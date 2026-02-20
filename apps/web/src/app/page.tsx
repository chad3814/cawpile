import Link from "next/link"
import CawpileFacetsDisplay from "@/components/homepage/CawpileFacetsDisplay"
import HomepageCharts from "@/components/homepage/HomepageCharts"

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="text-center px-6 py-16 max-w-4xl mx-auto">
        <div className="flex justify-center mb-8">
          <svg
            className="w-20 h-20 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>

        <h1 className="text-5xl font-bold text-foreground mb-6">
          Track Your Reading Journey
        </h1>

        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Organize your library, monitor reading progress, set goals, and discover your next favorite book with CAWPILE.
        </p>

        <Link
          href="/auth/signin"
          className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors text-lg"
        >
          Start Tracking
          <svg
            className="w-5 h-5 ml-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Link>
      </section>

      {/* CAWPILE Rating System Section */}
      <section className="w-full max-w-6xl mx-auto px-6 py-16 border-t border-border">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            The CAWPILE Rating System
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Rate books using 7 key facets for a more nuanced and thoughtful evaluation of your reading experience.
          </p>
        </div>
        <CawpileFacetsDisplay />
      </section>

      {/* Demo Charts Section */}
      <section className="w-full max-w-6xl mx-auto px-6 py-16 border-t border-border">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Track Your Reading Statistics
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Visualize your reading habits with interactive charts. See how many books you read, pages you turn, and formats you prefer.
          </p>
        </div>
        <HomepageCharts />
      </section>

      {/* Features Section */}
      <section className="w-full max-w-6xl mx-auto px-6 py-16 border-t border-border">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Track Reading
            </h3>
            <p className="text-muted-foreground">
              Keep track of what you&apos;re reading, want to read, and have completed. Monitor your progress page by page.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Set Goals
            </h3>
            <p className="text-muted-foreground">
              Challenge yourself with reading goals. Track your progress throughout the year and celebrate your achievements.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Discover Books
            </h3>
            <p className="text-muted-foreground">
              Search millions of books, get recommendations, and find your next great read from our comprehensive database.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
