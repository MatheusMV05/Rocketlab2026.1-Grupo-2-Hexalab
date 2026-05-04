from pathlib import Path

from pydantic_settings import BaseSettings


BASE_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/vcommerce.db"
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"


settings = Settings()
