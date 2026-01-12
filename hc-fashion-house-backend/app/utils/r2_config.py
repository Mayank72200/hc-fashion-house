"""
Cloudflare R2 Configuration and Utilities
Handles R2 client setup and image upload operations
"""
import os
import logging
from typing import Optional, BinaryIO
from pathlib import Path
import boto3
from botocore.exceptions import ClientError
from botocore.config import Config
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

logger = logging.getLogger(__name__)

# Environment variables
CF_ACCOUNT_ID = os.getenv("HC_CF_ACCOUNT_ID")
CF_ACCESS_KEY_ID = os.getenv("HC_CF_ACCESS_KEY_ID")
CF_SECRET_ACCESS_KEY = os.getenv("HC_CF_SECRET_ACCESS_KEY")
CF_BUCKET_NAME = os.getenv("HC_CF_BUCKET_NAME", "hc-fashion-house")
CF_R2_PUBLIC_BASE_URL = os.getenv("HC_CF_BUCKET_PUBLIC_URL")

# Validate required environment variables
if not all([CF_ACCOUNT_ID, CF_ACCESS_KEY_ID, CF_SECRET_ACCESS_KEY, CF_R2_PUBLIC_BASE_URL]):
    logger.warning("Cloudflare R2 credentials not fully configured")


