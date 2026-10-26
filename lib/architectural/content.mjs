/** Public content only. The scene never receives Supabase credentials or raw HTML. */
export function safeMedia(value) {
  if (typeof value !== 'string') return null
  try { const url = new URL(value); return url.protocol === 'https:' || (url.protocol === 'http:' && url.hostname === 'localhost') ? url.href : null } catch { return null }
}
export function plainText(value = '') {
  return String(value).replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/\s+/g, ' ').trim()
}
function textPages(text,limit=220){
  const words=text.split(/\s+/),pages=[];let page='';
  for(const word of words){if(page&&page.length+word.length+1>limit){pages.push(page);page=''}page+=(page?' ':'')+word}
  if(page)pages.push(page);return pages;
}
function sectionKey(title){return /overview|introduction|summary/i.test(title)?'overview':title.toLowerCase().replace(/[^a-z0-9]+/g,'')}
export function caseStudySlides(study){
  const cover=safeMedia(study.thumbnail_url);const groups=[];let current=null,pendingHeading='';
  const begin=title=>{const clean=plainText(title||'Project overview'),key=sectionKey(clean);if(current?.key===key)return current;current={key,title:clean,blocks:[]};groups.push(current);return current};
  const text=html=>{for(const paragraph of String(html||'').split(/<\/p\s*>|<\/li\s*>|<br\s*\/?>/i)){const body=plainText(paragraph);if(body){if(!current)begin('Project overview');current.blocks.push({type:'text',body,heading:pendingHeading});pendingHeading=''}}};
  const image=url=>{const src=safeMedia(url);if(src&&src!==cover){if(!current)begin('Project overview');if(!current.blocks.some(block=>block.type==='image'&&block.image===src))current.blocks.push({type:'image',image:src})}};
  if(plainText(study.excerpt||'')||safeMedia(study.thumbnail_url)){begin('Project overview');text(study.excerpt)}
  let sections=study.sections;if(typeof sections==='string'){try{sections=JSON.parse(sections)}catch{sections=[]}}
  for(const section of Array.isArray(sections)?sections:[]){
    const label=plainText(section.title||section.label||section.toc||'');if(label)begin(label);
    const source=String(section.body||''),tokens=/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1\s*>|<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;let cursor=0;
    for(const match of source.matchAll(tokens)){text(source.slice(cursor,match.index));if(match[3])image(match[3]);else if(Number(match[1])<=2)begin(match[2]);else pendingHeading=plainText(match[2]);cursor=match.index+match[0].length}
    text(source.slice(cursor));image(section.image);for(const src of section.gallery_images||[])image(src);
  }
  const presentation=groups.filter(group=>group.blocks.length).flatMap((group,index)=>{
    const number=String(index+1).padStart(2,'0'),base={sectionNumber:number,sectionTitle:group.title,kicker:'',missing:false};
    const intro={...base,type:'intro',heading:group.title,body:'',image:null};
    const content=group.blocks.flatMap(block=>block.type==='image'?[{...base,type:'image',heading:'',body:'',image:block.image}]:textPages(block.body,block.heading?170:220).map((body,page)=>({...base,type:'text',heading:page===0&&sectionKey(block.heading||'')!==group.key?block.heading||'':'',body,image:null})));
    return [intro,...content];
  });
  return cover?[{type:'image',sectionNumber:'',sectionTitle:'Cover',kicker:'',missing:false,heading:'',body:'',image:cover,isCover:true},...presentation]:presentation;
}
export function mapGalleryData(profile, studies, works) {
  const photos = [...new Set([...(profile?.gallery_images || []), profile?.hero_image_1, profile?.hero_image_2, profile?.hero_image_3].map(safeMedia).filter(value => value !== null))]
  return {
    profile: { name: plainText(profile?.full_name || 'Faith Awokunle'), bio: plainText(profile?.bio || ''), email: profile?.contact_email || null, contact_email: profile?.contact_email || null, whatsapp_url: safeMedia(profile?.whatsapp_url), x_url: safeMedia(profile?.x_url), linkedin_url: safeMedia(profile?.linkedin_url), photos, introVideo: safeMedia(profile?.train_video_1) },
    projects: studies.filter(study => study.published).map((study, index) => ({ id: study.id, name: plainText(study.title), type: 'DESIGN CASE STUDY', title: plainText(study.title), text: plainText(study.excerpt || ''), number: String(index + 1).padStart(2, '0'), color: ['#b8b8b8', '#d0d0d0', '#999999'][index % 3], slides: caseStudySlides(study), href: `/case-studies/${encodeURIComponent(study.slug || study.id)}`, video: safeMedia(study.video_url) })),
    films: works.filter(work => work.media_type === 'video' && safeMedia(work.media_url)).map(work => ({ id: work.id, title: plainText(work.title || 'Untitled video'), category: plainText(work.type || 'Video editing'), url: safeMedia(work.media_url), thumbnail: safeMedia(work.thumbnail_url) })),
  }
}
