import React from "react";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: "success" | "warning" | "default";
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = "default",
  action,
}) => {
  const iconComponent = {
    success: (
      <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-lg animate-bounce-in">
        <CheckCircleIcon className="w-10 h-10 text-white" />
      </div>
    ),
    warning: (
      <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-lg animate-bounce-in">
        <ExclamationCircleIcon className="w-10 h-10 text-white" />
      </div>
    ),
    default: (
      <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-600 rounded-3xl flex items-center justify-center shadow-lg animate-bounce-in">
        <svg
          className="w-10 h-10 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
    ),
  }[icon];

  return (
    <div className="text-center py-16 animate-fade-in">
      <div className="flex justify-center mb-6">{iconComponent}</div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-600 mb-8 max-w-lg mx-auto text-lg leading-relaxed">
        {description}
      </p>
      {action && <div className="animate-slide-in-right">{action}</div>}
    </div>
  );
};

export default EmptyState;
