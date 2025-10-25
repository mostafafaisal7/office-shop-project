/**
 * Enhanced Link component with loading animations
 *
 * Wraps Next.js Link with a loading state that shows when navigation starts
 * Provides visual feedback to users that the page is loading
 */

'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useCallback, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  showSpinner?: boolean;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  onClick?: () => void;
}

export default function LoadingLink({
  href,
  children,
  className = '',
  showSpinner = true,
  prefetch,
  replace = false,
  scroll,
  onClick
}: LoadingLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  // Reset loading state when pathname changes (navigation complete)
  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    // Don't interfere with cmd/ctrl+click (open in new tab)
    if (e.metaKey || e.ctrlKey) return;

    // Don't show loading if already on the page
    if (href === pathname) return;

    // Call custom onClick if provided
    onClick?.();

    // Show loading state
    setIsLoading(true);
  }, [href, pathname, onClick]);

  return (
    <Link
      href={href}
      className={`${className} ${isLoading ? 'pointer-events-none opacity-75' : ''} transition-opacity duration-200`}
      onClick={handleClick}
      prefetch={prefetch}
      replace={replace}
      scroll={scroll}
    >
      <span className="inline-flex items-center gap-2">
        {isLoading && showSpinner && (
          <Loader2 className="w-4 h-4 animate-spin" />
        )}
        {children}
      </span>
    </Link>
  );
}

// Named export
export { LoadingLink };
