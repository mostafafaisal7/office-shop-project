import { BaseEntity } from './api';

export type ProductStatus = 'active' | 'inactive' | 'draft';
export type MediaType = 'image' | 'video';
export type AreaType = 'front' | 'back' | 'left' | 'right';

export interface ProductCreate {
  name: string;
  description: string;
  short_description?: string;
  features?: string;
  sku: string;
  base_price: number;
  status: ProductStatus;
  is_customizable: boolean;
  weight?: number;
  dimensions?: {
    [key: string]: number;
  };
  tags?: string[];
  seo_title?: string;
  seo_description?: string;
  category_ids?: number[];
  slug?: string;
  variations?: ProductVariationCreate[];
  customization_options?: CustomizationOptionCreate[];
  media?: ProductMediaCreate[];
}

export interface ProductUpdate extends Partial<ProductCreate> {}

export interface ProductResponse extends BaseEntity {
  name: string;
  description: string;
  short_description?: string;
  features?: string;
  sku: string;
  base_price: number;
  status: ProductStatus;
  is_customizable: boolean;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  tags?: string[];
  seo_title?: string;
  seo_description?: string;
  category_ids?: number[];
  variations?: ProductVariationResponse[];
  media?: ProductMediaResponse[];
  customization_options?: CustomizationOptionResponse[];
}

export interface ProductVariationCreate {
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  low_stock_threshold?: number;
  attributes: Record<string, any>;
  is_active: boolean;
  sort_order?: number;
  media?: VariationMediaCreate[];
}

export interface ProductVariationResponse extends BaseEntity {
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  low_stock_threshold?: number;
  attributes: Record<string, any>;
  is_active: boolean;
  sort_order?: number;
  product_id: number;
  media?: VariationMediaResponse[];
}

export interface ProductVariationUpdateWithID extends Partial<ProductVariationCreate> {
  id: number;
}

export interface ProductMediaCreate {
  file_path: string;
  file_name: string;
  file_size?: number;
  media_type: MediaType;
  mime_type: string;
  alt_text?: string;
  is_primary?: boolean;
  color?: string;
  sort_order?: number;
}

export interface ProductMediaResponse extends BaseEntity {
  file_path: string;
  file_name: string;
  file_size?: number;
  media_type: MediaType;
  mime_type: string;
  alt_text?: string;
  is_primary?: boolean;
  color?: string;
  sort_order?: number;
  product_id: number;
  uploaded_at: string;
}

export interface ProductMediaUpdateWithID extends Partial<ProductMediaCreate> {
  id: number;
}

export interface VariationMediaCreate {
  file_path: string;
  file_name: string;
  media_type: MediaType;
  mime_type: string;
  alt_text?: string;
  design?: boolean;
  area?: AreaType;
  sort_order?: number;
  variation_id: number;
}

export interface VariationMediaResponse extends BaseEntity {
  file_path: string;
  file_name: string;
  media_type: MediaType;
  mime_type: string;
  alt_text?: string;
  design?: boolean;
  area?: AreaType;
  sort_order?: number;
  variation_id: number;
  uploaded_at: string;
}

export interface CustomizationOptionCreate {
  name: string;
  type: string;
  is_required: boolean;
  options?: any[];
  pricing_rules?: Record<string, any>;
  validation_rules?: Record<string, any>;
  sort_order?: number;
  is_active: boolean;
  position?: {
    x: number;
    y: number;
  };
  canvas_element_id?: string;
  default_value?: string;
  preview_image_url?: string;
  group?: string;
}

export interface CustomizationOptionResponse extends BaseEntity {
  name: string;
  type: string;
  is_required: boolean;
  options?: any[];
  pricing_rules?: Record<string, any>;
  validation_rules?: Record<string, any>;
  sort_order?: number;
  is_active: boolean;
  position?: {
    x: number;
    y: number;
  };
  canvas_element_id?: string;
  default_value?: string;
  preview_image_url?: string;
  group?: string;
  product_id: number;
}

export interface CustomizationOptionUpdate extends Partial<CustomizationOptionCreate> {}

export interface CustomizationOptionUpdateWithID extends CustomizationOptionUpdate {
  id: number;
}

export interface CategoryCreate {
  name: string;
  slug?: string;
  description?: string;
  parent_id?: number;
  is_active?: boolean;
  sort_order?: number;
}

export interface CategoryUpdate extends Partial<CategoryCreate> {}

export interface CategoryOut extends BaseEntity {
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  is_active: boolean;
  sort_order?: number;
  children?: CategoryOut[];
}
