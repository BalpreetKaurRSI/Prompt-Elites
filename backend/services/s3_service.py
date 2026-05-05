import os
import boto3
from botocore.exceptions import ClientError


def _get_s3_client():
    if os.getenv("AWS_LOCAL", "false").lower() == "true":
        return boto3.client(
            "s3",
            endpoint_url="http://localhost:4566",
            region_name=os.getenv("AWS_REGION", "us-east-1"),
            aws_access_key_id="local",
            aws_secret_access_key="local",
        )
    return boto3.client("s3", region_name=os.getenv("AWS_REGION", "us-east-1"))


def ensure_bucket_exists():
    client = _get_s3_client()
    bucket = os.getenv("S3_BUCKET_NAME", "ai-sdlc-documents")
    try:
        client.head_bucket(Bucket=bucket)
    except ClientError:
        client.create_bucket(Bucket=bucket)


async def upload_file(file_bytes: bytes, filename: str, requirement_id: str) -> str:
    client = _get_s3_client()
    bucket = os.getenv("S3_BUCKET_NAME", "ai-sdlc-documents")
    key = f"{requirement_id}/{filename}"

    ensure_bucket_exists()
    client.put_object(Bucket=bucket, Key=key, Body=file_bytes)
    return key


async def download_file(key: str) -> bytes:
    client = _get_s3_client()
    bucket = os.getenv("S3_BUCKET_NAME", "ai-sdlc-documents")
    response = client.get_object(Bucket=bucket, Key=key)
    return response["Body"].read()
