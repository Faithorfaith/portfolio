import test from 'node:test'
import assert from 'node:assert/strict'
import { mapGalleryData, caseStudySlides, safeMedia, plainText } from '../lib/architectural/content.mjs'

test('only published cases and valid stored videos reach the gallery', () => {
 const data=mapGalleryData(null,[{id:'1',title:'Actual title',published:true},{id:'2',title:'Draft',published:false}], [{id:'v',title:'Film',media_type:'video',media_url:'https://example.com/film.mp4'},{id:'x',media_type:'image',media_url:'https://example.com/photo.jpg'},{id:'z',media_type:'video',media_url:'javascript:alert(1)'}])
 assert.deepEqual(data.projects.map(p=>p.name),['Actual title']);assert.equal(data.films.length,1)
})
test('rich documents keep real copy and images, omitting absent research', () => {
 const slides=caseStudySlides({title:'Air',sections:[{body:'<h2>The Problem</h2><p>Real challenge.</p><h2>Outcome</h2><p>Real result.</p><img src="https://example.com/final.png">'}]})
 assert.equal(slides.find(p=>p.type==='text'&&p.sectionTitle==='The Problem').body,'Real challenge.')
 assert.equal(slides.some(p=>p.sectionTitle==='Research and insights'),false)
 assert.equal(slides.find(p=>p.type==='image'&&p.sectionTitle==='Outcome').image,'https://example.com/final.png')
 assert.ok(!slides.some(p=>/replace this|sample narrative/i.test(p.body)))
})
test('long copy is paginated without dropping words', () => {
 const text=Array.from({length:700},(_,i)=>`word${i}`).join(' ')
 const slides=caseStudySlides({title:'Long',sections:[{label:'Overview',body:text}]})
 assert.equal(slides.filter(s=>s.type==='text').map(s=>s.body).join(' '),text)
 assert.ok(slides.filter(s=>s.type==='text').every(s=>s.body.length<=220))
})
test('invalid content and unsafe URLs do not become markup or media', () => {
 assert.equal(safeMedia('javascript:alert(1)'),null);assert.equal(safeMedia('data:text/html,bad'),null)
 assert.equal(plainText('<script>bad()</script><p>Actual &amp; safe</p>'),'Actual & safe')
 assert.equal(caseStudySlides({title:'Malformed',sections:'not-json'}).length,0)
})

test('unlabelled section continuations stay with the preceding process stage',()=>{
 const slides=caseStudySlides({title:'Case',sections:[{label:'App Experience',body:'The onboarding.'},{label:'',body:'The next step.'}]})
 assert.equal(slides.find(s=>s.body==='The next step.').sectionTitle,'App Experience')
})

import { exhibitionLayout, clampExhibitionPosition } from '../public/gallery/exhibition-layout.mjs'
test('nine fixed frames occupy three exhibition walls and leave the entrance clear',()=>{
 for(const side of [-1,1]){
  const frames=exhibitionLayout(-87,side,12)
  assert.equal(frames.length,9)
  for(const wall of ['far','left','right']) assert.equal(frames.filter(frame=>frame.wall===wall).length,3)
  assert.ok(frames.every(frame=>frame.x*side>17))
  assert.equal(new Set(frames.map(frame=>[frame.x,frame.z].join(','))).size,9)
  assert.ok(frames.every(frame=>Math.abs(frame.width/frame.height-9/16)<.002))
  for(const wall of ['far','left','right']){const row=frames.filter(frame=>frame.wall===wall);for(let i=1;i<row.length;i++)assert.ok(Math.hypot(row[i].x-row[i-1].x,row[i].z-row[i-1].z)>row[i].width+1)}
 }
})
test('only available records become wall displays',()=>{
 assert.equal(exhibitionLayout(-87,1,0).length,0)
 assert.equal(exhibitionLayout(-87,1,5).length,5)
})
test('free movement is clamped inside the exhibition walls on either corridor side',()=>{
 for(const side of [-1,1]){
 const position=clampExhibitionPosition({x:side*100,z:100},-87,side)
 assert.equal(position.x,side*31)
 assert.equal(position.z,-79.2)
 assert.equal(clampExhibitionPosition({x:0,z:-1000},-87,side).x,side*15)
 }
})

test('empty headings and whitespace do not create presentation sections',()=>{
 assert.deepEqual(caseStudySlides({title:'Empty',excerpt:'  ',sections:[{label:'Research',body:'<p> </p>'},{label:'Process',body:'<h2>Design process</h2>'}]}),[])
})

test('section introductions are unique and images never share a slide with paragraphs',()=>{
 const slides=caseStudySlides({title:'Case',excerpt:'An actual summary.',sections:[{label:'Project overview',body:'More context.',image:'https://example.com/a.png'},{label:'Research',body:'A real finding.'},{label:'',body:'Another finding.',image:'https://example.com/b.png'}]})
 assert.equal(slides.filter(s=>s.type==='intro'&&s.sectionTitle==='Project overview').length,1)
 assert.equal(slides.filter(s=>s.type==='intro'&&s.sectionTitle==='Research').length,1)
 assert.ok(slides.filter(s=>s.type==='image').every(s=>!s.body&&!s.heading))
 assert.ok(slides.filter(s=>s.type==='text').every(s=>!s.image&&!s.heading))
 assert.ok(slides.every(s=>['intro','text','image'].includes(s.type)))
})

test('the original project cover is always the first visual slide',()=>{
 const cover='https://example.com/cover.png'
 const slides=caseStudySlides({title:'Case',thumbnail_url:cover,excerpt:'Real introduction.',sections:[{label:'Overview',body:'Project detail.',image:cover}]})
 assert.equal(slides[0].type,'image');assert.equal(slides[0].image,cover);assert.equal(slides[0].isCover,true)
 assert.equal(slides[0].body,'');assert.equal(slides[0].heading,'')
 assert.equal(slides.filter(slide=>slide.image===cover).length,1)
 assert.equal(slides[1].type,'intro')
})
