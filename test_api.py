import requests
res = requests.post(
    f"{API_URL}/api/projects/{project_id}/export-pdf",
    headers={"Authorization": f"Bearer {headless_token}"}
)
print("Status:", res.status_code)
if res.status_code == 200:
    with open("test.pdf", "wb") as f:
        f.write(res.content)
    print("Saved to test.pdf")
else:
    print("Body:", res.text)
