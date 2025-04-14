import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertReviewSchema } from '@shared/schema';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2, Upload, X } from 'lucide-react';

interface ReviewFormProps {
  productId: number;
  onSuccess?: () => void;
}

// Extend schema for client-side validation
const reviewFormSchema = insertReviewSchema
  .omit({ userId: true, productId: true, verifiedPurchase: true, helpfulCount: true })
  .extend({
    images: z.array(z.string()).optional(),
  });

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

const StarRatingInput = ({ 
  value, 
  onChange 
}: { 
  value: number, 
  onChange: (value: number) => void 
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          type="button"
          key={star}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className="focus:outline-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-8 w-8 ${
              star <= (hoverRating || value) ? 'text-yellow-400' : 'text-gray-300'
            } transition-colors duration-150`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 15.934l-6.18 3.249 1.18-6.889L.083 7.514l6.91-1.004L10 0l3.008 6.51 6.909 1.004-4.917 4.78 1.18 6.89z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      ))}
    </div>
  );
};

const ReviewForm: React.FC<ReviewFormProps> = ({ productId, onSuccess }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      title: '',
      review: '',
      rating: 5,
      images: [],
    },
  });
  
  const addImageUrl = () => {
    if (!newImageUrl) {
      toast({
        title: 'Empty URL',
        description: 'Please enter an image URL',
        variant: 'destructive',
      });
      return;
    }
    
    if (imageUrls.includes(newImageUrl)) {
      toast({
        title: 'Duplicate image',
        description: 'This image URL is already added',
        variant: 'destructive',
      });
      return;
    }
    
    // Basic URL validation
    try {
      new URL(newImageUrl);
    } catch (e) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid image URL',
        variant: 'destructive',
      });
      return;
    }
    
    // Check if the URL points to an image (pre-load)
    const img = new Image();
    img.onload = () => {
      // Valid image - add to the list
      setImageUrls(prev => [...prev, newImageUrl]);
      setNewImageUrl('');
      toast({
        title: 'Image added',
        description: 'Image has been added to your review',
      });
    };
    img.onerror = () => {
      toast({
        title: 'Invalid image',
        description: 'The URL provided does not seem to be a valid image',
        variant: 'destructive',
      });
    };
    img.src = newImageUrl;
  };
  
  const removeImageUrl = (url: string) => {
    setImageUrls(imageUrls.filter((imageUrl) => imageUrl !== url));
  };
  
  const onSubmit = async (data: ReviewFormValues) => {
    setIsSubmitting(true);
    try {
      const reviewData = {
        ...data,
        images: imageUrls,
      };
      
      await apiRequest('POST', `/api/products/${productId}/reviews`, reviewData);
      
      toast({
        title: 'Review submitted',
        description: 'Thank you for your review!',
      });
      
      // Reset form
      form.reset();
      setImageUrls([]);
      
      // Invalidate queries to refresh reviews
      queryClient.invalidateQueries({ queryKey: ['productReviews'] });
      queryClient.invalidateQueries({ queryKey: [`product_${productId}_rating`] });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit review. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <FormControl>
                    <StarRatingInput
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Summarize your experience" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="review"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Review</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What did you like or dislike about this product?"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <FormLabel>Add Images (Optional)</FormLabel>
              <div className="flex flex-col space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter image URL"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    onClick={addImageUrl}
                    variant="outline"
                    disabled={uploadingImage}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Add URL
                  </Button>
                </div>
                
                <div className="flex gap-2 items-center">
                  <p className="text-sm text-muted-foreground">Or upload directly:</p>
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        // Validate file type
                        if (!file.type.startsWith('image/')) {
                          toast({
                            title: 'Invalid file',
                            description: 'Please upload an image file',
                            variant: 'destructive',
                          });
                          return;
                        }
                        
                        // Max size validation (2MB)
                        if (file.size > 2 * 1024 * 1024) {
                          toast({
                            title: 'File too large',
                            description: 'Image size should be less than 2MB',
                            variant: 'destructive',
                          });
                          return;
                        }
                        
                        try {
                          setUploadingImage(true);
                          
                          // Create FormData for file upload
                          const formData = new FormData();
                          formData.append('image', file);
                          
                          // Upload to server
                          const response = await fetch('/api/upload-image', {
                            method: 'POST',
                            credentials: 'include',
                            body: formData,
                          });
                          
                          if (!response.ok) {
                            throw new Error('Failed to upload image');
                          }
                          
                          const result = await response.json();
                          
                          // Add the uploaded image URL to our list
                          setImageUrls(prev => [...prev, result.imageUrl]);
                          
                          toast({
                            title: 'Image uploaded',
                            description: 'Image has been added to your review',
                          });
                        } catch (error) {
                          console.error('Upload error:', error);
                          toast({
                            title: 'Upload failed',
                            description: 'Could not upload image. Please try again.',
                            variant: 'destructive',
                          });
                        } finally {
                          setUploadingImage(false);
                          // Clear the file input
                          e.target.value = '';
                        }
                      }}
                      disabled={uploadingImage}
                    />
                    <Button 
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Image
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              <FormDescription>
                Add images to include photos with your review (URL or upload)
              </FormDescription>
              
              {imageUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Review image ${index + 1}`}
                        className="h-24 w-full object-cover rounded-md"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/placeholder.svg';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImageUrl(url)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ReviewForm;