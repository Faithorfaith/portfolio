import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import * as RealThree from '../public/gallery/vendor/three.module.js'
const require=createRequire(import.meta.url)
const {JSDOM}=createRequire(require.resolve('isomorphic-dompurify'))('jsdom')

test('scene startup preserves case-study rooms and mounts a walkable motion room',async()=>{
 const data={profile:{name:'Test portfolio',photos:[],introVideo:null},projects:Array.from({length:3},(_,i)=>({name:'Published case '+i,title:'Published case '+i,type:'DESIGN CASE STUDY',number:String(i+1),color:'#b9c8a6',slides:[{heading:'Overview',kicker:'Project overview',body:'Actual supplied content',missing:false,image:null},{heading:'Challenge',kicker:'The challenge',body:'Supplied challenge',missing:false,image:null}]})),films:Array.from({length:12},(_,i)=>({title:'Stored film '+i,category:'Animation',url:`https://example.com/${i}.mp4`,thumbnail:null}))}
 const html=(await readFile(new URL('../public/gallery/index.html',import.meta.url),'utf8')).replace('<script type="module"',`<script id="portfolio-data" type="application/json">${JSON.stringify(data)}</script><script type="module"`)
 const dom=new JSDOM(html,{url:'http://127.0.0.1:3000/gallery/',pretendToBeVisual:true})
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,Image:dom.window.Image,location:dom.window.location,parent:dom.window,innerWidth:1440,innerHeight:1000,devicePixelRatio:1,matchMedia:()=>({matches:false})})
 Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true})
 document.fonts={load:async()=>[]}
 dom.window.Image.prototype.decode=async()=>{}
 dom.window.HTMLCanvasElement.prototype.getContext=()=>({fillRect(){},fillText(){},strokeRect(){},beginPath(){},arc(){},fill(){},drawImage(){},moveTo(){},lineTo(){},stroke(){},closePath(){},quadraticCurveTo(){},clearRect(){},createLinearGradient(){return{addColorStop(){}}},measureText(text){return{width:text.length*15}}})
 dom.window.HTMLMediaElement.prototype.play=async()=>{};dom.window.HTMLMediaElement.prototype.pause=()=>{};dom.window.HTMLMediaElement.prototype.load=()=>{}
 for(const dialog of document.querySelectorAll('dialog')){dialog.showModal=()=>dialog.setAttribute('open','');dialog.close=()=>dialog.removeAttribute('open')}
 class TestRenderer{constructor(){this.domElement=document.createElement('canvas');this.shadowMap={};this.xr={isPresenting:false};this.loop=null}setSize(){}setPixelRatio(){}setAnimationLoop(loop){this.loop=loop}render(scene,camera){scene.updateMatrixWorld();camera.updateMatrixWorld()}dispose(){}}
 class TestTextureLoader{setCrossOrigin(){}load(){}}
 globalThis.__sceneTestThree={...RealThree,WebGLRenderer:TestRenderer,TextureLoader:TestTextureLoader,Clock:class{getDelta(){return .05}}}
 let source=await readFile(new URL('../public/gallery/scene.js',import.meta.url),'utf8')
 source=source.replace("import * as THREE from './vendor/three.module.js';",'const THREE=globalThis.__sceneTestThree;')
 source=source.replace(/from '(\.\/[^']+)'/g,(_,relative)=>`from '${new URL(relative,new URL('../public/gallery/scene.js',import.meta.url)).href}'`)
 source+='\nexport {scene,camera,targetPos,activeProject,enterProject,leaveProject,go,renderer,studyPage,motionExhibition};'
 const runtime=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))
 assert.equal(document.querySelectorAll('[data-destination]').length,3)
 assert.deepEqual([...document.querySelectorAll('[data-destination]')].map(button=>button.textContent),['Home','Projects','Motion Room'])
 for(const sign of runtime.scene.children.filter(object=>object.userData.doorSign)){const side=sign.userData.project%2===0?-1:1;assert.ok(sign.position.x*side<(sign.userData.project===3?28:11),'plaque faces the corridor in front of the recess');assert.equal(sign.geometry.parameters.width,3.95)}
 for(let i=0;i<3;i++){
  runtime.enterProject(i);runtime.renderer.loop()
  assert.equal(runtime.studyPage,0)
  assert.equal(document.getElementById('studyControls').classList.contains('visible'),true)
  const expected=i%2===0?-1:1;const direction=new RealThree.Vector3();runtime.camera.getWorldDirection(direction)
  assert.ok(direction.x*expected>.99,'entry faces the presentation board')
  document.getElementById('nextStudy').click();assert.equal(runtime.studyPage,1)
  document.getElementById('prevStudy').click();assert.equal(runtime.studyPage,0)
  runtime.leaveProject();assert.equal(runtime.activeProject,-1)
 }
 runtime.enterProject(3);runtime.renderer.loop();assert.equal(document.getElementById('motionRoomControls').hidden,false)
 const direction=new RealThree.Vector3();runtime.camera.getWorldDirection(direction);assert.ok(direction.x>.99,'entry faces the far wall')
 assert.equal(runtime.scene.children.filter(object=>object.isGroup&&object.children.some(child=>child.userData.motionIndex!==undefined)).length,9)
 const before=runtime.targetPos.x
 document.querySelector('#scene canvas').dispatchEvent(new dom.window.WheelEvent('wheel',{deltaY:120,bubbles:true,cancelable:true}));runtime.renderer.loop()
 assert.ok(runtime.targetPos.x>before,'wheel walks forward rather than selecting another film')
 const afterWheel=runtime.targetPos.x
 window.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'w'}));runtime.renderer.loop();window.dispatchEvent(new dom.window.KeyboardEvent('keyup',{key:'w'}));assert.ok(runtime.targetPos.x>afterWheel,'W walks through Motion Room')
 runtime.leaveProject();document.querySelector('[data-destination=projects]').click();assert.equal(runtime.activeProject,-1);assert.equal(runtime.targetPos.z,-11);document.querySelector('[data-destination=home]').click();assert.equal(document.getElementById('intro').classList.contains('hide'),false)

 runtime.enterProject(0);runtime.renderer.loop();
 const exit=runtime.scene.children.find(object=>object.userData.exitDoor&&object.userData.project===0&&object.geometry.type==='PlaneGeometry');
 runtime.camera.lookAt(exit.position);runtime.camera.updateMatrixWorld();runtime.scene.updateMatrixWorld();
 const exitPoint=exit.position.clone().project(runtime.camera);
 document.querySelector('#scene canvas').dispatchEvent(new dom.window.MouseEvent('click',{clientX:(exitPoint.x+1)*720,clientY:(1-exitPoint.y)*500,bubbles:true}));
 assert.equal(runtime.activeProject,-1,'room-facing exit door returns the visitor to the gallery');
 runtime.enterProject(0);const board=runtime.scene.children.find(object=>object.userData.room===0&&object.material?.map?.image?.width===1280);
 assert.equal(board.material.toneMapped,false);assert.equal(board.material.transparent,false);assert.equal(board.material.opacity,1);
 assert.equal(document.querySelectorAll('button svg:not(.lucide)').length,0)
  for(const frame of runtime.scene.children.filter(object=>object.userData.arrivalFrame))assert.ok(Math.abs(frame.geometry.parameters.width/frame.geometry.parameters.height-9/16)<.001)
 document.querySelector('[data-destination=motion]').click();assert.equal(runtime.activeProject,-1);assert.equal(runtime.targetPos.z,-87);assert.equal(runtime.targetPos.x,20)
 assert.equal(runtime.scene.children.filter(object=>object.userData.doorHandle).length,4)
 const beforeContact=runtime.targetPos.clone();const messages=[];parent.postMessage=message=>messages.push(message);document.getElementById('aboutButton').click();assert.equal(messages.at(-1).type,'portfolio:contact');assert.ok(runtime.targetPos.equals(beforeContact),'contact dropdown does not move the camera')
 assert.equal(runtime.renderer.shadowMap.autoUpdate,false)
 runtime.enterProject(0);runtime.renderer.loop();assert.ok(runtime.scene.children.filter(object=>object.userData.room!==undefined&&object.visible&&!object.isLight).every(object=>object.userData.room===0),'inactive rooms are not rendered')
 assert.equal(document.getElementById('motionBrowse'),null)
 assert.equal(document.getElementById('studyImageDialog'),null)
 assert.equal(runtime.scene.children.filter(object=>object.userData.exitDoor).length,9)
 assert.equal(document.querySelector('.guide').textContent.includes('WASD'),false)
 document.querySelector('[data-destination=projects]').click();for(let frame=0;frame<35;frame++)runtime.renderer.loop();const facingBefore=runtime.targetPos.x;document.querySelector('#scene canvas').dispatchEvent(new dom.window.WheelEvent('wheel',{deltaY:120,bubbles:true,cancelable:true}));assert.ok(runtime.targetPos.x<facingBefore,'corridor scrolling follows a left-facing view, rather than the fixed corridor axis')
 assert.equal(document.querySelector('.intro h1').textContent,"Hi, I'm Faith Awokunle.")
 runtime.enterProject(3);await runtime.motionExhibition.open(0);for(let tick=0;tick<35;tick++)runtime.renderer.loop();assert.equal(runtime.motionExhibition.activeIndex(),0);const lights=runtime.scene.children.filter(object=>object.userData.motionFilmIndex!==undefined);assert.ok(lights.find(object=>object.userData.motionFilmIndex===0).intensity>30);assert.ok(lights.filter(object=>object.userData.motionFilmIndex!==0).every(object=>object.intensity<.1),'only the selected wall display keeps its attached monitor light on')
 dom.window.close()
})
