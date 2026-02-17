'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Bookmark } from '@/lib/types'

interface BookmarkListProps {
  bookmarks: Bookmark[]
  onBookmarkDeleted: (bookmarkId: string) => void
}

export default function BookmarkList({ bookmarks, onBookmarkDeleted }: BookmarkListProps) {
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  const handleDelete = async (bookmarkId: string) => {
    setError(null)
    setDeletingId(bookmarkId)

    try {
      const { error: deleteError } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId)

      if (deleteError) {
        setError(deleteError.message)
      } else {
        onBookmarkDeleted(bookmarkId)
      }
    } catch {
      setError('An unexpected error occurred while deleting the bookmark.')
    } finally {
      setDeletingId(null)
    }
  }

  if (bookmarks.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-gray-400">No bookmarks yet. Add one above to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-red-600 mb-2" role="alert">{error}</p>
      )}

      <ul className="divide-y divide-gray-100">
        {bookmarks.map((bookmark) => (
          <li
            key={bookmark.id}
            className="flex items-center justify-between py-3 group hover:bg-gray-50 -mx-2 px-2 rounded-md transition-colors"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {bookmark.title}
              </p>
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate block mt-0.5"
              >
                {bookmark.url}
              </a>
            </div>
            <button
              onClick={() => handleDelete(bookmark.id)}
              disabled={deletingId === bookmark.id}
              className="ml-4 rounded-md px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deletingId === bookmark.id ? 'Deleting...' : 'Delete'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
