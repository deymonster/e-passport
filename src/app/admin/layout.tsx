'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import SideMenu from '@/components/SideMenu';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <SideMenu>
      <button
          onClick={() => signOut()}
          className="w-full py-2 px-4 text-left text-gray-600 hover:bg-gray-50"
        >
          Выход
        </button>
      </SideMenu>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
