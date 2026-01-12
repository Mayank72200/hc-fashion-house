"""
Media Upload Service
Handles R2 (Cloudflare) uploads and database operations for media assets
"""
from typing import Optional, List, Dict, Any
import logging

from sqlalchemy.orm import Session
from fastapi import UploadFile

from database.db_models import (
    MediaAsset, Product, ProductVariant, Catalogue, Category
)
from models.media_models import (
    MediaType, UsageType,
    ProductVariantMediaUpload, CatalogueBannerUpload,
    CategoryBannerUpload, GlobalMediaUpload, MediaUpdateRequest
)
from utils.r2_config import (
    r2_client,
    generate_product_path,
    generate_catalogue_banner_path,
    generate_category_banner_path,
    generate_brand_logo_path,
    generate_global_media_path,
    get_content_type,
    validate_file_type,
    get_allowed_types,
    extract_object_path_from_url
)
from utils.exceptions import (
    ResourceNotFoundException,
    ValidationException,
    BusinessRuleException
)

logger = logging.getLogger(__name__)


class MediaUploadService:
    """Service for handling media uploads to R2 and database operations"""

    def __init__(self):
        """Initialize the service"""
        pass

    # ========================
    # Validation Methods
    # ========================

    @staticmethod
    def validate_file(file: UploadFile, media_type: str) -> None:
        """
        Validate uploaded file.

        Args:
            file: The uploaded file
            media_type: Expected media type (image/video)

        Raises:
            ValidationException: If file is invalid
        """
        if not file or not file.filename:
            raise ValidationException(
                message="No file provided",
                field="file"
            )

        allowed_types = get_allowed_types(media_type)
        if not validate_file_type(file.filename, allowed_types):
            raise ValidationException(
                message=f"Invalid file type. Allowed types: {', '.join(allowed_types)}",
                field="file",
                details={"allowed_types": allowed_types}
            )

        # Check file size (max 10MB for images, 100MB for videos)
        max_size = 100 * 1024 * 1024 if media_type == "video" else 10 * 1024 * 1024
        if file.size and file.size > max_size:
            raise ValidationException(
                message=f"File too large. Max size: {max_size / (1024 * 1024)}MB",
                field="file"
            )

    @staticmethod
    def validate_product_variant(db: Session, product_id: int, variant_id: int) -> tuple:
        """
        Validate that product and variant exist and are related.

        Returns:
            Tuple of (Product, ProductVariant)
        """
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise ResourceNotFoundException(resource="Product", resource_id=product_id)

        variant = db.query(ProductVariant).filter(
            ProductVariant.id == variant_id,
            ProductVariant.product_id == product_id
        ).first()
        if not variant:
            raise ResourceNotFoundException(
                resource="ProductVariant",
                resource_id=variant_id,
                details={"product_id": product_id}
            )

        return product, variant

    @staticmethod
    def validate_catalogue(db: Session, catalogue_id: int) -> Catalogue:
        """Validate that catalogue exists"""
        catalogue = db.query(Catalogue).filter(Catalogue.id == catalogue_id).first()
        if not catalogue:
            raise ResourceNotFoundException(resource="Catalogue", resource_id=catalogue_id)
        return catalogue

    @staticmethod
    def validate_category(db: Session, category_id: int) -> Category:
        """Validate that category exists"""
        category = db.query(Category).filter(Category.id == category_id).first()
        if not category:
            raise ResourceNotFoundException(resource="Category", resource_id=category_id)
        return category

    # ========================
    # Upload Methods
    # ========================

    async def upload_to_r2(
        self,
        file: UploadFile,
        object_path: str
    ) -> Dict[str, Any]:
        """
        Upload file to R2.

        Args:
            file: The file to upload
            object_path: Target path in R2 bucket

        Returns:
            Upload result with public URL

        Raises:
            BusinessRuleException: If upload fails
        """
        try:
            # Read file content
            content = await file.read()

            # Determine content type
            content_type = get_content_type(file.filename)

            # Upload to R2
            public_url = r2_client.upload_file(
                file_content=content,
                object_path=object_path,
                content_type=content_type
            )

            logger.info(f"Successfully uploaded to R2: {object_path}")

            return {
                "public_url": public_url,
                "object_path": object_path,
                "filename": file.filename,
                "content_type": content_type
            }

        except Exception as e:
            logger.error(f"R2 upload failed for {object_path}: {str(e)}")
            raise BusinessRuleException(
                message=f"Upload failed: {str(e)}",
                rule="r2_upload",
                details={"object_path": object_path, "error": str(e)}
            )
        finally:
            # Reset file position for potential retry
            await file.seek(0)

    def create_media_asset(
        self,
        db: Session,
        upload_result: Dict[str, Any],
        object_path: str,
        media_type: str,
        usage_type: str,
        platform: str,
        display_order: int,
        is_primary: bool,
        product_id: Optional[int] = None,
        variant_id: Optional[int] = None
    ) -> MediaAsset:
        """
        Create media asset record in database.

        Args:
            db: Database session
            upload_result: R2 upload response
            object_path: Path in R2 bucket
            media_type: 'image' or 'video'
            usage_type: 'catalogue', 'lifestyle', or 'banner'
            platform: Target platform
            display_order: Display order
            is_primary: Whether this is the primary media
            product_id: Optional product ID
            variant_id: Optional variant ID

        Returns:
            Created MediaAsset
        """
        media_asset = MediaAsset(
            product_id=product_id,
            variant_id=variant_id,
            media_type=media_type,
            usage_type=usage_type,
            platform=platform,
            cloudinary_url=upload_result["public_url"],  # Keep field name for now (will migrate later)
            folder_path=object_path,  # Store R2 object path
            public_id=object_path,  # Use object path as public_id
            width=None,  # Will add image processing later
            height=None,
            aspect_ratio=None,
            display_order=display_order,
            is_primary=is_primary,
            status="approved"
        )

        db.add(media_asset)
        db.commit()
        db.refresh(media_asset)

        return media_asset

    # ========================
    # Product Variant Media
    # ========================

    async def upload_product_variant_media(
        self,
        db: Session,
        file: UploadFile,
        upload_data: ProductVariantMediaUpload
    ) -> MediaAsset:
        """
        Upload media for a product (color SKU).
        
        ⚠️ IMPORTANT: Images belong to PRODUCT (color), NOT to variants (sizes)!
        All sizes of the same color share the same images.

        Args:
            db: Database session
            file: The file to upload
            upload_data: Upload parameters

        Returns:
            Created MediaAsset
        """
        # Validate file
        self.validate_file(file, MediaType.IMAGE.value)

        # Validate product and variant
        product, variant = self.validate_product_variant(
            db, upload_data.product_id, upload_data.variant_id
        )

        # Get catalogue and platform information
        catalogue = product.catalogue
        if not catalogue:
            raise BusinessRuleException(
                message="Product must belong to a catalogue",
                rule="catalogue_required"
            )
        
        platform = product.category.platform if product.category and product.category.platform else None
        if not platform:
            raise BusinessRuleException(
                message="Product must belong to a platform via category",
                rule="platform_required"
            )

        # Get brand information (may be None)
        brand = product.brand
        brand_slug = brand.slug if brand else "no-brand"

        # Generate deterministic object path
        object_path = generate_product_path(
            platform_slug=platform.slug,
            brand_slug=brand_slug,
            catalogue_slug=catalogue.slug,
            product_slug=product.slug,
            usage_type=upload_data.usage_type.value,
            filename=file.filename
        )

        # If setting as primary, unset other primary images for this PRODUCT
        if upload_data.is_primary:
            self._unset_primary_media(
                db,
                product_id=upload_data.product_id,
                usage_type=upload_data.usage_type.value
            )

        # Upload to R2
        upload_result = await self.upload_to_r2(file, object_path)

        # Create database record
        media_asset = self.create_media_asset(
            db=db,
            upload_result=upload_result,
            object_path=object_path,
            media_type=MediaType.IMAGE.value,
            usage_type=upload_data.usage_type.value,
            platform=upload_data.platform.value,
            display_order=upload_data.display_order,
            is_primary=upload_data.is_primary,
            product_id=upload_data.product_id,
            variant_id=upload_data.variant_id
        )

        return media_asset

    # ========================
    # Catalogue Banner
    # ========================

    async def upload_catalogue_banner(
        self,
        db: Session,
        file: UploadFile,
        upload_data: CatalogueBannerUpload
    ) -> MediaAsset:
        """
        Upload banner for a catalogue/collection.

        Args:
            db: Database session
            file: The file to upload
            upload_data: Upload parameters

        Returns:
            Created MediaAsset
        """
        # Validate file
        self.validate_file(file, MediaType.IMAGE.value)

        # Validate catalogue
        catalogue = self.validate_catalogue(db, upload_data.catalogue_id)

        # Generate object path
        object_path = generate_catalogue_banner_path(
            catalogue_slug=catalogue.slug,
            filename=file.filename
        )

        # If setting as primary, unset other primary banners
        if upload_data.is_primary:
            self._unset_catalogue_primary_banner(db, upload_data.catalogue_id)

        # Upload to R2
        upload_result = await self.upload_to_r2(file, object_path)

        # Create database record
        media_asset = self.create_media_asset(
            db=db,
            upload_result=upload_result,
            object_path=object_path,
            media_type=MediaType.IMAGE.value,
            usage_type=UsageType.BANNER.value,
            platform=upload_data.platform.value,
            display_order=upload_data.display_order,
            is_primary=upload_data.is_primary,
            product_id=None,
            variant_id=None
        )

        # Update catalogue with banner_media_id if primary
        if upload_data.is_primary:
            catalogue.banner_media_id = media_asset.id
            db.commit()

        return media_asset

    # ========================
    # Category Banner
    # ========================

    async def upload_category_banner(
        self,
        db: Session,
        file: UploadFile,
        upload_data: CategoryBannerUpload
    ) -> MediaAsset:
        """
        Upload banner for a category.

        Args:
            db: Database session
            file: The file to upload
            upload_data: Upload parameters

        Returns:
            Created MediaAsset
        """
        # Validate file
        self.validate_file(file, MediaType.IMAGE.value)

        # Validate category
        category = self.validate_category(db, upload_data.category_id)

        # Generate object path
        object_path = generate_category_banner_path(
            category_slug=category.slug,
            filename=file.filename
        )

        # Upload to R2
        upload_result = await self.upload_to_r2(file, object_path)

        # Create database record
        media_asset = self.create_media_asset(
            db=db,
            upload_result=upload_result,
            object_path=object_path,
            media_type=MediaType.IMAGE.value,
            usage_type=UsageType.BANNER.value,
            platform=upload_data.platform.value,
            display_order=upload_data.display_order,
            is_primary=upload_data.is_primary,
            product_id=None,
            variant_id=None
        )

        return media_asset

    # ========================
    # Global Media
    # ========================

    async def upload_global_media(
        self,
        db: Session,
        file: UploadFile,
        upload_data: GlobalMediaUpload
    ) -> MediaAsset:
        """
        Upload global media (brand, offers, videos).

        Args:
            db: Database session
            file: The file to upload
            upload_data: Upload parameters

        Returns:
            Created MediaAsset
        """
        # Validate file
        self.validate_file(file, upload_data.media_type.value)

        # Generate object path
        object_path = generate_global_media_path(
            folder_type=upload_data.folder_type,
            filename=file.filename
        )

        # Upload to R2
        upload_result = await self.upload_to_r2(file, object_path)

        # Create database record
        media_asset = self.create_media_asset(
            db=db,
            upload_result=upload_result,
            object_path=object_path,
            media_type=upload_data.media_type.value,
            usage_type=UsageType.BANNER.value,  # Global media uses banner usage type
            platform=upload_data.platform.value,
            display_order=upload_data.display_order,
            is_primary=False,
            product_id=None,
            variant_id=None
        )

        return media_asset

    # ========================
    # Query Methods
    # ========================

    @staticmethod
    def get_media_by_id(db: Session, media_id: int) -> MediaAsset:
        """Get media asset by ID"""
        media = db.query(MediaAsset).filter(MediaAsset.id == media_id).first()
        if not media:
            raise ResourceNotFoundException(resource="MediaAsset", resource_id=media_id)
        return media

    @staticmethod
    def list_product_media(
        db: Session,
        product_id: int,
        usage_type: Optional[str] = None
    ) -> List[MediaAsset]:
        """List all media for a product"""
        query = db.query(MediaAsset).filter(MediaAsset.product_id == product_id)
        if usage_type:
            query = query.filter(MediaAsset.usage_type == usage_type)
        return query.order_by(MediaAsset.display_order).all()

    @staticmethod
    def list_variant_media(
        db: Session,
        variant_id: int,
        usage_type: Optional[str] = None
    ) -> List[MediaAsset]:
        """List all media for a variant"""
        query = db.query(MediaAsset).filter(MediaAsset.variant_id == variant_id)
        if usage_type:
            query = query.filter(MediaAsset.usage_type == usage_type)
        return query.order_by(MediaAsset.display_order).all()

    @staticmethod
    def list_catalogue_banners(db: Session, catalogue_id: int) -> List[MediaAsset]:
        """List catalogue banners"""
        # Catalogue banners don't have product_id, filter by usage_type
        return db.query(MediaAsset).filter(
            MediaAsset.usage_type == UsageType.BANNER.value
        ).order_by(MediaAsset.display_order).all()

    # ========================
    # Update Methods
    # ========================

    def update_media(
        self,
        db: Session,
        media_id: int,
        update_data: MediaUpdateRequest
    ) -> MediaAsset:
        """Update media asset metadata"""
        media = self.get_media_by_id(db, media_id)

        update_dict = update_data.model_dump(exclude_unset=True)

        # Handle primary flag
        if update_dict.get('is_primary') is True:
            # Unset other primary media for the same variant/product
            if media.variant_id:
                self._unset_primary_media(db, variant_id=media.variant_id, usage_type=media.usage_type)
            elif media.product_id:
                self._unset_primary_media(db, product_id=media.product_id, usage_type=media.usage_type)

        # Apply updates
        for key, value in update_dict.items():
            if hasattr(media, key):
                setattr(media, key, value)

        db.commit()
        db.refresh(media)
        return media

    def set_primary_media(
        self,
        db: Session,
        variant_id: int,
        media_id: int
    ) -> MediaAsset:
        """Set a specific media as primary for a variant"""
        media = self.get_media_by_id(db, media_id)

        if media.variant_id != variant_id:
            raise BusinessRuleException(
                message="Media does not belong to this variant",
                rule="variant_mismatch"
            )

        # Unset other primary
        self._unset_primary_media(db, variant_id=variant_id, usage_type=media.usage_type)

        # Set this as primary
        media.is_primary = True
        db.commit()
        db.refresh(media)

        return media

    def bulk_update_display_order(
        self,
        db: Session,
        media_orders: List[Dict[str, int]]
    ) -> List[MediaAsset]:
        """Bulk update display order for multiple media assets"""
        updated = []

        for item in media_orders:
            media = self.get_media_by_id(db, item['media_id'])
            media.display_order = item['display_order']
            updated.append(media)

        db.commit()

        for media in updated:
            db.refresh(media)

        return updated

    # ========================
    # Delete Methods
    # ========================

    def delete_media(self, db: Session, media_id: int) -> Dict[str, Any]:
        """
        Delete media from R2 and database.

        Args:
            db: Database session
            media_id: Media asset ID

        Returns:
            Deletion result
        """
        media = self.get_media_by_id(db, media_id)

        r2_deleted = False

        # Try to delete from R2
        if media.public_id:  # public_id contains the object path
            try:
                r2_deleted = r2_client.delete_file(media.public_id)
            except Exception as e:
                logger.error(f"Failed to delete from R2: {str(e)}")

        # If this was a catalogue banner, update catalogue
        if media.usage_type == UsageType.BANNER.value and media.is_primary:
            catalogues = db.query(Catalogue).filter(
                Catalogue.banner_media_id == media_id
            ).all()
            for catalogue in catalogues:
                catalogue.banner_media_id = None

        # Delete from database
        db.delete(media)
        db.commit()

        return {
            "success": True,
            "message": "Media deleted successfully",
            "deleted_id": media_id,
            "r2_deleted": r2_deleted
        }

    # ========================
    # Helper Methods
    # ========================

    def _unset_primary_media(
        self,
        db: Session,
        variant_id: Optional[int] = None,
        product_id: Optional[int] = None,
        usage_type: Optional[str] = None
    ) -> None:
        """Unset is_primary for media matching the criteria"""
        query = db.query(MediaAsset).filter(MediaAsset.is_primary == True)

        if variant_id:
            query = query.filter(MediaAsset.variant_id == variant_id)
        if product_id:
            query = query.filter(MediaAsset.product_id == product_id)
        if usage_type:
            query = query.filter(MediaAsset.usage_type == usage_type)

        query.update({"is_primary": False})
        db.flush()

    def _unset_catalogue_primary_banner(self, db: Session, catalogue_id: int) -> None:
        """Unset primary for catalogue banners"""
        catalogue = db.query(Catalogue).filter(Catalogue.id == catalogue_id).first()
        if catalogue:
            catalogue.banner_media_id = None
            db.flush()

    # ========================
    # Health Check
    # ========================

    @staticmethod
    def check_r2_connection() -> Dict[str, Any]:
        """Check R2 connection health"""
        try:
            return r2_client.check_connection()
        except Exception as e:
            return {
                "connected": False,
                "error": str(e)
            }

    # ========================
    # Replace Media
    # ========================

    async def replace_media(
        self,
        db: Session,
        media_id: int,
        file: UploadFile
    ) -> MediaAsset:
        """
        Replace media file while keeping the same DB record.

        This is useful for admin corrections without changing media_id references.

        Args:
            db: Database session
            media_id: Media asset ID to replace
            file: New file to upload

        Returns:
            Updated MediaAsset
        """
        # Get existing media
        media = self.get_media_by_id(db, media_id)

        # Validate file
        self.validate_file(file, media.media_type)

        # Delete old file from R2
        if media.public_id:
            try:
                r2_client.delete_file(media.public_id)
            except Exception as e:
                logger.warning(f"Failed to delete old file from R2: {str(e)}")

        # Use the same object path (or generate new one with same structure)
        object_path = media.public_id

        # Upload new file
        upload_result = await self.upload_to_r2(file, object_path)

        # Update media record
        media.cloudinary_url = upload_result["public_url"]
        media.public_id = object_path
        media.folder_path = object_path

        db.commit()
        db.refresh(media)

        return media