class R2Client:
    """Cloudflare R2 S3-compatible client"""
    
    _instance = None
    _client = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(R2Client, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._client is None:
            self._initialize_client()
    
    def _initialize_client(self):
        """Initialize boto3 S3 client for R2"""
        try:
            endpoint_url = f"https://{CF_ACCOUNT_ID}.r2.cloudflarestorage.com"
            
            self._client = boto3.client(
                's3',
                endpoint_url=endpoint_url,
                aws_access_key_id=CF_ACCESS_KEY_ID,
                aws_secret_access_key=CF_SECRET_ACCESS_KEY,
                region_name='auto',
                config=Config(
                    signature_version='s3v4',
                    retries={'max_attempts': 3, 'mode': 'standard'}
                )
            )
            
            logger.info(f"R2 client initialized successfully for bucket: {CF_BUCKET_NAME}")
            
        except Exception as e:
            logger.error(f"Failed to initialize R2 client: {str(e)}")
            raise
    
    @property
    def client(self):
        """Get the boto3 S3 client"""
        if self._client is None:
            self._initialize_client()
        return self._client
    
    def upload_file(
        self,
        file_content: bytes,
        object_path: str,
        content_type: str = "image/jpeg",
        cache_control: str = "public, max-age=31536000"
    ) -> str:
        """
        Upload file to R2 bucket
        
        Args:
            file_content: Binary file content
            object_path: Relative path in bucket (e.g., "products/footwear/...")
            content_type: MIME type of the file
            cache_control: Cache control header
            
        Returns:
            Full public CDN URL
            
        Raises:
            ClientError: If upload fails
        """
        try:
            # Upload to R2
            self.client.put_object(
                Bucket=CF_BUCKET_NAME,
                Key=object_path,
                Body=file_content,
                ContentType=content_type,
                CacheControl=cache_control
            )
            
            # Generate public URL
            public_url = f"{CF_R2_PUBLIC_BASE_URL}/{object_path}"
            
            logger.info(f"Successfully uploaded to R2: {object_path}")
            return public_url
            
        except ClientError as e:
            logger.error(f"R2 upload failed for {object_path}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error during R2 upload: {str(e)}")
            raise
    
    def delete_file(self, object_path: str) -> bool:
        """
        Delete file from R2 bucket
        
        Args:
            object_path: Relative path in bucket
            
        Returns:
            True if deleted successfully, False otherwise
        """
        try:
            self.client.delete_object(
                Bucket=CF_BUCKET_NAME,
                Key=object_path
            )
            logger.info(f"Successfully deleted from R2: {object_path}")
            return True
            
        except ClientError as e:
            logger.error(f"R2 delete failed for {object_path}: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error during R2 delete: {str(e)}")
            return False
    
    def file_exists(self, object_path: str) -> bool:
        """
        Check if file exists in R2 bucket
        
        Args:
            object_path: Relative path in bucket
            
        Returns:
            True if file exists, False otherwise
        """
        try:
            self.client.head_object(
                Bucket=CF_BUCKET_NAME,
                Key=object_path
            )
            return True
        except ClientError:
            return False
    
    def check_connection(self) -> dict:
        """
        Health check for R2 connection
        
        Returns:
            Dictionary with connection status
        """
        try:
            # Try to list objects (limited to 1)
            self.client.list_objects_v2(
                Bucket=CF_BUCKET_NAME,
                MaxKeys=1
            )
            return {
                "connected": True,
                "bucket": CF_BUCKET_NAME,
                "endpoint": f"https://{CF_ACCOUNT_ID}.r2.cloudflarestorage.com"
            }
        except Exception as e:
            return {
                "connected": False,
                "error": str(e)
            }


# Singleton instance
r2_client = R2Client()


# ========================
# Path Generation Utilities
# ========================

def generate_product_path(
    platform_slug: str,
    brand_slug: str,
    catalogue_slug: str,
    product_slug: str,
    usage_type: str,
    filename: str
) -> str:
    """
    Generate deterministic path for product images
    
    Args:
        platform_slug: Platform identifier (e.g., "footwear")
        brand_slug: Brand identifier (e.g., "nike", "adidas")
        catalogue_slug: Catalogue/article identifier (e.g., "hr-416")
        product_slug: Product color variant (e.g., "white-grey")
        usage_type: Type of image (e.g., "catalogue", "lifestyle", "banner")
        filename: Original filename
        
    Returns:
        Object path like: products/footwear/nike/hr-416/white-grey/catalogue/hero.jpg
    """
    # Clean filename - keep extension, sanitize name
    clean_name = sanitize_filename(filename)
    
    return f"products/{platform_slug}/{brand_slug}/{catalogue_slug}/{product_slug}/{usage_type}/{clean_name}"


def generate_catalogue_banner_path(
    catalogue_slug: str,
    filename: str
) -> str:
    """
    Generate path for catalogue banner images
    
    Returns:
        Object path like: banners/catalogues/hr-416/hero.jpg
    """
    clean_name = sanitize_filename(filename)
    return f"banners/catalogues/{catalogue_slug}/{clean_name}"


def generate_category_banner_path(
    category_slug: str,
    filename: str
) -> str:
    """
    Generate path for category banner images
    
    Returns:
        Object path like: banners/categories/sneakers/hero.jpg
    """
    clean_name = sanitize_filename(filename)
    return f"banners/categories/{category_slug}/{clean_name}"


def generate_brand_logo_path(
    brand_slug: str,
    filename: str
) -> str:
    """
    Generate path for brand logos
    
    Returns:
        Object path like: brands/nike/logo.png
    """
    clean_name = sanitize_filename(filename)
    return f"brands/{brand_slug}/{clean_name}"


def generate_global_media_path(
    folder_type: str,
    filename: str
) -> str:
    """
    Generate path for global media (offers, videos, etc.)
    
    Returns:
        Object path like: global/offers/summer-sale.jpg
    """
    clean_name = sanitize_filename(filename)
    return f"global/{folder_type}/{clean_name}"


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename for storage
    
    - Convert to lowercase
    - Replace spaces with hyphens
    - Remove special characters
    - Keep extension
    """
    import re
    
    # Split name and extension
    parts = filename.rsplit('.', 1)
    name = parts[0]
    ext = parts[1] if len(parts) > 1 else ''
    
    # Sanitize name
    name = name.lower()
    name = re.sub(r'[^a-z0-9-_]', '-', name)
    name = re.sub(r'-+', '-', name)  # Replace multiple hyphens with single
    name = name.strip('-')
    
    # Reconstruct filename
    if ext:
        return f"{name}.{ext.lower()}"
    return name


def get_content_type(filename: str) -> str:
    """
    Determine content type from filename
    
    Args:
        filename: File name with extension
        
    Returns:
        MIME type string
    """
    ext = filename.lower().split('.')[-1]
    
    content_types = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'mov': 'video/quicktime'
    }
    
    return content_types.get(ext, 'application/octet-stream')


def validate_file_type(filename: str, allowed_types: list) -> bool:
    """
    Validate file type against allowed types
    
    Args:
        filename: File name with extension
        allowed_types: List of allowed extensions
        
    Returns:
        True if valid, False otherwise
    """
    ext = filename.lower().split('.')[-1]
    return ext in [t.lower() for t in allowed_types]


def get_allowed_types(media_type: str) -> list:
    """
    Get allowed file extensions for media type
    
    Args:
        media_type: 'image' or 'video'
        
    Returns:
        List of allowed extensions
    """
    if media_type == 'image':
        return ['jpg', 'jpeg', 'png', 'webp', 'gif']
    elif media_type == 'video':
        return ['mp4', 'webm', 'mov']
    return []


def extract_object_path_from_url(url: str) -> Optional[str]:
    """
    Extract object path from R2 public URL
    
    Args:
        url: Full public URL
        
    Returns:
        Object path or None
    """
    if not url or not CF_R2_PUBLIC_BASE_URL:
        return None
    
    if url.startswith(CF_R2_PUBLIC_BASE_URL):
        return url[len(CF_R2_PUBLIC_BASE_URL):].lstrip('/')
    
    return None
