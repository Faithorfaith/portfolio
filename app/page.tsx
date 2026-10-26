import { readFile } from 'node:fs/promises'
import path from 'node:path'
import ArchitecturalGallery from '@/components/architectural/gallery'
import { getArchitecturalData } from '@/lib/architectural/data'

export const revalidate = 300
export default async function PortfolioPage() {
  try {
    const data = await getArchitecturalData()
    const template = await readFile(path.join(process.cwd(), 'public/gallery/index.html'), 'utf8')
    const document = template.replace('<head>', '<head><base href="/gallery/">').replace('<script type="module"', `<script id="portfolio-data" type="application/json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script><script type="module"`)
    return <ArchitecturalGallery profile={data.profile} document={document} />
  } catch {
    return <div role="alert" style={{ padding: '15vh 8vw', background: '#171c1b', color: '#f3efe7', minHeight: '100vh' }}><h1>Faith Awokunle</h1><p>The gallery content could not be loaded. Please try again.</p><a href="/">Reload gallery</a></div>
  }
}
