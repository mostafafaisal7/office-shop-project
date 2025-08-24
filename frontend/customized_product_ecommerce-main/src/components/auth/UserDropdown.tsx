// "use client";

// import React, { useState, useRef, useEffect } from 'react';
// import { User, LogOut, Settings, ShoppingBag, ChevronDown, FolderOpen } from 'lucide-react';
// import { useAuthStore } from '@/store/authStore';
// import { useToast } from '@/contexts/ToastContext';
// import Link from 'next/link';

// interface UserDropdownProps {
//   onNavigate?: () => void;
// }

// export const UserDropdown: React.FC<UserDropdownProps> = ({ onNavigate }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement>(null);
//   const { user, logout, logoutAll, isAuthenticated } = useAuthStore();
//   const { showToast } = useToast();

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setIsOpen(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   const handleLogout = async () => {
//     try {
//       await logout();
//       showToast('Logged out successfully', 'success');
//       setIsOpen(false);
//     } catch (error) {
//       showToast('Logout failed', 'error');
//     }
//   };

//   const handleLogoutAll = async () => {
//     try {
//       await logoutAll();
//       showToast('Logged out from all devices', 'success');
//       setIsOpen(false);
//     } catch (error) {
//       showToast('Logout failed', 'error');
//     }
//   };

//   if (!user) return null;

//   const getInitials = (name: string | undefined | null) => {
//     if (!name || typeof name !== 'string') {
//       return 'U'; // Default to 'U' for User if name is not available
//     }
//     return name
//       .split(' ')
//       .map(word => word.charAt(0))
//       .join('')
//       .toUpperCase()
//       .slice(0, 2);
//   };

//   return (
//     <div className="relative" ref={dropdownRef}>
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className="flex items-center space-x-2 p-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
//       >
//         <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
//           {getInitials(user.name)}
//         </div>
//         <span className="hidden md:block text-sm font-medium">
//           {user.name || 'User'}
//         </span>
//         <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
//       </button>

//       {isOpen && (
//         <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
//           <div className="py-1">
//             {/* User Info */}
//             <div className="px-4 py-3 border-b border-gray-100">
//               <div className="flex items-center space-x-3">
//                 <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
//                   {getInitials(user.name)}
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-sm font-medium text-gray-900 truncate">{user.name || 'User'}</p>
//                   <p className="text-sm text-gray-500 truncate select-none">{user.email}</p>
//                   {!user.isEmailVerified && (
//                     <p className="text-xs text-orange-600 mt-1">Email not verified</p>
//                   )}
//                 </div>
//               </div>
//             </div>

//             {/* Menu Items */}
//             <div className="py-1">
//               <Link
//                 href="/dashboard/profile"
//                 className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                 onClick={() => {
//                   setIsOpen(false);
//                   onNavigate?.();
//                 }}
//               >
//                 <User className="h-4 w-4 mr-3" />
//                 Profile Settings
//               </Link>
//               <Link
//                 href="/dashboard/projects"
//                 className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                 onClick={() => {
//                   setIsOpen(false);
//                   onNavigate?.();
//                 }}
//               >
//                 <FolderOpen className="h-4 w-4 mr-3" />
//                 My Projects
//               </Link>
//               <Link
//                 href="/dashboard/orders"
//                 className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                 onClick={() => {
//                   setIsOpen(false);
//                   onNavigate?.();
//                 }}
//               >
//                 <ShoppingBag className="h-4 w-4 mr-3" />
//                 My Orders
//               </Link>
//               <Link
//                 href="/dashboard/settings"
//                 className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                 onClick={() => {
//                   setIsOpen(false);
//                   onNavigate?.();
//                 }}
//               >
//                 <Settings className="h-4 w-4 mr-3" />
//                 Account Settings
//               </Link>
//             </div>

//             {/* Logout Section */}
//             <div className="py-1 border-t border-gray-100">
//               <button
//                 onClick={handleLogout}
//                 className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//               >
//                 <LogOut className="h-4 w-4 mr-3" />
//                 Sign out
//               </button>
//               <button
//                 onClick={handleLogoutAll}
//                 className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
//               >
//                 <LogOut className="h-4 w-4 mr-3" />
//                 Sign out from all devices
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };





"use client";

import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Settings, ShoppingBag, ChevronDown, FolderOpen } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';

interface UserDropdownProps {
  onNavigate?: () => void;
}

export const UserDropdown: React.FC<UserDropdownProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout, logoutAll, isAuthenticated, isLoading, initializeAuth } = useAuthStore();
  const { showToast } = useToast();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Logged out successfully', 'success');
      setIsOpen(false);
    } catch (error) {
      showToast('Logout failed', 'error');
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logoutAll();
      showToast('Logged out from all devices', 'success');
      setIsOpen(false);
    } catch (error) {
      showToast('Logout failed', 'error');
    }
  };

  const getInitials = (name: string | undefined | null) => {
    if (!name || typeof name !== 'string') {
      return 'U';
    }
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // prevent disappearing on reload
  if (isLoading) {
    return <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />;
  }
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
      >
        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
          {getInitials(user.name)}
        </div>
        <span className="hidden md:block text-sm font-medium">
          {user.name || 'User'}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {getInitials(user.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name || 'User'}</p>
                  <p className="text-sm text-gray-500 truncate select-none">{user.email}</p>
                  {!user.isEmailVerified && (
                    <p className="text-xs text-orange-600 mt-1">Email not verified</p>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <Link
                href="/dashboard/profile"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => {
                  setIsOpen(false);
                  onNavigate?.();
                }}
              >
                <User className="h-4 w-4 mr-3" />
                Profile Settings
              </Link>
              <Link
                href="/dashboard/projects"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => {
                  setIsOpen(false);
                  onNavigate?.();
                }}
              >
                <FolderOpen className="h-4 w-4 mr-3" />
                My Projects
              </Link>
              <Link
                href="/dashboard/orders"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => {
                  setIsOpen(false);
                  onNavigate?.();
                }}
              >
                <ShoppingBag className="h-4 w-4 mr-3" />
                My Orders
              </Link>
              <Link
                href="/dashboard/settings"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => {
                  setIsOpen(false);
                  onNavigate?.();
                }}
              >
                <Settings className="h-4 w-4 mr-3" />
                Account Settings
              </Link>
            </div>

            {/* Logout Section */}
            <div className="py-1 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Sign out
              </button>
              <button
                onClick={handleLogoutAll}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Sign out from all devices
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
