import React from "react";

// Simple icons as components
const Search: React.FC<{ className?: string }> = ({
  className = "w-5 h-5",
}) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const Filter: React.FC<{ className?: string }> = ({
  className = "w-4 h-4",
}) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
    />
  </svg>
);

const SortAsc: React.FC<{ className?: string }> = ({
  className = "w-4 h-4",
}) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
    />
  </svg>
);

const SortDesc: React.FC<{ className?: string }> = ({
  className = "w-4 h-4",
}) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
    />
  </svg>
);

interface SearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;

  // Sort options
  sortField: string;
  sortDirection: "asc" | "desc";
  onSortChange: (field: string, direction: "asc" | "desc") => void;
  sortOptions: { value: string; label: string }[];

  // Site filter
  selectedSite: string;
  onSiteChange: (site: string) => void;
  sites: string[];

  // Additional filters
  children?: React.ReactNode;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Tìm kiếm...",
  sortField,
  sortDirection,
  onSortChange,
  sortOptions,
  selectedSite,
  onSiteChange,
  sites,
  children,
}) => {
  return (
    <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl p-6 mb-6 shadow-xl">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all duration-200 shadow-sm"
          />
        </div>

        {/* Site Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 z-10" />
          <select
            value={selectedSite}
            onChange={(e) => onSiteChange(e.target.value)}
            className="pl-10 pr-8 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all duration-200 appearance-none cursor-pointer min-w-[140px] shadow-sm"
          >
            <option value="">Tất cả Site</option>
            {sites.map((site) => (
              <option
                key={site}
                value={site}
                className="bg-white text-gray-900"
              >
                Site {site}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <select
            value={sortField}
            onChange={(e) => onSortChange(e.target.value, sortDirection)}
            className="px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all duration-200 appearance-none cursor-pointer shadow-sm"
          >
            {sortOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
                className="bg-white text-gray-900"
              >
                {option.label}
              </option>
            ))}
          </select>

          <button
            onClick={() =>
              onSortChange(sortField, sortDirection === "asc" ? "desc" : "asc")
            }
            className="p-3 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 shadow-sm"
            title={`Sắp xếp ${
              sortDirection === "asc" ? "tăng dần" : "giảm dần"
            }`}
          >
            {sortDirection === "asc" ? (
              <SortAsc className="w-4 h-4" />
            ) : (
              <SortDesc className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Additional filters */}
        {children}
      </div>

      {/* Active filters display */}
      <div className="mt-4 flex flex-wrap gap-2">
        {searchQuery && (
          <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm border border-blue-500/30">
            Tìm kiếm: "{searchQuery}"
          </span>
        )}
        {selectedSite && (
          <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm border border-green-500/30">
            Site: {selectedSite}
          </span>
        )}
        <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm border border-purple-500/30">
          Sắp xếp: {sortOptions.find((opt) => opt.value === sortField)?.label} (
          {sortDirection === "asc" ? "A-Z" : "Z-A"})
        </span>
      </div>
    </div>
  );
};

export default SearchAndFilter;
