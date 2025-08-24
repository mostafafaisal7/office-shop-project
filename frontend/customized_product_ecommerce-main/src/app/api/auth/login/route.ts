import { NextRequest, NextResponse } from 'next/server';

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();

//     const backendResponse = await fetch('http://127.0.0.1:8000/auth/login', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(body),
//     });

//     const text = await backendResponse.text();
//     let data;

//     try {
//       data = JSON.parse(text);
//     } catch {
//       data = { detail: text }; // fallback if backend returns plain text
//     }

//     // Keep your OTP logic
//     const otpRequired = data.detail?.toLowerCase().includes('otp sent');

//     // Wrap backend response in "data" to match your authStore expectation
//     return NextResponse.json(
//       {
//         success: backendResponse.ok,
//         message: data.detail || (backendResponse.ok ? 'Login successful' : 'Login failed'),
//         data: { ...data, otpRequired },
//       },
//       { status: backendResponse.status }
//     );
//   } catch (error) {
//     console.error('Login API error:', error);
//     return NextResponse.json(
//       { success: false, message: 'Internal server error', data: {} },
//       { status: 500 }
//     );
//   }
// }


// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();

//     const backendResponse = await fetch('http://127.0.0.1:8000/auth/login', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(body),
//     });

//     const data = await backendResponse.json(); // parse JSON directly

//     // Forward the backend response without wrapping
//     return NextResponse.json(data, { status: backendResponse.status });
//   } catch (error) {
//     console.error('Login API error:', error);
//     return NextResponse.json(
//       { detail: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }



export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const backendResponse = await fetch('http://127.0.0.1:8000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
    
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', data: {} },
      { status: 500 }
    );
  }
}
