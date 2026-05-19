'use client'

import { useEffect } from 'react'
import { incrementViews } from '@/lib/actions'

export function PostViewCounter({ postId }: { postId: string }) {
  useEffect(() => {
    incrementViews(postId)
  }, [postId])

  return null
}
