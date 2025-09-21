import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  // Redirect based on user role
  switch (session.user.role) {
    case 'ADMIN':
      redirect('/dashboard/admin')
    case 'MANAGER':
      redirect('/dashboard/manager')
    case 'EMPLOYEE':
      redirect('/dashboard/employee')
    default:
      redirect('/auth/signin')
  }
}
