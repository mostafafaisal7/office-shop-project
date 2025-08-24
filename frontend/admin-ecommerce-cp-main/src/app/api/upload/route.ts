import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ProductMediaCreate } from '@/types/product';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const files: File[] = data.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files received' }, { status: 400 });
    }

    const uploadedFiles = [];

    for (const file of files) {
      if (!file.size) {
        continue;
      }

      // Generate unique filename
      const fileExtension = file.name.split('.').pop();
      const uniqueFilename = `${uuidv4()}.${fileExtension}`;
      
      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Define upload path
      const uploadPath = join(process.cwd(), 'public/uploads', uniqueFilename);

      // Write file to disk
      await writeFile(uploadPath, buffer);

      // Create file info object
      const fileInfo: ProductMediaCreate = {
        file_path: `/uploads/${uniqueFilename}`,
        file_name: file.name,
        file_size: file.size,
        media_type: file.type.startsWith('image/') ? 'image' : 'video',
        mime_type: file.type,
        alt_text: file.name.split('.')[0],
        is_primary: false,
        sort_order: uploadedFiles.length,
      };

      uploadedFiles.push(fileInfo);
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
