from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    service_secret: str = "internal_service_secret"
    mongo_uri: str = "mongodb://localhost:27017/cryptoplatform"
    redis_url: str = "redis://localhost:6379"
    model_dir: str = "app/saved_models"

    class Config:
        env_file = ".env"

settings = Settings()
