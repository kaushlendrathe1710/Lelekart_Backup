import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Thumbs } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  // Debugging to see incoming images
  console.log('ProductImageGallery received images:', images);
  
  // Ensure we always have at least one image
  const imageUrls = images.length > 0 ? images : ['https://placehold.co/600x400?text=No+Image'];
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Handle case where initially loaded with only one image, but then updates with more
  useEffect(() => {
    console.log('Images changed, count:', images.length, 'content:', images);
    if (images.length > 0) {
      setActiveIndex(0);
    }
  }, [images]);

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
          navigation={imageUrls.length > 1}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          className="rounded-lg overflow-hidden"
        >
          {imageUrls.map((image, idx) => (
            <SwiperSlide key={idx}>
              <div className="aspect-[4/3] flex items-center justify-center bg-white">
                <img 
                  src={image} 
                  alt={`${productName} - Image ${idx + 1}`} 
                  className="max-h-80 max-w-full object-contain"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        
        {/* Navigation arrows for desktop */}
        {imageUrls.length > 1 && (
          <div className="hidden sm:block">
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 rounded-full w-8 h-8 bg-white opacity-80 hover:opacity-100 shadow-sm"
              onClick={() => {
                if (activeIndex > 0) {
                  setActiveIndex(activeIndex - 1);
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
              onClick={() => {
                if (activeIndex < imageUrls.length - 1) {
                  setActiveIndex(activeIndex + 1);
                }
              }}
              disabled={activeIndex === imageUrls.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Thumbnail images for navigation */}
      {imageUrls.length > 1 && (
        <div className="thumbnails-container">
          <Swiper
            onSwiper={setThumbsSwiper}
            slidesPerView="auto"
            spaceBetween={10}
            modules={[Thumbs]}
            watchSlidesProgress={true}
            className="thumbnail-swiper"
          >
            {imageUrls.map((image, idx) => (
              <SwiperSlide key={idx} className="w-16">
                <div 
                  className={`cursor-pointer rounded-md overflow-hidden border-2 h-16 ${
                    activeIndex === idx ? 'border-primary' : 'border-transparent'
                  }`}
                  onClick={() => setActiveIndex(idx)}
                >
                  <img 
                    src={image} 
                    alt={`Thumbnail ${idx + 1}`} 
                    className="w-full h-full object-cover"
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