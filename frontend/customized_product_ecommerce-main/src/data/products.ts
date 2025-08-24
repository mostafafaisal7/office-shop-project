export const schoolStationaryProducts = [
  {
    "name": "School Uniform Set",
    "description": "A premium quality school uniform set.",
    "short_description": "Complete school uniform set",
    "sku": "SCHOOL-UNIFORM-001",
    "base_price": "499.99",
    "status": "active",
    "is_customizable": true,
    "weight": "0.50",
    "dimensions": {
      "length": 12.0,
      "width": 8.0,
      "height": 2.0
    },
    "tags": ["uniform", "school", "set"],
    "seo_title": "Premium School Uniform Set",
    "seo_description": "Complete school uniform set with customization options",
    "category_ids": [1],
    "id": 1,
    "created_at": "2025-06-02T23:29:10",
    "updated_at": "2025-06-02T23:29:10",
    "variations": [
      {
        "name": "Red - Small",
        "sku": "UNIFORM-S",
        "price": "499.99",
        "stock_quantity": 50,
        "low_stock_threshold": 5,
        "attributes": {
          "size": "Small",
          "color": "Red"
        },
        "is_active": true,
        "sort_order": 1,
        "id": 1,
        "product_id": 1,
        "created_at": "2025-06-02T23:29:10",
        "media": [
          {
            "file_path": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&h=300&fit=crop",
            "file_name": "uniform-small-new.jpg",
            "media_type": "image",
            "mime_type": "image/jpeg",
            "alt_text": "Small size uniform new",
            "design": true,
            "area": "front",
            "sort_order": 1,
            "id": 1,
            "variation_id": 1,
            "uploaded_at": "2025-06-02T17:29:10"
          },
          {
            "file_path": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=300&h=300&fit=crop",
            "file_name": "uniform-small-new.jpg",
            "media_type": "image",
            "mime_type": "image/jpeg",
            "alt_text": "Small size uniform new",
            "design": true,
            "area": "back",
            "sort_order": 1,
            "id": 1,
            "variation_id": 1,
            "uploaded_at": "2025-06-02T17:29:10"
          },
          {
            "file_path": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=300&h=300&fit=crop",
            "file_name": "uniform-small-n.jpg",
            "media_type": "image",
            "mime_type": "image/jpeg",
            "alt_text": "Small size uniform new",
            "design": true,
            "area": "right",
            "sort_order": 1,
            "id": 1,
            "variation_id": 1,
            "uploaded_at": "2025-06-02T17:29:10"
          },
          {
            "file_path": "https://images.unsplash.com/photo-1473091534298-04dcbce3278c?w=300&h=300&fit=crop",
            "file_name": "uniform-small-ne.jpg",
            "media_type": "image",
            "mime_type": "image/jpeg",
            "alt_text": "Small size uniform new",
            "design": true,
            "area": "left",
            "sort_order": 1,
            "id": 1,
            "variation_id": 1,
            "uploaded_at": "2025-06-02T17:29:10"
          }
        ]
      },
      {
        "name": "Blue - Large",
        "sku": "UNIFORM-L",
        "price": "499.99",
        "stock_quantity": 50,
        "low_stock_threshold": 5,
        "attributes": {
          "size": "Large",
          "color": "Blue"
        },
        "is_active": true,
        "sort_order": 2,
        "id": 2,
        "product_id": 1,
        "created_at": "2025-06-02T23:29:10",
        "media": [
          {
            "file_path": "https://images.unsplash.com/photo-1521334884684-d80222895322?w=300&h=300&fit=crop",
            "file_name": "uniform-small-new.jpg",
            "media_type": "image",
            "mime_type": "image/jpeg",
            "alt_text": "Small size uniform new",
            "design": true,
            "area": "front",
            "sort_order": 1,
            "id": 1,
            "variation_id": 1,
            "uploaded_at": "2025-06-02T17:29:10"
          },
          {
            "file_path": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=300&h=300&fit=crop",
            "file_name": "uniform-small-new.jpg",
            "media_type": "image",
            "mime_type": "image/jpeg",
            "alt_text": "Small size uniform new",
            "design": false,
            "area": "back",
            "sort_order": 1,
            "id": 1,
            "variation_id": 1,
            "uploaded_at": "2025-06-02T17:29:10"
          }
        ]
      }
    ],
    "customization_options": [
      {
        "id": "unique_design_id",
        "user_id": 1,
        "product_id": 1,
        "variation_id": 1,
        "design_area": "front", // which view (front/back/left/right)
        "canvas_data": {
          // Complete Fabric.js canvas JSON
          "version": "5.3.0",
          "objects": [], // All canvas objects
          "background": "",
          "backgroundImage": {}
        },
        "design_metadata": {
          "canvas_width": 600,
          "canvas_height": 600,
          "product_image_url": "...",
          "created_at": "2025-06-23T21:45:00Z",
          "updated_at": "2025-06-23T21:45:00Z",
          "design_name": "My Custom Design",
          "is_completed": false
        },
        "design_elements": [
          {
            "type": "text",
            "content": "John Doe",
            "position": {"x": 100, "y": 150},
            "style": {
              "fontSize": 24,
              "fontFamily": "Arial",
              "color": "#000000",
              "fontWeight": "bold"
            }
          },
          {
            "type": "image",
            "src": "data:image/png;base64,...",
            "position": {"x": 200, "y": 100},
            "dimensions": {"width": 100, "height": 100}
          }
        ]
      }

    ],
    "media": [
      {
        "file_path": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=300&h=300&fit=crop",
        "file_name": "uniform-alt.jpg",
        "file_size": null,
        "media_type": "image",
        "mime_type": "image/jpeg",
        "alt_text": "Alternate School Uniform Set",
        "is_primary": true,
        "sort_order": 2,
        "id": 2,
        "product_id": 1,
        "uploaded_at": "2025-06-02T17:30:00"
      },
      {
        "file_path": "https://images.unsplash.com/photo-1521334884684-d80222895322?w=300&h=300&fit=crop",
        "file_name": "uniform-color1.jpg",
        "file_size": null,
        "media_type": "image",
        "mime_type": "image/jpeg",
        "alt_text": "Color variant 1",
        "is_primary": false,
        "sort_order": 3,
        "id": 3,
        "product_id": 1,
        "uploaded_at": "2025-06-02T17:31:00"
      },
      {
        "file_path": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=300&h=300&fit=crop",
        "file_name": "uniform-color2.jpg",
        "file_size": null,
        "media_type": "image",
        "mime_type": "image/jpeg",
        "alt_text": "Color variant 2",
        "is_primary": false,
        "color": "blue",
        "sort_order": 4,
        "id": 4,
        "product_id": 1,
        "uploaded_at": "2025-06-02T17:32:00"
      }
    ]

  }
];

