import { Search } from 'lucide-react';
import { useState, FormEvent, useRef, useEffect } from 'react';
import { useNavigate } from 'wouter';

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
    <form onSubmit={handleSearch} className="relative w-full max-w-md">
      <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 bg-white">
        <Search className="h-4 w-4 mr-2 text-gray-500" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search products... (Press / to focus)"
          className="flex-1 outline-none bg-transparent"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button 
            type="button"
            className="text-xs text-gray-500 hover:text-gray-700 ml-1"
            onClick={() => setQuery('')}
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );
}