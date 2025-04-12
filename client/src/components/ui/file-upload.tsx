import { useCallback, useState } from "react";
import { UploadCloud, Loader2, X, Check, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onChange: (url: string) => void;
  value?: string;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
  id?: string;
}

export function FileUpload({
  onChange,
  value,
  label = "Upload Image",
  accept = "image/*",
  maxSizeMB = 5,
  className,
  id = "file-upload",
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const maxSizeBytes = maxSizeMB * 1024 * 1024; // Convert MB to bytes

  const handleUpload = useCallback(
    async (file: File) => {
      // Check file size
      if (file.size > maxSizeBytes) {
        setError(`File size exceeds ${maxSizeMB}MB limit`);
        toast({
          variant: "destructive",
          title: "File too large",
          description: `Maximum file size is ${maxSizeMB}MB.`,
        });
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        
        console.log(`Uploading file: ${file.name}, size: ${file.size}, type: ${file.type}`);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Upload failed with status ${response.status}: ${errorText}`);
          throw new Error(`Failed to upload file: ${errorText}`);
        }

        const data = await response.json();
        console.log(`Upload success, received URL: ${data.url}`);
        onChange(data.url);
        
        toast({
          title: "File uploaded",
          description: `File "${file.name}" uploaded successfully.`,
        });
      } catch (err) {
        console.error("Error uploading file:", err);
        setError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: err instanceof Error ? err.message : "There was an error uploading your file. Please try again.",
        });
      } finally {
        setIsUploading(false);
      }
    },
    [onChange, maxSizeBytes, maxSizeMB, toast]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="text-sm font-medium">{label}</label>}
      
      {value ? (
        <div className="relative rounded-md overflow-hidden border">
          <img 
            src={value} 
            alt="Uploaded file"
            className="w-full h-48 object-contain bg-secondary/30"
          />
          <div className="absolute top-2 right-2 flex space-x-2">
            <Button
              variant="destructive"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 transition-colors",
            error && "border-destructive text-destructive",
            isUploading && "opacity-70 pointer-events-none"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => document.getElementById(id)?.click()}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Uploading file...</p>
            </>
          ) : error ? (
            <>
              <AlertTriangle className="h-10 w-10 text-destructive" />
              <p className="text-sm font-medium text-destructive">{error}</p>
              <p className="text-xs text-muted-foreground">Click to try again</p>
            </>
          ) : (
            <>
              <UploadCloud className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium">Drag & drop or click to upload</p>
              <p className="text-xs text-muted-foreground">
                Upload a file (max {maxSizeMB}MB)
              </p>
            </>
          )}
          <Input
            id={id}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}

export function FileUploadRow({
  onChange,
  value,
  label = "Upload Image",
  accept = "image/*",
  maxSizeMB = 5,
  className,
  id = "file-upload-row",
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const maxSizeBytes = maxSizeMB * 1024 * 1024; // Convert MB to bytes

  const handleUpload = useCallback(
    async (file: File) => {
      // Check file size
      if (file.size > maxSizeBytes) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: `Maximum file size is ${maxSizeMB}MB.`,
        });
        return;
      }

      setIsUploading(true);
      setIsSuccess(false);

      try {
        const formData = new FormData();
        formData.append("file", file);
        
        console.log(`FileUploadRow: Uploading file: ${file.name}, size: ${file.size}, type: ${file.type}`);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`FileUploadRow: Upload failed with status ${response.status}: ${errorText}`);
          throw new Error(`Failed to upload file: ${errorText}`);
        }

        const data = await response.json();
        console.log(`FileUploadRow: Upload success, received URL: ${data.url}`);
        onChange(data.url);
        setIsSuccess(true);
        
        toast({
          title: "File uploaded",
          description: `File "${file.name}" uploaded successfully.`,
        });
      } catch (err) {
        console.error("FileUploadRow: Error uploading file:", err);
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: err instanceof Error ? err.message : "There was an error uploading your file. Please try again.",
        });
      } finally {
        setIsUploading(false);
      }
    },
    [onChange, maxSizeBytes, maxSizeMB, toast]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex-1">
        <label className="block text-sm font-medium">{label}</label>
        {value && (
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
            {value.split("/").pop()}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {value ? (
          <>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => window.open(value, "_blank")}
            >
              <Check className="h-4 w-4" /> View
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => onChange("")}
            >
              <X className="h-4 w-4" /> Remove
            </Button>
          </>
        ) : (
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={isUploading}
              onClick={() => document.getElementById(id)?.click()}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" /> Uploading...
                </>
              ) : isSuccess ? (
                <>
                  <Check className="h-3 w-3" /> Uploaded
                </>
              ) : (
                <>
                  <UploadCloud className="h-3 w-3" /> Upload
                </>
              )}
            </Button>
            <Input
              id={id}
              type="file"
              accept={accept}
              onChange={handleChange}
              className="hidden"
            />
          </div>
        )}
      </div>
    </div>
  );
}