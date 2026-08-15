/**
 * URL rewriting for Markdown that was authored somewhere other than where it is
 * rendered.
 *
 * Two different kinds of content flow through the renderer and they disagree
 * about what a root-relative `/foo` means:
 *
 *  - Blog posts: `/images/blog/…` is a real path on the site that serves the
 *    post, so it must be left alone (or pointed at that site's origin when a
 *    different site is rendering the same Markdown).
 *  - GitHub READMEs and generated docs: `/foo` is repository-root-relative and
 *    has to become a raw.githubusercontent URL to resolve at all.
 *
 * Getting this backwards is how root-relative blog images ended up rewritten to
 * raw GitHub paths that do not exist, so the behaviour is an explicit option
 * rather than something inferred from the URL.
 */

import { FILE_ICON, FOLDER_ICON } from './icons'
import { cx, type MarkdownTheme } from './theme'

export type RootRelativeMode = 'site' | 'repo'

export type UrlOptions = {
  /** Repository the Markdown lives in, e.g. `https://github.com/user/repo`. */
  githubBaseUrl?: string
  /**
   * GitHub profile the `gh:` scheme treats as `me`, e.g.
   * `https://github.com/tashifkhan`. `gh:me` and `gh:me/repo` resolve against
   * it; without it the `me` spelling falls back to the literal username.
   */
  githubProfileUrl?: string
  /** Docs project slug, used to serve bundled `images/…` from the site. */
  project?: string
  rootRelative?: RootRelativeMode
  /**
   * Origin to prefix onto root-relative URLs. Set this when one site renders
   * Markdown whose assets are hosted by another.
   */
  assetBaseUrl?: string
  /** Origin the `tc:` / `tashif:` schemes expand to (default tashif.codes). */
  siteBaseUrl?: string
  /** Origin the `blog:` scheme expands to (default blog.tashif.codes). */
  blogBaseUrl?: string
}

const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i
const SCHEME_REF = /^([a-z][a-z0-9+.-]*):(.*)$/i

/**
 * Sites whose bare `site.tld/…` URLs are upgraded to https.
 *
 * linkify-it's fuzzy matcher recognises common TLDs and prefixes a match with
 * `http://`. Every site the shorthand schemes expand to is https-only, so a
 * fuzzy-linked one is upgraded here — this is how a post that says
 * `github.com/user/repo` renders a working https link rather than http.
 */
export const KNOWN_SITES = [
  'github.com',
  'youtube.com',
  'youtu.be',
  'x.com',
  'twitter.com',
  'linkedin.com',
  'reddit.com',
  'wikipedia.org',
  'instagram.com',
  'medium.com',
  'stackoverflow.com',
  'npmjs.com',
  'discord.com',
  'tashif.codes',
  'codetrace.xyz',
]

const KNOWN_SITE_HTTP = new RegExp(
  `^http://([A-Za-z0-9-]+\\.)*(${KNOWN_SITES.map((domain) =>
    domain.replace(/\./g, '\\.'),
  ).join('|')})([/:?#]|$)`,
  'i',
)

/**
 * Expand one short scheme (`yt:`, `tw:`, `wp:`, …) into a full URL.
 *
 * The map is the extension point for new sites: add an alias and a resolver
 * here and it works for both explicit `[x](scheme:ref)` links and bare
 * `scheme:ref` in prose, which `render.ts` registers with linkify-it. A
 * resolver turns the tail after `scheme:` into a URL; the `options` argument
 * lets it honour the configured profile or origin.
 */
export type SchemeResolver = (ref: string, options: UrlOptions) => string

/**
 * Expand the `gh:` shorthand into a GitHub URL.
 *
 * A single segment is a profile (`gh:user`), `owner/repo` a repository, and
 * `me` aliases the configured profile so a site can point at its own repos as
 * `gh:me/repo`. Deep links (`gh:owner/repo/tree/main`) survive. Trailing
 * punctuation is dropped: GitHub names never end in a dot or hyphen, so the
 * `.` a sentence would leave behind belongs to the prose, not the URL.
 */
