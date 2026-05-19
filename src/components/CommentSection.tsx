'use client'

import { useState } from 'react'
import { createComment, deleteComment } from '@/lib/actions'
import { MessageSquare, Trash2, X, Lock } from 'lucide-react'
import Link from 'next/link'

interface Comment {
  id: string
  content: string
  createdAt: Date
  author: {
    id: string
    name: string | null
  }
}

export function CommentSection({ 
  postId, 
  comments, 
  currentUserId 
}: { 
  postId: string, 
  comments: Comment[],
  currentUserId?: string
}) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (commentId: string) => {
    if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) return

    setIsDeleting(commentId)
    try {
      await deleteComment(commentId, postId)
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.')
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="mt-12 space-y-8">
      <div className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
        <MessageSquare size={24} />
        댓글 {comments.length}
      </div>

      {/* Comment Form */}
      {currentUserId ? (
        <form 
          action={async (formData) => {
            await createComment(postId, formData)
            // form reset is handled by Next.js if using standard form, 
            // but for better UX we might want a client-side wrapper.
            // For now, let's keep it simple.
          }} 
          className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4"
        >
          <textarea
            name="content"
            placeholder="댓글 내용을 입력하세요"
            required
            rows={3}
            className="w-full p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none transition-all resize-none shadow-sm"
          ></textarea>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold hover:opacity-90 transition-opacity"
            >
              댓글 등록
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 text-center">
          <Lock className="mx-auto mb-3 text-zinc-400" size={24} />
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">로그인 후 댓글을 작성할 수 있습니다.</p>
          <Link 
            href="/login" 
            className="inline-block px-6 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full font-bold text-sm"
          >
            로그인하기
          </Link>
        </div>
      )}

      {/* Comment List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{comment.author.name}</span>
                <span className="text-xs text-zinc-400">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </div>
              {currentUserId === comment.author.id && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  disabled={isDeleting === comment.id}
                  className="text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-50"
                  title="댓글 삭제"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
          </div>
        ))}
        {comments.length === 0 && (
          <div className="text-center py-10 text-zinc-500 italic">
            첫 번째 댓글을 남겨보세요!
          </div>
        )}
      </div>
    </div>
  )
}
