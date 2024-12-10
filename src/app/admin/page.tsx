'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import PassportsList  from '@/components/PassportsList'


export default function AdminPage() {
  const { status } = useSession()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()


  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

 

  return (
    <div className="flex h-screen bg-gray-100">
        <main className="flex-1 overflow-auto">
          <PassportsList />
        </main>
    </div>
  )
}
