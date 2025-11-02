"use client";

interface RefreshButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function RefreshButton({ className = "", children = "Refresh Page" }: RefreshButtonProps) {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <button
      onClick={handleRefresh}
      className={className || "bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"}
    >
      {children}
    </button>
  );
}
