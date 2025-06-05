import { toast } from "../hooks/use-toast";

/**
 * Downloads an image from a URL and uploads it to AWS S3
 * @param imageUrl The URL of the image to download and upload
 * @returns The AWS S3 URL of the uploaded image
 */
export async function processImageUrl(imageUrl: string): Promise<string> {
  console.log(`[ImageUtils] Starting to process image URL: ${imageUrl}`);
  try {
    // Download the image
    console.log(`[ImageUtils] Downloading image from URL...`);
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(
        `[ImageUtils] Failed to download image: ${response.status} ${response.statusText}`
      );
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    // Get the image data as blob
    console.log(`[ImageUtils] Converting image to blob...`);
    const blob = await response.blob();
    console.log(
      `[ImageUtils] Image blob size: ${blob.size} bytes, type: ${blob.type}`
    );

    // Create a file from the blob
    const fileName = imageUrl.split("/").pop() || "image.jpg";
    console.log(`[ImageUtils] Creating file from blob with name: ${fileName}`);
    const file = new File([blob], fileName, { type: blob.type });

    // Create form data for upload
    console.log(`[ImageUtils] Preparing form data for upload...`);
    const formData = new FormData();
    formData.append("file", file);

    // Upload to AWS S3
    console.log(`[ImageUtils] Uploading to AWS S3...`);
    const uploadResponse = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(
        `[ImageUtils] Upload failed: ${uploadResponse.status} ${errorText}`
      );
      throw new Error(`Failed to upload image: ${errorText}`);
    }

    const data = await uploadResponse.json();
    console.log(`[ImageUtils] Upload successful! AWS URL: ${data.url}`);
    return data.url;
  } catch (error) {
    console.error("[ImageUtils] Error processing image URL:", error);
    toast({
      variant: "destructive",
      title: "Image processing failed",
      description:
        error instanceof Error ? error.message : "Failed to process image URL",
    });
    throw error;
  }
}

/**
 * Processes multiple image URLs in parallel
 * @param imageUrls Array of image URLs to process
 * @returns Array of AWS S3 URLs
 */
export async function processImageUrls(imageUrls: string[]): Promise<string[]> {
  console.log(
    `[ImageUtils] Starting to process ${imageUrls.length} image URLs`
  );
  try {
    console.log(`[ImageUtils] URLs to process:`, imageUrls);
    const uploadPromises = imageUrls.map((url) => processImageUrl(url));
    const results = await Promise.all(uploadPromises);
    console.log(
      `[ImageUtils] Successfully processed all URLs. Results:`,
      results
    );
    return results;
  } catch (error) {
    console.error("[ImageUtils] Error processing multiple image URLs:", error);
    throw error;
  }
}
