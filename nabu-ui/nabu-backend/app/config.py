from pydantic_settings import BaseSettings
from pydantic import field_validator, Field
from functools import lru_cache
from typing import List, Any
import json

class Settings(BaseSettings):
    aws_access_key_id: str
    aws_secret_access_key: str
    aws_region: str = "us-east-1"
    s3_bucket: str

    allowed_origins: List[str] = Field(default_factory=lambda: ["*"])
    use_localstack: bool = False   # ✅ Default: False (real AWS)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def coerce_allowed_origins(cls, v: Any):
        if isinstance(v, list):
            return v
        s = "" if v is None else str(v).strip()
        if s.startswith("["):
            try:
                arr = json.loads(s)
                if isinstance(arr, list):
                    return [str(x).strip() for x in arr]
            except Exception:
                pass
        if s == "*" or s == "":
            return ["*"]
        return [p.strip() for p in s.split(",") if p.strip()]

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
