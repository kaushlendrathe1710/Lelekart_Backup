import { Search, X } from 'lucide-react';
import { useState, FormEvent, useRef, useEffect } from 'react';
import { useNavigate } from 'wouter';
import { Button } from './button';

export function SimpleSearch() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      console.log('Search for:', query);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
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
        />
        {query && (
          <button 
            type="button"
            className="text-white/80 hover:text-white"
            onClick={clearSearch}
          >
            <X className="h-5 w-5" />
          </button>
        )}
        <Button 
          type="submit" 
          className="ml-3 bg-white text-primary hover:bg-white/90 font-medium rounded-md"
          size="sm"
        >
          Search
        </Button>
      </div>
      <div className="hidden md:flex absolute -bottom-6 left-4 text-xs text-white/70">
        Press <kbd className="px-1.5 py-0.5 bg-white/20 rounded mx-1 font-mono">/</kbd> to search
      </div>
    </form>
  );
}