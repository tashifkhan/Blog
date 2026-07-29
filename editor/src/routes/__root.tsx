import '@fontsource-variable/dm-sans'
import '@fontsource-variable/newsreader'

import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'

import '../styles.css'

/**
 * Runs before first paint so the stored / system theme is applied without a
 * light-mode flash. Keep this string self-contained — no imports.
 */
const themeBootScript = `(function(){try{var k='pressroom:theme:v1';var t=localStorage.getItem(k);var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){document.documentElement.dataset.theme='light';}})();`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Pressroom — Private Blog Editor',
      },
      {
        name: 'description',
        content: 'Private editorial workspace for publishing the Tashif blog.',
      },
      // Private surface: keep it out of search indexes even if the URL leaks.
      { name: 'robots', content: 'noindex, nofollow' },
      { name: 'color-scheme', content: 'light dark' },
      { name: 'theme-color', content: '#141310' },
    ],
  }),
  component: Outlet,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inline boot script first so stored/system theme paints without a flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
