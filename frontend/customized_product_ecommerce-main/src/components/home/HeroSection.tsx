"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Slide {
  id: number;
  title: string;
  subtitle?: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  backgroundImage: string;
  textColor: string;
}

const slides: Slide[] = [
  {
    id: 1,
    title: "",
    subtitle: "",
    description: "",
    buttonText: "Shop Office",
    buttonLink: "/categories/office",
    backgroundImage: "/uploads/slider/slider3.jpeg",
    textColor: "text-white"
  },
  {
    id: 2,
    title: "",
    subtitle: "",
    description: "",
    buttonText: "Shop Now",
    buttonLink: "/products",
    backgroundImage: "/uploads/slider/slider1.jpeg",
    textColor: "text-white"
  },
  {
    id: 3,
    title: "",
    subtitle: "",
    description: "",
    buttonText: "Explore Products",
    buttonLink: "/categories",
    backgroundImage: "/uploads/slider/slider2.jpeg",
    textColor: "text-white"
  }
];

export const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  return (
    <section 
      className="relative h-[600px] overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Slider Container */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Background Image - No Overlay */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${slide.backgroundImage})` }}
            >
            </div>

            {/* Content - Only show button if there's content */}
            {(slide.title || slide.subtitle || slide.description || slide.buttonText) && (
              <div className="relative z-10 h-full flex items-end justify-center pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                  <div className="space-y-6">
                    {/* Main Title */}
                    {slide.title && (
                      <div className="space-y-2">
                        <h1 className={`text-6xl lg:text-8xl font-bold ${slide.textColor} leading-tight drop-shadow-lg`}>
                          {slide.title}
                        </h1>
                        {slide.subtitle && (
                          <h2 className={`text-6xl lg:text-8xl font-bold ${slide.textColor} leading-tight drop-shadow-lg`}>
                            {slide.subtitle}
                          </h2>
                        )}
                      </div>
                    )}
                    
                    {/* Description */}
                    {slide.description && (
                      <p className={`text-lg lg:text-xl ${slide.textColor} opacity-90 max-w-2xl mx-auto leading-relaxed drop-shadow-md`}>
                        {slide.description}
                      </p>
                    )}
                    
                    {/* CTA Button */}
                    {slide.buttonText && (
                      <div className="pt-4">
                        <Link 
                          href={slide.buttonLink}
                          className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                          {slide.buttonText}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-300 z-20 group"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-300 z-20 group"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-white scale-125' 
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20 z-20">
        <div 
          className="h-full bg-orange-500 transition-all duration-300 ease-linear"
          style={{ 
            width: `${((currentSlide + 1) / slides.length) * 100}%` 
          }}
        />
      </div>
    </section>
  );
};
