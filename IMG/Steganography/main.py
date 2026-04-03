import argparse
import numpy as np
from PIL import Image

DELIMITER = "###END###"

def encode(image_path, msg, output_path):
    img = Image.open(image_path).convert('RGBA')
    data = np.array(img)
    
    # 1. Prepare bitstream (text + delimiter)
    full_msg = msg + DELIMITER
    bits = []
    for char in full_msg:
        b = bin(ord(char))[2:].zfill(8)
        bits.extend([int(bit) for bit in b])
    
    if len(bits) > data.size:
        raise ValueError("Message is too long for this image size.")
    
    # 2. Modify LSBs
    flat_data = data.flatten()
    # Mask out the LSB and OR with our bits
    # Use 0xFE (uint8 safe mask)
    for i in range(len(bits)):
        flat_data[i] = (flat_data[i] & 0xFE) | bits[i]
        
    encoded_data = flat_data.reshape(data.shape)
    Image.fromarray(encoded_data.astype('uint8'), 'RGBA').save(output_path, 'PNG')
    print(f"Message hidden in {output_path}")

def decode(image_path):
    img = Image.open(image_path).convert('RGBA')
    data = np.array(img).flatten()
    
    bits = [str(x & 1) for x in data]
    chars = []
    bit_str = "".join(bits)
    
    for i in range(0, len(bit_str), 8):
        byte = bit_str[i:i+8]
        char = chr(int(byte, 2))
        chars.append(char)
        if "".join(chars).endswith(DELIMITER):
            return "".join(chars)[:-len(DELIMITER)]
            
    return "".join(chars)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="LSB Steganography")
    parser.add_argument("--method", choices=["encode", "decode"], required=True)
    parser.add_argument("--image", required=True)
    parser.add_argument("--msg")
    parser.add_argument("--output_file", default="hidden.png")
    
    args = parser.parse_args()
    
    if args.method == "encode":
        if not args.msg:
            print("Error: Message required for encoding.")
        else:
            encode(args.image, args.msg, args.output_file)
    else:
        result = decode(args.image)
        print(f"REVEALED MESSAGE: {result}")
