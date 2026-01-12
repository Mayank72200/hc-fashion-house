# Frontend R2 Migration - Quick Reference

## 🎯 Usage Guide

### Import the Utility

```javascript
import { resolveImageUrl, extractMediaUrl, getImageProps } from '@/utils/imageUtils';
```

---

## 📚 Functions

### 1. `resolveImageUrl(imagePath)`

**Purpose:** Convert any path/URL to full R2 URL

**Examples:**
```javascript
// Relative path → Full URL
resolveImageUrl('products/footwear/nike/hr-416/hero.jpg')
// → 'https://assets.hcfashionhouse.com/products/footwear/nike/hr-416/hero.jpg'

// Full URL → Return as-is
resolveImageUrl('https://example.com/image.jpg')
// → 'https://example.com/image.jpg'

// Null/undefined → Fallback
resolveImageUrl(null)
// → 'https://assets.hcfashionhouse.com/global/ui/no-image.png'
```

---

### 2. `extractMediaUrl(media)`

**Purpose:** Extract URL from media object (handles old + new formats)

**Examples:**
```javascript
// Media object (old format)
extractMediaUrl({ cloudinary_url: 'https://res.cloudinary.com/...' })
// → 'https://res.cloudinary.com/...'

// Media object (new format)
extractMediaUrl({ cloudinary_url: 'products/footwear/hero.jpg' })
// → 'https://assets.hcfashionhouse.com/products/footwear/hero.jpg'

// String path
extractMediaUrl('products/footwear/hero.jpg')
// → 'https://assets.hcfashionhouse.com/products/footwear/hero.jpg'

// Null
extractMediaUrl(null)
// → 'https://assets.hcfashionhouse.com/global/ui/no-image.png'
```

---

### 3. `getImageProps(imagePath, alt)`

**Purpose:** Get optimized props for `<img>` tag

**Returns:**
```javascript
{
  src: resolvedUrl,
  alt: 'alt text',
  loading: 'lazy',
  decoding: 'async',
  onError: (e) => { /* fallback */ }
}
```

**Example:**
```jsx
// Before
<img src={product.image} alt={product.name} />

// After
<img {...getImageProps(product.image, product.name)} />

// Expands to:
<img 
  src="https://assets.hcfashionhouse.com/products/..."
  alt="Product Name"
  loading="lazy"
  decoding="async"
  onError={handleFallback}
/>
```

---

## 🔧 Common Patterns

### Product Card
```jsx
import { getImageProps } from '@/utils/imageUtils';

<img 
  {...getImageProps(product.image, product.name)}
  className="w-full h-full object-cover"
/>
```

### Media Array
```jsx
import { extractMediaUrl } from '@/utils/imageUtils';

const images = mediaArray.map(m => extractMediaUrl(m));
```

### Brand Logo
```jsx
import { extractMediaUrl } from '@/utils/imageUtils';

const logo = extractMediaUrl(brand.logo_cloudinary_url || brand.logo_url);
```

### Background Image
```jsx
import { resolveImageUrl } from '@/utils/imageUtils';

<div 
  style={{ 
    backgroundImage: `url(${resolveImageUrl(imagePath)})` 
  }}
/>
```

---

## ⚙️ Environment Setup

### `.env` File
```env
VITE_ASSETS_BASE_URL=https://pub-31ed8ae4320a4a8e847441c0a07a9c08.r2.dev
```

### With Custom Domain
```env
VITE_ASSETS_BASE_URL=https://assets.hcfashionhouse.com
```

---

## 📁 File Structure

```
src/
├── utils/
│   └── imageUtils.js          ← New utility module
├── components/
│   ├── products/
│   │   ├── ProductCard.jsx    ← Updated
│   │   └── FlipCard.jsx       ← Updated
│   └── layout/
│       └── CartDrawer.jsx     ← Updated
├── pages/
│   ├── Product.jsx            ← Updated
│   ├── Wishlist.jsx           ← Updated
│   └── Index.jsx              ← Updated
└── hooks/
    └── useProducts.js         ← Updated
```

---

## ✅ Migration Checklist

### Code Changes
- [x] Created `src/utils/imageUtils.js`
- [x] Updated all product components
- [x] Updated all admin components
- [x] Updated all page components
- [x] Updated hooks/useProducts.js
- [x] Updated .env.example

### Environment
- [ ] Add `VITE_ASSETS_BASE_URL` to `.env`
- [ ] Upload fallback image: `global/ui/no-image.png`
- [ ] Verify R2 bucket public access

### Testing
- [ ] Test product cards
- [ ] Test product detail page
- [ ] Test cart drawer
- [ ] Test wishlist
- [ ] Test checkout
- [ ] Test admin panels
- [ ] Test fallback images
- [ ] Test lazy loading

---

## 🐛 Quick Fixes

### Images Not Loading
```javascript
// Check environment variable
console.log(import.meta.env.VITE_ASSETS_BASE_URL);
// Should print: https://pub-...r2.dev

// Check resolved URL
import { resolveImageUrl } from '@/utils/imageUtils';
console.log(resolveImageUrl('products/test.jpg'));
// Should print: https://pub-.../products/test.jpg
```

### Fallback Not Working
```javascript
// Manually test fallback
import { getFallbackImageUrl } from '@/utils/imageUtils';
console.log(getFallbackImageUrl());
// Visit URL in browser to verify it loads
```

---

## 📝 Best Practices

### ✅ DO
```javascript
// Use getImageProps for img tags
<img {...getImageProps(path, alt)} />

// Use extractMediaUrl for media objects
const url = extractMediaUrl(mediaObject);

// Use resolveImageUrl for direct paths
const url = resolveImageUrl(relativePath);
```

### ❌ DON'T
```javascript
// Don't hardcode base URL
<img src={`https://r2.dev/${path}`} />

// Don't access cloudinary_url directly
<img src={media.cloudinary_url} />

// Don't skip lazy loading
<img src={url} loading="eager" />
```

---

## 🚀 Performance Tips

### Lazy Loading
All images use `loading="lazy"` by default via `getImageProps()`

### Async Decoding
All images use `decoding="async"` by default

### Preload Critical Images
```html
<!-- In index.html for above-fold images -->
<link 
  rel="preload" 
  as="image" 
  href="https://assets.hcfashionhouse.com/hero.jpg"
/>
```

---

## 🔄 Backwards Compatibility

The utility handles:
- ✅ Old Cloudinary URLs
- ✅ New R2 relative paths
- ✅ Full URLs from any source
- ✅ Data URLs (base64)
- ✅ Null/undefined values

**No code changes needed when backend migrates!**

---

## 📞 Support

**Issue:** Image not loading  
**Fix:** Check network tab, verify R2 URL, check CORS

**Issue:** Fallback not working  
**Fix:** Upload `global/ui/no-image.png` to R2

**Issue:** Performance issues  
**Fix:** Verify lazy loading is enabled

---

**Quick Start:**
1. Add `VITE_ASSETS_BASE_URL` to `.env`
2. Import utility in your component
3. Use `getImageProps()` for images
4. Test in browser

Done! 🎉
