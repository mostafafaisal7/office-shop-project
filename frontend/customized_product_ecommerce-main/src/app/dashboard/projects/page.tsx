'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Edit3, Trash2, Copy, Search, Filter, Grid, List, Eye } from 'lucide-react';
import { designApi, CustomizationOption } from '@/services/designApi';
import { fetchProductById, ApiProduct } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { previewGenerator } from '@/utils/previewGenerator';

interface ProjectWithProduct extends CustomizationOption {
  product?: ApiProduct;
  preview_image?: string;
  isGeneratingPreview?: boolean;
}

interface GroupedProject {
  client_reference_id: string;
  product_id: number;
  variation_id?: number;
  product?: ApiProduct;
  design_areas: string[];
  customization_options: CustomizationOption[];
  preview_image?: string;
  created_at: string;
  updated_at: string;
  isGeneratingPreview?: boolean;
}

export default function ProjectsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [projects, setProjects] = useState<ProjectWithProduct[]>([]);
  const [groupedProjects, setGroupedProjects] = useState<GroupedProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<GroupedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterBy, setFilterBy] = useState<'all' | 'recent' | 'completed'>('all');

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [groupedProjects, searchTerm, filterBy]);

  const generatePreviewImage = async (option: CustomizationOption, product?: ApiProduct): Promise<string> => {
    try {
      // Get the background image URL with better fallback logic
      let backgroundImageUrl = '';
      
      // First try to get the specific product image URL from option data
      if (option.option_data?.product_image_url) {
        backgroundImageUrl = option.option_data.product_image_url;
      }
      // Then try design metadata
      else if (option.design_metadata?.product_image_url) {
        backgroundImageUrl = option.design_metadata.product_image_url;
      }
      // Finally fallback to product media
      else if (product && product.media && product.media.length > 0 && product.media[0].file_path) {
        backgroundImageUrl = product.media[0].file_path;
      }
      // Try to find primary media if available
      else if (product && product.media && product.media.length > 0) {
        const primaryMedia = product.media.find(media => media.is_primary);
        if (primaryMedia) {
          backgroundImageUrl = primaryMedia.file_path;
        } else {
          backgroundImageUrl = product.media[0].file_path;
        }
      }

      // Check if we have canvas data (user's design)
      const canvasData = option.canvas_data || option.option_data?.canvas_data;
      
      if (canvasData && canvasData.objects && canvasData.objects.length > 0) {
        // Generate preview with user's design
        const previewUrl = await previewGenerator.generatePreview(
          canvasData,
          backgroundImageUrl,
          { 
            quality: 0.8, 
            multiplier: 1,
            width: 400,
            height: 300
          }
        );
        
        return previewUrl;
      } else {
        // No design data, but we should still generate a preview with the background image
        // instead of just returning the URL directly
        if (backgroundImageUrl) {
          try {
            const previewUrl = await previewGenerator.generatePreview(
              null, // No canvas data
              backgroundImageUrl,
              { 
                quality: 0.8, 
                multiplier: 1,
                width: 400,
                height: 300
              }
            );
            return previewUrl;
          } catch (previewError) {
            // Fallback to the background image URL
            return backgroundImageUrl;
          }
        } else {
          return '';
        }
      }
    } catch (error) {
      // Enhanced fallback logic
      const fallbackUrl = option.option_data?.product_image_url || 
                         option.design_metadata?.product_image_url ||
                         product?.media?.[0]?.file_path || '';
      
      return fallbackUrl;
    }
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      // ✅ getUserCustomizationOptions already filters by current user via /users/me/options endpoint
      const customizationOptions = await designApi.getUserCustomizationOptions();

      console.log(`📦 Loaded ${customizationOptions.length} customization options`);

      // ✅ MAJOR OPTIMIZATION: Backend defers loading canvas_data/design_elements (can be MBs each)
      // So we MUST use saved preview_image_url - we CANNOT generate from canvas_data here
      // This makes projects list 10x faster by avoiding:
      // 1. Loading huge JSON fields from database
      // 2. Fetching product details for every option
      // 3. Generating canvas previews for every option
      const projectsWithProducts = customizationOptions.map((option) => {
        const preview_image = option.design_metadata?.preview_image_url ||
                            option.design_metadata?.product_image_url ||
                            '';

        return {
          ...option,
          product: undefined, // Don't fetch product for list view - huge performance gain
          preview_image
        };
      });

      console.log(`✅ Processed ${projectsWithProducts.length} projects instantly`);
      setProjects(projectsWithProducts);

      // Group projects by client_reference_id
      const grouped = projectsWithProducts.reduce((groups: { [key: string]: GroupedProject }, project) => {
        const clientRefId = project.client_reference_id;
        
        if (!clientRefId) {
          // If no client_reference_id, treat as individual project
          const fallbackId = `individual_${project.id}`;
          groups[fallbackId] = {
            client_reference_id: fallbackId,
            product_id: project.product_id,
            variation_id: project.variation_id,
            product: 'product' in project ? project.product : undefined,
            design_areas: [project.design_area || project.option_data?.design_area || 'unknown'],
            customization_options: [project],
            preview_image: 'preview_image' in project ? project.preview_image : undefined,
            created_at: project.created_at || new Date().toISOString(),
            updated_at: project.updated_at || new Date().toISOString()
          };
          return groups;
        }

        if (!groups[clientRefId]) {
          groups[clientRefId] = {
            client_reference_id: clientRefId,
            product_id: project.product_id,
            variation_id: project.variation_id,
            product: 'product' in project ? project.product : undefined,
            design_areas: [],
            customization_options: [],
            preview_image: 'preview_image' in project ? project.preview_image : undefined,
            created_at: project.created_at || new Date().toISOString(),
            updated_at: project.updated_at || new Date().toISOString()
          };
        }

        // Add design area if not already present
        const designArea = project.design_area || project.option_data?.design_area || 'unknown';
        if (!groups[clientRefId].design_areas.includes(designArea)) {
          groups[clientRefId].design_areas.push(designArea);
        }

        // Add customization option
        groups[clientRefId].customization_options.push(project);

        // Use the most recent updated_at
        if (project.updated_at && new Date(project.updated_at) > new Date(groups[clientRefId].updated_at)) {
          groups[clientRefId].updated_at = project.updated_at;
          // Update preview image to the most recent one
          if ('preview_image' in project) {
            groups[clientRefId].preview_image = project.preview_image;
          }
        }

        return groups;
      }, {});

      const groupedProjectsArray = Object.values(grouped);
      setGroupedProjects(groupedProjectsArray);
    } catch (error) {
      console.error('Error loading projects:', error);
      showToast('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = groupedProjects;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(project => 
        project.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.design_areas.some(area => area.toLowerCase().includes(searchTerm.toLowerCase())) ||
        project.customization_options.some(option => 
          (option.option_name || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply category filter
    if (filterBy === 'recent') {
      filtered = filtered.sort((a, b) => 
        new Date(b.updated_at || b.created_at || '').getTime() - 
        new Date(a.updated_at || a.created_at || '').getTime()
      ).slice(0, 10);
    } else if (filterBy === 'completed') {
      filtered = filtered.filter(project => 
        project.customization_options.some(option =>
          option.option_data?.metadata?.is_completed === true ||
          option.design_metadata?.is_completed === true
        )
      );
    }

    setFilteredProjects(filtered);
  };

  const handleProjectClick = (project: GroupedProject) => {
    if (project.product_id && project.client_reference_id) {
      // Use client_reference_id instead of option_id
      router.push(`/products/${project.product_id}/design?client_reference_id=${project.client_reference_id}`);
    }
  };

  const handleDeleteProject = async (project: GroupedProject, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (project.customization_options.length === 0) return;
    
    const message = project.customization_options.length > 1 
      ? `Are you sure you want to delete this project? This will delete all ${project.customization_options.length} design areas (${project.design_areas.join(', ')}).`
      : 'Are you sure you want to delete this project?';
    
    if (confirm(message)) {
      try {
        // Delete all customization options for this project
        await Promise.all(
          project.customization_options.map(option => 
            option.id ? designApi.deleteCustomizationOption(option.id) : Promise.resolve()
          )
        );
        showToast('Project deleted successfully', 'success');
        loadProjects(); // Reload projects
      } catch (error) {
        console.error('Error deleting project:', error);
        showToast('Failed to delete project', 'error');
      }
    }
  };

  const handleDuplicateProject = async (project: GroupedProject, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      // Duplicate all customization options for this project
      await Promise.all(
        project.customization_options.map(async (option) => {
          const newProject = {
            option_type: (option.option_type || 'design') as 'design' | 'text' | 'image' | 'color',
            option_name: `${option.option_name || 'Project'} (Copy)`,
            option_data: {
              ...option.option_data,
              canvas_data: option.canvas_data,
              design_area: option.design_area || option.option_data?.design_area,
              product_image_url: option.design_metadata?.product_image_url || option.option_data?.product_image_url,
              metadata: {
                ...option.option_data?.metadata,
                design_name: `${option.design_metadata?.design_name || option.option_data?.metadata?.design_name || 'Design'} (Copy)`,
                is_completed: false
              }
            },
            is_active: true
          };

          return designApi.createCustomizationOption(project.product_id.toString(), newProject);
        })
      );

      showToast('Project duplicated successfully', 'success');
      loadProjects(); // Reload projects
    } catch (error) {
      console.error('Error duplicating project:', error);
      showToast('Failed to duplicate project', 'error');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDesignAreaDisplayName = (areas: string[]) => {
    const displayNames: { [key: string]: string } = {
      'front': 'Front',
      'back': 'Back',
      'left': 'Left',
      'right': 'Right'
    };
    
    return areas.map(area => 
      displayNames[area.toLowerCase()] || area.charAt(0).toUpperCase() + area.slice(1)
    ).join(', ');
  };
  
  const getProjectName = (project: GroupedProject) => {
    // Get name from the first customization option or product name
    const firstOption = project.customization_options[0];
    return firstOption?.option_name || 
           firstOption?.design_metadata?.design_name || 
           firstOption?.option_data?.metadata?.design_name ||
           `${project.product?.name || 'Unknown Product'} Design`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Projects</h1>
        <p className="text-gray-600 dark:text-gray-300">Manage your product customization projects</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-4">
            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as 'all' | 'recent' | 'completed')}
                className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Projects</option>
                <option value="recent">Recent</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* View Mode */}
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterBy !== 'all' 
              ? 'Try adjusting your search or filter criteria.' 
              : 'Start creating your first customization project!'}
          </p>
          {!searchTerm && filterBy === 'all' && (
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Browse Products
            </button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
        }>
          {filteredProjects.map((project) => (
            <div
              key={project.client_reference_id}
              onClick={() => handleProjectClick(project)}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200 cursor-pointer ${
                viewMode === 'list' ? 'flex items-center p-4' : 'overflow-hidden'
              }`}
            >
              {viewMode === 'grid' ? (
                <>
                  {/* Project Image */}
                  <div className="aspect-video bg-gray-100 relative group">
                    {project.preview_image ? (
                      <img
                        src={project.preview_image}
                        alt={getProjectName(project)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Eye className="h-8 w-8" />
                      </div>
                    )}

                    {/* Quick Action Buttons - Top Right */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleDuplicateProject(project, e)}
                        className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                        title="Duplicate Project"
                      >
                        <Copy className="h-3 w-3 text-gray-600" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteProject(project, e)}
                        className="p-1.5 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </button>
                    </div>

                    {/* Action Button Overlay - Bottom */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleProjectClick(project)}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                      >
                        <Edit3 className="h-4 w-4" />
                        Redesign Project
                      </button>
                    </div>
                  </div>

                  {/* Project Info */}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1 truncate">
                      {project.product?.name || 'Unknown Product'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {getDesignAreaDisplayName(project.design_areas)}
                    </p>
                    <div className="flex items-center text-xs text-gray-400 dark:text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(project.updated_at || project.created_at)}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* List View */}
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 mr-4">
                    {project.preview_image ? (
                      <img
                        src={project.preview_image}
                        alt={getProjectName(project)}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Eye className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {project.product?.name || 'Unknown Product'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {getDesignAreaDisplayName(project.design_areas)}
                    </p>
                    <div className="flex items-center text-xs text-gray-400 dark:text-gray-500 mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(project.updated_at || project.created_at)}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleProjectClick(project)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                      title="Redesign Project"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span className="hidden sm:inline">Redesign</span>
                    </button>
                    <button
                      onClick={(e) => handleDuplicateProject(project, e)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      title="Duplicate Project"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteProject(project, e)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
