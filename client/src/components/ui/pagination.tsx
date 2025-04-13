import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from './button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  siblingCount = 1 
}: PaginationProps) {
  // If there are less than 2 pages, don't render pagination
  if (totalPages <= 1) return null;
  
  // Function to generate page numbers
  const generatePageNumbers = () => {
    // Always show first and last page
    const firstPageIndex = 1;
    const lastPageIndex = totalPages;
    
    // Calculate left and right siblings
    const leftSiblingIndex = Math.max(currentPage - siblingCount, firstPageIndex);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, lastPageIndex);
    
    // Determine if we need to show left and right dots
    const shouldShowLeftDots = leftSiblingIndex > firstPageIndex + 1;
    const shouldShowRightDots = rightSiblingIndex < lastPageIndex - 1;
    
    // Special case: fewer than 7 pages
    if (totalPages <= 5 + siblingCount * 2) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Generate page numbers with dots
    const pages = [];
    
    // Always include the first page
    pages.push(1);
    
    // Add dots on the left side if needed
    if (shouldShowLeftDots) {
      pages.push(-1); // -1 represents dots
    }
    
    // Add pages around the current page
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }
    
    // Add dots on the right side if needed
    if (shouldShowRightDots) {
      pages.push(-2); // -2 represents dots
    }
    
    // Always include the last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  const pageNumbers = generatePageNumbers();
  
  return (
    <div className="flex items-center justify-center space-x-2 my-8">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {pageNumbers.map((page, index) => {
        if (page < 0) {
          // Render dots for ellipsis
          return (
            <Button 
              key={`ellipsis-${index}`}
              variant="ghost" 
              size="icon"
              disabled
              className="cursor-default"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          );
        }
        
        return (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            className={`${page === currentPage ? 'bg-primary text-primary-foreground' : ''}`}
            onClick={() => onPageChange(page)}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </Button>
        );
      })}
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}