import time
import requests
import jwt

def test():
    # 1. Fetch Google certs
    resp = requests.get("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com")
    certs = resp.json()
    
    for kid, cert_str in certs.items():
        print(f"Testing kid {kid}...")
        try:
            # Create a fake JWT token
            token = jwt.encode({"test": "data"}, "fake_key", algorithm="HS256")
            
            # Now try to decode it USING THE RS256 CERTIFICATE to VERIFY the signature!
            # Since the token is HS256 but we specify algorithms=["RS256"], what happens?
            jwt.decode(token, cert_str, algorithms=["RS256"])
        except Exception as e:
            print(f"Error loading cert: {e}")
            print(f"Type: {type(e)}")

if __name__ == "__main__":
    test()
