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
  imageUrl?: string;
  additionalImages?: string | null;
  productName?: string;
}

export function ProductImageGallery({ imageUrl, additionalImages, productName = "Product" }: ProductImageGalleryProps) {
  // Combine main image and additional images
  const images = useMemo(() => {
    const allImages = [];
    
    // Add main image if it exists
    if (imageUrl) {
      allImages.push(imageUrl);
    }
    
    // Add additional images if they exist
    if (additionalImages) {
      try {
        // Parse if it's a JSON string
        if (typeof additionalImages === 'string') {
          const parsedImages = JSON.parse(additionalImages);
          if (Array.isArray(parsedImages)) {
            allImages.push(...parsedImages.filter(Boolean));
          }
        }
      } catch (error) {
        console.error('Error parsing additional images:', error);
      }
    }
    
    return allImages;
  }, [imageUrl, additionalImages]);
  // References to Swiper instances
  const mainSwiperRef = useRef<SwiperType | null>(null);
  const thumbsSwiperRef = useRef<SwiperType | null>(null);
  
  // State
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [renderedImages, setRenderedImages] = useState<string[]>([]);
  
  // Debugging to see incoming images
  console.log('ProductImageGallery received images:', images);
  
  // Process images when they change
  useEffect(() => {
    // Ensure images is treated as an array and filter out empty strings
    const validImages = Array.isArray(images) 
      ? images.filter(img => img && typeof img === 'string' && img.trim() !== '')
      : [];
    
    console.log('Images changed, count:', validImages.length, 'content:', validImages);
    
    // Use placeholder if no valid images
    const finalImages = validImages.length > 0 
      ? validImages 
      : ['https://placehold.co/600x400?text=No+Image'];
    
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
  }, [images]);

  // Navigate between images
  const goToSlide = (index: number) => {
    if (mainSwiperRef.current) {
      mainSwiperRef.current.slideTo(index);
    }
    setActiveIndex(index);
  };

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
          key={`main-${renderedImages.join('')}`} // Force re-render when images change
        >
          {renderedImages.map((image, idx) => (
            <SwiperSlide key={`slide-${image}-${idx}`}>
              <div className="aspect-[4/3] flex items-center justify-center bg-white">
                <img 
                  src={image} 
                  alt={`${productName} - Image ${idx + 1}`} 
                  className="max-h-80 max-w-full object-contain"
                  loading="eager" // Important for bulk upload images
                  onError={(e) => {
                    console.error('Image failed to load:', image);
                    (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Error+Loading+Image';
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
            key={`thumbs-${renderedImages.join('')}`} // Force re-render when images change
          >
            {renderedImages.map((image, idx) => (
              <SwiperSlide key={`thumb-${image}-${idx}`} className="w-16">
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