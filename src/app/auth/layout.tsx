import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Authentication - HRM App',
  description: 'Sign in or create an account to access the HRM system',
}

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  // If user is already authenticated, redirect to appropriate dashboard
  if (session) {
    const role = session.user.role.toLowerCase()
    redirect(`/dashboard/${role}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}
