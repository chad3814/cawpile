import Link from 'next/link'

/**
 * Custom 404 page for profile routes
 * Displays friendly message when username is not found
 */
export default function ProfileNotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 404 Icon */}
        <div className="mb-6">
          <svg
            className="w-24 h-24 mx-auto text-muted-foreground/40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Profile Not Found
        </h1>
        <p className="text-muted-foreground mb-6">
          We could not find a user with that username. Please check the URL and try again.
        </p>

        {/* Action Button */}
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          Go to Home
        </Link>
      </div>
    </div>
  )
}
