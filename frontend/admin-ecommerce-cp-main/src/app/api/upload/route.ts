import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const files: File[] = data.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files received' }, { status: 400 });
    }

    const uploadedFiles = [];

    for (const file of files) {
      if (!file.size) continue;

      // Forward file to FastAPI backend
      const formData = new FormData();
      formData.append('upload_type', 'products'); // <-- or 'users' / 'categories'
      formData.append('file', file);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uploads/image`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`FastAPI upload failed: ${res.statusText}`);
      }

      const result = await res.json();

      uploadedFiles.push({
        file_path: result.image_url, // Absolute URL returned by FastAPI
        file_name: file.name,
        file_size: file.size,
        media_type: file.type.startsWith('image/') ? 'image' : 'video',
        mime_type: file.type,
        alt_text: file.name.split('.')[0],
        is_primary: false,
        sort_order: uploadedFiles.length,
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      message: `${uploadedFiles.length} file(s) uploaded successfully`
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload files', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
