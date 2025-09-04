import { Table, Button, Space, Typography, Tag, Avatar, Modal, Card, Input, Select, Row, Col, Statistic, Tooltip, Badge, Dropdown, Menu, InputNumber, Checkbox } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, FilterOutlined, EyeOutlined, MoreOutlined, ShoppingOutlined, DollarOutlined, TagOutlined, AppstoreOutlined, ClearOutlined } from '@ant-design/icons';
import { useProducts } from '@/hooks/useProducts';
import { useSimpleCategories } from '@/hooks/useSimpleCategories';
import { ProductResponse, CategoryOut } from '@/types/product';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';

const { Title, Text } = Typography;
const { confirm } = Modal;
const { Search } = Input;
const { Option } = Select;

export default function ProductList() {
  const { products, loading, error, response, stats, handleTableChange, deleteProduct, updateFilters } = useProducts();
  const { categories } = useSimpleCategories();
  
  // Filter states
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>();
  const [customizableFilter, setCustomizableFilter] = useState<boolean | undefined>();
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [tagsFilter, setTagsFilter] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Create a mapping from category ID to category name
  const categoryMap = categories.reduce((map: Record<number, string>, category: CategoryOut) => {
    map[category.id] = category.name;
    return map;
  }, {} as Record<number, string>);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchValue: string) => {
      updateFilters({ q: searchValue || undefined });
    }, 500),
    [updateFilters]
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    debouncedSearch(value);
  };

  // Handle status filter change
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    updateFilters({ status: value || undefined });
  };

  // Handle category filter change
  const handleCategoryChange = (value: number) => {
    setCategoryFilter(value);
    updateFilters({ category_id: value || undefined });
  };

  // Handle customizable filter change
  const handleCustomizableChange = (checked: boolean) => {
    const value = checked ? true : undefined;
    setCustomizableFilter(value);
    updateFilters({ is_customizable: value });
  };

  // Handle price range changes
  const handleMinPriceChange = (value: number | null) => {
    setMinPrice(value || undefined);
    updateFilters({ min_price: value || undefined });
  };

  const handleMaxPriceChange = (value: number | null) => {
    setMaxPrice(value || undefined);
    updateFilters({ max_price: value || undefined });
  };

  // Handle tags filter change
  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagsFilter(value);
    debouncedSearch.cancel(); // Cancel search debounce
    const debouncedTagsFilter = debounce(() => {
      updateFilters({ tags: value || undefined });
    }, 500);
    debouncedTagsFilter();
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchText('');
    setStatusFilter('');
    setCategoryFilter(undefined);
    setCustomizableFilter(undefined);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setTagsFilter('');
    updateFilters({
      q: undefined,
      status: undefined,
      category_id: undefined,
      is_customizable: undefined,
      min_price: undefined,
      max_price: undefined,
      tags: undefined,
    });
  };

// const showDeleteConfirm = (id: number, productName: string) => {
//   confirm({
//     title: 'Delete Product',
//     content: (
//       <div>
//         <p>Are you sure you want to delete <strong>"{productName}"</strong>?</p>
//         <p style={{ color: '#ff4d4f', fontSize: '14px' }}>This action cannot be undone and will remove all associated data.</p>
//       </div>
//     ),
//     okText: 'Delete',
//     okType: 'danger',
//     cancelText: 'Cancel',
//     width: 480,
//     onOk: async () => {
//       await deleteProduct(id); // wait for deletion before closing modal
//     },
//   });
// };

const showDeleteConfirm = (id: number, productName: string) => {
  console.log('Delete clicked for:', id, productName);
  confirm({
    title: 'Delete Product',
    content: (
      <div>
        <p>Are you sure you want to delete <strong>"{productName}"</strong>?</p>
        <p style={{ color: '#ff4d4f', fontSize: '14px' }}>This action cannot be undone and will remove all associated data.</p>
      </div>
    ),
    okText: 'Delete',
    okType: 'danger',
    cancelText: 'Cancel',
    width: 480,
    onOk: async () => {
      console.log('Confirmed deletion:', id);
      await deleteProduct(id); 
    },
  });
};



  // Use statistics from the hook (calculated from all products, not just current page)
  const totalProducts = stats.total_products || response?.total_items || 0;
  const activeProducts = stats.active_products || 0;
  const draftProducts = stats.draft_products || 0;
  const totalValue = stats.total_value || 0;

  const getActionMenuItems = (record: ProductResponse) => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: (
        <Link href={`/dashboard/products/${record.id}`}>
          View Details
        </Link>
      ),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: (
        <Link href={`/dashboard/products/${record.id}`}>
          Edit Product
        </Link>
      ),
    },
    {
      type: 'divider' as const,
    },
   {
    key: 'delete',
    icon: <DeleteOutlined />,
    label: (
      <span
        style={{ color: '#ff4d4f', cursor: 'pointer' }}
        onClick={() => showDeleteConfirm(record.id, record.name)}
      >
        Delete Product
      </span>
    ),
  },
