'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Bookmark } from '@/lib/types'
import AddBookmarkForm from '@/components/AddBookmarkForm'
import BookmarkList from '@/components/BookmarkList'
import SignOutButton from '@/components/SignOutButton'

interface BookmarkManagerProps {
  userId: string
}

export default function BookmarkManager({ userId }: BookmarkManagerProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const fetchBookmarks = async () => {
      const { data } = await supabase
        .from('bookmarks')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) {
        setBookmarks(data as Bookmark[])
      }
      setLoading(false)
    }

    fetchBookmarks()

    // Use broadcast channel for INSERT (works reliably across tabs)
    const broadcastChannel = supabase
      .channel(`bookmarks-broadcast-${userId}`)
      .on('broadcast', { event: 'bookmark-added' }, (payload) => {
        const newBookmark = payload.payload as Bookmark
        setBookmarks((prev) => {
          if (prev.some((b) => b.id === newBookmark.id)) return prev
          return [newBookmark, ...prev]
        })
      })
      .on('broadcast', { event: 'bookmark-deleted' }, (payload) => {
        const deletedId = payload.payload.id as string
        setBookmarks((prev) => prev.filter((b) => b.id !== deletedId))
      })
      .subscribe()

    // Also keep postgres_changes for cross-tab delete sync as backup
    const pgChannel = supabase
      .channel(`bookmarks-pg-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newBookmark = payload.new as Bookmark
            if (newBookmark.user_id !== userId) return
            setBookmarks((prev) => {
              if (prev.some((b) => b.id === newBookmark.id)) return prev
              return [newBookmark, ...prev]
            })
          } else if (payload.eventType === 'DELETE') {
            const oldBookmark = payload.old as Bookmark
            setBookmarks((prev) =>
              prev.filter((b) => b.id !== oldBookmark.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(broadcastChannel)
      supabase.removeChannel(pgChannel)
    }
  }, [supabase, userId])

  const handleBookmarkAdded = useCallback((bookmark: Bookmark) => {
    // Update local state immediately
    setBookmarks((prev) => {
      if (prev.some((b) => b.id === bookmark.id)) return prev
      return [bookmark, ...prev]
    })
    // Broadcast to other tabs
    supabase.channel(`bookmarks-broadcast-${userId}`).send({
      type: 'broadcast',
      event: 'bookmark-added',
      payload: bookmark,
    })
  }, [supabase, userId])

  const handleBookmarkDeleted = useCallback((bookmarkId: string) => {
    // Update local state immediately
    setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId))
    // Broadcast to other tabs
    supabase.channel(`bookmarks-broadcast-${userId}`).send({
      type: 'broadcast',
      event: 'bookmark-deleted',
      payload: { id: bookmarkId },
    })
  }, [supabase, userId])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">My Bookmarks</h1>
            <p className="text-sm text-gray-500">Save and organize your links</p>
          </div>
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8 space-y-8">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-500">
            Add a bookmark
          </h2>
          <AddBookmarkForm userId={userId} onBookmarkAdded={handleBookmarkAdded} />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-500">
            Your bookmarks
          </h2>
          {loading ? (
            <p className="text-sm text-gray-400">Loading bookmarks...</p>
          ) : (
            <BookmarkList bookmarks={bookmarks} onBookmarkDeleted={handleBookmarkDeleted} />
          )}
        </div>
      </main>
    </div>
  )
}
