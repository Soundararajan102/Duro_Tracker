import requests

def test():
    # Login
    resp = requests.post("http://localhost:8000/api/v1/auth/login", data={"username": "admin", "password": "password123"})
    print("Login:", resp.status_code, resp.text)
    if resp.status_code != 200:
        return
    token = resp.json()["access_token"]
    
    # Fetch buyers
    resp2 = requests.get("http://localhost:8000/api/v1/admin/buyers", headers={"Authorization": f"Bearer {token}"})
    print("Buyers:", resp2.status_code, resp2.text)

if __name__ == "__main__":
    test()
