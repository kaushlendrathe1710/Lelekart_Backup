import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import { VoiceSearch } from './voice-search';
import { AISearchService } from '@/services/ai-search-service';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface VoiceSearchDialogProps {
  className?: string;
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  buttonText?: string;
  showIcon?: boolean;
  onSearch?: (query: string) => void;
}

export function VoiceSearchDialog({
  className,
  buttonVariant = 'outline',
  buttonSize = 'default',
  buttonText = 'Voice Search',
  showIcon = true,
  onSearch
}: VoiceSearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleSearch = async (query: string) => {
    if (!query) return;
    
    setIsSearching(true);
    
    try {
      // If an external search handler is provided, use it
      if (onSearch) {
        onSearch(query);
        setOpen(false);
        return;
      }
      
      // Otherwise use our default implementation
      // Process the query using AI to extract structured search parameters
      const result = await AISearchService.processQuery(query);
      
      if (result.success) {
        // Build a search URL from the extracted parameters
        const searchUrl = AISearchService.buildSearchUrl(result.filters, result.enhancedQuery);
        
        // Close the dialog
        setOpen(false);
        
        // Navigate to the search page
        navigate(searchUrl);
        
        toast({
          title: 'Voice Search',
          description: `Searching for "${result.enhancedQuery}"`,
          duration: 3000
        });
      } else {
        throw new Error(result.error || 'Failed to process search query');
      }
    } catch (error) {
      console.error('Error processing voice search:', error);
      
      toast({
        title: 'Voice Search Error',
        description: error instanceof Error ? error.message : 'Failed to process your search',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={buttonVariant} 
          size={buttonSize}
          className={className}
          disabled={isSearching}
        >
          {showIcon && <Mic className={buttonText ? "mr-2 h-4 w-4" : "h-4 w-4"} />}
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Voice Search</DialogTitle>
          <DialogDescription>
            Use your voice to search for products on Lelekart
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <VoiceSearch onSearch={handleSearch} />
        </div>
      </DialogContent>
    </Dialog>
  );
}