import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'http://127.0.0.1:8000';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    const apiUrl = `${API_BASE_URL}/products/${queryString ? `?${queryString}` : ''}`;
    console.log(`🔄 [PROXY] Forwarding request to: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️  [PROXY] Backend responded in ${duration}ms with status: ${response.status}`);

    if (!response.ok) {
      console.error(`❌ [PROXY] Backend returned error: ${response.status}`);
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ [PROXY] Successfully proxied request (${duration}ms)`);

    return NextResponse.json(data);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [PROXY] Error after ${duration}ms:`, error);
    console.error(`❌ [PROXY] Is the backend running at ${API_BASE_URL}?`);
    console.error(`❌ [PROXY] Run: cd fastapi_ecommerce-main && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`);

    return NextResponse.json(
      {
        error: 'Backend server not available',
        message: error instanceof Error ? error.message : 'Unknown error',
        backend_url: API_BASE_URL,
        hint: 'Make sure FastAPI backend is running on port 8000'
      },
      { status: 500 }
    );
  }
}
