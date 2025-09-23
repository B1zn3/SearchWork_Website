from aiobotocore.session import get_session
from contextlib import asynccontextmanager
import aiofiles
import asyncio
import os 


class S3Client():
    def __init__(
            self,
            accsess_key: str,
            secret_accsess_key: str,
            endpoint_url: str,
            bucket_name: str):
        self.config = {
            'aws_access_key_id': accsess_key,
            'aws_secret_access_key': secret_accsess_key,
            'endpoint_url': endpoint_url,
        }   
        self.bucket_name = bucket_name
        self.session = get_session()

    @asynccontextmanager
    async def get_client(self):
        async with self.session.create_client('s3', **self.config) as client:
            yield client

    async def upload_content(self, key: str, content: bytes, content_type: str = None):
        async with self.get_client() as client:
            await client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=content,
                ContentType=content_type
            )
    
    async def delete_files(self, files: list[str]):
        async with self.get_client() as client:
            async def delete(file: str):
                await client.delete_object(Bucket=self.bucket_name, Key=file)
            await asyncio.gather(*(delete(file) for file in files))


s3_client = S3Client(
    accsess_key=os.getenv('ACCSESS_KEY'),
    secret_accsess_key=os.getenv('SECRET_ACCSESS_KEY'),
    endpoint_url=os.getenv('ENDPOINT_URL'),
    bucket_name=os.getenv('BUCKET_NAME'),
)