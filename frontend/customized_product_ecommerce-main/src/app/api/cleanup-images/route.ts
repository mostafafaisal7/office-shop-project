import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const { imagePaths } = await request.json();

    if (!Array.isArray(imagePaths)) {
      return NextResponse.json(
        { error: 'imagePaths must be an array' },
        { status: 400 }
      );
    }

    const results = [];

    for (const imagePath of imagePaths) {
      try {
        // Convert relative path to absolute path
        const absolutePath = join(process.cwd(), 'public', imagePath);
        
        if (existsSync(absolutePath)) {
          await unlink(absolutePath);
          results.push({ path: imagePath, status: 'deleted' });
          console.log('Deleted image:', imagePath);
        } else {
          results.push({ path: imagePath, status: 'not_found' });
          console.log('Image not found:', imagePath);
        }
      } catch (error) {
        console.error('Error deleting image:', imagePath, error);
        results.push({ path: imagePath, status: 'error', error: error instanceof Error ? error.message : String(error) });
      }
    }

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Error in cleanup-images API:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup images' },
      { status: 500 }
    );
  }
}
