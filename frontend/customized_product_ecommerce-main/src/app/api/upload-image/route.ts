import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const directory = formData.get('directory') as string || 'uploads';

    if (!image) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!image.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Create upload directory path
    const uploadDir = join(process.cwd(), 'public', 'uploads', directory);
    
    // Ensure directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Get file buffer
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create file path
    const filePath = join(uploadDir, image.name);
    const relativePath = `/uploads/${directory}/${image.name}`;

    // Write file to disk
    await writeFile(filePath, buffer);

    console.log('Image saved successfully:', relativePath);

    return NextResponse.json({
      success: true,
      path: relativePath,
      filename: image.name,
      size: buffer.length
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
