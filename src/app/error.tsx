'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global Error Captured:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-zinc-900 border-2 border-red-500 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-3xl font-black text-red-600 mb-6">시스템 오류 발생 (상세 로그)</h2>
        
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl mb-6 overflow-auto max-h-[400px]">
          <pre className="text-sm text-red-800 dark:text-red-200 font-mono whitespace-pre-wrap">
            {error.name}: {error.message}
            {'\n\n'}
            {error.stack}
          </pre>
        </div>

        <div className="space-y-4">
          <p className="text-zinc-600 dark:text-zinc-400">
            위의 에러 메시지를 복사해서 알려주시면 즉시 해결해 드릴 수 있습니다. 
            주로 <strong>데이터베이스 연결</strong>이나 <strong>권한 문제</strong>일 가능성이 높습니다.
          </p>
          
          <div className="flex gap-4">
            <button
              onClick={() => reset()}
              className="flex-1 px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold rounded-xl hover:opacity-90 transition-all"
            >
              다시 시도하기
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="flex-1 px-6 py-3 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            >
              메인으로 가기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
