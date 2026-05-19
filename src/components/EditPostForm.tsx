'use client'

import { updatePost } from '@/lib/actions'
import Link from 'next/link'

interface Category {
  id: string
  name: string
}

interface Post {
  id: string
  title: string
  content: string
  categoryId: string
}

export function EditPostForm({ post, categories }: { post: Post, categories: Category[] }) {
  const updatePostWithId = updatePost.bind(null, post.id)

  return (
    <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-zinc-100">글 수정하기</h1>
        <p className="text-zinc-500 text-sm">내용을 수정해주세요.</p>
      </div>

      <form action={updatePostWithId} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">카테고리</label>
          <select
            name="categoryId"
            required
            defaultValue={post.categoryId}
            className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none transition-all"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id} className="dark:bg-zinc-900">
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">제목</label>
          <input
            type="text"
            name="title"
            required
            defaultValue={post.title}
            placeholder="제목을 입력하세요"
            className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">내용</label>
          <textarea
            name="content"
            required
            rows={10}
            defaultValue={post.content}
            placeholder="내용을 입력하세요"
            className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none transition-all resize-none"
          ></textarea>
        </div>

        <div className="flex gap-4 pt-4">
          <Link
            href={`/posts/${post.id}`}
            className="flex-1 px-6 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 font-medium text-center text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            취소
          </Link>
          <button
            type="submit"
            className="flex-1 px-6 py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold hover:opacity-90 transition-opacity"
          >
            수정 완료
          </button>
        </div>
      </form>
    </div>
  )
}
