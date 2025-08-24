
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { message, Spin, Result, Button } from 'antd';
import ProductForm from '@/components/products/ProductForm';
import { productService } from '@/services/product';
import { ProductResponse, ProductUpdate, ProductCreate } from '@/types/product';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        setFetchLoading(true);
        try {
          const data = await productService.getProductById(Number(id));
          setProduct(data);
          setError(null);
        } catch (err) {
          setError('Failed to fetch product');
          console.error('Fetch product error:', err);
        } finally {
          setFetchLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id]);

  const handleFinish = async (values: ProductCreate | ProductUpdate) => {
    if (id) {
      setLoading(true);
      try {
        await productService.updateProduct(Number(id), values as ProductUpdate);
        message.success('Product updated successfully!');
        router.push('/dashboard/products');
      } catch (err) {
        message.error('Failed to update product. Please try again.');
        console.error('Update product error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  if (fetchLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#f5f5f5', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Spin size="large">
          <div style={{ padding: '50px' }}>Loading product...</div>
        </Spin>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '24px' }}>
        <Result
          status="error"
          title="Failed to Load Product"
          subTitle={error}
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
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '24px 0' }}>
      <Spin spinning={loading}>
        <div style={{ minHeight: '200px' }}>
          {product && (
            <ProductForm
              initialValues={product}
              onFinish={handleFinish}
              loading={loading}
            />
          )}
        </div>
      </Spin>
    </div>
  );
}
