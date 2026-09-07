export default function ArticleRowContent({ title, minutes, year }: { title: string; excerpt: string | null; cover: string | null; minutes: number; year: number }) {
  return <div className="article-index-row">
    <h3>{title}</h3>
    <span className="article-index-time">{minutes} min read</span>
    <span className="article-index-year">{year}</span>
  </div>
}
