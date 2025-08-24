'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Spin, Result, Button, Breadcrumb } from 'antd';
import { HomeOutlined, ShoppingOutlined, SendOutlined } from '@ant-design/icons';
import ProductShippingManager from '@/components/shipping/ProductShippingManager';
import { productService } from '@/services/product';
import { ProductResponse } from '@/types/product';

export default function ProductShippingPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        setLoading(true);
        try {
          const data = await productService.getProductById(Number(id));
          setProduct(data);
          setError(null);
        } catch (err) {
          setError('Failed to fetch product');
          console.error('Fetch product error:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id]);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#f5f5f5', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Spin size="large">
          <div style={{ padding: '50px' }}>Loading product shipping rules...</div>
        </Spin>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '24px' }}>
        <Result
          status="error"
          title="Failed to Load Product"
          subTitle={error || 'Product not found'}
          extra={[
            <Button type="primary" key="retry" onClick={() => window.location.reload()}>
              Try Again
            </Button>,
            <Button key="back" onClick={() => router.push('/dashboard/products')}>
              Back to Products
            </Button>,
          ]}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Breadcrumb
        style={{ marginBottom: '24px' }}
        items={[
          {
            href: '/dashboard',
            title: <HomeOutlined />,
          },
          {
            href: '/dashboard/products',
            title: (
              <span>
                <ShoppingOutlined style={{ marginRight: 4 }} />
                Products
              </span>
            ),
          },
          {
            href: `/dashboard/products/${id}`,
            title: product.name,
          },
          {
            title: (
              <span>
                <SendOutlined style={{ marginRight: 4 }} />
                Shipping Rules
              </span>
            ),
          },
        ]}
      />

      <ProductShippingManager
        productId={Number(id)}
        productName={product.name}
      />
    </div>
  );
}
