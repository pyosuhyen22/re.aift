'use server'

import { prisma } from './prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth, signIn, signOut } from '@/auth'
import bcrypt from 'bcryptjs'

export async function register(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!name || !email || !password) {
    throw new Error('All fields are required')
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    throw new Error('Email already exists or registration failed')
  }

  redirect('/login')
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    throw new Error('Email and password are required')
  }

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/',
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }
    throw new Error('Invalid credentials')
  }
}

export async function logout() {
  await signOut({ redirectTo: '/' })
}

export async function createPost(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Not authenticated')

  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const categoryId = formData.get('categoryId') as string

  if (!title || !content || !categoryId) {
    throw new Error('All fields are required')
  }

  const recentPost = await prisma.post.findFirst({
    where: {
      authorId: session.user.id,
      title: title,
      createdAt: {
        gt: new Date(Date.now() - 5000)
      }
    }
  })

  if (recentPost) {
    throw new Error('잠시 후에 다시 시도해주세요. (중복 글쓰기 방지)')
  }

  const post = await prisma.post.create({
    data: {
      title,
      content,
      categoryId,
      authorId: session.user.id,
    },
  })

  revalidatePath('/')
  redirect(`/posts/${post.id}`)
}

export async function updatePost(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Not authenticated')

  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const categoryId = formData.get('categoryId') as string

  const existingPost = await prisma.post.findUnique({ where: { id } })
  if (!existingPost) throw new Error('Post not found')
  if (existingPost.authorId !== session.user.id) throw new Error('Not authorized')

  await prisma.post.update({
    where: { id },
    data: {
      title,
      content,
      categoryId,
    },
  })

  revalidatePath(`/posts/${id}`)
  redirect(`/posts/${id}`)
}

export async function deletePost(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Not authenticated')

  const existingPost = await prisma.post.findUnique({ where: { id } })
  if (!existingPost) throw new Error('Post not found')
  if (existingPost.authorId !== session.user.id) throw new Error('Not authorized')

  await prisma.post.delete({ where: { id } })
  revalidatePath('/')
  revalidatePath('/mypage')
  redirect('/')
}

export async function incrementViews(id: string) {
  await prisma.post.update({
    where: { id },
    data: { views: { increment: 1 } },
  })
}

// 좋아요 토글 기능 (있으면 삭제, 없으면 추가)
export async function toggleLike(postId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('로그인이 필요합니다.')

  const userId = session.user.id

  const existingLike = await prisma.like.findUnique({
    where: {
      postId_userId: {
        postId,
        userId
      }
    }
  })

  if (existingLike) {
    await prisma.like.delete({
      where: {
        id: existingLike.id
      }
    })
  } else {
    await prisma.like.create({
      data: {
        postId,
        userId
      }
    })
  }
  
  revalidatePath(`/posts/${postId}`)
}

export async function createComment(postId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Not authenticated')

  const content = formData.get('content') as string

  if (!content) {
    throw new Error('Content is required')
  }

  await prisma.comment.create({
    data: {
      content,
      postId,
      authorId: session.user.id,
    },
  })

  revalidatePath(`/posts/${postId}`)
}

export async function deleteComment(id: string, postId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Not authenticated')

  const existingComment = await prisma.comment.findUnique({ where: { id } })
  if (!existingComment) throw new Error('Comment not found')
  if (existingComment.authorId !== session.user.id) throw new Error('Not authorized')

  await prisma.comment.delete({ where: { id } })
  revalidatePath(`/posts/${postId}`)
}
