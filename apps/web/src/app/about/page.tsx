import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About CAWPILE - Book Rating System",
  description:
    "Learn about the CAWPILE rating system created by Book Roast for evaluating books across 7 key facets.",
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      {/* Hero Section */}
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          About CAWPILE
        </h1>
        <p className="text-xl text-muted-foreground">
          A comprehensive book rating system for thoughtful readers
        </p>
      </section>

      {/* Book Roast Credit Section */}
      <section className="mb-12">
        <div className="rounded-lg bg-muted/50 border border-border p-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Created by Book Roast
          </h2>
          <p className="text-muted-foreground mb-6">
            The CAWPILE rating system was created by{" "}
            <a
              href="https://www.youtube.com/@BookRoast"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Book Roast
            </a>
            , a popular BookTube channel dedicated to thoughtful book reviews
            and reading discussions. CAWPILE provides a structured way to
            evaluate books beyond simple star ratings, allowing readers to
            analyze different aspects of their reading experience.
          </p>

          <h3 className="text-xl font-semibold text-foreground mb-4">
            What is CAWPILE?
          </h3>
          <p className="text-muted-foreground mb-4">
            CAWPILE is an acronym that stands for the seven facets used to
            evaluate a book:
          </p>

          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-3">
              <span className="text-2xl font-bold text-primary">C</span>
              <div>
                <span className="font-medium text-foreground">Characters</span>
                <span className="text-muted-foreground">
                  {" "}
                  - Character development and memorability
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl font-bold text-primary">A</span>
              <div>
                <span className="font-medium text-foreground">Atmosphere</span>
                <span className="text-muted-foreground">
                  {" "}
                  - Immersion and world-building
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl font-bold text-primary">W</span>
              <div>
                <span className="font-medium text-foreground">Writing</span>
                <span className="text-muted-foreground">
                  {" "}
                  - Writing style and prose quality
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl font-bold text-primary">P</span>
              <div>
                <span className="font-medium text-foreground">Plot</span>
                <span className="text-muted-foreground">
                  {" "}
                  - Story structure and pacing
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl font-bold text-primary">I</span>
              <div>
                <span className="font-medium text-foreground">Intrigue</span>
                <span className="text-muted-foreground">
                  {" "}
                  - Engagement and page-turning quality
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl font-bold text-primary">L</span>
              <div>
                <span className="font-medium text-foreground">Logic</span>
                <span className="text-muted-foreground">
                  {" "}
                  - Internal consistency and coherence
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl font-bold text-primary">E</span>
              <div>
                <span className="font-medium text-foreground">Enjoyment</span>
                <span className="text-muted-foreground">
                  {" "}
                  - Overall satisfaction
                </span>
              </div>
            </li>
          </ul>

          <div className="pt-4 border-t border-border">
            <p className="text-muted-foreground">
              Learn more about how to use CAWPILE by watching Book Roast&apos;s{" "}
              <a
                href="https://www.youtube.com/playlist?list=PL3V6H7y0QuPPNa_DRxClpQ5XU1E-vZpJA"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                CAWPILE playlist
              </a>{" "}
              on YouTube.
            </p>
          </div>
        </div>
      </section>

      {/* About This App Section */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">
          About This App
        </h2>
        <p className="text-muted-foreground">
          CAWPILE.org is a reading tracker that implements the CAWPILE rating
          system. Track your reading progress, rate books using the 7-facet
          system, and gain insights into your reading habits with detailed
          charts and statistics.
        </p>
      </section>
    </div>
  );
}
