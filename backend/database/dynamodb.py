import os
import boto3
from botocore.exceptions import ClientError


def get_dynamodb_resource():
    if os.getenv("AWS_LOCAL", "false").lower() == "true":
        return boto3.resource(
            "dynamodb",
            endpoint_url="http://localhost:8000",
            region_name=os.getenv("AWS_REGION", "us-east-1"),
            aws_access_key_id="local",
            aws_secret_access_key="local",
        )
    return boto3.resource(
        "dynamodb",
        region_name=os.getenv("AWS_REGION", "us-east-1"),
    )


def get_dynamodb_client():
    if os.getenv("AWS_LOCAL", "false").lower() == "true":
        return boto3.client(
            "dynamodb",
            endpoint_url="http://localhost:8000",
            region_name=os.getenv("AWS_REGION", "us-east-1"),
            aws_access_key_id="local",
            aws_secret_access_key="local",
        )
    return boto3.client(
        "dynamodb",
        region_name=os.getenv("AWS_REGION", "us-east-1"),
    )


def create_tables():
    dynamodb = get_dynamodb_resource()
    requirements_table = os.getenv("DYNAMODB_REQUIREMENTS_TABLE", "requirements")
    artifacts_table = os.getenv("DYNAMODB_ARTIFACTS_TABLE", "artifacts")

    try:
        dynamodb.create_table(
            TableName=requirements_table,
            KeySchema=[
                {"AttributeName": "requirement_id", "KeyType": "HASH"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "requirement_id", "AttributeType": "S"},
            ],
            BillingMode="PAY_PER_REQUEST",
        )
    except ClientError as e:
        if e.response["Error"]["Code"] != "ResourceInUseException":
            raise

    try:
        dynamodb.create_table(
            TableName=artifacts_table,
            KeySchema=[
                {"AttributeName": "requirement_id", "KeyType": "HASH"},
                {"AttributeName": "artifact_type", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "requirement_id", "AttributeType": "S"},
                {"AttributeName": "artifact_type", "AttributeType": "S"},
            ],
            BillingMode="PAY_PER_REQUEST",
        )
    except ClientError as e:
        if e.response["Error"]["Code"] != "ResourceInUseException":
            raise
