import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { Eye, Heart, MessageSquare } from 'lucide-react'
import { PostActions } from '@/components/PostActions'
import { Navbar } from '@/components/Navbar'

export default async function MyPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const posts = await prisma.post.findMany({
    where: { authorId: session.user.id },
    include: {
      category: true,
      _count: {
        select: { 
          comments: true,
          likes: true
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="flex justify-between items-end mb-8 border-b pb-4 border-zinc-200 dark:border-zinc-800">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">마이페이지</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">
              {session.user.name} 님이 작성하신 글입니다.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-zinc-500">내 글 총 {posts.length}개</p>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-500 dark:text-zinc-400">아직 작성한 글이 없습니다.</p>
            <Link
              href="/posts/new"
              className="mt-4 inline-block text-blue-600 hover:underline font-medium"
            >
              첫 번째 글 쓰러 가기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="group bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                        {post.category.name}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {format(new Date(post.createdAt), 'yyyy-MM-dd HH:mm')}
                      </span>
                    </div>
                    <Link href={`/posts/${post.id}`}>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors">
                        {post.title}
                      </h2>
                    </Link>
                  </div>
                  <div className="ml-4">
                    <PostActions postId={post.id} />
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-zinc-500 border-t border-zinc-50 dark:border-zinc-800 pt-4">
                  <span className="flex items-center gap-1">
                    <Eye size={16} /> {post.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart size={16} className={post._count.likes > 0 ? "fill-red-500 text-red-500" : ""} /> {post._count.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare size={16} /> {post._count.comments}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
