import os
from main import encode, decode

input_image = "input.png"
output_image = "test_output.png"
message = "Testing steganography integrity: 1234567890!@#$%^&*()"

if os.path.exists(input_image):
    print("Encoding...")
    encode(input_image, message, output_image)
    print("Decoding...")
    revealed = decode(output_image)
    print(f"Original: {message}")
    print(f"Revealed: {revealed}")
    if message == revealed:
        print("SUCCESS: Message matches!")
    else:
        print("FAILURE: Message mismatch.")
else:
    print(f"Error: {input_image} not found.")
