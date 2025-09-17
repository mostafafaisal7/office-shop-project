'use client';

import React, { useState, useEffect } from 'react';
import { ImageIcon, Type, Upload } from 'lucide-react';
import { useAuthStore, getValidToken } from '@/store/authStore';

interface LeftSidebarProps {
  onAddText: (text: string) => void;
  onImageUpload: (file: File) => void;      // callback with the File object
  onImageClick: (imageUrl: string) => void; // callback when user clicks uploaded image
}

// Endpoints
const API_UPLOAD_ADMIN = 'http://localhost:8000/uploads/image';
const API_UPLOAD_USER  = 'http://localhost:8000/uploads/image_user';
const API_FETCH_USER_IMAGES = 'http://localhost:8000/uploads/images/previews';

const API_MIGRATE_GUEST_IMAGES = 'http://localhost:8000/uploads/migrate-guest-images';


const LeftSidebar = ({ onAddText, onImageUpload, onImageClick }: LeftSidebarProps) => {
  const { user, isAuthenticated } = useAuthStore();

  const [token, setToken] = useState<string | null>(null);

  // Guest ID for non-authenticated users
  const [guestId] = useState(() => {
    if (typeof window === 'undefined') return '';
    let id = localStorage.getItem('guest_id');
    if (!id) {
      id = 'guest-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('guest_id', id);
    }
    return id;
  });

  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [textInput, setTextInput] = useState<string>('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // Fetch token if user is logged in
  useEffect(() => {
    if (isAuthenticated) {
      getValidToken().then(t => setToken(t));
    }
  }, [isAuthenticated]);

  // Fetch previously uploaded images for users/guests
  useEffect(() => {
    const fetchExistingImages = async () => {
      if (!isAuthenticated && !guestId) return;
      try {
        const query = !isAuthenticated ? `?guest_id=${guestId}` : '';
        const res = await fetch(`${API_FETCH_USER_IMAGES}${query}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data?.images) setUploadedImages(data.images);
      } catch (err) {
        console.error('Failed to fetch existing images:', err);
      }
    };
    fetchExistingImages();
  }, [token, isAuthenticated, guestId]);

  // After user logs in, migrate guest images if any
useEffect(() => {
  const migrateGuestImages = async () => {
    if (!isAuthenticated || !guestId || !token) return;

    try {
      const res = await fetch(API_MIGRATE_GUEST_IMAGES, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ guest_id: guestId }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log('Guest images migrated to user account');

        // Update sidebar immediately
        if (data?.images?.length) {
          setUploadedImages(prev =>
            Array.from(new Set([...data.images, ...prev])) // avoid duplicates
          );
        }

        localStorage.removeItem('guest_id');
      } else {
        console.error('Migration failed', await res.json());
      }

    } catch (err) {
      console.error('Migration request error:', err);
    }
  };

  migrateGuestImages();
}, [isAuthenticated, guestId, token]);


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];

    // Show temporary preview
    const previewUrl = URL.createObjectURL(file);
    setUploadedImages(prev => [...prev, previewUrl]);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_type', 'previews');

    if (!isAuthenticated) formData.append('guest_id', guestId);

    const headers: Record<string, string> = {};
    if (isAuthenticated && token) headers['Authorization'] = `Bearer ${token}`;

    const uploadUrl = isAuthenticated ? API_UPLOAD_USER : API_UPLOAD_USER; // both guest/user use same endpoint

    try {
      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers,
      });
      const data = await res.json();

      if (data.image_url) {
        // Replace preview with backend URL
        setUploadedImages(prev =>
          prev.map(url => (url === previewUrl ? data.image_url : url))
        );
        onImageUpload(file);
      } else {
        alert('Upload failed. Please try again.');
        setUploadedImages(prev => prev.filter(url => url !== previewUrl));
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed. Please try again.');
      setUploadedImages(prev => prev.filter(url => url !== previewUrl));
    }
  };

  const renderPanel = () => {
    switch (activePanel) {
      case 'text':
        return (
          <div className="w-[250px] border-r bg-white shadow-sm">
            <div className="p-8">
              <div className="flex items-center mb-4">
                <Type className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">Text</h3>
              </div>
              <input
                type="text"
                placeholder="Write your text here..."
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-5 py-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              />
              <button
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-lg text-base font-medium hover:from-blue-700 hover:to-blue-800"
                onClick={() => onAddText(textInput || 'Sample Text')}
              >
                Add Text Field
              </button>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="w-[250px] border-r bg-white shadow-sm">
            <div className="p-8">
              <div className="flex items-center mb-4">
                <ImageIcon className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">Images</h3>
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-panel-upload"
              />
              <label
                htmlFor="image-panel-upload"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-lg text-base font-medium hover:from-blue-700 hover:to-blue-800 cursor-pointer flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Upload Image
              </label>

              {uploadedImages.length > 0 ? (
                <div className="mt-6">
                  <h4 className="text-base font-semibold text-gray-700 mb-4">Uploaded Images</h4>
                  <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                    {uploadedImages.map((url, index) => (
                      <div
                        key={index}
                        className="aspect-square bg-gray-100 rounded-xl border border-gray-200 hover:shadow-md cursor-pointer overflow-hidden"
                        onClick={() => onImageClick(url)}
                      >
                        <img src={url} alt={`Uploaded image ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No images uploaded yet</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-full bg-white shadow-sm">
      <div className="w-20 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 flex flex-col items-center py-6 space-y-4">
        <button
          onClick={() => setActivePanel(activePanel === 'text' ? null : 'text')}
          className={`p-3 rounded-xl transition-all duration-200 ${
            activePanel === 'text' ? 'bg-blue-100 text-blue-600 shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
          }`}
          title="Add Text"
        >
          <Type className="w-6 h-6 mx-auto" />
          <span className="text-xs mt-1 block font-medium">Add text</span>
        </button>

        <button
          onClick={() => setActivePanel(activePanel === 'image' ? null : 'image')}
          className={`p-3 rounded-xl transition-all duration-200 ${
            activePanel === 'image' ? 'bg-blue-100 text-blue-600 shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
          }`}
          title="Images"
        >
          <ImageIcon className="w-6 h-6 mx-auto" />
          <span className="text-xs mt-1 block font-medium">Image</span>
        </button>
      </div>
      {renderPanel()}
    </div>
  );
};

export default LeftSidebar;
