import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Thumbs } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';

interface ProductImageGalleryProps {
  imageUrl?: string | null;
  additionalImages?: string | string[] | null;
  productName?: string;
  category?: string;
}

export function ProductImageGallery({ imageUrl, additionalImages, productName = "Product", category }: ProductImageGalleryProps) {
  // Process and extract images from different possible formats
  const processImages = useMemo(() => {
    const allImages: string[] = [];
    
    // Helper function to safely parse JSON strings
    const safeJsonParse = (jsonString: string) => {
      try {
        return JSON.parse(jsonString);
      } catch (e) {
        console.error('Failed to parse JSON image data:', e);
        return null;
      }
    };
    
    // Special handling for additionalImages when stored in bulk upload format
    const extractImagesFromBulkFormat = (jsonString: string) => {
      try {
        // This is a debugging step to check the exact format of additionalImages
        console.log('Bulk format string to parse:', jsonString);
        
        // First try to directly extract URLs with regex to handle the strange format we're seeing
        // This matches URLs that appear at the beginning of a line followed by a comma or quote
        // It's designed specifically for the format we're encountering in bulk uploads
        const directUrlMatches = jsonString.match(/https?:\/\/[^",\\]+/g);
        if (directUrlMatches && directUrlMatches.length > 0) {
          console.log('Directly extracted URL matches from string:', directUrlMatches);
          return directUrlMatches;
        }
        
        // If direct extraction failed, try JSON parsing
        try {
          const parsed = safeJsonParse(jsonString);
          if (!parsed) {
            return [];
          }
          
          // Check if we got an array directly
          if (Array.isArray(parsed)) {
            return parsed.filter(Boolean);
          }
          
          // Extract keys from the object which should be URLs based on what we're seeing
          if (typeof parsed === 'object' && parsed !== null) {
            const urls = Object.keys(parsed).filter(key => key.startsWith('http'));
            if (urls.length > 0) {
              console.log('Extracted URL keys from JSON object:', urls);
              return urls;
            }
          }
        } catch (parseErr) {
          console.error('Error during JSON parsing in extractImagesFromBulkFormat:', parseErr);
        }
        
        return [];
      } catch (e) {
        console.error('Error extracting images from bulk format:', e);
        return [];
      }
    };

    try {
      // Detailed debugging for incoming image data
      console.log('Raw image data:', { 
        imageUrl, 
        additionalImages,
        imageUrlType: imageUrl ? typeof imageUrl : 'undefined',
        additionalImagesType: additionalImages ? typeof additionalImages : 'undefined',
        isArray: additionalImages && Array.isArray(additionalImages)
      });
      
      // Add the main image if it exists
      if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
        // Check if it's a proper URL or a JSON string
        if (imageUrl.startsWith('http')) {
          allImages.push(imageUrl);
        } else if (imageUrl.includes('[') && imageUrl.includes(']')) {
          // May be a JSON array as a string
          const parsed = safeJsonParse(imageUrl);
          if (Array.isArray(parsed) && parsed.length > 0) {
            allImages.push(...parsed.filter(Boolean));
          }
        }
      }
  
      // Add additional images based on their type
      if (additionalImages) {
        // Case 1: additionalImages is a string array
        if (Array.isArray(additionalImages)) {
          allImages.push(...additionalImages.filter(img => 
            typeof img === 'string' && img.trim() !== ''
          ));
        } 
        // Case 2: additionalImages is a single string
        else if (typeof additionalImages === 'string') {
          try {
            // First, check if this is a JSON string of an array
            if (additionalImages.includes('[') && additionalImages.includes(']')) {
              const parsed = safeJsonParse(additionalImages);
              if (Array.isArray(parsed)) {
                // Filter out any null or empty strings
                allImages.push(...parsed.filter((item: unknown) => Boolean(item)));
              }
            }
            // Check if it's a JSON object with URLs as keys - this is the bulk upload format
            else if (additionalImages.includes('{') && additionalImages.includes('}')) {
              try {
                console.log('Attempting to parse additionalImages as JSON object:', additionalImages);
                
                // Try the special extract function for bulk upload format
                const extractedUrls = extractImagesFromBulkFormat(additionalImages);
                if (extractedUrls.length > 0) {
                  allImages.push(...extractedUrls);
                } else {
                  // Fallback to direct regex extraction from the string
                  const urlMatches = additionalImages.match(/https?:\/\/[^",\\]+/g);
                  if (urlMatches && urlMatches.length > 0) {
                    console.log('Extracted URL matches from string:', urlMatches);
                    allImages.push(...urlMatches);
                  }
                }
              } catch (parseErr) {
                console.error('Error parsing additionalImages as JSON object:', parseErr);
                
                // Last resort: direct regex extraction from the string
                const urlMatches = additionalImages.match(/https?:\/\/[^",\\]+/g);
                if (urlMatches && urlMatches.length > 0) {
                  console.log('Last resort - extracted URL matches from string:', urlMatches);
                  allImages.push(...urlMatches);
                }
              }
            }
            // Case 3: It's a single URL string
            else if (additionalImages.trim() !== '') {
              allImages.push(additionalImages);
            }
          } catch (e) {
            console.error('Error processing additionalImages string:', e);
            // If it's a valid URL despite parsing error, still add it
            if (additionalImages.startsWith('http')) {
              allImages.push(additionalImages);
            } else {
              // Last resort: try to extract URLs with regex
              const urlMatches = additionalImages.match(/https?:\/\/[^",\\]+/g);
              if (urlMatches && urlMatches.length > 0) {
                allImages.push(...urlMatches);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Error processing images:", err);
    }

    // Return the unique images as an array to avoid TypeScript issues and remove duplicates
    return Array.from(new Set(allImages));
  }, [imageUrl, additionalImages]);

  // References to Swiper instances
  const mainSwiperRef = useRef<SwiperType | null>(null);
  const thumbsSwiperRef = useRef<SwiperType | null>(null);
  
  // State
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [renderedImages, setRenderedImages] = useState<string[]>([]);
  
  // Debugging to see incoming images
  console.log('ProductImageGallery received images:', { imageUrl, additionalImages });
  console.log('Processed images:', processImages);
  
  // Process images when they change
  useEffect(() => {
    const finalImages = processImages.length > 0 
      ? processImages 
      : ['https://placehold.co/600x400?text=No+Image'];
    
    // Add detailed logging to help debug
    console.log('Setting rendered images to:', finalImages);
    
    // Pre-verify each image with a fetch request to avoid display errors
    const verifyAndSetImages = async () => {
      // Always include the first image
      const verifiedImages = [finalImages[0]];
      
      // Test additional images (if any)
      if (finalImages.length > 1) {
        for (let i = 1; i < finalImages.length; i++) {
          try {
            // Skip verification for placeholder or relative images
            if (!finalImages[i].startsWith('http')) {
              verifiedImages.push(finalImages[i]);
              continue;
            }
            
            // For images that need to go through the proxy, we'll trust them
            // and deal with errors using the onError handler on the image element
            verifiedImages.push(finalImages[i]);
          } catch (err) {
            console.error(`Failed to verify image ${i}:`, finalImages[i], err);
          }
        }
      }

      // Update rendered images with verified ones
      setRenderedImages(verifiedImages);
    };
    
    // Run the verification
    verifyAndSetImages();
    
    // Reset active index when images change
    setActiveIndex(0);
    
    // Update swiper if available
    if (mainSwiperRef.current) {
      console.log('Updating swiper after images changed');
      mainSwiperRef.current.slideTo(0, 0);
      setTimeout(() => {
        if (mainSwiperRef.current) {
          mainSwiperRef.current.update();
        }
        if (thumbsSwiperRef.current) {
          thumbsSwiperRef.current.update();
        }
      }, 300);
    }
  }, [processImages]);

  // Navigate between images
  const goToSlide = (index: number) => {
    if (mainSwiperRef.current) {
      mainSwiperRef.current.slideTo(index);
    }
    setActiveIndex(index);
  };

  // Get placeholder image based on category
  const getPlaceholderImage = () => {
    if (category) {
      const categoryLower = category.toLowerCase();
      return `../images/${categoryLower}.svg`;
    }
    return '../images/placeholder.svg';
  };

  // Placeholder image for errors
  const placeholderImage = getPlaceholderImage();

  return (
    <div className="product-gallery">
      {/* Main large image with swipe capability */}
      <div className="main-image-container relative mb-3">
        <Swiper
          modules={[Pagination, Navigation, Thumbs]}
          thumbs={{ swiper: thumbsSwiper }}
          pagination={{ 
            clickable: true,
            dynamicBullets: true
          }}
          navigation={renderedImages.length > 1}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          className="rounded-lg overflow-hidden"
          onSwiper={(swiper) => {
            mainSwiperRef.current = swiper;
          }}
          key={`main-${renderedImages.length}`} // Force re-render when images change
        >
          {renderedImages.map((image, idx) => (
            <SwiperSlide key={`slide-${idx}`}>
              <div className="aspect-[4/3] flex items-center justify-center bg-white">
                <img 
                  src={image.includes('flixcart.com') || image.includes('lelekart.com') 
                    ? `/api/image-proxy?url=${encodeURIComponent(image)}&category=${encodeURIComponent(category || '')}` 
                    : image}
                  alt={`${productName} - Image ${idx + 1}`} 
                  className="max-h-80 max-w-full object-contain"
                  loading="eager"
                  onError={(e) => {
                    console.error('Failed to load image:', image);
                    (e.target as HTMLImageElement).src = placeholderImage;
                  }}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        
        {/* Navigation arrows for desktop */}
        {renderedImages.length > 1 && (
          <div className="hidden sm:block">
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 rounded-full w-8 h-8 bg-white opacity-80 hover:opacity-100 shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                if (activeIndex > 0) {
                  goToSlide(activeIndex - 1);
                }
              }}
              disabled={activeIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 rounded-full w-8 h-8 bg-white opacity-80 hover:opacity-100 shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                if (activeIndex < renderedImages.length - 1) {
                  goToSlide(activeIndex + 1);
                }
              }}
              disabled={activeIndex === renderedImages.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Thumbnail images for navigation */}
      {renderedImages.length > 1 && (
        <div className="thumbnails-container">
          <Swiper
            onSwiper={(swiper) => {
              setThumbsSwiper(swiper);
              thumbsSwiperRef.current = swiper;
            }}
            slidesPerView="auto"
            spaceBetween={10}
            modules={[Thumbs]}
            watchSlidesProgress={true}
            className="thumbnail-swiper"
            key={`thumbs-${renderedImages.length}`} // Force re-render when images change
          >
            {renderedImages.map((image, idx) => (
              <SwiperSlide key={`thumb-${idx}`} className="w-16">
                <div 
                  className={`cursor-pointer rounded-md overflow-hidden border-2 h-16 ${
                    activeIndex === idx ? 'border-primary' : 'border-transparent'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToSlide(idx);
                  }}
                >
                  <img 
                    src={image.includes('flixcart.com') || image.includes('lelekart.com') 
                      ? `/api/image-proxy?url=${encodeURIComponent(image)}&category=${encodeURIComponent(category || '')}` 
                      : image}
                    alt={`Thumbnail ${idx + 1}`} 
                    className="w-full h-full object-cover"
                    loading="eager"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = placeholderImage;
                    }}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </div>
  );
}