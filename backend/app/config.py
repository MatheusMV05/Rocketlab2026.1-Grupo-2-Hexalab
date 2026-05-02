from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/vcommerce.db"
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"


settings = Settings()
