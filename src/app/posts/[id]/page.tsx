import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/Navbar'
import { PostViewCounter } from '@/components/PostViewCounter'
import { PostActions } from '@/components/PostActions'
import { LikeButton } from '@/components/LikeButton'
import { CommentSection } from '@/components/CommentSection'
import { Eye, Clock, User } from 'lucide-react'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()
  
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      category: true,
      author: {
        select: { id: true, name: true }
      },
      likes: {
        where: {
          userId: session?.user?.id || ''
        }
      },
      _count: {
        select: { likes: true }
      },
      comments: {
        include: {
          author: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!post) {
    notFound()
  }

  const isAuthor = session?.user?.id === post.authorId
  const initiallyLiked = post.likes.length > 0

  return (
    <>
      <Navbar />
      <PostViewCounter postId={post.id} />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <article className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 md:p-12 shadow-sm">
          {/* Header */}
          <header className="mb-8 pb-8 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-bold px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {post.category.name}
              </span>
              <span className="text-sm text-zinc-400 flex items-center gap-1">
                <Clock size={14} />
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black mb-6 leading-tight text-zinc-900 dark:text-zinc-100">
              {post.title}
            </h1>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-sm text-zinc-500">
                <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100">
                  <User size={16} className="text-zinc-400" />
                  {post.author.name}
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye size={16} className="text-zinc-400" />
                  {post.views}
                </div>
              </div>
              {isAuthor && <PostActions postId={post.id} />}
            </div>
          </header>

          {/* Content */}
          <div className="prose dark:prose-invert max-w-none mb-12">
            <p className="whitespace-pre-wrap leading-relaxed text-lg text-zinc-800 dark:text-zinc-200">
              {post.content}
            </p>
          </div>

          {/* Footer / Like */}
          <div className="flex justify-center border-t border-zinc-100 dark:border-zinc-800 pt-12">
            <LikeButton 
              postId={post.id} 
              initialLikes={post._count.likes} 
              initiallyLiked={initiallyLiked}
            />
          </div>
        </article>

        {/* Comment Section */}
        <CommentSection 
          postId={post.id} 
          comments={post.comments} 
          currentUserId={session?.user?.id}
        />
      </main>
    </>
  )
}
