'use client';

import { useParams } from 'next/navigation';
import CategoryForm from '@/components/categories/CategoryForm';

export default function EditCategoryPage() {
  const params = useParams();
  const categoryId = parseInt(params.id as string);

  if (isNaN(categoryId)) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <h2>Invalid Category ID</h2>
        <p>The category ID provided is not valid.</p>
      </div>
    );
  }

  return <CategoryForm mode="edit" categoryId={categoryId} />;
}
