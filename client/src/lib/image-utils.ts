import { toast } from "@/hooks/use-toast";

/**
 * Downloads an image from a URL and converts it to a File object
 */
export async function urlToFile(url: string): Promise<File> {
  console.log(`[urlToFile] Starting download from URL: ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(
        `[urlToFile] Failed to fetch image: ${response.status} ${response.statusText}`
      );
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    console.log(
      `[urlToFile] Successfully downloaded image, size: ${response.headers.get("content-length")} bytes`
    );
    const blob = await response.blob();
    const filename = url.split("/").pop() || "image.jpg";
    console.log(
      `[urlToFile] Converted to blob, type: ${blob.type}, filename: ${filename}`
    );
    return new File([blob], filename, { type: blob.type });
  } catch (error) {
    console.error("[urlToFile] Error converting URL to file:", error);
    throw new Error("Failed to download image from URL");
  }
}

/**
 * Uploads a file to AWS S3 via our API
 */
export async function uploadToAWS(file: File): Promise<string> {
  console.log(
    `[uploadToAWS] Starting upload for file: ${file.name} (${file.size} bytes, ${file.type})`
  );
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[uploadToAWS] Upload failed: ${response.status} ${response.statusText}`,
        errorText
      );
      throw new Error(`Failed to upload to AWS: ${errorText}`);
    }

    const data = await response.json();
    console.log(
      `[uploadToAWS] Successfully uploaded to AWS, got URL: ${data.url}`
    );
    return data.url;
  } catch (error) {
    console.error("[uploadToAWS] Error during upload:", error);
    throw error;
  }
}

/**
 * Converts an image URL to an AWS S3 URL
 */
export async function convertUrlToAWS(url: string): Promise<string> {
  console.log(`[convertUrlToAWS] Starting conversion for URL: ${url}`);
  try {
    console.log("[convertUrlToAWS] Step 1: Converting URL to File");
    const file = await urlToFile(url);

    console.log("[convertUrlToAWS] Step 2: Uploading File to AWS");
    const awsUrl = await uploadToAWS(file);

    console.log(
      `[convertUrlToAWS] Successfully converted URL to AWS URL: ${awsUrl}`
    );
    return awsUrl;
  } catch (error) {
    console.error("[convertUrlToAWS] Error during conversion:", error);
    throw error;
  }
}

/**
 * Converts multiple image URLs to AWS S3 URLs
 */
export const convertUrlsToAWS = async (urls: string[]): Promise<string[]> => {
  console.log(
    "[convertUrlsToAWS] Starting batch conversion of",
    urls.length,
    "URLs"
  );
  const results: string[] = [];
  const errors: string[] = [];

  for (const url of urls) {
    try {
      // Skip if URL is already an AWS URL
      if (url.includes("chunumunu.s3.ap-northeast-1.amazonaws.com")) {
        console.log(
          "[convertUrlsToAWS] Skipping already converted AWS URL:",
          url
        );
        results.push(url);
        continue;
      }

      console.log("[convertUrlsToAWS] Converting URL:", url);
      const awsUrl = await convertUrlToAWS(url);
      console.log(
        "[convertUrlsToAWS] Successfully converted URL to AWS:",
        awsUrl
      );
      results.push(awsUrl);
    } catch (error) {
      console.error("[convertUrlsToAWS] Failed to convert URL:", url, error);
      errors.push(url);
      // Keep the original URL if conversion fails
      results.push(url);
    }
  }

  if (errors.length > 0) {
    console.warn("[convertUrlsToAWS] Some URLs failed to convert:", errors);
    toast({
      title: "Warning",
      description: `${errors.length} image${errors.length > 1 ? "s" : ""} could not be converted. Original URLs will be used.`,
      variant: "destructive",
    });
  }

  return results;
};
