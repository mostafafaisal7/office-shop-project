
// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { message, Spin } from 'antd';
// import ProductForm from '@/components/products/ProductForm';
// import { productService } from '@/services/product';
// import { ProductCreate, ProductUpdate } from '@/types/product';

// export default function CreateProductPage() {
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);

//   const handleFinish = async (values: ProductCreate | ProductUpdate) => {
//     setLoading(true);
//     try {
//       await productService.createProduct(values as ProductCreate);
//       message.success('Product created successfully!');
//       router.push('/dashboard/products');
//     } catch (err) {
//       message.error('Failed to create product. Please try again.');
//       console.error('Create product error:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '24px 0' }}>
//       <Spin spinning={loading} tip="Creating product...">
//         <ProductForm onFinish={handleFinish} loading={loading} />
//       </Spin>
//     </div>
//   );
// }



'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { message, Spin } from 'antd';
import ProductForm from '@/components/products/ProductForm';
import { productService } from '@/services/product';
import { ProductCreate, ProductUpdate } from '@/types/product';

export default function CreateProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleFinish = async (values: ProductCreate | ProductUpdate) => {
    setLoading(true);
    try {
      await productService.createProduct(values as ProductCreate);
      message.success('Product created successfully!');
      router.push('/dashboard/products');
    } catch (err: any) {
      // ✅ Better error feedback without breaking your function
      if (err?.response?.data?.errors) {
        Object.entries(err.response.data.errors).forEach(([field, msgs]) => {
          message.error(`${field}: ${(msgs as string[]).join(', ')}`);
        });
      } else {
        message.error('Failed to create product. Please try again.');
      }
      console.error('Create product error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '24px 0' }}>
      <Spin spinning={loading} tip="Creating product..." size="large">
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <ProductForm onFinish={handleFinish} loading={loading} />
        </div>
      </Spin>
    </div>
  );
}
