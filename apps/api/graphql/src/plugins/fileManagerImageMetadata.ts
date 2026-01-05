/**
 * File Manager Image Metadata Plugin
 * 
 * Automatically extracts image dimensions (width, height) and adds them to file metadata
 * when images are uploaded through Webiny File Manager.
 * 
 * Uses the 'image-size' library to extract dimensions from image buffers.
 */

import { ContextPlugin } from "@webiny/api";
import imageSize from "image-size";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { FileManagerContext, OnFileBeforeCreateTopicParams } from "@webiny/api-file-manager/types";

/**
 * Creates a plugin that extracts image dimensions on upload
 */
export const createFileManagerImageMetadata = () => {
    return new ContextPlugin<FileManagerContext>(async context => {
        // Hook into file creation lifecycle - before the file metadata is saved
        context.fileManager.onFileBeforeCreate.subscribe(
            async ({ file }: OnFileBeforeCreateTopicParams) => {
                // Only process image files
                if (!file.type?.startsWith("image/")) {
                    return;
                }

                try {
                    // Get S3 bucket from environment
                    const bucket = process.env.S3_BUCKET;
                    if (!bucket) {
                        console.warn("S3_BUCKET not configured, skipping image dimension extraction");
                        return;
                    }

                    // Initialize S3 client
                    const s3Client = new S3Client({ region: process.env.AWS_REGION });

                    // Get the file from S3 (file is already uploaded by this point)
                    const command = new GetObjectCommand({
                        Bucket: bucket,
                        Key: file.key
                    });

                    const response = await s3Client.send(command);
                    
                    // Convert stream to buffer
                    const chunks: Uint8Array[] = [];
                    if (response.Body) {
                        for await (const chunk of response.Body as any) {
                            chunks.push(chunk);
                        }
                    }
                    const buffer = Buffer.concat(chunks);

                    // Extract dimensions using image-size
                    const dimensions = imageSize(buffer);

                    // Add dimensions to file metadata (this will be saved to the database)
                    if (!file.meta) {
                        file.meta = {};
                    }

                    file.meta["width"] = dimensions.width;
                    file.meta["height"] = dimensions.height;

                    console.log(`Extracted dimensions for ${file.name}: ${dimensions.width}x${dimensions.height}`);

                } catch (error) {
                    console.error("Failed to extract image dimensions:", error);
                    // Don't fail the upload if dimension extraction fails
                }
            }
        );
    });
};
