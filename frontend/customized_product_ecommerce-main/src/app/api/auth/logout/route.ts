import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header from the request
    const authorization = request.headers.get('authorization');
    
    if (!authorization) {
      return NextResponse.json(
        { message: 'Authorization header required' },
        { status: 401 }
      );
    }

    // Forward the request to the backend
    const backendResponse = await fetch('http://localhost:8000/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
    });

    const data = await backendResponse.json();

    // If the backend returns an error, make sure we format it correctly
    if (!backendResponse.ok) {
      // The backend might return {"detail": "error message"} instead of {"message": "error message"}
      const errorMessage = data.detail || data.message || 'Logout failed';
      return NextResponse.json(
        { message: errorMessage },
        { status: backendResponse.status }
      );
    }

    // Return the backend response for successful logout
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
