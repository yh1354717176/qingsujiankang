import React from 'react';
import { Icons } from './Icons';

interface ImageViewerProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ images, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
      >
        <Icons.Close className="w-8 h-8" />
      </button>

      <div className="w-full h-full flex items-center justify-center relative">
        <img 
          src={images[currentIndex]} 
          alt={`View ${currentIndex + 1}`} 
          className="max-w-full max-h-full object-contain"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
        />
        
        {images.length > 1 && (
          <>
             {currentIndex > 0 && (
                <button 
                  onClick={handlePrev}
                  className="absolute left-2 bg-black/20 text-white p-2 rounded-full hover:bg-black/50"
                >
                  <Icons.ChevronRight className="w-8 h-8 rotate-180" />
                </button>
             )}
             {currentIndex < images.length - 1 && (
                <button 
                  onClick={handleNext}
                  className="absolute right-2 bg-black/20 text-white p-2 rounded-full hover:bg-black/50"
                >
                  <Icons.ChevronRight className="w-8 h-8" />
                </button>
             )}
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                {currentIndex + 1} / {images.length}
             </div>
          </>
        )}
      </div>
    </div>
  );
};