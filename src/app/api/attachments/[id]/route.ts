import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id },
    });

    if (!attachment || !attachment.data) {
      return new NextResponse('Image not found', { status: 404 });
    }

    // 사진 데이터를 응답으로 전송
    return new NextResponse(attachment.data, {
      headers: {
        'Content-Type': attachment.mimetype,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