export const hospitalStationaryProducts = [
  {
    "name": "Medical Scrubs",
    "description": "Professional medical scrubs for healthcare workers.",
    "short_description": "Professional medical scrubs",
    "sku": "MED-SCRUBS-001",
    "base_price": "599.99",
    "status": "active",
    "is_customizable": false,
    "weight": "0.30",
    "dimensions": {
      "length": 10.0,
      "width": 8.0,
      "height": 1.0
    },
    "tags": ["medical", "scrubs", "healthcare"],
    "seo_title": "Professional Medical Scrubs",
    "seo_description": "High-quality medical scrubs for healthcare professionals",
    "category_ids": [2],
    "id": 2,
    "created_at": "2025-06-02T23:29:10",
    "updated_at": "2025-06-02T23:29:10",
    "variations": [
      {
        "name": "Size - Medium",
        "sku": "SCRUBS-M",
        "price": "599.99",
        "stock_quantity": 100,
        "low_stock_threshold": 10,
        "attributes": {
          "size": "Medium"
        },
        "is_active": true,
        "sort_order": 1,
        "id": 2,
        "product_id": 2,
        "created_at": "2025-06-02T23:29:10",
        "media": [
          {
            "file_path": "https://images.unsplash.com/photo-1473091534298-04dcbce3278c?w=300&h=300&fit=crop",
            "file_name": "scrubs-medium.jpg",
            "media_type": "image",
            "mime_type": "image/jpeg",
            "alt_text": "Medium size scrubs",
            "sort_order": 1,
            "id": 2,
            "variation_id": 2,
            "uploaded_at": "2025-06-02T17:29:10"
          }
        ]
      }
    ],
    "customization_options": [
      {
        "name": "Name Badge",
        "type": "TEXT",
        "is_required": false,
        "options": [],
        "pricing_rules": {},
        "validation_rules": {
          "max_length": 20
        },
        "sort_order": 1,
        "is_active": true,
        "position": {
          "x": 50,
          "y": 50
        },
        "canvas_element_id": "badge_1",
        "default_value": "Enter name",
        "preview_image_url": "https://example.com/images/preview-badge.png",
        "group": "badge",
        "id": 2,
        "product_id": 2
      }
    ],
    "media": [
      {
        "file_path": "https://images.unsplash.com/photo-1473091534298-04dcbce3278c?w=300&h=300&fit=crop",
        "file_name": "scrubs-main.jpg",
        "file_size": null,
        "media_type": "image",
        "mime_type": "image/jpeg",
        "alt_text": "Medical Scrubs",
        "is_primary": true,
        "color": "red",
        "sort_order": 1,
        "id": 2,
        "product_id": 2,
        "uploaded_at": "2025-06-02T17:29:10"
      }
    ]
  },
  {
    "name": "Hospital Gown",
    "description": "Comfortable hospital gown for patients.",
    "short_description": "Patient hospital gown",
    "sku": "HOSP-GOWN-001",
    "base_price": "299.99",
    "status": "active",
    "is_customizable": true,
    "weight": "0.20",
    "dimensions": {
      "length": 9.0,
      "width": 7.0,
      "height": 0.5
    },
    "tags": ["hospital", "gown", "patient"],
    "seo_title": "Hospital Patient Gown",
    "seo_description": "Comfortable hospital gown for patient care",
    "category_ids": [2],
    "id": 3,
    "created_at": "2025-06-02T23:29:10",
    "updated_at": "2025-06-02T23:29:10",
    "variations": [
      {
        "name": "Size - Universal",
        "sku": "GOWN-UNI",
        "price": "299.99",
        "stock_quantity": 200,
        "low_stock_threshold": 20,
        "attributes": {
          "size": "Universal"
        },
        "is_active": true,
        "sort_order": 1,
        "id": 3,
        "product_id": 3,
        "created_at": "2025-06-02T23:29:10",
        "media": [
          {
            "file_path": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300&h=300&fit=crop",
            "file_name": "gown-uni.jpg",
            "media_type": "image",
            "mime_type": "image/jpeg",
            "alt_text": "Universal size gown",
            "sort_order": 1,
            "id": 3,
            "variation_id": 3,
            "uploaded_at": "2025-06-02T17:29:10"
          }
        ]
      }
    ],
    "customization_options": [],
    "media": [
      {
        "file_path": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300&h=300&fit=crop",
        "file_name": "gown-main.jpg",
        "file_size": null,
        "media_type": "image",
        "mime_type": "image/jpeg",
        "alt_text": "Hospital Gown",
        "is_primary": true,
        "sort_order": 1,
        "id": 3,
        "product_id": 3,
        "uploaded_at": "2025-06-02T17:29:10"
      }
    ]
  }
];

