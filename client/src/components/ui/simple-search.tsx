import { Search } from 'lucide-react';

export function SimpleSearch() {
  return (
    <div className="relative w-full max-w-md">
      <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 bg-white">
        <Search className="h-4 w-4 mr-2 text-gray-500" />
        <input
          type="text"
          placeholder="Search products..."
          className="flex-1 outline-none bg-transparent"
          disabled={true}
          onClick={() => alert('Search functionality is being improved. Please check back later!')}
        />
        <div className="text-xs text-gray-400 ml-1 hidden md:block">Coming soon</div>
      </div>
    </div>
  );
}