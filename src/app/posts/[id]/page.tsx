import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/Navbar'
import { PostViewCounter } from '@/components/PostViewCounter'
import { PostActions } from '@/components/PostActions'
import { LikeButton } from '@/components/LikeButton'
import { CommentSection } from '@/components/CommentSection'
import { Eye, Clock, User, Download, FileText } from 'lucide-react'
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
      attachments: true,
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

          {/* Images - Shown prominently above content */}
          {post.attachments.filter(f => 
            f.mimetype.startsWith('image/') || 
            /\.(jpg|jpeg|png|gif|webp)$/i.test(f.filename)
          ).length > 0 && (
            <div className="mb-8 space-y-4">
              {post.attachments
                .filter(f => f.mimetype.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(f.filename))
                .map((file) => (
                  <div key={file.id} className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                    <img 
                      src={file.url} 
                      alt={file.filename}
                      className="w-full h-auto max-h-[800px] object-contain mx-auto"
                    />
                  </div>
                ))}
            </div>
          )}

          {/* Content */}
          <div className="prose dark:prose-invert max-w-none mb-12">
            <p className="whitespace-pre-wrap leading-relaxed text-lg text-zinc-800 dark:text-zinc-200">
              {post.content}
            </p>
          </div>

          {/* Other Attachments - Only non-images */}
          {post.attachments.filter(f => 
            !f.mimetype.startsWith('image/') && 
            !/\.(jpg|jpeg|png|gif|webp)$/i.test(f.filename)
          ).length > 0 && (
            <div className="mb-12 space-y-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <FileText size={20} />
                첨부 파일
              </h3>
              <div className="grid gap-4">
                {post.attachments
                  .filter(f => !f.mimetype.startsWith('image/') && !/\.(jpg|jpeg|png|gif|webp)$/i.test(f.filename))
                  .map((file) => (
                    <a 
                      key={file.id}
                      href={file.url} 
                      download={file.filename}
                      className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="text-zinc-400" />
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{file.filename}</p>
                          <p className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <Download size={18} className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
                    </a>
                  ))}
              </div>
            </div>
          )}

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
