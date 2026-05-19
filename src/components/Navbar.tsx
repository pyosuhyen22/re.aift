import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'
import { PenSquare, LogIn, UserCircle, LogOut } from 'lucide-react'
import { auth } from '@/auth'
import { logout } from '@/lib/actions'

export async function Navbar() {
  const session = await auth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tighter hover:opacity-80 transition-opacity text-zinc-900 dark:text-zinc-100">
          DARK BOARD
        </Link>
        
        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle />
          
          {session ? (
            <>
              <Link 
                href="/posts/new" 
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 transition-opacity text-sm font-medium"
              >
                <PenSquare size={16} />
                <span className="hidden md:inline">글쓰기</span>
              </Link>
              <Link 
                href="/mypage"
                className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                title="마이페이지"
              >
                <UserCircle size={22} />
              </Link>
              <form action={logout}>
                <button 
                  type="submit"
                  className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-red-600 transition-colors"
                  title="로그아웃"
                >
                  <LogOut size={22} />
                </button>
              </form>
            </>
          ) : (
            <>
              <Link 
                href="/login"
                className="flex items-center gap-1 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 px-3 py-1.5"
              >
                <LogIn size={18} />
                로그인
              </Link>
              <Link 
                href="/register"
                className="text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-4 py-1.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
