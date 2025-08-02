# Image Upload System

This implementation provides a complete image upload system with Cloudinary integration and preview functionality.

## Features

✅ **Drag & Drop Upload**: Users can drag images directly from their computer/mobile device
✅ **File Browser**: Click to browse and select multiple images
✅ **Image Preview**: Real-time preview of selected images before upload
✅ **Cloudinary Integration**: Automatic upload to Cloudinary with optimization
✅ **Validation**: File type, size, and count validation
✅ **Progress Indicators**: Visual feedback for upload status
✅ **Error Handling**: Comprehensive error messaging
✅ **Mobile Responsive**: Works on desktop, tablet, and mobile devices

## Architecture

### Controllers
- **ImageController**: Handles image upload, validation, and deletion
- **ItemController**: Updated to use ImageController and proper datasource pattern

### Datasources
- **ItemDatasource**: Added slug validation methods (`isSlugExists`, `validateSlug`)

### Components
- **ImageUploadComponent**: Reusable React component with drag & drop functionality
- **CreateItemModal**: Updated to use the new image upload system

## API Endpoints

### Image Upload
```
POST /api/admin/images
```
- Accepts multipart/form-data with image files
- Returns uploaded image URLs and metadata
- Protected by admin authentication

### Image Deletion
```
DELETE /api/admin/images?publicId=IMAGE_PUBLIC_ID
DELETE /api/admin/images?publicIds=ID1,ID2,ID3
```
- Delete single or multiple images from Cloudinary
- Protected by admin authentication

### Item Management
```
POST /api/admin/items
PUT /api/admin/items/[id]
```
- Now accepts both JSON and multipart/form-data
- Automatic image upload during item creation/update
- Slug validation using datasource methods

## Usage

### 1. Creating Items with Images

```tsx
// The ImageUploadComponent is already integrated in CreateItemModal
<ImageUploadComponent
  images={images}
  onImagesChange={setImages}
  maxImages={10}
  maxFileSize={10} // MB
  acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
/>
```

### 2. Image Upload Process

1. **Select Images**: Drag & drop or click to browse
2. **Preview**: Images appear immediately with preview
3. **Validation**: Automatic validation of file type, size, count
4. **Upload**: Manual or automatic upload to Cloudinary
5. **Integration**: URLs automatically added to item data

### 3. Image States

- **Pending**: Image selected but not yet uploaded (yellow indicator)
- **Uploaded**: Image successfully uploaded to Cloudinary (blue indicator)  
- **Existing**: Previously saved image (green indicator)

## File Validation

- **Supported Types**: JPEG, JPG, PNG, WebP, GIF
- **Max File Size**: 10MB per image
- **Max Images**: 10 images per item (configurable)

## Mobile Support

The system works seamlessly on mobile devices:
- Touch-friendly drag & drop
- Mobile camera integration via file input
- Responsive image grid
- Optimized for smaller screens

## Error Handling

- File type validation with clear error messages
- File size validation  
- Upload failure recovery with cleanup
- Network error handling
- Visual error indicators

## Cloudinary Configuration

Images are automatically:
- Optimized for web delivery with `quality: 'auto'`
- Organized in folders (`milowearco/items/`)
- Delivered with automatic format selection (`f_auto`) for optimal performance
- Preserved in original format unless specifically converted

**Note**: The system preserves the original image format unless a specific format conversion is requested. For delivery optimization, Cloudinary's automatic format detection (`f_auto`) is used to serve the best format for each browser.

## Security

- Admin authentication required for all upload endpoints
- File type validation on both client and server
- Size limits enforced
- Cloudinary public ID management for secure deletion

## Next Steps

To extend the functionality:

1. **Add image editing**: Crop, resize, filters before upload
2. **Bulk operations**: Select and delete multiple images
3. **Image optimization**: Different sizes for thumbnails, gallery, etc.
4. **Alt text support**: SEO and accessibility improvements
5. **Image ordering**: Drag to reorder images in gallery
