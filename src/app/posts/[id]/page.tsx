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

          {/* Images & Attachments Section */}
          {post.attachments.length > 0 && (
            <div className="mt-12 pt-12 border-t border-zinc-100 dark:border-zinc-800">
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-8">
                <FileText size={24} className="text-blue-500" />
                첨부 파일 및 이미지 ({post.attachments.length})
              </h3>
              
              <div className="grid gap-10">
                {post.attachments.map((file) => {
                  const isImage = file.mimetype.startsWith('image/') || 
                                /\.(jpg|jpeg|png|gif|webp)$/i.test(file.filename);
                  
                  return (
                    <div key={file.id} className="space-y-4">
                      {isImage ? (
                        <div className="space-y-3">
                          <a 
                            href={file.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block rounded-3xl overflow-hidden border-2 border-zinc-100 dark:border-zinc-800 hover:border-blue-500 transition-all bg-zinc-50 dark:bg-zinc-950 shadow-sm group"
                          >
                            <img 
                              src={file.url} 
                              alt={file.filename}
                              className="w-full h-auto max-h-[1000px] object-contain mx-auto group-hover:scale-[1.01] transition-transform duration-500"
                              onError={(e) => {
                                // 이미지 로드 실패 시 대체 텍스트나 아이콘 표시 로직 (클라이언트 사이드)
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<div class="p-20 text-center text-zinc-400 font-bold">이미지를 불러올 수 없습니다.<br/><span class="text-xs font-normal">${file.filename}</span></div>`;
                                }
                              }}
                            />
                          </a>
                          <div className="flex items-center justify-between px-2">
                            <span className="text-sm font-bold text-zinc-500 truncate max-w-[70%]">{file.filename}</span>
                            <a 
                              href={file.url} 
                              download={file.filename}
                              className="px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-black hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1.5"
                            >
                              <Download size={14} /> 원본 저장
                            </a>
                          </div>
                        </div>
                      ) : (
                        <a 
                          href={file.url} 
                          download={file.filename}
                          className="flex items-center justify-between p-6 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-blue-500 hover:bg-white dark:hover:bg-zinc-800 transition-all shadow-sm group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-4 bg-white dark:bg-zinc-800 rounded-2xl shadow-inner text-zinc-400 group-hover:text-blue-500 transition-colors">
                              <FileText size={32} />
                            </div>
                            <div>
                              <p className="text-lg font-black text-zinc-900 dark:text-zinc-100 truncate max-w-[200px] md:max-w-md">{file.filename}</p>
                              <p className="text-sm text-zinc-500">{(file.size / 1024).toFixed(1)} KB · 클릭하여 다운로드</p>
                            </div>
                          </div>
                          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                            <Download size={24} />
                          </div>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer / Like */}
          <div className="flex justify-center border-t border-zinc-100 dark:border-zinc-800 pt-12 mt-12">
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
