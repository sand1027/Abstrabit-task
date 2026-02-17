import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BookmarkManager from '@/components/BookmarkManager'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <BookmarkManager userId={user.id} />
}
