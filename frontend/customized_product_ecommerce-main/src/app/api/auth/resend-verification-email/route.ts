import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header from the request
    const authorization = request.headers.get('authorization');
    
    // Get the request body
    const body = await request.json();

    // Prepare headers for backend request
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Include authorization header if present
    if (authorization) {
      headers.Authorization = authorization;
    }

    // Forward the request to the backend
    const backendResponse = await fetch('http://localhost:8000/auth/resend-verification-email', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await backendResponse.json();

    // Return the backend response
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('Resend verification email API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
