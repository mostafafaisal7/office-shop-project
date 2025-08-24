import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'http://127.0.0.1:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('API route: Fetching product with ID:', id);
    
    const apiUrl = `${API_BASE_URL}/products/${id}`;
    console.log('API route: Making request to:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('API route: Response status:', response.status);

    if (!response.ok) {
      console.error('API route: Request failed with status:', response.status);
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('API route: Successfully fetched product data');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('API route: Error proxying product request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

