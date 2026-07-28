'use client';

import dynamic from 'next/dynamic';

const VideoRoom = dynamic(() => import('./VideoRoom'), { ssr: false });

export default function CanliDersSayfasi() {
  return <VideoRoom />;
}