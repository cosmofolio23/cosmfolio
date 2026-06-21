import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

# Generate a private/public key pair
private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048, backend=default_backend())
public_key = private_key.public_key()

# Serialize keys to PEM
private_pem = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.TraditionalOpenSSL,
    encryption_algorithm=serialization.NoEncryption()
)
public_pem = public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
)

token = jwt.encode({"test": "data"}, private_pem, algorithm="RS256")

print("Generated token.")

try:
    # Attempt to decode using the public PEM
    decoded = jwt.decode(token, public_pem, algorithms=["RS256"])
    print("Successfully decoded with public_pem!")
except Exception as e:
    print(f"Error decoding with public_pem: {type(e)} {e}")

try:
    # Attempt to decode using the private PEM
    decoded = jwt.decode(token, private_pem, algorithms=["RS256"])
    print("Successfully decoded with private_pem!")
except Exception as e:
    print(f"Error decoding with private_pem: {type(e)} {e}")
