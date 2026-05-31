/**
 * Asset Search Bar Component
 * Provides search and filtering capabilities
 */

import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface SearchFilters {
  query: string;
  assetType?: string;
  tags: string[];
  dateRange?: { start: Date; end: Date };
  sizeRange?: { min: number; max: number };
}

interface AssetSearchBarProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: SearchFilters) => void;
  availableTags: string[];
  currentFilters: SearchFilters;
}

export const AssetSearchBar: React.FC<AssetSearchBarProps> = ({
  onSearch,
  onFilterChange,
  availableTags,
  currentFilters,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState(currentFilters.query);
  const [selectedType, setSelectedType] = useState(currentFilters.assetType || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(currentFilters.tags);

  const assetTypes = ['image', 'video', 'document', 'audio', 'other'];

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    onFilterChange({
      ...currentFilters,
      assetType: type,
    });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);
    onFilterChange({
      ...currentFilters,
      tags: newTags,
    });
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search assets by name..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Filter Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ChevronDown
          size={16}
          className={`transition ${showFilters ? 'rotate-180' : ''}`}
        />
        Advanced Filters
      </button>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          {/* Asset Type Filter */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Type</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleTypeChange('')}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedType === ''
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300'
                }`}
              >
                All
              </button>
              {assetTypes.map(type => (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type)}
                  className={`px-3 py-1 rounded-full text-sm capitalize ${
                    selectedType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
