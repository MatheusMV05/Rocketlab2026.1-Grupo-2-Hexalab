from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/database.db"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "dev-secret-inseguro-troque-em-producao"
    GOOGLE_CLIENT_ID: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    class Config:
        env_file = Path(__file__).resolve().parents[1] / ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
