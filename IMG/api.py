from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import numpy as np
import io

app = FastAPI(title="StegoReveal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DELIMITER = "###END###"

def lsb_encode(img_bytes: bytes, message: str) -> bytes:
    img = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
    data = np.array(img)
    flat = data.flatten()

    full_msg = message + DELIMITER
    bits = []
    for ch in full_msg:
        for b in range(7, -1, -1):
            bits.append((ord(ch) >> b) & 1)

    if len(bits) > len(flat):
        raise ValueError("Message too long for this image.")

    for i, bit in enumerate(bits):
        flat[i] = (int(flat[i]) & 0xFE) | bit

    encoded = flat.reshape(data.shape).astype("uint8")
    out = Image.fromarray(encoded, "RGBA")
    buf = io.BytesIO()
    out.save(buf, format="PNG")
    buf.seek(0)
    return buf.read()


import re

URL_PATTERN = re.compile(r'(?:https?|ftp)://[^\s]+|www\.[^\s]+')
NUMBER_PATTERN = re.compile(r'\b\d{5,}\b')

def lsb_decode(img_bytes: bytes) -> list:
    img = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
    data = np.array(img)
    
    strategies = {
        "All RGBA": data.flatten(),
        "RGB interleaved": data[:,:,:3].flatten(),
        "R channel": data[:,:,0].flatten(),
        "G channel": data[:,:,1].flatten(),
        "B channel": data[:,:,2].flatten(),
        "Alpha channel": data[:,:,3].flatten(),
    }
    
    results = set()
    
    def extract_from_bits(flat_array, bits_per_channel=1):
        if bits_per_channel == 1:
            bits = (flat_array & 1).astype(np.uint8)
        else:
            b2 = (flat_array & 3).astype(np.uint8)
            bits = np.zeros(len(b2) * 2, dtype=np.uint8)
            bits[0::2] = (b2 >> 1) & 1
            bits[1::2] = b2 & 1
            
        max_bits = min(len(bits), 800000)
        bits = bits[:max_bits]
        if len(bits) % 8 != 0:
            bits = bits[:-(len(bits) % 8)]
            
        bytes_array = np.packbits(bits)
        return bytes_array.tobytes().decode('ascii', errors='ignore')

    for name, flat in strategies.items():
        text1 = extract_from_bits(flat, 1)
        text2 = extract_from_bits(flat, 2) if name == "All RGBA" else ""
        
        for text in [text1, text2]:
            if not text: continue
            
            # PERFECT MATCH! If we see the Python delimiter, this is 100% the exact encoded message.
            if DELIMITER in text:
                msg = text.split(DELIMITER)[0]
                msg = "".join(c for c in msg if 32 <= ord(c) <= 126).strip()
                if msg: 
                    return [msg]  # Short-circuit and return immediately
            
            # Very aggressive repeating character removal for raw matching
            clean_t = re.sub(r'(.)\1{2,}', ' ', text)
            clean_t = "".join(c for c in clean_t if 32 <= ord(c) <= 126)
            
            # Extract URLs
            for u in URL_PATTERN.findall(clean_t):
                results.add(u)
                
            # Extract distinct Long Numbers (e.g. OTPs, phone numbers)
            for n in NUMBER_PATTERN.findall(clean_t):
                if 5 <= len(n) <= 20 and len(set(n)) >= 2:
                    results.add(n)

    final_results = [r for r in results if len(r) < 100]
    return final_results



@app.post("/encode")
async def encode(image: UploadFile = File(...), message: str = Form(...)):
    img_bytes = await image.read()
    try:
        result = lsb_encode(img_bytes, message)
        return StreamingResponse(
            io.BytesIO(result),
            media_type="image/png",
            headers={"Content-Disposition": "attachment; filename=hidden_secret.png"}
        )
    except ValueError as e:
        return JSONResponse({"error": str(e)}, status_code=400)


@app.post("/decode")
async def decode(image: UploadFile = File(...)):
    img_bytes = await image.read()
    try:
        results = lsb_decode(img_bytes)
        if not results:
            return JSONResponse({"message": None})
        
        msg_out = " | ".join(sorted(results))
        return JSONResponse({"message": msg_out})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)


@app.get("/")
def root():
    return {"status": "StegoReveal API running", "endpoints": ["/encode", "/decode"]}
