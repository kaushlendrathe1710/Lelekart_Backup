import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Hero slider image interface
interface SliderImage {
  url: string;
  alt: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  category?: string;
  badgeText?: string;
  productId?: number;
}

interface HeroSectionProps {
  sliderImages: SliderImage[];
  dealOfTheDay?: {
    title: string;
    subtitle: string;
    image: string;
    originalPrice: number;
    discountPrice: number;
    discountPercentage: number;
    hours: number;
    minutes: number;
    seconds: number;
    productId?: number;  // Added product ID for linking
  };
}

export function HeroSection({ sliderImages, dealOfTheDay }: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);
  const [, navigate] = useLocation();
  
  // Deal of the day countdown
  const [countdown, setCountdown] = useState({
    hours: dealOfTheDay?.hours || 47,
    minutes: dealOfTheDay?.minutes || 53,
    seconds: dealOfTheDay?.seconds || 41,
  });

  // Update countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        let newSeconds = prev.seconds - 1;
        let newMinutes = prev.minutes;
        let newHours = prev.hours;

        if (newSeconds < 0) {
          newSeconds = 59;
          newMinutes--;
        }
        
        if (newMinutes < 0) {
          newMinutes = 59;
          newHours--;
        }
        
        if (newHours < 0) {
          // Reset or stop timer when reaches 0
          return { hours: 0, minutes: 0, seconds: 0 };
        }

        return { hours: newHours, minutes: newMinutes, seconds: newSeconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const goToSlide = (slideIndex: number) => {
    let newIndex = slideIndex;
    if (newIndex < 0) newIndex = sliderImages.length - 1;
    if (newIndex >= sliderImages.length) newIndex = 0;
    
    setCurrentSlide(newIndex);
    
    if (sliderRef.current) {
      sliderRef.current.style.transform = `translateX(-${newIndex * 100}%)`;
    }
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    goToSlide(currentSlide - 1);
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    goToSlide(currentSlide + 1);
  };

  const handleSlideClick = (image: SliderImage) => {
    if (image.productId) {
      navigate(`/product/${image.productId}`);
    } else if (image.category) {
      navigate(`/?category=${image.category.toLowerCase()}`);
    }
  };

  // Set up autoplay
  useEffect(() => {
    const startAutoplay = () => {
      intervalRef.current = window.setInterval(() => {
        goToSlide(currentSlide + 1);
      }, 5000);
    };

    const stopAutoplay = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    startAutoplay();

    return () => stopAutoplay();
  }, [currentSlide]);

  // Pause autoplay on hover
  const handleMouseEnter = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    intervalRef.current = window.setInterval(() => {
      goToSlide(currentSlide + 1);
    }, 5000);
  };

  return (
    <>
      {/* Main hero slider */}
      <div 
        className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-700"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          ref={sliderRef}
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {sliderImages.map((image, index) => (
            <div 
              key={index} 
              className="w-full flex-shrink-0 cursor-pointer"
              onClick={() => handleSlideClick(image)}
            >
              <div className="container mx-auto px-4 py-8 md:py-16 flex flex-col md:flex-row items-center">
                {/* Content area */}
                <div className="md:w-1/2 text-white mb-8 md:mb-0 md:pr-8">
                  {image.badgeText && (
                    <span className="bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-md uppercase">
                      {image.badgeText}
                    </span>
                  )}
                  <h2 className="text-3xl md:text-5xl font-bold mt-4 leading-tight">{image.title || "Summer Sale Collection"}</h2>
                  <p className="mt-4 text-lg md:text-xl opacity-90 max-w-md">{image.subtitle || "Up to 50% off on all summer essentials"}</p>
                  <Button 
                    className="mt-6 bg-white text-blue-600 hover:bg-gray-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSlideClick(image);
                    }}
                  >
                    {image.buttonText || "Shop Now"}
                  </Button>
                </div>
                
                {/* Image area */}
                <div className="md:w-1/2">
                  <img 
                    src={image.url} 
                    alt={image.alt} 
                    className="w-full h-64 md:h-80 object-cover rounded-lg shadow-lg" 
                    onError={(e) => {
                      // Use a fallback image on error
                      const target = e.target as HTMLImageElement;
                      target.onerror = null; // Prevent infinite loop
                      target.src = "https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/placeholder_9951d0.svg";
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Slider Controls */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-2 shadow-lg z-10 hover:bg-white"
          onClick={prevSlide}
        >
          <ChevronLeft className="text-primary" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-2 shadow-lg z-10 hover:bg-white"
          onClick={nextSlide}
        >
          <ChevronRight className="text-primary" />
        </Button>
        
        {/* Indicator Dots */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {sliderImages.map((_, index) => (
            <button 
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === currentSlide ? 'bg-white' : 'bg-white/50'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(index);
              }}
            />
          ))}
        </div>
      </div>

      {/* Deal of the Day Section */}
      {dealOfTheDay && (
        <div className="bg-gray-50 py-6">
          <div className="container mx-auto px-4">
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
              <div className="flex flex-col md:flex-row">
                {/* Left side - Deal info */}
                <div className="md:w-1/2 md:pr-8">
                  <div className="flex items-center mb-4">
                    <div className="bg-red-600 text-white text-xs font-medium px-2 py-1 rounded">
                      DEAL OF THE DAY
                    </div>
                    <div className="flex ml-4 space-x-2">
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">{countdown.hours}</div>
                        <div className="text-xs text-gray-500">Hours</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">{countdown.minutes}</div>
                        <div className="text-xs text-gray-500">Minutes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">{countdown.seconds}</div>
                        <div className="text-xs text-gray-500">Seconds</div>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-medium mb-2">{dealOfTheDay.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{dealOfTheDay.subtitle}</p>
                  
                  <div className="flex items-center mb-4">
                    <span className="text-2xl font-bold">₹{dealOfTheDay.discountPrice.toFixed(2)}</span>
                    <span className="text-gray-500 line-through ml-2">₹{dealOfTheDay.originalPrice.toFixed(2)}</span>
                    <span className="text-green-600 ml-2 text-sm">{dealOfTheDay.discountPercentage}% off</span>
                  </div>
                  
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      if (dealOfTheDay.productId) {
                        navigate(`/product/${dealOfTheDay.productId}`);
                      }
                    }}
                  >
                    Shop Now
                  </Button>
                </div>
                
                {/* Right side - Product image */}
                <div className="md:w-1/2 mt-6 md:mt-0">
                  <div 
                    className="cursor-pointer" 
                    onClick={() => {
                      if (dealOfTheDay.productId) {
                        navigate(`/product/${dealOfTheDay.productId}`);
                      }
                    }}
                  >
                    <img 
                      src={dealOfTheDay.image} 
                      alt={dealOfTheDay.title}
                      className="w-full max-h-48 object-contain"
                      onError={(e) => {
                        // Use a fallback image on error
                        const target = e.target as HTMLImageElement;
                        target.onerror = null; // Prevent infinite loop
                        target.src = "https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/placeholder_9951d0.svg";
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}