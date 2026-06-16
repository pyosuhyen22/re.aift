import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Eye, Heart, MessageSquare, ChevronLeft, ChevronRight, Search as SearchIcon } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    category?: string
  }>
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const search = params.search || ''
  const categoryId = params.category || ''
  const limit = 10
  const skip = (page - 1) * limit

  const where = {
    AND: [
      search ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { content: { contains: search, mode: 'insensitive' as const } },
        ]
      } : {},
      categoryId ? { categoryId } : {},
    ]
  }

  const [posts, total, categoriesCount] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        category: true,
        attachments: true,
        author: {
          select: { name: true }
        },
        _count: {
          select: { 
            comments: true,
            likes: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.post.count({ where }),
    prisma.category.count(),
  ])

  // 자동 카테고리 생성 (공지 추가)
  if (categoriesCount === 0) {
    await prisma.category.createMany({
      data: [
        { name: '공지' },
        { name: '일반' },
        { name: '질문' },
      ]
    })
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  })

  const totalPages = Math.ceil(total / limit)

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        {/* Category & Search Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !categoryId 
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' 
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              전체
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/?category=${cat.id}${search ? `&search=${search}` : ''}`}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  categoryId === cat.id 
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' 
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          <form action="/" method="GET" className="relative w-full md:w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={18} />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="검색어 입력..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 outline-none transition-all"
            />
            {categoryId && <input type="hidden" name="category" value={categoryId} />}
          </form>
        </div>

        {/* Post List */}
        <div className="grid gap-4">
          {posts.length === 0 ? (
            <div className="text-center py-20 text-zinc-500 dark:text-zinc-400">
              게시글이 없습니다.
            </div>
          ) : (
            posts.map((post) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="group block p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                    {post.category.name}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h2 className="text-xl font-bold mb-2 text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {post.title}
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 line-clamp-2 text-sm mb-4">
                  {post.content}
                </p>
                <div className="flex items-center gap-4 text-xs text-zinc-400 font-medium border-t border-zinc-100 dark:border-zinc-800 pt-4">
                  <span className="text-zinc-600 dark:text-zinc-300 font-semibold">{post.author.name}</span>
                  <div className="flex items-center gap-1 ml-auto">
                    <Eye size={14} />
                    {post.views}
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart size={14} />
                    {post._count.likes}
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare size={14} />
                    {post._count.comments}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            {page > 1 && (
              <Link
                href={`/?page=${page - 1}${search ? `&search=${search}` : ''}${categoryId ? `&category=${categoryId}` : ''}`}
                className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <ChevronLeft size={20} />
              </Link>
            )}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <Link
                  key={i}
                  href={`/?page=${i + 1}${search ? `&search=${search}` : ''}${categoryId ? `&category=${categoryId}` : ''}`}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg border font-medium transition-colors ${
                    page === i + 1 
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100' 
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {i + 1}
                </Link>
              ))}
            </div>
            {page < totalPages && (
              <Link
                href={`/?page=${page + 1}${search ? `&search=${search}` : ''}${categoryId ? `&category=${categoryId}` : ''}`}
                className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <ChevronRight size={20} />
              </Link>
            )}
          </div>
        )}
      </main>
    </>
  )
}
