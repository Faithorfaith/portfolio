import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import * as THREE from '../public/gallery/vendor/three.module.js'
import { createMotionExhibition } from '../public/gallery/motion-exhibition.mjs'
const require=createRequire(import.meta.url)
const { JSDOM }=createRequire(require.resolve('isomorphic-dompurify'))('jsdom')

test('exhibition mounts nine real displays and uses one player without eager video streams',async()=>{
 const html=await readFile(new URL('../public/gallery/index.html',import.meta.url),'utf8')
 const dom=new JSDOM(html,{url:'http://127.0.0.1:3000/gallery/'})
 globalThis.document=dom.window.document;globalThis.Image=dom.window.Image
 globalThis.matchMedia=()=>({matches:false})
 dom.window.HTMLCanvasElement.prototype.getContext=()=>({fillRect(){},fillText(){},beginPath(){},arc(){},fill(){},drawImage(){}})
 dom.window.Image.prototype.decode=async()=>{}
 assert.equal(document.querySelector('dialog'),null)
 const video=document.getElementById('exhibitVideo');let paused=true,plays=0,pauses=0,stops=0
 Object.defineProperty(video,'paused',{get:()=>paused});Object.defineProperty(video,'duration',{get:()=>120})
 video.load=()=>{};video.pause=()=>{paused=true;pauses++;video.dispatchEvent(new dom.window.Event('pause'))}
 video.play=async()=>{paused=false;plays++;video.dispatchEvent(new dom.window.Event('play'));video.dispatchEvent(new dom.window.Event('playing'))}
 let fullscreen=0;video.requestFullscreen=async()=>{fullscreen++}
 const scene=new THREE.Scene(),thumbnailRequests=[]
 const material=()=>new THREE.MeshStandardMaterial()
 const block=(x,y,z,w,h,d,m)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);scene.add(mesh);return mesh}
 const films=Array.from({length:12},(_,index)=>({id:String(index),title:'Real film '+index,category:'Animation',url:`https://example.com/${index}.mp4`,thumbnail:`https://example.com/${index}.jpg`}))
 const exhibition=createMotionExhibition({THREE,scene,centerZ:-87,side:1,films,block,mat:material,loader:{load:url=>thumbnailRequests.push(url)},stopOtherMedia:()=>stops++,notify:()=>{}})
 assert.equal(exhibition.exhibits.length,9)
 assert.equal(document.getElementById('motionBrowse'),null)
 assert.equal(video.getAttribute('src'),null)
 exhibition.enter();assert.equal(thumbnailRequests.length,9);assert.equal(video.getAttribute('src'),null)
 for(const item of exhibition.exhibits){
  assert.equal(item.display.userData.motionIndex,item.position.index)
  const normal=new THREE.Vector3(0,0,1).applyQuaternion(item.group.quaternion)
  const inward=new THREE.Vector3(23.5,3.85,-87).sub(item.group.position)
  assert.ok(normal.dot(inward)>0,'screen faces the room interior')
 }
 await exhibition.open(0);assert.equal(plays,1);assert.equal(paused,false);assert.equal(document.getElementById('filmPlaybackControls').hidden,false)
 assert.equal(video.muted,false);assert.equal(video.defaultMuted,false);assert.equal(video.volume,1);assert.ok(exhibition.exhibits[0].display.material.map.isVideoTexture);assert.equal(exhibition.exhibits[0].display.material.userData.mediaGrayscale,0);assert.equal(exhibition.activeIndex(),0)
 await exhibition.open(1);assert.equal(plays,2);assert.ok(pauses>=2);assert.equal(stops,2);assert.equal(exhibition.activeIndex(),1);assert.equal(exhibition.exhibits[0].display.material.map,exhibition.exhibits[0].poster);assert.equal(exhibition.exhibits[0].display.material.userData.mediaGrayscale,0);assert.ok(exhibition.exhibits[1].display.material.map.isVideoTexture);assert.equal(exhibition.exhibits[1].light.userData.motionFilmIndex,1)
 assert.equal(document.querySelectorAll('video').length,1)
 assert.equal(video.src,'https://example.com/1.mp4')
 document.getElementById('filmPlay').click();assert.equal(paused,true)
 document.getElementById('filmSeek').value='50';document.getElementById('filmSeek').dispatchEvent(new dom.window.Event('input'));assert.equal(video.currentTime,60)
 document.getElementById('filmVolume').value='.35';document.getElementById('filmVolume').dispatchEvent(new dom.window.Event('input'));assert.equal(video.volume,.35)
 document.getElementById('filmFullscreen').click();assert.equal(fullscreen,1)
 video.dispatchEvent(new dom.window.Event('error'));assert.equal(document.getElementById('filmStatus').hidden,false);assert.equal(document.getElementById('filmRetry').hidden,false)
 exhibition.leave();assert.equal(paused,true);assert.equal(video.getAttribute('src'),null);assert.equal(document.getElementById('filmPlaybackControls').hidden,true)
 exhibition.enter();await exhibition.open(0);assert.equal(document.getElementById('filmPlaybackControls').hidden,false);exhibition.dispose();dom.window.close()
})