,
  ];

  const columns = [
    {
      title: 'Product',
      key: 'product',
      width: 300,
      render: (_: any, record: ProductResponse) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar 
            src={record.media?.[0]?.file_path} 
            shape="square" 
            size={64}
            style={{ 
              borderRadius: '8px',
              border: '1px solid #f0f0f0'
            }}
            icon={<AppstoreOutlined />}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontWeight: '600', 
              fontSize: '14px',
              marginBottom: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              <Link 
                href={`/dashboard/products/${record.id}`}
                style={{ color: '#1890ff', textDecoration: 'none' }}
              >
                {record.name}
              </Link>
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#666',
              marginBottom: '4px'
            }}>
              SKU: {record.sku}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'base_price',
      key: 'base_price',
      width: 120,
      sorter: true,
      render: (price: number | string | null | undefined) => {
        const numPrice = typeof price === 'number' ? price : parseFloat(String(price || 0));
        return (
          <div style={{ fontWeight: '600', fontSize: '14px', color: '#52c41a' }}>
            ${(isNaN(numPrice) ? 0 : numPrice).toFixed(2)}
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      sorter: true,
      render: (status: string) => {
        const statusConfig = {
          active: { color: '#48c609ff', text: 'Active', bg: '#f6ffed' },
          inactive: { color: '#e9090dff', text: 'Inactive', bg: '#fff2f0' },
          draft: { color: '#faad14', text: 'Draft', bg: '#fffbe6' }
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
        
        return (
          <Tag 
            color={config.color}
            style={{ 
              borderRadius: '16px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: '500',
              border: 'none',
              background: config.bg
            }}
          >
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: 'Categories',
      key: 'categories',
      width: 150,
      render: (record: ProductResponse) => (
        <div>
          {record.category_ids && record.category_ids.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {record.category_ids.slice(0, 2).map((categoryId, index) => {
                const categoryName = categoryMap[categoryId] || `Category ${categoryId}`;
                return (
                  <Tag 
                    key={categoryId} 
                    style={{ 
                      borderRadius: '4px',
                      fontSize: '11px',
                      margin: 0,
                      padding: '2px 6px',
                      backgroundColor: '#f0f2ff',
                      color: '#1890ff',
                      border: '1px solid #d6e4ff'
                    }}
                  >
                    {categoryName}
                  </Tag>
                );
              })}
              {record.category_ids.length > 2 && (
                <Tag 
                  style={{ 
                    borderRadius: '4px', 
                    fontSize: '11px', 
                    margin: 0, 
                    padding: '2px 6px',
                    backgroundColor: '#f6f6f6',
                    color: '#666',
                    border: '1px solid #d9d9d9'
                  }}
                >
                  +{record.category_ids.length - 2}
                </Tag>
              )}
            </div>
          ) : (
            <Text type="secondary" style={{ fontSize: '12px' }}>No categories</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Customizable',
      dataIndex: 'is_customizable',
      key: 'is_customizable',
      width: 120,
      render: (isCustomizable: boolean) => (
        <Badge 
          status={isCustomizable ? 'success' : 'default'} 
          text={isCustomizable ? 'Yes' : 'No'}
          style={{ fontSize: '12px' }}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: ProductResponse) => (
        <Space size="small">
          <Tooltip title="Edit Product">
            <Link href={`/dashboard/products/${record.id}`}>
              <Button 
                type="text" 
                icon={<EditOutlined />} 
                size="small"
                style={{ color: '#1890ff' }}
              />
            </Link>
          </Tooltip>
          <Dropdown menu={{ items: getActionMenuItems(record) }} trigger={['click']} placement="bottomRight">
            <Button 
              type="text" 
              icon={<MoreOutlined />} 
              size="small"
              style={{ color: '#666' }}
            />
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 24px' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <Title level={2} style={{ margin: 0, marginBottom: '8px' }}>
              Products Management
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Manage your product catalog, inventory, and pricing
            </Text>
          </div>
          <Link href="/dashboard/products/create">
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              size="large"
              style={{ 
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}
            >
              Add New Product
            </Button>
          </Link>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[24, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}>
              <Statistic
                title="Total Products"
                value={totalProducts}
                prefix={<ShoppingOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: '600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}>
              <Statistic
                title="Active Products"
                value={activeProducts}
                prefix={<TagOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: '600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}>
              <Statistic
                title="Draft Products"
                value={draftProducts}
                prefix={<EditOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14', fontSize: '24px', fontWeight: '600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}>
              <Statistic
                title="Total Value"
                value={totalValue}
                prefix={<DollarOutlined style={{ color: '#722ed1' }} />}
                precision={2}
                valueStyle={{ color: '#722ed1', fontSize: '24px', fontWeight: '600' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters and Search */}
        <Card style={{ borderRadius: '12px', marginBottom: '24px' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} lg={8}>
              <Input
                placeholder="Search products by name, description, or SKU..."
                allowClear
                size="large"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={handleSearchChange}
                style={{ borderRadius: '8px' }}
              />
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Select
                placeholder="Filter by status"
                size="large"
                style={{ width: '100%', borderRadius: '8px' }}
                value={statusFilter || undefined}
                onChange={handleStatusChange}
                allowClear
              >
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
                <Option value="draft">Draft</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Select
                placeholder="Filter by category"
                size="large"
                style={{ width: '100%', borderRadius: '8px' }}
                value={categoryFilter}
                onChange={handleCategoryChange}
                allowClear
              >
                {categories.map(category => (
                  <Option key={category.id} value={category.id}>
                    {category.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={24} lg={8}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <Button 
                  icon={<FilterOutlined />}
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  style={{ borderRadius: '8px' }}
                  type={showAdvancedFilters ? 'primary' : 'default'}
                >
                  Advanced Filters
                </Button>
                <Button 
                  icon={<ClearOutlined />}
                  onClick={clearAllFilters}
                  style={{ borderRadius: '8px' }}
                >
                  Clear All
                </Button>
              </div>
            </Col>
          </Row>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#fafafa', borderRadius: '8px' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: '8px' }}>Price Range</Text>
                    <Space.Compact style={{ width: '100%' }}>
                      <InputNumber
                        placeholder="Min Price"
                        value={minPrice}
                        onChange={handleMinPriceChange}
                        style={{ width: '50%' }}
                        min={0}
                        prefix="$"
                      />
                      <InputNumber
                        placeholder="Max Price"
                        value={maxPrice}
                        onChange={handleMaxPriceChange}
                        style={{ width: '50%' }}
                        min={0}
                        prefix="$"
                      />
                    </Space.Compact>
                  </div>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: '8px' }}>Tags</Text>
                    <Input
                      placeholder="Filter by tags..."
                      value={tagsFilter}
                      onChange={handleTagsChange}
                      allowClear
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: '8px' }}>Customizable</Text>
                    <Checkbox
                      checked={customizableFilter === true}
                      onChange={(e) => handleCustomizableChange(e.target.checked)}
                    >
                      Show only customizable products
                    </Checkbox>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Card style={{ marginBottom: '24px', borderColor: '#ff4d4f', borderRadius: '8px' }}>
          <div style={{ color: '#ff4d4f', textAlign: 'center', padding: '20px' }}>
            <Text type="danger" style={{ fontSize: '16px' }}>{error}</Text>
          </div>
        </Card>
      )}

      {/* Products Table */}
      <Card style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Table
          columns={columns}
          dataSource={products}
          loading={loading}
          rowKey="id"
          pagination={{
            current: response?.page,
            pageSize: response?.per_page,
            total: response?.total_items,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} products`,
            style: { marginTop: '16px' }
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
          rowClassName={(record, index) => 
            index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
          }
        />
      </Card>

      <style jsx global>{`
        .table-row-light {
          background-color: #ffffff;
        }
        .table-row-dark {
          background-color: #fafafa;
        }
        .ant-table-thead > tr > th {
          background: #fafafa !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          padding: 16px 12px !important;
          border-bottom: 2px solid #f0f0f0 !important;
        }
        .ant-table-tbody > tr > td {
          padding: 16px 12px !important;
          border-bottom: 1px solid #f5f5f5 !important;
        }
        .ant-table-tbody > tr:hover > td {
          background: #f8f9ff !important;
        }
        .ant-table-row:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
      `}</style>
    </div>
  );
}
