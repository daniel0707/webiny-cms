# File Manager Image Metadata Plugin

## Overview

This plugin automatically extracts image dimensions (width, height) from uploaded images and stores them in the file's metadata. This is useful for:

- Displaying image dimensions in the File Manager UI
- Using dimensions in frontend rendering
- Optimizing layout calculations
- Preventing layout shift

## How It Works

1. **Lifecycle Hook**: The plugin subscribes to the `onFileBeforeCreate` event in the File Manager lifecycle
2. **Image Detection**: When a file is created, it checks if the MIME type starts with `image/`
3. **S3 Retrieval**: Fetches the image from S3 (the file is already uploaded at this point)
4. **Dimension Extraction**: Uses the `image-size` library to parse the image buffer and extract dimensions
5. **Metadata Update**: Adds `width` and `height` to the `file.meta` object before it's saved to DynamoDB

## Installation

The plugin is already installed and configured in `/home/dan/Code/blog-cms/apps/api/graphql/src/index.ts`:

```typescript
import { createFileManagerImageMetadata } from "./plugins/fileManagerImageMetadata";

// ...

createFileManagerContext({
    storageOperations: createFileManagerStorageOperations({
        documentClient
    })
}),
createFileManagerGraphQL(),
createFileManagerImageMetadata(), // ← Plugin added here
createAssetDelivery({ documentClient }),
fileManagerS3(),
```

## Dependencies

- `image-size` (v2.0.2): Fast image dimension detection for multiple formats
- `@aws-sdk/client-s3` (v3.958.0): AWS S3 client for retrieving uploaded files

## Supported Formats

The `image-size` library supports:
- JPEG
- PNG
- GIF
- WebP
- SVG
- BMP
- TIFF
- ICO
- And more...

## Usage in GraphQL

After uploading an image, the metadata will contain:

```graphql
query GetFile {
  fileManager {
    getFile(id: "abc123") {
      id
      name
      type
      size
      meta {
        width    # Auto-populated
        height   # Auto-populated
      }
    }
  }
}
```

## Error Handling

- If S3_BUCKET is not configured, a warning is logged and extraction is skipped
- If dimension extraction fails (corrupt image, unsupported format), an error is logged but the upload succeeds
- The plugin is non-blocking - failures won't prevent file uploads

## Performance Considerations

- **Minimal Overhead**: Only processes image files (skips documents, videos, etc.)
- **Async Processing**: Runs asynchronously during the file creation lifecycle
- **Single S3 Read**: Fetches the file once and reuses the buffer
- **Lambda Optimized**: Works well with AWS Lambda cold starts

## Testing

To test the plugin:

1. Deploy the API: `yarn webiny deploy api --env=dev`
2. Upload an image through the File Manager UI
3. Check the file's metadata in GraphQL or the database
4. Verify `width` and `height` are populated

## Debugging

Enable debug logging by checking CloudWatch logs for the GraphQL Lambda function:

- Look for: `Extracted dimensions for [filename]: [width]x[height]`
- Errors will show: `Failed to extract image dimensions: [error]`

## Future Enhancements

Possible improvements:
- Add EXIF data extraction (camera info, GPS, orientation)
- Store image format/color space
- Generate thumbnail dimensions
- Calculate aspect ratio
- Detect transparency/alpha channel
