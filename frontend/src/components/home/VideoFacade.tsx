'use client'

import Image from 'next/image'
import { useState } from 'react'
import { PlayIcon } from '@/components/site/icons'

type Props = { youtubeId: string; title: string; poster: string }

/**
 * Ảnh bìa + nút phát; chỉ khi bấm mới nhúng iframe YouTube (kèm autoplay). Trang chủ không phải
 * tải trình phát YouTube nặng cho người không xem video. Ảnh bìa là ảnh nội bộ để không phụ thuộc
 * máy chủ ảnh của YouTube.
 */
export function VideoFacade({ youtubeId, title, poster }: Props) {
  const [playing, setPlaying] = useState(false)

  if (playing) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Phát video: ${title}`}
      className="group absolute inset-0 block h-full w-full"
    >
      <Image src={poster} alt="" aria-hidden fill sizes="(max-width: 1024px) 100vw, 580px" className="object-cover" />
      <span className="absolute inset-0 bg-primary-dark/35 transition-colors group-hover:bg-primary-dark/20" />
      <span className="absolute left-1/2 top-1/2 grid h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent text-primary-dark shadow-[0_0_0_10px_rgb(192_147_66/0.3)] transition-transform group-hover:scale-110">
        <PlayIcon className="ml-1 h-7 w-7" />
      </span>
    </button>
  )
}
