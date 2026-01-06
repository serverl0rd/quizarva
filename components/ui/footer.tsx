import Link from 'next/link'

export function Footer() {
  return (
    <footer className="w-full border-t border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Created by{' '}
            <Link
              href="https://serverlord.in"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary-light dark:text-primary-dark hover:underline"
            >
              @ServerLord
            </Link>
            {' '}
            (
            <Link
              href="https://atharvakulkarni.link"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary-light dark:text-primary-dark hover:underline"
            >
              Atharva Kulkarni
            </Link>
            )
          </p>
          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
            © {new Date().getFullYear()} QuizArva. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}