import httpx
import os
from dotenv import load_dotenv 


load_dotenv()
async def get_weather(coordinates):
    api = os.getenv('API_KEY')
    url = f'http://api.weatherapi.com/v1/current.json?key={api}&q={coordinates}&aqi=no'
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        if response.status_code==200:
            return response.json()
        return {'Error: ', response.status_code}

