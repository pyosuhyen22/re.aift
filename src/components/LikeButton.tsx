'use client'

import { useState } from 'react'
import { toggleLike } from '@/lib/actions'
import { Heart } from 'lucide-react'

export function LikeButton({ 
  postId, 
  initialLikes, 
  initiallyLiked 
}: { 
  postId: string, 
  initialLikes: number,
  initiallyLiked: boolean
}) {
  const [isLiking, setIsLiking] = useState(false)
  const [hasLiked, setHasLiked] = useState(initiallyLiked)
  const [likesCount, setLikesCount] = useState(initialLikes)

  const handleLike = async () => {
    setIsLiking(true)
    
    // UI 우선 업데이트 (Optimistic UI)
    const newHasLiked = !hasLiked
    setHasLiked(newHasLiked)
    setLikesCount(prev => newHasLiked ? prev + 1 : prev - 1)

    try {
      await toggleLike(postId)
    } catch (error) {
      // 에러 발생 시 원래대로 복구
      setHasLiked(!newHasLiked)
      setLikesCount(prev => !newHasLiked ? prev + 1 : prev - 1)
      alert('로그인이 필요한 기능입니다.')
    } finally {
      setIsLiking(false)
    }
  }

  return (
    <button
      onClick={handleLike}
      disabled={isLiking}
      className={`flex items-center gap-2 px-8 py-3 rounded-full border transition-all font-bold shadow-md ${
        hasLiked 
          ? 'bg-red-500 border-red-500 text-white hover:bg-red-600' 
          : 'border-red-200 dark:border-red-900/50 bg-white dark:bg-zinc-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
      }`}
    >
      <Heart size={20} className={hasLiked ? 'fill-current' : ''} />
      <span>{likesCount}</span>
    </button>
  )
}
