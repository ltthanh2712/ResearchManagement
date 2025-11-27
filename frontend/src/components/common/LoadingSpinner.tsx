import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className = "",
}) => {
  const sizeClasses: Record<string, string> = {
    sm: "w-5 h-5",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  return (
    <div className={`flex flex-col justify-center items-center ${className}`}>
      <div className={`${sizeClasses[size]} relative`}>
        {/* Main spinner */}
        <div className="absolute inset-0 animate-spin">
          <div className="h-full w-full border-4 border-gray-200 border-t-transparent border-r-transparent rounded-full bg-gradient-to-r from-primary-500 to-blue-600 opacity-20"></div>
        </div>
        <div
          className="absolute inset-0 animate-spin"
          style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
        >
          <div className="h-full w-full border-4 border-transparent border-t-primary-500 border-r-blue-600 rounded-full"></div>
        </div>
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-2 h-2 bg-gradient-to-r from-primary-500 to-blue-600 rounded-full animate-pulse"></div>
        </div>
      </div>
      {size === "lg" && (
        <div className="mt-4 text-sm font-medium text-gray-600 animate-pulse">
          Đang tải...
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;
