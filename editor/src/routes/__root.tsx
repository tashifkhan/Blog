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
const themeBootScript = `(function(){try{var k='pressroom:theme:v1';var t=localStorage.getItem(k);var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light';var c=d?'#141310':'#f3efe4';var m=document.querySelectorAll('meta[name="theme-color"]');for(var i=0;i<m.length;i++)m[i].setAttribute('content',c);}catch(e){document.documentElement.dataset.theme='light';}})();`

/**
 * Register the service worker without depending on React hydration.
 * Auto-activates updates only when a previous controller already exists.
 */
const pwaRegisterScript = `(function(){if(!('serviceWorker' in navigator))return;var had=!!navigator.serviceWorker.controller;var go=function(){navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).then(function(reg){if(reg.waiting&&had)reg.waiting.postMessage({type:'SKIP_WAITING'});reg.addEventListener('updatefound',function(){var w=reg.installing;if(!w)return;w.addEventListener('statechange',function(){if(w.state==='installed'&&navigator.serviceWorker.controller)w.postMessage({type:'SKIP_WAITING'});});});var refreshing=false;navigator.serviceWorker.addEventListener('controllerchange',function(){if(!had||refreshing)return;refreshing=true;location.reload();});}).catch(function(){});};if(document.readyState==='complete')go();else window.addEventListener('load',go,{once:true});})();`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, viewport-fit=cover',
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
      // Single tag — boot script + theme toggle keep content in sync.
      { name: 'theme-color', content: '#141310' },
      // iOS / iPadOS home-screen web app
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      {
        name: 'apple-mobile-web-app-status-bar-style',
        content: 'black-translucent',
      },
      { name: 'apple-mobile-web-app-title', content: 'Pressroom' },
      { name: 'application-name', content: 'Pressroom' },
      { name: 'format-detection', content: 'telephone=no' },
      { name: 'msapplication-TileColor', content: '#141310' },
    ],
    links: [
      { rel: 'manifest', href: '/manifest.webmanifest' },
      // Classic multi-res ICO (browsers still request /favicon.ico by default)
      { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
      // Modern scalable mark
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml', sizes: 'any' },
      // Explicit PNG sizes for tabs / bookmarks / older Chromium
      {
        rel: 'icon',
        href: '/icons/favicon-16x16.png',
        type: 'image/png',
        sizes: '16x16',
      },
      {
        rel: 'icon',
        href: '/icons/favicon-32x32.png',
        type: 'image/png',
        sizes: '32x32',
      },
      {
        rel: 'icon',
        href: '/icons/favicon-48x48.png',
        type: 'image/png',
        sizes: '48x48',
      },
      // iOS / iPadOS home screen
      {
        rel: 'apple-touch-icon',
        href: '/icons/apple-touch-icon.png',
        sizes: '180x180',
      },
      {
        rel: 'apple-touch-icon',
        href: '/icons/apple-touch-icon-167x167.png',
        sizes: '167x167',
      },
      {
        rel: 'apple-touch-icon',
        href: '/icons/apple-touch-icon-152x152.png',
        sizes: '152x152',
      },
      // Safari pinned tab (monochrome silhouette)
      {
        rel: 'mask-icon',
        href: '/icons/safari-pinned-tab.svg',
        color: '#c43d2f',
      },
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
        <script dangerouslySetInnerHTML={{ __html: pwaRegisterScript }} />
        <Scripts />
      </body>
    </html>
  )
}