export const hotelStationaryProducts = [
  {
    "name": "Hotel Uniform",
    "description": "Professional hotel staff uniform with premium fabric.",
    "short_description": "Professional hotel uniform",
    "sku": "HOTEL-UNIFORM-001",
    "base_price": "799.99",
    "status": "active",
    "is_customizable": false,
    "weight": "0.40",
    "dimensions": {
      "length": 11.0,
      "width": 8.0,
      "height": 1.5
    },
    "tags": ["hotel", "uniform", "hospitality"],
    "seo_title": "Professional Hotel Staff Uniform",
    "seo_description": "Premium hotel staff uniform with customization options",
    "category_ids": [3],
    "id": 4,
    "created_at": "2025-06-02T23:29:10",
    "updated_at": "2025-06-02T23:29:10",
    "variations": [
      {
        "name": "Size - Large",
        "sku": "HOTEL-L",
        "price": "799.99",
        "stock_quantity": 75,
        "low_stock_threshold": 8,
        "attributes": {
          "size": "Large"
        },
        "is_active": true,
        "sort_order": 1,
        "id": 4,
        "product_id": 4,
        "created_at": "2025-06-02T23:29:10",
        "media": [
          {
            "file_path": "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=300&h=300&fit=crop",
            "file_name": "hotel-large.jpg",
            "media_type": "image",
            "mime_type": "image/jpeg",
            "alt_text": "Large size hotel uniform",
            "sort_order": 1,
            "id": 4,
            "variation_id": 4,
            "uploaded_at": "2025-06-02T17:29:10"
          }
        ]
      }
    ],
    "customization_options": [
      {
        "name": "Name Tag",
        "type": "TEXT",
        "is_required": false,
        "options": [],
        "pricing_rules": {},
        "validation_rules": {
          "max_length": 25
        },
        "sort_order": 1,
        "is_active": true,
        "position": {
          "x": 50,
          "y": 50
        },
        "canvas_element_id": "nametag_1",
        "default_value": "Enter name",
        "preview_image_url": "https://example.com/images/preview-nametag.png",
        "group": "nametag",
        "id": 4,
        "product_id": 4
      }
    ],
    "media": [
      {
        "file_path": "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=300&h=300&fit=crop",
        "file_name": "hotel-main.jpg",
        "file_size": null,
        "media_type": "image",
        "mime_type": "image/jpeg",
        "alt_text": "Hotel Staff Uniform",
        "is_primary": true,
        "sort_order": 1,
        "id": 4,
        "product_id": 4,
        "uploaded_at": "2025-06-02T17:29:10"
      }
    ]
  }
];

export const getAllProducts = () => {
  return [...schoolStationaryProducts, ...hospitalStationaryProducts, ...hotelStationaryProducts];
};
