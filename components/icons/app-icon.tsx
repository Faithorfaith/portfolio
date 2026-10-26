import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, ArrowUpRight, X, Play, Pause, Volume2, Maximize2, Minimize2, Search, LayoutGrid, UserRound, FileText, Images, Video, Archive, SquarePen, Download, Undo2, Redo2, Bold, Italic, Pencil, List, ListOrdered, Quote, Link, Unlink, Image, Code, Minus, BookOpen, DoorOpen, Move, Glasses, Zap, CircleAlert, Check, GripVertical, LockKeyhole, Trash2, Plus, ThumbsUp, VolumeX, MessageCircle, Folder, Loader2, type LucideProps } from 'lucide-react'
const icons = { Zap, CircleAlert, Check, GripVertical, LockKeyhole, Trash2, Plus, ThumbsUp, VolumeX, MessageCircle, Folder, Loader2, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, ArrowUpRight, X, Play, Pause, Volume2, Maximize2, Minimize2, Search, LayoutGrid, UserRound, FileText, Images, Video, Archive, SquarePen, Download, Undo2, Redo2, Bold, Italic, Pencil, List, ListOrdered, Quote, Link, Unlink, Image, Code, Minus, BookOpen, DoorOpen, Move, Glasses }
export type AppIconName = keyof typeof icons
export default function AppIcon({ name, ...props }: LucideProps & { name: AppIconName }) {
  const Icon = icons[name]
  return <Icon size={20} strokeWidth={1.75} aria-hidden="true" focusable="false" {...props} />
}
