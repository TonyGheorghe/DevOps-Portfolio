from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Arhivare Web App"
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Added fields
    ADMIN_USERNAME: str
    ADMIN_PASSWORD: str

    class Config:
        env_file = ".env"


settings = Settings()

