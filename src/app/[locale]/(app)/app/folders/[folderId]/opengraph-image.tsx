import { prisma } from '@/lib/prisma'
import { ImageResponse } from 'next/og'

// Image metadata
export const alt = 'Echomori'
export const size = {
    width: 1200,
    height: 630,
}

export const contentType = 'image/png'

// Image generation
export default async function Image({ params, searchParams }: { params: { folderId: string }, searchParams: { share?: string, t?: string, h?: string } }) {
    const folder = await prisma.folder.findUnique({
        where: { id: params.folderId },
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
                src={`${process.env.NEXT_PUBLIC_APP_URL}/api/folders/${params.folderId}/images/${folder.cover.id}?${searchParams?.share ? `share=${searchParams.share}` : ""}${searchParams?.t ? `t=${searchParams.t}` : ""}${searchParams?.h ? `h=${searchParams.h}` : ""}`} 
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