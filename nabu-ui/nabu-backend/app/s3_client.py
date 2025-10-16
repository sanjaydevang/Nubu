from typing import Optional, List, Dict
import uuid
import json
import boto3
import logging
from .config import settings

log = logging.getLogger("nabu.s3")

use_localstack = bool(settings.use_localstack)
endpoint = "http://localhost:4566" if use_localstack else None

session = boto3.session.Session(
    aws_access_key_id=settings.aws_access_key_id,
    aws_secret_access_key=settings.aws_secret_access_key,
    region_name=settings.aws_region,
)

s3 = session.client("s3", endpoint_url=endpoint)

log.info(
    f"S3 initialized | bucket={settings.s3_bucket}, region={settings.aws_region}, "
    f"use_localstack={use_localstack}, endpoint={endpoint or 'aws'}"
)

# --- Core helper functions ---
def scribe_key(prefix: str, scribe_id: str, name: str) -> str:
    """Return scribe path key like scribes/<scribe_id>/<prefix>/<uuid>_<filename>"""
    return f"scribes/{scribe_id}/{prefix}/{uuid.uuid4()}_{name}"

def put_bytes(key: str, data: bytes, content_type: Optional[str] = None) -> str:
    extra = {"ContentType": content_type} if content_type else {}
    s3.put_object(Bucket=settings.s3_bucket, Key=key, Body=data, **extra)
    return f"s3://{settings.s3_bucket}/{key}"

def put_json(key: str, data: dict) -> str:
    body = json.dumps(data, ensure_ascii=False).encode("utf-8")
    return put_bytes(key, body, "application/json")

def list_prefix(prefix: str) -> List[Dict]:
    out: List[Dict] = []
    paginator = s3.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=settings.s3_bucket, Prefix=prefix):
        for obj in page.get("Contents", []) or []:
            out.append({
                "key": obj["Key"],
                "size": obj["Size"],
                "last_modified": obj["LastModified"].isoformat(),
            })
    return out

def presign_post(prefix: str, scribe_id: str, filename: str, expires_in: int = 3600):
    """Generate presigned POST for direct browser uploads"""
    key = f"scribes/{scribe_id}/{prefix}/{filename}"
    post = s3.generate_presigned_post(
        Bucket=settings.s3_bucket, Key=key, Fields={}, Conditions=[], ExpiresIn=expires_in
    )
    return key, post

def presign_get(key: str, expires_in: int = 3600) -> str:
    """Return a pre-signed AWS S3 URL"""
    return s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.s3_bucket, "Key": key},
        ExpiresIn=expires_in,
    )
