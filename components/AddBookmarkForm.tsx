'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { validateBookmarkInput } from '@/lib/validation'
import type { Bookmark } from '@/lib/types'

interface AddBookmarkFormProps {
  userId: string
  onBookmarkAdded: (bookmark: Bookmark) => void
}

export default function AddBookmarkForm({ userId, onBookmarkAdded }: AddBookmarkFormProps) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [errors, setErrors] = useState<{ url?: string; title?: string }>({})
  const [dbError, setDbError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setDbError(null)

    const result = validateBookmarkInput(url, title)
    if (!result.valid) {
      setErrors(result.errors)
      return
    }

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .insert({ url, title, user_id: userId })
        .select()
        .single()

      if (error) {
        setDbError(error.message)
        return
      }

      if (data) {
        onBookmarkAdded(data as Bookmark)
      }

      setUrl('')
      setTitle('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My bookmark"
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-600">{errors.title}</p>
          )}
        </div>

        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
            URL
          </label>
          <input
            id="url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.url && (
            <p className="mt-1 text-xs text-red-600">{errors.url}</p>
          )}
        </div>
      </div>

      {dbError && (
        <p className="text-sm text-red-600">{dbError}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Adding...' : 'Add Bookmark'}
      </button>
    </form>
  )
}
