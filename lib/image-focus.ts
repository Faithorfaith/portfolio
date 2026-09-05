export function imageFocus(src: string) {
  const match = src.match(/#focus=(\d+),(\d+)$/)
  return {
    src: match ? src.slice(0, match.index) : src,
    x: match ? Math.min(100, Number(match[1])) : 50,
    y: match ? Math.min(100, Number(match[2])) : 50,
    position: match ? `${Math.min(100, Number(match[1]))}% ${Math.min(100, Number(match[2]))}%` : '50% 50%',
  }
}