export function resolveGithubRef(ref: string, githubProfileUrl?: string): string {
  const target = ref.trim().replace(/[.-]+$/, '')
  if (!target) return githubProfileUrl || 'https://github.com'
  if (target === 'me') return githubProfileUrl || 'https://github.com/me'
  if (target.startsWith('me/')) {
    const profile = githubProfileUrl || 'https://github.com/me'
    return `${profile.replace(/\/+$/, '')}/${target.slice(3)}`
  }
  return `https://github.com/${target}`
}

/** Path tail after `scheme:`, with any leading slashes trimmed. */
function firstPath(ref: string): string {
  return ref.replace(/^\/+/, '')
}

/** A bare handle/username, tolerating a leading `@`. */
function handle(ref: string): string {
  return ref.replace(/^\/+/, '').replace(/^@/, '')
}

function youtubeRef(ref: string): string {
  const path = firstPath(ref)
  if (path.startsWith('playlist/') || path.startsWith('list/')) {
    return `https://www.youtube.com/playlist?list=${path.split('/').pop()}`
  }
  if (!path) return 'https://www.youtube.com'
  return `https://www.youtube.com/watch?v=${path}`
}

function linkedinRef(ref: string): string {
  const path = firstPath(ref)
  if (/^(in|company|school|pub|groups)\//.test(path)) {
    return `https://www.linkedin.com/${path}`
  }
  return `https://www.linkedin.com/in/${path}`
}

function wikipediaRef(ref: string): string {
  // Spaces become underscores (`wp:Complex Article` is `Complex_Article`), and
  // markdown-it percent-encodes a destination's spaces to `%20` first, so both
  // spellings land on the canonical underscore form.
  const path = firstPath(ref).replace(/\s+/g, '_').replace(/%20/g, '_')
  const lang = path.match(/^([a-z]{2,3})\/(.+)$/)
  if (lang) return `https://${lang[1]}.wikipedia.org/wiki/${lang[2]}`
  return `https://en.wikipedia.org/wiki/${path}`
}

/** Root-origin scheme: `tc:path` -> `https://tashif.codes/path`. */
function originRef(ref: string, base: string): string {
  const root = base.replace(/\/+$/, '')
  const path = firstPath(ref)
  return path ? `${root}/${path}` : root
}

/**
 * Short schemes for common sites, keyed by the spelling that appears in
 * Markdown. Every alias maps to the same resolver, so `yt:` and `youtube:` are
 * interchangeable.
 */
export const CUSTOM_SCHEMES: Record<string, SchemeResolver> = {
  gh: (ref, options) => resolveGithubRef(ref, options.githubProfileUrl),
  github: (ref, options) => resolveGithubRef(ref, options.githubProfileUrl),

  yt: (ref) => youtubeRef(ref),
  youtube: (ref) => youtubeRef(ref),

  tw: (ref) => `https://x.com/${handle(ref)}`,
  x: (ref) => `https://x.com/${handle(ref)}`,
  twitter: (ref) => `https://twitter.com/${handle(ref)}`,

  li: (ref) => linkedinRef(ref),
  linkedin: (ref) => linkedinRef(ref),

  rd: (ref) => `https://www.reddit.com/${firstPath(ref)}`,
  reddit: (ref) => `https://www.reddit.com/${firstPath(ref)}`,

  tc: (ref, options) =>
    originRef(ref, options.siteBaseUrl ?? 'https://tashif.codes'),
  tashif: (ref, options) =>
    originRef(ref, options.siteBaseUrl ?? 'https://tashif.codes'),
  blog: (ref, options) =>
    originRef(ref, options.blogBaseUrl ?? 'https://blog.tashif.codes'),

  wp: (ref) => wikipediaRef(ref),
  wiki: (ref) => wikipediaRef(ref),
  wikipedia: (ref) => wikipediaRef(ref),

  ig: (ref) => `https://www.instagram.com/${handle(ref)}`,
  instagram: (ref) => `https://www.instagram.com/${handle(ref)}`,
  medium: (ref) => originRef(ref, 'https://medium.com'),
  so: (ref) => originRef(ref, 'https://stackoverflow.com'),
  stackoverflow: (ref) => originRef(ref, 'https://stackoverflow.com'),
  npm: (ref) => `https://www.npmjs.com/package/${firstPath(ref)}`,
  discord: (ref) => originRef(ref, 'https://discord.com'),
}

