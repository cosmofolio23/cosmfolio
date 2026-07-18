import requests
url = "https://rjobifgysmovmcvhdlnd.supabase.co/storage/v1/object/public/documents/test.png"
res = requests.options(url, headers={"Origin": "https://thecosmofolio.com", "Access-Control-Request-Method": "GET"})
print("OPTIONS Headers:", res.headers)
res2 = requests.get(url, headers={"Origin": "https://thecosmofolio.com"})
print("GET Headers:", res2.headers)
