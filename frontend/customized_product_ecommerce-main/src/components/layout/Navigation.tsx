"use client";

import { Search, User, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { ensureUserData } from "@/store/authStore";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AuthModal } from "@/components/auth/AuthModal";
import { UserDropdown } from "@/components/auth/UserDropdown";
import { SearchBar } from "@/components/ui/SearchBar";
import { useShippingStore } from "@/store/shippingStore";

export const Navigation = () => {
  const [mounted, setMounted] = useState(false);
  const [userDataLoading, setUserDataLoading] = useState(false);
  
  const pathname = usePathname();
  const { isAuthenticated, user, initializeAuth, isLoading, authModalOpen, authModalView, openAuthModal, closeAuthModal } = useAuthStore();
  const cartCount = useCartStore((state) => state.getUniqueProductCount());

  // // Close auth modal when user becomes authenticated
  // useEffect(() => {
  //   if (isAuthenticated && authModalOpen) {
  //     setAuthModalOpen(false);
  //   }
  // }, [isAuthenticated, authModalOpen]);

  useEffect(() => {
    if (isAuthenticated && authModalOpen) {
      closeAuthModal();
    }
  }, [isAuthenticated, authModalOpen, closeAuthModal]);
  

  // useEffect(() => {
  //   setMounted(true);
  //   initializeAuth();
  // }, [initializeAuth]);

  useEffect(() => {
    setMounted(true);
    (async () => {
      await initializeAuth(); // Wait for auth initialization before rendering
    })();
  }, [initializeAuth]);
  

  // Ensure user data is loaded when authenticated but user data is incomplete
  useEffect(() => {
    const loadUserData = async () => {
      if (isAuthenticated && (!user || !user.name) && !userDataLoading && mounted) {
        setUserDataLoading(true);
        try {
          await ensureUserData();
        } catch (error) {
          console.error('Failed to ensure user data in Navigation:', error);
        } finally {
          setUserDataLoading(false);
        }
      }
    };

    // Only run once when component mounts and conditions are met
    if (mounted && isAuthenticated && (!user || !user.name) && !userDataLoading) {
      loadUserData();
    }
  }, [isAuthenticated, user?.name, mounted]); // Removed userDataLoading from dependencies to prevent loops

  const handleAuthClick = (view: 'login' | 'register') => {
    openAuthModal(view);
  };

  return (
    <>
      {/* Top Header Bar */}
      <div className="bg-blue-900 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center">
              <span className="mr-2">📞</span>
              <span>+91 1234567890</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">👤</span>
              <span>officeshopbd@gmail.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link href="/">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-2">
                      <span className="text-white font-bold text-sm">O</span>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">OFFICE</div>
                      <div className="text-lg font-bold text-red-500">SHOP</div>
                    </div>
                  </div>
                </Link>
              </div>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-8">
                  <Link href="/categories" className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium uppercase">Categories</Link>
                  <Link href="/products" className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium uppercase">Products</Link>
                  <Link href="/about" className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium uppercase">About</Link>
                  <Link href="/contact" className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium uppercase">Contact</Link>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Search Bar */}
              <div className="hidden xl:block">
                <SearchBar className="w-64 xl:w-80" />
              </div>
              
              {/* {mounted && (
                <>
                  {isAuthenticated ? (
                    <UserDropdown onNavigate={() => {}} />
                  ) : (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <button 
                        onClick={() => handleAuthClick('login')}
                        className="text-gray-700 hover:text-blue-600 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
                      >
                        Login
                      </button>
                      <button 
                        onClick={() => handleAuthClick('register')}
                        className="bg-blue-600 text-white hover:bg-blue-700 px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
                      >
                        Sign Up
                      </button>
                    </div>
                  )}
                </>
              )} */}

              {mounted && (
                <>
                  {isLoading ? (
                    <div className="text-gray-500 text-sm">Loading...</div>
                  ) : isAuthenticated ? (
                    <UserDropdown onNavigate={() => {}} />
                  ) : (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <button
                        onClick={() => handleAuthClick('login')}
                        className="text-gray-700 hover:text-blue-600 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
                      >
                        Login
                      </button>
                      <button
                        onClick={() => handleAuthClick('register')}
                        className="bg-blue-600 text-white hover:bg-blue-700 px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
                      >
                        Sign Up
                      </button>
                    </div>
                  )}
                </>
              )}
              
              <div className="flex items-center bg-blue-600 text-white px-2 sm:px-4 py-2 rounded-full">
                <Link href="/cart" className="flex items-center">
                  <span className="text-xs sm:text-sm font-bold mr-1 whitespace-nowrap">
                    <span className="hidden sm:inline">Items: </span>
                    <span className="sm:hidden">{mounted ? cartCount : 0}</span>
                    <span className="hidden sm:inline">{mounted ? cartCount : 0}</span>
                  </span>
                  <ShoppingCart className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Search Bar */}
      <div className="xl:hidden bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <SearchBar className="w-full" />
        </div>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={closeAuthModal}
        initialView={authModalView}
      />
    </>
  );
};
