import { Search, X, Mic } from 'lucide-react';
import { useState, FormEvent, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from './button';
import { VoiceSearchDialog } from '@/components/search/voice-search-dialog';
import { cn } from '@/lib/utils';
import { AISearchService } from '@/services/ai-search-service';
import { useToast } from '@/hooks/use-toast';

interface SimpleSearchProps {
  className?: string;
}

export function SimpleSearch({ className }: SimpleSearchProps = {}) {
  const [query, setQuery] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [, navigate] = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Process search with AI
  const processAiSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setIsAiSearching(true);
    
    try {
      // Process the query using AI to extract structured search parameters
      console.log('Processing AI search query:', searchQuery);
      const result = await AISearchService.processQuery(searchQuery);
      
      if (result.success) {
        // Build a search URL from the extracted parameters
        const searchUrl = AISearchService.buildSearchUrl(result.filters, result.enhancedQuery);
        
        // Navigate to the search page
        navigate(searchUrl);
        
        toast({
          title: 'AI Search',
          description: `Searching for "${result.enhancedQuery}"`,
          duration: 3000
        });
      } else {
        throw new Error(result.error || 'Failed to process search query');
      }
    } catch (error) {
      console.error('Error processing AI search:', error);
      
      toast({
        title: 'Search Error',
        description: error instanceof Error ? error.message : 'Failed to process your search',
        variant: 'destructive'
      });
      
      // Fall back to simple search with the original query
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } finally {
      setIsAiSearching(false);
    }
  };

  // Handle form submission
  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      console.log('Search for:', query);
      
      // For direct queries longer than 6 words, use AI search processing
      if (query.trim().split(' ').length > 6) {
        console.log('Using AI search processing for long query');
        await processAiSearch(query);
      } else {
        // Use simple search for shorter queries
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };
  
  // Handle voice search query
  const handleVoiceSearch = async (voiceQuery: string) => {
    if (!voiceQuery.trim()) return;
    
    console.log('Processing voice search query:', voiceQuery);
    await processAiSearch(voiceQuery);
  };

  const clearSearch = () => setQuery('');

  // Focus input when pressing / key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className={cn("relative", className)}>
      <form onSubmit={handleSearch} className="relative w-full max-w-xl">
        <div className="flex items-center border-2 border-white/30 hover:border-white/50 focus-within:border-white rounded-lg px-4 py-2.5 bg-white/10 backdrop-blur-sm shadow-lg transition-all">
          <Search className="h-5 w-5 mr-3 text-white" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search for products, brands and more..."
            className="flex-1 outline-none bg-transparent text-white placeholder-white/70 text-base"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isAiSearching}
          />
          {query && (
            <button 
              type="button"
              className="text-white/80 hover:text-white"
              onClick={clearSearch}
              disabled={isAiSearching}
            >
              <X className="h-5 w-5" />
            </button>
          )}
          
          {/* Voice search button */}
          <VoiceSearchDialog 
            className="ml-2 text-white/80 hover:text-white"
            buttonVariant="ghost"
            buttonSize="icon"
            buttonText=""
            showIcon={true}
            onSearch={handleVoiceSearch}
          />
          
          <Button 
            type="submit" 
            className="ml-3 bg-white text-primary hover:bg-white/90 font-medium rounded-md"
            size="sm"
            disabled={isAiSearching}
          >
            Search
          </Button>
        </div>
        <div className="hidden md:flex absolute -bottom-6 left-4 text-xs text-white/70">
          Press <kbd className="px-1.5 py-0.5 bg-white/20 rounded mx-1 font-mono">/</kbd> to search
        </div>
      </form>
    </div>
  );
}