import { NextRequest, NextResponse } from 'next/server';

// Use environment variable for API URL
const API_BASE_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

async function handler(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const url = `${API_BASE_URL}/${path}`;
  
  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  }

  try {
    // Get the request body if it exists
    let body;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        body = await request.json();
      } else if (contentType?.includes('multipart/form-data')) {
        body = await request.formData();
      } else {
        body = await request.text();
      }
    }

    // Prepare headers for the backend request
    const headers: Record<string, string> = {};
    
    // Copy relevant headers
    const headersToForward = [
      'authorization',
      'content-type',
      'accept',
      'user-agent',
    ];
    
    headersToForward.forEach(header => {
      const value = request.headers.get(header);
      if (value) {
        headers[header] = value;
      }
    });

    // Make the request to the backend
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };

    if (body !== undefined) {
      if (body instanceof FormData) {
        fetchOptions.body = body;
        // Remove content-type header to let fetch set it with boundary
        delete headers['content-type'];
      } else if (typeof body === 'string') {
        fetchOptions.body = body;
      } else {
        fetchOptions.body = JSON.stringify(body);
      }
    }

    // Add search params to URL
    const searchParams = request.nextUrl.searchParams.toString();
    const finalUrl = searchParams ? `${url}?${searchParams}` : url;

    console.log('API Proxy - Making request to:', finalUrl);
    console.log('API Proxy - Method:', request.method);
    console.log('API Proxy - Headers:', Object.fromEntries(Object.entries(headers)));

    const response = await fetch(finalUrl, fetchOptions);
    
    console.log('API Proxy - Response status:', response.status);
    console.log('API Proxy - Response headers:', Object.fromEntries(response.headers.entries()));
    
    // Handle 204 No Content responses specially
    if (response.status === 204) {
      return new NextResponse(null, {
        status: 204,
        statusText: response.statusText,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version',
          'Access-Control-Allow-Credentials': 'true',
        },
      });
    }

    // Check if response is binary (like ZIP files)
    const contentType = response.headers.get('content-type') || '';
    const isBinary = contentType.includes('application/zip') ||
                     contentType.includes('application/octet-stream') ||
                     contentType.includes('image/') ||
                     contentType.includes('video/') ||
                     contentType.includes('audio/');

    let responseData;
    if (isBinary) {
      // For binary data, use arrayBuffer
      responseData = await response.arrayBuffer();
      console.log('API Proxy - Binary response, size:', responseData.byteLength, 'bytes');
    } else {
      // For text data, use text
      responseData = await response.text();
      console.log('API Proxy - Text response data:', responseData.substring(0, 500) + (responseData.length > 500 ? '...' : ''));
    }

    // Create response with CORS headers
    return new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': contentType || 'application/json',
      },
    });

  } catch (error) {
    console.error('API Proxy Error:', error);
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to proxy request to backend API'
      }), 
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version',
          'Access-Control-Allow-Credentials': 'true',
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH, handler as OPTIONS };
