import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'http://127.0.0.1:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    
    // For now, we'll use the product endpoint to get reviews
    // In a real implementation, you'd have a dedicated reviews endpoint
    const apiUrl = `${API_BASE_URL}/products/${params.productId}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract reviews from the product data
    const allReviews = data.helpful_reviews || [];
    
    // Implement pagination logic
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const paginatedReviews = allReviews.slice(startIndex, endIndex);
    const hasMore = endIndex < allReviews.length;
    
    return NextResponse.json({
      reviews: paginatedReviews,
      has_more: hasMore,
      total: allReviews.length,
      page: pageNum,
      limit: limitNum
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
