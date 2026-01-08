"""
Media Upload Service
Handles Cloudinary uploads and database operations for media assets
"""
from typing import Optional, List, Dict, Any

import cloudinary
import cloudinary.uploader
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
from utils.cloudinary_config import (
    configure_cloudinary,
    generate_product_variant_folder,
    generate_catalogue_banner_folder,
    generate_category_banner_folder,
    generate_global_folder,
    get_upload_options,
    extract_media_info,
    calculate_aspect_ratio,
    validate_file_type,
    get_allowed_types
)
from utils.exceptions import (
    ResourceNotFoundException,
    ValidationException,
    BusinessRuleException
)


class MediaUploadService:
    """Service for handling media uploads to Cloudinary and database operations"""

    def __init__(self):
        """Initialize the service and configure Cloudinary"""
        configure_cloudinary()

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
                message=f"Invalid file type. Allowed types for {media_type}: {', '.join(allowed_types)}",
                field="file",
                details={"allowed_types": allowed_types, "filename": file.filename}
            )

        # Check file size (max 10MB for images, 100MB for videos)
        max_size = 100 * 1024 * 1024 if media_type == "video" else 10 * 1024 * 1024
        # Note: file.size might be None for streaming uploads
        if file.size and file.size > max_size:
            raise ValidationException(
                message=f"File too large. Maximum size: {max_size // (1024*1024)}MB",
                field="file",
                details={"max_size_mb": max_size // (1024*1024), "file_size_mb": file.size // (1024*1024)}
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
            raise ResourceNotFoundException("Product", product_id)

        variant = db.query(ProductVariant).filter(
            ProductVariant.id == variant_id,
            ProductVariant.product_id == product_id
        ).first()
        if not variant:
            raise ResourceNotFoundException(
                "ProductVariant", variant_id,
                details={"message": f"Variant {variant_id} not found for product {product_id}"}
            )

        return product, variant

    @staticmethod
    def validate_catalogue(db: Session, catalogue_id: int) -> Catalogue:
        """Validate that catalogue exists"""
        catalogue = db.query(Catalogue).filter(Catalogue.id == catalogue_id).first()
        if not catalogue:
            raise ResourceNotFoundException("Catalogue", catalogue_id)
        return catalogue

    @staticmethod
    def validate_category(db: Session, category_id: int) -> Category:
        """Validate that category exists"""
        category = db.query(Category).filter(Category.id == category_id).first()
        if not category:
            raise ResourceNotFoundException("Category", category_id)
        return category

    # ========================
    # Upload Methods
    # ========================

    async def upload_to_cloudinary(
        self,
        file: UploadFile,
        folder_path: str,
        resource_type: str = "image"
    ) -> Dict[str, Any]:
        """
        Upload file to Cloudinary.

        Args:
            file: The file to upload
            folder_path: Target folder in Cloudinary
            resource_type: 'image' or 'video'

        Returns:
            Cloudinary upload response

        Raises:
            BusinessRuleException: If upload fails
        """
        try:
            # Read file content
            content = await file.read()

            # Get upload options
            options = get_upload_options(folder_path, resource_type)

            # Upload to Cloudinary
            result = cloudinary.uploader.upload(
                content,
                **options
            )

            return result

        except cloudinary.exceptions.Error as e:
            raise BusinessRuleException(
                message=f"Cloudinary upload failed: {str(e)}",
                rule="cloudinary_upload",
                details={"folder": folder_path, "error": str(e)}
            )
        except Exception as e:
            raise BusinessRuleException(
                message=f"Upload failed: {str(e)}",
                rule="file_upload",
                details={"error": str(e)}
            )
        finally:
            # Reset file position for potential retry
            await file.seek(0)

    def create_media_asset(
        self,
        db: Session,
        upload_result: Dict[str, Any],
        folder_path: str,
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
            upload_result: Cloudinary upload response
            folder_path: Folder path in Cloudinary
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
        info = extract_media_info(upload_result)
        aspect_ratio = calculate_aspect_ratio(info.get("width"), info.get("height"))

        media_asset = MediaAsset(
            product_id=product_id,
            variant_id=variant_id,
            media_type=media_type,
            usage_type=usage_type,
            platform=platform,
            cloudinary_url=info["cloudinary_url"],
            folder_path=folder_path,
            public_id=info["public_id"],
            width=info.get("width"),
            height=info.get("height"),
            aspect_ratio=aspect_ratio,
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
        Upload media for a product variant.

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

        # Generate folder path
        variant_slug = variant.sku.lower().replace("-", "-") if variant.sku else f"variant-{variant.id}"
        # Get product type from category -> platform hierarchy
        product_type = product.category.platform.slug if product.category and product.category.platform else "general"
        folder_path = generate_product_variant_folder(
            product_type=product_type,
            product_slug=product.slug,
            variant_slug=variant_slug,
            usage_type=upload_data.usage_type.value
        )

        # If setting as primary, unset other primary images for this variant
        if upload_data.is_primary:
            self._unset_primary_media(
                db,
                variant_id=upload_data.variant_id,
                usage_type=upload_data.usage_type.value
            )

        # Upload to Cloudinary
        upload_result = await self.upload_to_cloudinary(file, folder_path, "image")

        # Create database record
        media_asset = self.create_media_asset(
            db=db,
            upload_result=upload_result,
            folder_path=folder_path,
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

        # Generate folder path
        folder_path = generate_catalogue_banner_folder(catalogue.slug)

        # If setting as primary, unset other primary banners
        if upload_data.is_primary:
            self._unset_catalogue_primary_banner(db, upload_data.catalogue_id)

        # Upload to Cloudinary
        upload_result = await self.upload_to_cloudinary(file, folder_path, "image")

        # Create database record
        media_asset = self.create_media_asset(
            db=db,
            upload_result=upload_result,
            folder_path=folder_path,
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

        # Generate folder path
        folder_path = generate_category_banner_folder(category.slug)

        # Upload to Cloudinary
        upload_result = await self.upload_to_cloudinary(file, folder_path, "image")

        # Create database record
        media_asset = self.create_media_asset(
            db=db,
            upload_result=upload_result,
            folder_path=folder_path,
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

        # Generate folder path
        folder_path = generate_global_folder(upload_data.folder_type)

        # Determine resource type
        resource_type = "video" if upload_data.media_type == MediaType.VIDEO else "image"

        # Upload to Cloudinary
        upload_result = await self.upload_to_cloudinary(file, folder_path, resource_type)

        # Create database record
        media_asset = self.create_media_asset(
            db=db,
            upload_result=upload_result,
            folder_path=folder_path,
            media_type=upload_data.media_type.value,
            usage_type=UsageType.BANNER.value,  # Global media uses banner type
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
            raise ResourceNotFoundException("MediaAsset", media_id)
        return media

    @staticmethod
    def list_product_media(
        db: Session,
        product_id: int,
        usage_type: Optional[str] = None
    ) -> List[MediaAsset]:
        """List all media for a product, ordered by display_order"""
        query = db.query(MediaAsset).filter(MediaAsset.product_id == product_id)

        if usage_type:
            query = query.filter(MediaAsset.usage_type == usage_type)

        return query.order_by(MediaAsset.display_order.asc()).all()

    @staticmethod
    def list_variant_media(
        db: Session,
        variant_id: int,
        usage_type: Optional[str] = None
    ) -> List[MediaAsset]:
        """List all media for a variant, ordered by display_order"""
        query = db.query(MediaAsset).filter(MediaAsset.variant_id == variant_id)

        if usage_type:
            query = query.filter(MediaAsset.usage_type == usage_type)

        return query.order_by(MediaAsset.display_order.asc()).all()

    @staticmethod
    def list_catalogue_banners(db: Session, catalogue_id: int) -> List[MediaAsset]:
        """List all banners for a catalogue"""
        catalogue = db.query(Catalogue).filter(Catalogue.id == catalogue_id).first()
        if not catalogue:
            raise ResourceNotFoundException("Catalogue", catalogue_id)

        folder_path = generate_catalogue_banner_folder(catalogue.slug)
        return db.query(MediaAsset).filter(
            MediaAsset.folder_path == folder_path,
            MediaAsset.usage_type == UsageType.BANNER.value
        ).order_by(MediaAsset.display_order.asc()).all()

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
            if value is not None:
                if key == 'status':
                    setattr(media, key, value.value if hasattr(value, 'value') else value)
                elif key == 'platform':
                    setattr(media, key, value.value if hasattr(value, 'value') else value)
                else:
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
                rule="media_ownership",
                details={"media_id": media_id, "variant_id": variant_id}
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
            media = db.query(MediaAsset).filter(MediaAsset.id == item['media_id']).first()
            if media:
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
        Delete media from Cloudinary and database.

        Args:
            db: Database session
            media_id: Media asset ID

        Returns:
            Deletion result
        """
        media = self.get_media_by_id(db, media_id)

        cloudinary_deleted = False

        # Try to delete from Cloudinary
        if media.public_id:
            try:
                resource_type = "video" if media.media_type == "video" else "image"
                cloudinary.uploader.destroy(media.public_id, resource_type=resource_type)
                cloudinary_deleted = True
            except Exception as e:
                # Log but don't fail - still delete from DB
                print(f"Warning: Could not delete from Cloudinary: {e}")

        # If this was a catalogue banner, update catalogue
        if media.usage_type == UsageType.BANNER.value and media.is_primary:
            catalogue = db.query(Catalogue).filter(
                Catalogue.banner_media_id == media_id
            ).first()
            if catalogue:
                catalogue.banner_media_id = None

        # Delete from database
        db.delete(media)
        db.commit()

        return {
            "success": True,
            "message": "Media deleted successfully",
            "deleted_id": media_id,
            "cloudinary_deleted": cloudinary_deleted
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
            folder_path = generate_catalogue_banner_folder(catalogue.slug)
            db.query(MediaAsset).filter(
                MediaAsset.folder_path == folder_path,
                MediaAsset.is_primary == True
            ).update({"is_primary": False})
            db.flush()

    # ========================
    # Health Check
    # ========================

    @staticmethod
    def check_cloudinary_connection() -> Dict[str, Any]:
        """Check if Cloudinary connection is working"""
        try:
            result = cloudinary.api.ping()
            return {
                "status": "healthy",
                "cloud_name": cloudinary.config().cloud_name,
                "connected": True,
                "message": "Cloudinary connection successful"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "cloud_name": cloudinary.config().cloud_name,
                "connected": False,
                "message": str(e)
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

        # Delete old file from Cloudinary
        if media.public_id:
            try:
                resource_type = "video" if media.media_type == "video" else "image"
                cloudinary.uploader.destroy(media.public_id, resource_type=resource_type)
            except Exception as e:
                print(f"Warning: Could not delete old media from Cloudinary: {e}")

        # Upload new file to the same folder
        upload_result = await self.upload_to_cloudinary(
            file,
            media.folder_path,
            media.media_type
        )

        # Extract new media info
        info = extract_media_info(upload_result)
        aspect_ratio = calculate_aspect_ratio(info.get("width"), info.get("height"))

        # Update media record
        media.cloudinary_url = info["cloudinary_url"]
        media.public_id = info["public_id"]
        media.width = info.get("width")
        media.height = info.get("height")
        media.aspect_ratio = aspect_ratio

        db.commit()
        db.refresh(media)

        return media

