import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/Navbar'
import { EditPostForm } from '@/components/EditPostForm'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: PageProps) {
  const { id } = await params
  
  const [post, categories] = await Promise.all([
    prisma.post.findUnique({
      where: { id },
    }),
    prisma.category.findMany(),
  ])

  if (!post) {
    notFound()
  }

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex justify-center">
        <EditPostForm post={post} categories={categories} />
      </main>
    </>
  )
}
