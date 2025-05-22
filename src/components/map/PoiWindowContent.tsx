import React, { memo, useEffect, useState } from 'react';
import { Folder } from '@prisma/client';
import Image from 'next/image';
import { X } from 'lucide-react';

type ClusterWindowContentProps = {
  folders: Folder[];
  onClose: () => void;
};

const getSignedUrl = async (folderId: string, imageId: string): Promise<string> => {
  const signedUrl = await fetch(`/api/folders/${folderId}/images/${imageId}/download-url`);
  return signedUrl.json().then(data => data.url);
}

export const PoiWindowContent = memo(({ folders, onClose }: ClusterWindowContentProps) => {

  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!folders[0].coverId) return;
    getSignedUrl(folders[0].id, folders[0].coverId).then(setCoverImageUrl);
  }, [folders]);

  return (
    <div className="relative">
      <div className="bg-white border border-primary rounded-lg overflow-hidden shadow-lg mb-[23px] w-64">
        <div className="relative h-32 w-full">
          <Image src={coverImageUrl || ''} alt={folders[0].name} fill className="object-cover" />

          <button className="absolute top-2 right-2 text-white bg-black/50 rounded-full p-1" onClick={() => {
            onClose();
          }}>
            <X className="size-4" />
          </button>
        </div>

        <div className="p-2">
          <h3 className='text-base font-bold flex justify-between items-center gap-2'>{folders[0].name} <span className='text-sm text-gray-500 font-normal'>{folders.length} files</span></h3>



        </div>


      </div>

        <div style={{
          position: 'absolute',
          left: '50%',
          bottom: -11,
          transform: 'translateX(-50%)',
          width: 25,
          height: 12,
          pointerEvents: 'none', // so it doesn't block clicks
        }}>
          <svg width="25" height="13" viewBox="-1 1 25 13" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="0,0 12.5,12 25,0" fill="#fff" stroke="#1f7551" strokeWidth="1" />
          </svg>
        </div>
    </div>
  );
});