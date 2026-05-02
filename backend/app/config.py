from pathlib import Path

from pydantic_settings import BaseSettings


BASE_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    # caminho usado no ambiente de desenvolvimento local de genai 
    DATABASE_URL: str = f"sqlite+aiosqlite:///{(BASE_DIR / 'agent' / 'banco.db').as_posix()}" 
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"


settings = Settings()
