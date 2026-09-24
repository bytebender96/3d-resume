import { marked } from 'marked'

export type Work = {
  slug: string
  title: string
  year: string
  role: string
  tags: string[]
  color: string
  excerpt: string
  html: string
}

// Every `src/content/works/*.md` file becomes a portfolio card.
const files = import.meta.glob('./content/works/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

function parse(path: string, raw: string): Work {
  const slug = path.split('/').pop()!.replace(/\.md$/, '')
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  const meta: Record<string, string> = {}
  const body = m ? m[2] : raw
  if (m) for (const line of m[1].split('\n')) {
    const i = line.indexOf(':')
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return {
    slug,
    title: meta.title ?? slug,
    year: meta.year ?? '',
    role: meta.role ?? '',
    tags: (meta.tags ?? '').split(',').map((t) => t.trim()).filter(Boolean),
    color: meta.color ?? '#ffffff',
    excerpt: body.trim().split('\n')[0],
    html: marked.parse(body) as string,
  }
}

export const WORKS: Work[] = Object.entries(files)
  .map(([p, raw]) => parse(p, raw))
  .sort((a, b) => Number(b.year) - Number(a.year) || a.title.localeCompare(b.title))
