import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "mysql+pymysql://todo_user:todo_pass@db:3306/todo_db"
    )

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
