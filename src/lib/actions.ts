'use server'

import { prisma } from './prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth, signIn, signOut } from '@/auth'
import bcrypt from 'bcryptjs'
import fs from 'fs/promises'
import path from 'path'

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
  } catch (error: any) {
    if (error.type === 'CredentialsSignin') {
      throw new Error('Invalid credentials')
    }
    // NextAuth v5 redirects by throwing an error, we need to let it bubble up
    throw error
  }
}

export async function logout() {
  try {
    await signOut({ redirectTo: '/' })
  } catch (error) {
    throw error
  }
}

export async function createPost(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Not authenticated')

  const title = formData.get('title') as string
  let content = formData.get('content') as string
  const categoryId = formData.get('categoryId') as string
  const files = formData.getAll('files')

  if (!title || !content || !categoryId) {
    throw new Error('All fields are required')
  }

  // 1. 임시 게시글 생성 (에러 로그 저장을 위해 나중에 업데이트)
  let post;
  try {
    post = await prisma.post.create({
      data: {
        title,
        content,
        categoryId,
        authorId: session.user.id,
      },
    })
  } catch (error) {
    console.error('Database Error (Post Creation):', error)
    throw new Error('게시글 저장 중 오류가 발생했습니다.')
  }

  let debugLogs = "";

  // 2. 사진 업로드 처리 (Imgur API)
  if (files && files.length > 0) {
    for (const f of files) {
      try {
        const file = f as any;
        if (!file || !file.size || !file.name || typeof file.arrayBuffer !== 'function') continue;

        // 이미지 파일 검사
        const isImage = file.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
        if (!isImage) continue;

        // Base64 변환
        const arrayBuffer = await file.arrayBuffer();
        const base64Image = Buffer.from(arrayBuffer).toString('base64');

        // Imgur API 호출 (가장 표준적인 URLSearchParams 방식)
        const bodyParams = new URLSearchParams();
        bodyParams.append('image', base64Image);
        bodyParams.append('type', 'base64');

        const response = await fetch('https://api.imgur.com/3/image', {
          method: 'POST',
          headers: {
            Authorization: 'Client-ID 799307d66827012',
            'Accept': 'application/json', // JSON 응답 강제
          },
          body: bodyParams,
        });

        const resText = await response.text();
        let resData;
        try {
          resData = JSON.parse(resText);
        } catch (e) {
          debugLogs += `\n[Not JSON Error: ${file.name}] Status: ${response.status}, Body: ${resText.substring(0, 200)}`;
          continue;
        }
        
        if (response.ok && resData.success) {
          const imageUrl = resData.data.link;
          await prisma.attachment.create({
            data: {
              postId: post.id,
              filename: file.name,
              url: imageUrl,
              mimetype: file.type || 'image/jpeg',
              size: file.size,
            }
          });
        } else {
          debugLogs += `\n[Upload Failed: ${file.name}] ${JSON.stringify(resData)}`;
        }
      } catch (uploadError: any) {
        debugLogs += `\n[Process Error] ${uploadError.message}`;
      }
    }
  }

  // 3. 에러 로그가 있다면 본문에 추가하여 사용자(디버거)가 볼 수 있게 함
  if (debugLogs) {
    await prisma.post.update({
      where: { id: post.id },
      data: { content: content + "\n\n--- DEBUG LOG ---\n" + debugLogs }
    });
  }

  revalidatePath('/')
  revalidatePath(`/posts/${post.id}`)
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
