import os
import requests
import json
from dotenv import load_dotenv

# Load API key from .env
load_dotenv()
API_KEY = os.getenv("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")

headers = {
    "x-api-key": API_KEY,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json"
}

data = {
    "model": "claude-3-haiku-20240307",  # Use haiku (faster & cheaper)
    "max_tokens": 500,
    "messages": [
        {"role": "user", "content": "Tell me a fun fact about space."}
    ]
}

response = requests.post(
    "https://api.anthropic.com/v1/messages",
    headers=headers,
    data=json.dumps(data)
)

# Print Claude's response
print(response.json()["content"][0]["text"])
