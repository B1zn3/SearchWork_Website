from pydantic import BaseModel


class WeatherSchema(BaseModel):
    latitude: float
    longitude: float