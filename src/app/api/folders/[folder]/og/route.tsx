import { prisma } from '@/lib/prisma';
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

const size = {
  width: 1200,
  height: 630
}

export async function GET(request: NextRequest, { params }: { params: { folder: string } }) {
  const searchParams = request.nextUrl.searchParams;
  const folder = await prisma.folder.findUnique({
    where: { id: params.folder },
    select: { cover: true }
  });

  if (!folder || !folder.cover) {
    return new ImageResponse(
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff'
      }}>
        <img
          src={`${process.env.NEXT_PUBLIC_APP_URL}/opengraph-image.png`}
          alt="Echomori"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      </div>,
      { ...size }
    )
  }

  return new ImageResponse(
    <div style={{
      width: `${size.width}px`,
      height: `${size.height}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#ffffff'
    }}>
      <img
        src={`${process.env.NEXT_PUBLIC_APP_URL}/api/folders/${params.folder}/images/${folder.cover.id}?share=${searchParams.get("share")}&t=${searchParams.get("t")}&h=${searchParams.get("h")}`}
        alt="Echomori"
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
          objectFit: 'cover'
        }}
      />
    </div>,
    { ...size }
  )
}