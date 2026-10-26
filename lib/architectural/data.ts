import 'server-only'
import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { mapGalleryData } from './content.mjs'

export interface GallerySlide { isCover?: boolean; type: 'intro' | 'text' | 'image'; sectionNumber: string; sectionTitle: string; kicker: string; heading: string; body: string; image: string | null; missing: boolean }
export interface GalleryData {
  profile: { name: string; bio: string; email: string | null; contact_email: string | null; whatsapp_url: string | null; x_url: string | null; linkedin_url: string | null; photos: string[]; introVideo: string | null }
  projects: { id: string; name: string; type: string; title: string; text: string; number: string; color: string; slides: GallerySlide[]; href: string; video: string | null }[]
  films: { id: string; title: string; category: string; url: string | null; thumbnail: string | null }[]
}
// Same anonymous read contracts, fetched in one parallel batch instead of per-case waterfalls.
export const getArchitecturalData = unstable_cache(async (): Promise<GalleryData> => {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if(!url||!key) return mapGalleryData(null, [], [])
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
  const [profile,studies,works]=await Promise.all([
    client.from('profiles').select('full_name,bio,contact_email,whatsapp_url,x_url,linkedin_url,gallery_images,hero_image_1,hero_image_2,hero_image_3,train_video_1').limit(1).maybeSingle(),
    client.from('case_studies').select('id,title,slug,excerpt,thumbnail_url,video_url,sections,published,order_index,created_at').eq('published',true).order('order_index',{ascending:true}).order('created_at',{ascending:false}),
    client.from('portfolio_works').select('id,title,type,media_type,media_url,thumbnail_url,created_at').eq('media_type','video').order('created_at',{ascending:false}),
  ])
  if(profile.error||studies.error||works.error) throw new Error('Unable to load public portfolio content')
  return mapGalleryData(profile.data,studies.data||[],works.data||[])
}, ['architectural-gallery-v5-cover-first'], {revalidate:300})