export const CUSTOM_SCHEME_NAMES = Object.keys(CUSTOM_SCHEMES)

/** Repository URL to the raw-content host, so images resolve to bytes. */
function rawBase(githubBaseUrl: string): string {
  if (
    githubBaseUrl.includes('github.com') &&
    !githubBaseUrl.includes('raw.githubusercontent.com')
  ) {
    // `HEAD` rather than a branch name: the same helper serves repositories
    // whose default branch is not `main`.
    return `${githubBaseUrl.replace('github.com', 'raw.githubusercontent.com')}/HEAD`
  }
  return githubBaseUrl
}

function withAssetBase(url: string, assetBaseUrl?: string): string {
  if (!assetBaseUrl) return url
  return `${assetBaseUrl.replace(/\/+$/, '')}${url}`
}

export function convertRelativeUrl(url: string, options: UrlOptions): string {
  if (!url) return url
  if (url.startsWith('#')) return url
  if (url.startsWith('//')) return url

  const { githubBaseUrl, project, rootRelative = 'site', assetBaseUrl } = options

  // Root-relative handling comes first: it is the one case that applies even
  // without a repository URL, and the `repo` reading must not leak into posts.
  if (url.startsWith('/')) {
    if (rootRelative === 'repo' && githubBaseUrl) {
      return rawBase(githubBaseUrl) + url
    }
    return withAssetBase(url, assetBaseUrl)
  }

  // `file://` links are emitted by the docs generator and point into the repo.
  if (url.startsWith('file://')) {
    if (!githubBaseUrl) return url
    return `${githubBaseUrl}/blob/HEAD/${url.slice('file://'.length)}`
  }

  // `yt:`, `tw:`, `wp:`, … are shorthand for common-site URLs, expanded before
  // the generic scheme check which would otherwise pass them through unchanged.
  const scheme = SCHEME_REF.exec(url)
  if (scheme) {
    const resolver = CUSTOM_SCHEMES[scheme[1].toLowerCase()]
    if (resolver) return resolver(scheme[2], options)
  }

  // Fuzzy-linked bare site URLs (`github.com/user/repo`, `tashif.codes/x`)
  // arrive as `http://`; the known sites are all https-only, so upgrade them.
  // Explicit `https://` links fall through unchanged.
  if (KNOWN_SITE_HTTP.test(url)) {
    return url.replace(/^http:\/\//, 'https://')
  }

  if (HAS_SCHEME.test(url)) return url
  if (!githubBaseUrl) return url

  // Docs images are copied into the site rather than fetched from GitHub.
  if (project && (url.startsWith('images/') || url.startsWith('./images/'))) {
    return `/docs-assets/${project}/${url.replace(/^\.\//, '')}`
  }

  const base = rawBase(githubBaseUrl)
  if (url.startsWith('./')) return `${base}/${url.slice(2)}`
  if (url.startsWith('../')) return `${base}/${url.replace(/^\.\.\//, '')}`
  return `${base}/${url}`
}

export function convertSrcset(srcset: string, options: UrlOptions): string {
  return srcset
    .split(',')
    .map((entry) => {
      const trimmed = entry.trim()
      if (!trimmed) return trimmed

      const parts = trimmed.split(/\s+/)
      const src = parts.shift() || ''
      const descriptor = parts.join(' ')
      const converted = convertRelativeUrl(src, options)
      return descriptor ? `${converted} ${descriptor}` : converted
    })
    .join(', ')
}

/** Rewrite one attribute on a raw HTML tag, preserving its quoting style. */
function updateTagAttribute(
  tag: string,
  attribute: string,
  transform: (value: string) => string,
): string {
  const pattern = new RegExp(
    `\\b${attribute}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`,
    'i',
  )

  return tag.replace(
    pattern,
    (_match, _raw, doubleQuoted, singleQuoted, bare) => {
      const value = doubleQuoted ?? singleQuoted ?? bare ?? ''
      const converted = transform(value)
      if (doubleQuoted !== undefined) return `${attribute}="${converted}"`
      if (singleQuoted !== undefined) return `${attribute}='${converted}'`
      return `${attribute}=${converted}`
    },
  )
}

/**
 * Rewrite raw-HTML media that markdown-it passed through untouched, and turn
 * `<cite>` file lists from the docs generator into reference cards.
 *
 * Runs on the rendered string because these tags never become Markdown tokens —
 * they arrive as `html_block` content.
 */
export function postProcessHtml(
  html: string,
  options: UrlOptions,
  theme: MarkdownTheme = {},
): string {
  const { githubBaseUrl } = options
  const convert = (url: string) => convertRelativeUrl(url, options)

  let output = html

  output = output.replace(/<img\b[^>]*>/gi, (tag) => {
    let updated = updateTagAttribute(tag, 'src', convert)
    updated = updateTagAttribute(updated, 'srcset', (value) =>
      convertSrcset(value, options),
    )
    return updateTagAttribute(updated, 'data-src', convert)
  })

  output = output.replace(
    /<source\b[^>]*\bsrcset=(["'])([^"']+)\1[^>]*>/gi,
    (tag) => updateTagAttribute(tag, 'srcset', (value) => convertSrcset(value, options)),
  )

  output = output.replace(/<video\b[^>]*>/gi, (tag) => {
    const updated = updateTagAttribute(tag, 'src', convert)
    return updateTagAttribute(updated, 'poster', convert)
  })

  output = output.replace(/<audio\b[^>]*>/gi, (tag) =>
    updateTagAttribute(tag, 'src', convert),
  )

  output = output.replace(/<a\b[^>]*>/gi, (tag) =>
    updateTagAttribute(tag, 'href', convert),
  )

  if (!githubBaseUrl) return output

  output = output.replace(/<cite>([\s\S]*?)<\/cite>/g, (_match, inner: string) => {
    const links: string[] = []
    for (const link of inner.matchAll(/\[([^\]]+)\]\(file:\/\/([^)]+)\)/g)) {
      const [, label, filePath] = link
      links.push(
        `<a href="${githubBaseUrl}/blob/HEAD/${filePath}" target="_blank" rel="noopener noreferrer" class="${cx('md-cite-link', theme.citeLink)}">${FILE_ICON}<span class="md-cite-label">${label}</span></a>`,
      )
    }
    if (!links.length) return `<cite>${inner}</cite>`

    return `<div class="${cx('md-cite', theme.citeCard)}"><div class="${cx('md-cite-heading', theme.citeHeading)}">${FOLDER_ICON} Referenced Files</div><div class="${cx('md-cite-body', theme.citeBody)}">${links.join('')}</div></div>`
  })

  output = output.replace(
    /href="file:\/\/([^"]+)"/g,
    (_match, filePath: string) =>
      `href="${githubBaseUrl}/blob/HEAD/${filePath}" target="_blank" rel="noopener noreferrer"`,
  )

  return output
}

/**
 * Convert `[label](file://path)` before parsing.
 *
 * markdown-it does not treat `file:` as a linkifiable scheme, so these are left
 * as literal text unless they are rewritten up front. `<cite>` blocks are held
 * back for `postProcessHtml`, which renders them as cards instead of links.
 */
export function preProcessFileLinks(
  content: string,
  githubBaseUrl?: string,
): string {
  if (!githubBaseUrl || !content) return content

  return content.replace(
    /(<cite>[\s\S]*?<\/cite>)|(\[([^\]]+)\]\(file:\/\/([^)]+)\))/g,
    (match, citeBlock, _link, label, filePath) => {
      if (citeBlock) return citeBlock
      return `[${label}](${githubBaseUrl}/blob/HEAD/${filePath})`
    },
  )
}
