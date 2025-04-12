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
}

export function ProductImageGallery({ imageUrl, additionalImages, productName = "Product" }: ProductImageGalleryProps) {
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

    try {
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
          // Check if it's a JSON string containing an array
          if (additionalImages.includes('[') && additionalImages.includes(']')) {
            const parsed = safeJsonParse(additionalImages);
            if (Array.isArray(parsed)) {
              // Filter out any null or empty strings
              allImages.push(...parsed.filter(item => Boolean(item)));
            }
          }
          // Case 3: It's a single URL string
          else if (additionalImages.trim() !== '') {
            allImages.push(additionalImages);
          }
        }
      }
    } catch (err) {
      console.error("Error processing images:", err);
    }

    // Return the unique images as an array to avoid TypeScript issues
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
    
    console.log('Setting rendered images to:', finalImages);
    
    // Update rendered images
    setRenderedImages(finalImages);
    
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

  // Placeholder image for errors
  const placeholderImage = 'https://placehold.co/600x400?text=No+Image';

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
                  src={image}
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
                    src={image}
                    alt={`Thumbnail ${idx + 1}`} 
                    className="w-full h-full object-cover"
                    loading="eager"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Error';
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