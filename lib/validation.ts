export interface ValidationResult {
  valid: boolean
  errors: {
    url?: string
    title?: string
  }
}

export function validateBookmarkInput(url: string, title: string): ValidationResult {
  const errors: { url?: string; title?: string } = {}

  if (title.trim().length === 0) {
    errors.title = 'Title cannot be empty'
  }

  try {
    new URL(url)
  } catch {
    errors.url = 'Please enter a valid URL'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}
