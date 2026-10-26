
import * as THREE from './vendor/three.module.js';
import { monochromeMaterial } from './materials.mjs';
import { createMotionExhibition } from './motion-exhibition.mjs';
import { clampExhibitionPosition } from './exhibition-layout.mjs';
import { icon, setButton, canvasIcon } from './icons.mjs';
import { VRButton } from './vendor/VRButton.js';
// Public content is serialized by the server; no network handshake or credentials.
await Promise.all([document.fonts.load('400 34px Manrope'),document.fonts.load('600 24px Manrope'),document.fonts.load('400 36px "DM Sans"'),document.fonts.load('400 36px Inter'),document.fonts.load('500 64px Inter'),document.fonts.load('600 80px Inter')]);
const hostOrigin=new URL(document.baseURI).origin;
const data=JSON.parse(document.getElementById('portfolio-data').textContent);
const motionRoomIndex=data.projects.length;
const projects=[...data.projects,{name:'MOTION ROOM',type:'VIDEO EDITING & VISUAL STORYTELLING',title:'Stories in motion.',text:'',color:'#bbbbbb',number:String(data.projects.length+1).padStart(2,'0')}];
let suspended=false;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const setText=(id,text)=>document.getElementById(id).textContent=text;
const nav=document.querySelector('.roomnav'); nav.replaceChildren();
for(const [destination,label] of [['home','Home'],['projects','Projects'],['motion','Motion Room']]){const button=document.createElement('button');button.dataset.destination=destination;button.textContent=label;if(destination==='home'){button.classList.add('active');button.setAttribute('aria-current','page')}nav.append(button)}
const mount=document.getElementById('scene');const scene=new THREE.Scene();scene.background=new THREE.Color('#151515');scene.fog=new THREE.FogExp2('#151515',.006);const camera=new THREE.PerspectiveCamera(67,innerWidth/innerHeight,.1,250);camera.position.set(0,2.1,10);const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<=760?1.25:1.5));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.45;renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.xr.enabled=true;mount.append(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xeeeeee,0x555555,1.9));const sun=new THREE.DirectionalLight(0xffffff,2.8);sun.position.set(-9,13,2);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-28;sun.shadow.camera.right=28;sun.shadow.camera.top=30;sun.shadow.camera.bottom=-30;scene.add(sun);const spot=new THREE.PointLight('#ffffff',50,27);spot.position.set(0,8,-8);scene.add(spot);
const mat=(c,r=1,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});const stone=mat('#303030'),wall=mat('#242424'),floor=mat('#151515',.75),dark=mat('#292929'),trim=mat('#dedede');function block(x,y,z,w,h,d,m,cast=true){let o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.receiveShadow=true;o.castShadow=cast;scene.add(o);return o}block(0,-.2,-19,25,.4,82,floor);block(-12,4.8,-19,.5,9.6,82,wall);block(12,4.8,-19,.5,9.6,82,wall);block(0,9.6,-19,25,.4,82,stone);for(let z=6;z>-53;z-=9){let beam=block(0,9.15,z,24,.45,.65,stone);if(!projects.some((_,i)=>Math.abs(z-(-15-i*24))<4)){block(-11.5,4.5,z,.45,9,.55,stone);block(11.5,4.5,z,.45,9,.55,stone);}let light=new THREE.PointLight('#ffffff',22,15);light.position.set(0,8.5,z);scene.add(light)}
// Center sculpture
const pedestal=block(0,.65,2.2,3,1.3,3,stone);let sculpture=new THREE.Group();for(let i=0;i<3;i++){const tor=new THREE.Mesh(new THREE.TorusGeometry(1.3-i*.22,.08,12,100),trim);tor.rotation.set(.3+i*.42,i*.8,.25+i*.7);tor.position.y=2.5;tor.castShadow=true;sculpture.add(tor)}scene.add(sculpture);
// Text as high quality canvas textures
function canvasText(lines,opts={}){let c=document.createElement('canvas');c.width=1024;c.height=640;let x=c.getContext('2d');x.fillStyle=opts.bg||'#222222';x.fillRect(0,0,c.width,c.height);x.strokeStyle='#ffffff19';for(let i=0;i<12;i++){x.beginPath();x.moveTo(0,i*60);x.lineTo(1024,i*60);x.stroke()}x.fillStyle=opts.accent||'#cccccc';x.font='600 27px "Manrope", sans-serif';x.fillText('FAITH AWOKUNLE  /  SELECTED WORKS',65,75);x.font='500 100px "Neue Montreal", Arial, sans-serif';x.fillStyle='#fafafa';x.fillText(lines[0],65,300,890);x.font='35px "Manrope", sans-serif';x.fillStyle='#cccccc';x.fillText(lines[1],68,370,890);x.fillStyle=opts.accent||'#cccccc';x.fillRect(65,465,200,4);x.fillStyle='#eeeeee';x.font='24px "Manrope", sans-serif';x.fillText('SELECT TO EXPLORE',65,535);let tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex}
// Living lounge: gallery frames and a feature-video canvas that can be customized by visitor.
let art=[], doors=[], mediaMeshes=[];let frameContent=[];const studyBoards=[];
function frame(x,y,z,w,h,label,kind='photo',rotation=0){
 const border=block(x,y,z,w+.32,h+.32,.13,trim);border.rotation.y=rotation;
 const c=document.createElement('canvas');c.width=960;c.height=600;const g=c.getContext('2d');g.fillStyle='#333333';g.fillRect(0,0,960,600);
 const grad=g.createLinearGradient(0,0,960,600);grad.addColorStop(0,'#555555');grad.addColorStop(1,'#222222');g.fillStyle=grad;g.fillRect(14,14,932,572);
 g.fillStyle='#eeeeee';g.textAlign='center';g.font='600 55px "Manrope", sans-serif';g.fillText(label,480,287);g.font='24px "Manrope", sans-serif';g.fillText(kind==='video'?'INTRO FILM · CLICK TO PLAY':'PORTRAIT · LOADING STORED IMAGE',480,345);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
 const plane=new THREE.Mesh(new THREE.PlaneGeometry(w,h),monochromeMaterial(THREE,{map:tex,side:THREE.DoubleSide}));plane.position.set(x+Math.sin(rotation)*.095,y,z+Math.cos(rotation)*.095);plane.rotation.y=rotation;scene.add(plane);plane.userData.media=kind;plane.userData.arrivalFrame=true;mediaMeshes.push(plane);
 return plane;
}
function makeDoorPlaque(title,subtitle){
 const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=800;const ctx=canvas.getContext('2d');
 ctx.fillStyle='#101010';ctx.fillRect(0,0,1600,800);ctx.strokeStyle='#999999';ctx.lineWidth=18;ctx.strokeRect(25,25,1550,750);
 ctx.fillStyle='#f5f5f7';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='500 112px "Neue Montreal",Arial,sans-serif';
 const words=title.trim().split(/\s+/),lines=[];let line='';for(const word of words){const candidate=line?line+' '+word:word;if(ctx.measureText(candidate).width>1360&&line){lines.push(line);line=word}else line=candidate}if(line)lines.push(line);
 const fontSize=lines.length>2?82:112;ctx.font='500 '+fontSize+'px "Neue Montreal",Arial,sans-serif';lines.slice(0,3).forEach((text,index)=>ctx.fillText(text,800,340+(index-(Math.min(lines.length,3)-1)/2)*132,1380));
 ctx.fillStyle='#aaaaaa';ctx.font='600 38px Manrope,sans-serif';ctx.fillText(subtitle,800,650,1380);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=renderer.capabilities?.getMaxAnisotropy?.()||1;return texture;
}
function addBench(x,y,z,rot=0){
 const grp=new THREE.Group();
 const base=new THREE.Mesh(new THREE.BoxGeometry(2.9,.25,.9),stone);base.position.set(x,y,z);base.rotation.y=rot;base.castShadow=base.receiveShadow=true;grp.add(base);
 const leg1=new THREE.Mesh(new THREE.BoxGeometry(.14,.55,.14),dark);leg1.position.set(x-1.15*Math.cos(rot),y-.35,z+1.15*Math.sin(rot));leg1.castShadow=leg1.receiveShadow=true;grp.add(leg1);
 const leg2=leg1.clone();leg2.position.set(x+1.15*Math.cos(rot),y-.35,z-1.15*Math.sin(rot));grp.add(leg2);
 scene.add(grp);
}
// Long gallery side wings. Each door leads to a room behind the architectural walls.
const motionEntranceX=30;
const roomCenters=projects.map((_,i)=>-15-i*24);
const corridorEnd=Math.min(-103,roomCenters.at(-1)-16);
// Extend the earlier building corridor with floor and roof slabs and evenly spaced lights.
block(0,-.2,-81,25,.4,56,floor);block(-12,4.8,-81,.5,9.6,56,wall);block(12,4.8,-101.5,.5,9.6,15,wall);block(12,4.8,-64.5,.5,9.6,23,wall);block(0,9.6,-81,25,.4,56,stone);block(0,4.8,-109,25,9.6,.5,wall);
for(let z=-53;z>-109;z-=9){block(0,9.15,z,24,.45,.65,stone);let l=new THREE.PointLight('#ffffff',25,17);l.position.set(0,8.5,z);scene.add(l)}
const loungePhotos=[frame(-11.65,4.5,2,2.7,4.8,'PORTRAIT / 01','photo',Math.PI/2),frame(11.65,4.5,2,2.7,4.8,'PORTRAIT / 02','photo',-Math.PI/2)];
const introFrame=frame(-11.65,4.5,8,2.7,4.8,'INTRODUCING FAITH','video',Math.PI/2);
const loader=new THREE.TextureLoader(); loader.setCrossOrigin('anonymous');
function replaceMap(mesh,texture){const old=mesh.material.map;mesh.material.map=texture;mesh.material.needsUpdate=true;if(old&&old!==texture)old.dispose()}
function fitTexture(texture,aspect){const image=texture.image;if(!image)return;const ratio=image.width/image.height;if(ratio>aspect){texture.repeat.x=aspect/ratio;texture.offset.x=(1-texture.repeat.x)/2}else{texture.repeat.y=ratio/aspect;texture.offset.y=(1-texture.repeat.y)/2}}
loungePhotos.forEach((mesh,i)=>{const url=data.profile.photos[i];if(url)loader.load(url,t=>{t.colorSpace=THREE.SRGBColorSpace;fitTexture(t,9/16);replaceMap(mesh,t)},undefined,()=>notify('A lounge photo could not load.'))});

// A side kitchen at the extreme end of the gallery leads to the Motion Room.
const kitchenStart=scene.children.length;
block(21,-.15,2,18,.3,19,mat('#141414',.7));block(21,9,2,18,.3,19,mat('#161616'));block(21,4.5,-7.2,18,9,.25,wall);block(21,4.5,11.2,18,9,.25,wall);
block(29,4.5,-5.15,.3,9,4.1,wall);block(29,4.5,7.1,.3,9,8.2,wall);
const cabinet=mat('#101010',.5),countertop=mat('#373737',.35,.12),metal=mat('#b0b0b0',.25,.85);
block(21,1,-6,11,2,2,cabinet);block(21,2.1,-6,11,.15,2.1,countertop);block(21,4.3,-6.65,11,2.2,.75,cabinet);
for(let x=16;x<26;x+=2){block(x,1.1,-4.96,.025,1.65,.035,metal,false);block(x,4.3,-6.24,.025,1.7,.035,metal,false)}
block(22.5,2.19,-6,2,.035,1.15,mat('#060606',.2,.5));block(22.5,2.6,-6.8,.08,.85,.08,metal,false);block(22.5,3,-6.4,.08,.08,.8,metal,false);
block(20,1,6,7,2,2.4,cabinet);block(20,2.1,6,7.5,.14,2.7,countertop);
for(const x of [18,21.5]){block(x,1.2,8.2,.9,.18,.9,mat('#272727'));block(x,.6,8.2,.12,1.1,.12,metal)}
const kitchenLight=new THREE.PointLight('#ffffff',35,22);kitchenLight.position.set(21,7,1);scene.add(kitchenLight);
const stripMaterial=new THREE.MeshStandardMaterial({color:'#777777',emissive:'#bbbbbb',emissiveIntensity:.6});block(21,3,-6.3,10.5,.035,.035,stripMaterial,false);
scene.children.slice(kitchenStart).forEach(object=>{object.position.z+=roomCenters[motionRoomIndex];object.userData.kitchen=true});
for(const side of [-1,1])block(side*11.7,.12,-42,.05,.05,130,stripMaterial,false);
let motionExhibition=null;
let introVideo=null;
function motionStop(){motionExhibition?.pause();introVideo?.pause()}
function exitMotion(){motionExhibition?.leave();camera.fov=67;camera.updateProjectionMatrix();document.body.classList.remove('motion-mode')}
projects.forEach((p,i)=>{
 let z=roomCenters[i],side=i%2===0?-1:1;
 const doorX=side*(i===motionRoomIndex?28.5:11.55),jamb=mat('#505050',.55,.45),doorMat=mat('#141414',.65,.15),hardware=mat('#bcbcbc',.24,.88);
 // Deep reveals, a solid leaf and tactile metal hardware distinguish every doorway.
 block(doorX,3.95,z-2.45,.48,7.9,.3,jamb);block(doorX,3.95,z+2.45,.48,7.9,.3,jamb);block(doorX,7.9,z,.48,.3,5.2,jamb);
 block(doorX+side*.28,3.9,z,.85,7.8,5.2,dark,false);
 const threshold=block(doorX-side*.1,.06,z,1.15,.12,5.1,hardware,false);
 const door=block(doorX-side*.34,3.9,z,.2,7.4,4.5,doorMat);door.userData.project=i;door.userData.door=true;doors.push(door);
 // A narrow shadow reveal and inset panel give the leaf depth without ornamental clutter.
 block(door.position.x-side*.115,3.85,z,.025,6.85,3.98,mat('#1c1c1c',.78),false);
 for(const height of [2.65,3.65])block(door.position.x-side*.28,height,z+1.65,.28,.1,.18,hardware,false);
 const handle=block(door.position.x-side*.43,3.15,z+1.65,.12,1.1,.12,hardware,false);handle.userData.project=i;handle.userData.door=true;handle.userData.doorHandle=true;doors.push(handle);
 for(const height of [1.2,3.9,6.6])block(door.position.x, height,z-2.18,.26,.36,.12,hardware,false);
 // Premium embedded plaque mounted on the door, inspired by the reference signage.
 const plateBack=new THREE.Mesh(new THREE.BoxGeometry(.06,1.9,4.05),new THREE.MeshStandardMaterial({color:'#999999',metalness:.92,roughness:.2}));
 plateBack.position.set(door.position.x-side*.23,5.1,z);plateBack.rotation.y=0;scene.add(plateBack);
 const plateFront=new THREE.Mesh(new THREE.PlaneGeometry(3.95,1.8),monochromeMaterial(THREE,{map:makeDoorPlaque(p.name,i===motionRoomIndex?'SCREENING ROOM':'CASE STUDY'),transparent:true,side:THREE.DoubleSide}));
 plateFront.position.set(door.position.x-side*.275,5.1,z);plateFront.rotation.y=side===-1?Math.PI/2:-Math.PI/2;plateFront.userData.doorSign=true;plateFront.userData.project=i;plateFront.userData.door=true;scene.add(plateFront);doors.push(plateFront);
 const plaqueLight=new THREE.PointLight('#ffffff',18,7);plaqueLight.position.set(side*10.7,8.4,z);scene.add(plaqueLight);
 const roomStart=scene.children.length;
 // Motion exhibits have their own unobstructed rectangular architecture.
 if(i===motionRoomIndex){motionExhibition=createMotionExhibition({THREE,scene,centerZ:z,side,entranceX:motionEntranceX,films:data.films,block,mat,loader,stopOtherMedia:()=>introVideo?.pause(),notify});studyBoards.push(null);scene.children.slice(roomStart).forEach(object=>object.userData.room=i);return}
 const cx=side*23.5;
 const exitLeaf=block(side*13.2,3.9,z,.2,7.4,4.5,doorMat);exitLeaf.userData.exitDoor=true;exitLeaf.userData.project=i;doors.push(exitLeaf);
 block(side*13.1,3.95,z-2.45,.4,7.9,.3,jamb);block(side*13.1,3.95,z+2.45,.4,7.9,.3,jamb);block(side*13.1,7.9,z,.4,.3,5.2,jamb);
 const exitSign=new THREE.Mesh(new THREE.PlaneGeometry(3.95,1.8),monochromeMaterial(THREE,{map:makeDoorPlaque('EXIT','MAIN GALLERY')}));exitSign.position.set(side*13.34,5.1,z);exitSign.rotation.y=side*Math.PI/2;exitSign.userData.exitDoor=true;exitSign.userData.project=i;scene.add(exitSign);doors.push(exitSign);
 const exitHandle=block(side*13.5,3.15,z-1.65,.12,1.1,.12,hardware,false);exitHandle.userData.exitDoor=true;exitHandle.userData.project=i;doors.push(exitHandle);

 // floor / ceiling
 block(cx,-.2,z,21,.45,19,mat('#181818'));block(cx,12.3,z,21,.55,19,stone);
 // rear and side walls
 block(cx,6,z-9.5,21,12.5,.42,mat('#282828'));block(cx,6,z+9.5,21,12.5,.42,mat('#282828'));block(cx+side*10.15,6,z,.48,12.5,19,mat('#242424'));
 // front partial return walls to define the entry better
 block(cx-side*1.8,6,z-8.8,3.5,12.5,.42,mat('#282828'));block(cx-side*1.8,6,z+8.8,3.5,12.5,.42,mat('#282828'));
 // threshold in room
 block(side*14.8,0.02,z,5.8,.12,5.8,mat('#242424',.65));
 // feature display wall and board surround
 const boardWallX=side*31.05;
 if(i!==motionRoomIndex)block(boardWallX,6.15,z,.4,9.3,15.6,mat('#282828',.82));
 if(i!==motionRoomIndex)block(boardWallX-side*.55,6.15,z,.18,8.3,14.4,mat('#181818',.9));
 // room furniture & objects
 addBench(cx-side*3.8,1.05,z-5.8,side===-1?Math.PI/2:-Math.PI/2);addBench(cx-side*3.8,1.05,z+5.8,side===-1?Math.PI/2:-Math.PI/2);
 // warm lighting and accent wash
 const rl=new THREE.PointLight(0xffffff,72,23);rl.position.set(cx-side*2.8,10,z);scene.add(rl);
 const accent1=new THREE.PointLight(p.color,32,12);accent1.position.set(boardWallX-side*1.7,8.5,z-4.8);scene.add(accent1);
 const accent2=new THREE.PointLight(p.color,26,12);accent2.position.set(boardWallX-side*1.7,8.5,z+4.8);scene.add(accent2);
 // The classroom-style case study board is mounted permanently on the room wall.
 const boardCanvas=document.createElement('canvas');boardCanvas.width=1280;boardCanvas.height=800;
 const boardTexture=new THREE.CanvasTexture(boardCanvas);boardTexture.colorSpace=THREE.SRGBColorSpace;
 const board=new THREE.Mesh(new THREE.PlaneGeometry(12.8,8),new THREE.MeshBasicMaterial({map:boardTexture,side:THREE.DoubleSide,toneMapped:false,transparent:false,opacity:1}));
 board.position.set(boardWallX-side*.72,6.22,z);board.rotation.y=side===-1?Math.PI/2:-Math.PI/2;scene.add(board);
 const monitorHousing=mat('#171717',.42,.5),monitorDiffuser=new THREE.MeshStandardMaterial({color:'#eeeeee',emissive:'#ffffff',emissiveIntensity:.7});
 block(board.position.x-side*.18,10.48,z,.34,.16,6.4,monitorHousing,false);block(board.position.x-side*.21,10.385,z,.24,.035,6.1,monitorDiffuser,false);
 for(const offset of [-2.6,2.6])block(board.position.x,10.37,z+offset,.24,.25,.08,monitorHousing,false);
 const monitorLight=new THREE.SpotLight('#ffffff',32,13,.72,.8,1);monitorLight.position.set(board.position.x-side*.55,10.4,z);monitorLight.target.position.set(board.position.x,6,z);scene.add(monitorLight,monitorLight.target);
 studyBoards.push({canvas:boardCanvas,texture:boardTexture});scene.children.slice(roomStart).forEach(object=>object.userData.room=i);
});
let currentRoom=0, activeProject=-1;const LOUNGE=10;let targetPos=new THREE.Vector3(0,2.1,LOUNGE);let yaw=0,pitch=0,targetYaw=0,targetPitch=0,entered=false;let keys={};
const rooms=[{x:0,z:10,yaw:0},...roomCenters.map(z=>({x:0,z,yaw:0}))];
const detail=document.getElementById('detail');
function updateUi(n){if(currentRoom!==n)renderer.shadowMap.needsUpdate=true;currentRoom=n;const destination=n===0?'home':n===motionRoomIndex+1?'motion':'projects';document.querySelectorAll('[data-destination]').forEach(button=>{const active=button.dataset.destination===destination;button.classList.toggle('active',active);if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current')});const counter=document.getElementById('counter');if(counter)counter.textContent=''}
function go(n){++boardRevision;exitMotion();activeProject=-1;document.body.classList.remove('studying');studyControls.classList.remove('visible');entered=n!==0;document.getElementById('intro').classList.toggle('hide',n!==0);detail.classList.remove('open');targetPos.set(rooms[n].x,2.1,rooms[n].z);targetYaw=rooms[n].yaw;targetPitch=0;updateUi(n)}
const studyPages=projects.map(p=>p.slides||[]);
let studyPage=0;
const studyControls=document.getElementById('studyControls');
function wrapBoardText(ctx,text,x,y,maxWidth,lineHeight,maxLines=3){const words=text.split(' ');let line='',count=0;for(const word of words){const candidate=line?line+' '+word:word;if(ctx.measureText(candidate).width>maxWidth&&line){ctx.fillText(line,x,y+count*lineHeight);count++;line=word;if(count>=maxLines)return y+count*lineHeight}else line=candidate}if(line&&count<maxLines){ctx.fillText(line,x,y+count*lineHeight);count++}return y+count*lineHeight}
let boardRevision=0;
function renderStudyBoard(){
 if(activeProject<0||activeProject===motionRoomIndex)return;
 const project=projects[activeProject],page=studyPages[activeProject][studyPage],obj=studyBoards[activeProject],ctx=obj.canvas.getContext('2d'),revision=++boardRevision,copy=document.getElementById('mobileBoardCopy');
 if(!page){setText('slideStatus','0 / 0');document.getElementById('prevStudy').disabled=true;document.getElementById('nextStudy').disabled=true;copy.replaceChildren();return}
 const type=page.type||(page.image?'image':'text'),width=1280,height=800;
 function paint(image=null){
  if(revision!==boardRevision)return;ctx.fillStyle='#111214';ctx.fillRect(0,0,width,height);ctx.textAlign='left';ctx.textBaseline='alphabetic';
  if(type==='intro'){ctx.fillStyle='#A1A1AA';ctx.font='500 24px Inter';ctx.fillText((page.sectionNumber||String(studyPage+1).padStart(2,'0'))+' / '+project.name,116,164,1048);ctx.fillStyle='#F5F5F7';ctx.font='600 80px Inter';wrapBoardText(ctx,page.heading,112,338,1056,94,3)}
  else if(type==='text'){let y=190;if(page.heading){ctx.fillStyle='#F5F5F7';ctx.font='500 56px Inter';y=wrapBoardText(ctx,page.heading,116,156,1010,70,2)+54}ctx.fillStyle='#D4D4D8';ctx.font='400 36px "DM Sans"';presentationBodyText(ctx,page.body,116,y,930,54)}
  else if(image){const scale=Math.min(1184/image.width,688/image.height),w=image.width*scale,h=image.height*scale;ctx.filter='none';ctx.drawImage(image,(width-w)/2,44+(688-h)/2,w,h);ctx.filter='none'}
  else{ctx.fillStyle='#A1A1AA';ctx.font='400 28px Inter';ctx.fillText('Loading visual…',116,400)}
  ctx.fillStyle='#A1A1AA';ctx.font='400 22px Inter';ctx.textAlign='right';ctx.fillText(String(studyPage+1).padStart(2,'0')+' / '+String(studyPages[activeProject].length).padStart(2,'0'),1170,760);ctx.textAlign='left';obj.texture.needsUpdate=true;
 }
 paint();if(type==='image'&&page.image){const image=new Image();image.crossOrigin='anonymous';image.onload=()=>paint(image);image.onerror=()=>{if(revision===boardRevision){notify('This visual could not load. You can continue to the next slide.');ctx.fillStyle='#111214';ctx.fillRect(0,0,width,height);ctx.fillStyle='#D4D4D8';ctx.font='400 30px Inter';ctx.fillText('This visual could not load.',116,400);obj.texture.needsUpdate=true}};image.src=page.image}
 setText('slideStatus',String(studyPage+1).padStart(2,'0')+' / '+String(studyPages[activeProject].length).padStart(2,'0'));document.getElementById('prevStudy').disabled=studyPage===0;document.getElementById('nextStudy').disabled=studyPage===studyPages[activeProject].length-1;
 setText('boardTranscript',(type==='intro'?page.heading+'. ':page.heading?page.heading+'. ':'')+(type==='image'?'Project visual.':page.body));copy.replaceChildren();copy.dataset.slideType=type;
 if(type==='intro'){const label=document.createElement('small');label.textContent=page.sectionNumber||'';const title=document.createElement('h2');title.textContent=page.heading;copy.append(label,title)}
 else if(type==='text'){if(page.heading){const heading=document.createElement('h3');heading.textContent=page.heading;copy.append(heading)}const paragraph=document.createElement('p');paragraph.textContent=page.body;copy.append(paragraph)}
 else{const image=document.createElement('img');image.src=page.image;image.alt=project.name+' — presentation visual';image.draggable=false;copy.append(image)}
 if(!reducedMotion)copy.animate?.([{opacity:.35},{opacity:1}],{duration:160});
}
function fitStudyCamera(index){
 if(innerWidth<=760||camera.aspect<1)return;const side=index%2===0?-1:1;camera.fov=52;const halfAngle=52*Math.PI/360,distance=Math.max(6.4/(Math.tan(halfAngle)*camera.aspect),4/Math.tan(halfAngle))*1.14;targetPos.set(side*(30.33-distance),6.22,roomCenters[index]);camera.position.copy(targetPos);camera.updateProjectionMatrix();
}
function changeStudyPage(dir){if(activeProject===motionRoomIndex)return;if(activeProject<0)return;studyPage=Math.max(0,Math.min(studyPages[activeProject].length-1,studyPage+dir));renderStudyBoard()}
function enterProject(i){++boardRevision;renderer.shadowMap.needsUpdate=true;if(activeProject===motionRoomIndex)exitMotion();activeProject=i;studyPage=0;entered=true;const side=i%2===0?-1:1;targetPos.set(side*17.8,5.5,roomCenters[i]);targetYaw=side===-1?Math.PI/2:-Math.PI/2;targetPitch=0;camera.position.copy(targetPos);yaw=targetYaw;pitch=0;camera.rotation.order='YXZ';camera.rotation.set(0,yaw,0);updateUi(i+1);document.getElementById('intro').classList.add('hide');detail.classList.remove('open');document.body.classList.add('studying');renderer.domElement.focus();if(i===motionRoomIndex){studyControls.classList.remove('visible');document.body.classList.add('motion-mode');motionExhibition.enter();camera.fov=55;camera.updateProjectionMatrix();targetPos.set(side*(motionEntranceX+4),3.3,roomCenters[motionRoomIndex]);camera.position.copy(targetPos)}else{studyControls.classList.add('visible');mobileBoardVisible=true;mobileStudy.style.display='';mobileToggle.textContent='VIEW ROOM';fitStudyCamera(i);renderStudyBoard()}}
function leaveProject(){if(activeProject<0)return;++boardRevision;renderer.shadowMap.needsUpdate=true;const i=activeProject;if(i===motionRoomIndex)exitMotion();activeProject=-1;document.body.classList.remove('studying');studyControls.classList.remove('visible');mobileStudy.style.display='';detail.classList.remove('open');targetPos.set(i===motionRoomIndex?20:0,2.1,roomCenters[i]);targetYaw=i===motionRoomIndex?-Math.PI/2:0;targetPitch=0}
document.getElementById('motionLeave').onclick=leaveProject;
window.addEventListener('message',event=>{if(event.origin===hostOrigin&&event.source===parent&&['portfolio:pause','portfolio:suspend','portfolio:resume'].includes(event.data?.type)){suspended=event.data.type==='portfolio:suspend'?true:event.data.type==='portfolio:resume'?false:suspended;motionStop();keys={}}});

const mobileStudy=document.getElementById('mobileStudy'),mobileToggle=document.getElementById('mobileRoomToggle');
let mobileBoardVisible=true;
mobileToggle.addEventListener('click',()=>{mobileBoardVisible=!mobileBoardVisible;mobileStudy.style.display=mobileBoardVisible?'flex':'none';mobileToggle.textContent=mobileBoardVisible?'VIEW ROOM':'VIEW BOARD';});
for(const [id,dir] of [['mobileAhead',-1],['mobileBack',1]]){
 const el=document.getElementById(id);
 el.addEventListener('click',()=>{if(activeProject===motionRoomIndex){walkMotion(dir*2);return}if(targetPos.x>10){walkKitchen(dir*2);return}if(activeProject>=0)return;targetPos.z=THREE.MathUtils.clamp(targetPos.z+dir*5,corridorEnd,10);if(targetPos.z>=9.8)go(0);else{entered=true;document.getElementById('intro').classList.add('hide');const nearest=rooms.reduce((best,r,i)=>Math.abs(r.z-targetPos.z)<Math.abs(rooms[best].z-targetPos.z)?i:best,0);updateUi(nearest);}});
}
document.getElementById('prevStudy').onclick=()=>changeStudyPage(-1);document.getElementById('nextStudy').onclick=()=>changeStudyPage(1);document.getElementById('leaveStudy').onclick=leaveProject;
document.querySelectorAll('[data-destination]').forEach(button=>button.onclick=()=>{if(button.dataset.destination==='home')go(0);else if(button.dataset.destination==='motion')goKitchen();else{go(data.projects.length?1:0);if(data.projects.length){targetPos.z=roomCenters[0]+4;targetPos.y=3.3;targetYaw=Math.PI/2;targetPitch=0}}});document.getElementById('start').onclick=()=>document.querySelector('[data-destination="projects"]').click();
document.getElementById('close').onclick=()=>detail.classList.remove('open');
const creatorButton=document.getElementById('aboutButton');creatorButton.setAttribute('aria-expanded','false');creatorButton.setAttribute('aria-label','Show contact links');creatorButton.onclick=()=>parent.postMessage({type:'portfolio:contact'},hostOrigin);
window.addEventListener('message',event=>{if(event.origin!==hostOrigin||event.source!==parent)return;if(event.data?.type==='portfolio:contact-state')creatorButton.setAttribute('aria-expanded',String(event.data.open));if(event.data?.type==='portfolio:contact-close')creatorButton.setAttribute('aria-expanded','false')});
renderer.domElement.addEventListener('pointerdown',()=>parent.postMessage({type:'portfolio:contact-close'},hostOrigin));
window.addEventListener('keydown',e=>{if(e.key==='Escape'){if(activeProject>=0)leaveProject();else detail.classList.remove('open');return}if(motionExhibition?.isBlocking()||e.target.closest?.('button,input,a,video'))return;keys[e.key.toLowerCase()]=true;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))e.preventDefault();if(e.key==='Escape'){if(activeProject>=0)leaveProject();else detail.classList.remove('open')}if(activeProject>=0&&activeProject!==motionRoomIndex&&e.key==='ArrowLeft'){changeStudyPage(-1);return}if(activeProject>=0&&activeProject!==motionRoomIndex&&e.key==='ArrowRight'){changeStudyPage(1);return}if(e.key.toLowerCase()==='e'&&activeProject<0){let near=roomCenters.findIndex(z=>Math.abs(z-targetPos.z)<6);if(near>=0&&(near!==motionRoomIndex||targetPos.x>24))enterProject(near)}});
window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);window.addEventListener('blur',()=>{keys={};dragging=false;motionStop()});document.addEventListener('visibilitychange',()=>{if(document.hidden)motionStop()});
let dragging=false,lastX=0,lastY=0,moved=0;
renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;moved=0});window.addEventListener('pointerup',()=>dragging=false);
window.addEventListener('pointermove',e=>{if(dragging){const dx=e.clientX-lastX,dy=e.clientY-lastY;moved+=Math.abs(dx)+Math.abs(dy);targetYaw-=dx*.004;targetPitch=THREE.MathUtils.clamp(targetPitch-dy*.0035,-1.28,1.28);lastX=e.clientX;lastY=e.clientY}});
let twoTouchY=null;
renderer.domElement.addEventListener('touchstart',e=>{if(e.touches.length===2)twoTouchY=(e.touches[0].clientY+e.touches[1].clientY)/2;},{passive:true});
renderer.domElement.addEventListener('touchmove',e=>{if(e.touches.length===2&&twoTouchY!==null&&activeProject<0){const y=(e.touches[0].clientY+e.touches[1].clientY)/2;targetPos.z=THREE.MathUtils.clamp(targetPos.z+(y-twoTouchY)*.1,corridorEnd,10);twoTouchY=y;if(targetPos.z>=9.8)go(0);else{entered=true;document.getElementById('intro').classList.add('hide');}}},{passive:true});
renderer.domElement.addEventListener('touchend',()=>twoTouchY=null);
const ray=new THREE.Raycaster(),ptr=new THREE.Vector2();
function toggleIntro(){if(!data.profile.introVideo){notify('No introduction film supplied.');return}if(!introVideo){introVideo=document.createElement('video');introVideo.crossOrigin='anonymous';introVideo.playsInline=true;introVideo.src=data.profile.introVideo;introVideo.preload='none';introVideo.addEventListener('loadedmetadata',()=>{const ratio=introVideo.videoWidth/introVideo.videoHeight,aspect=9/16;introFrame.scale.set(ratio<aspect?ratio/aspect:1,ratio>aspect?aspect/ratio:1,1)});introVideo.addEventListener('error',()=>notify('The introduction film could not load.'));const texture=new THREE.VideoTexture(introVideo);texture.colorSpace=THREE.SRGBColorSpace;replaceMap(introFrame,texture)}if(introVideo.paused){motionStop();introVideo.play().catch(()=>notify('The introduction film could not start.'))}else introVideo.pause()}
renderer.domElement.addEventListener('click',e=>{if(moved>8||motionExhibition?.isBlocking())return;ptr.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);ray.setFromCamera(ptr,camera);const objects=activeProject===motionRoomIndex?motionExhibition.exhibits.flatMap(item=>[item.display,item.playSurface]):activeProject>=0?doors.filter(object=>object.userData.exitDoor&&object.userData.project===activeProject):[...doors.filter(object=>!object.userData.exitDoor),...mediaMeshes];const hits=ray.intersectObjects(objects);if(!hits.length)return;const hit=hits[0].object;if(hit.userData.motionIndex!==undefined&&activeProject===motionRoomIndex){motionExhibition.open(hit.userData.motionIndex);return}if(hit.userData.exitDoor){leaveProject();return}if(hit.userData.door)enterProject(hit.userData.project);if(hit.userData.media==='video')toggleIntro()});
function walkMotion(distance){if(motionExhibition?.isBlocking())return;targetPos.x+=Math.sin(targetYaw)*distance;targetPos.z+=Math.cos(targetYaw)*distance;const position=clampExhibitionPosition(targetPos,roomCenters[motionRoomIndex],motionRoomIndex%2===0?-1:1,motionEntranceX);targetPos.x=position.x;targetPos.z=position.z}
function walkInView(distance){
 if(activeProject>=0&&activeProject!==motionRoomIndex)return;
 if(motionExhibition?.isBlocking())return;
 targetPos.x-=Math.sin(yaw)*distance;targetPos.z-=Math.cos(yaw)*distance;
 if(activeProject===motionRoomIndex){const position=clampExhibitionPosition(targetPos,roomCenters[motionRoomIndex],motionRoomIndex%2===0?-1:1,motionEntranceX);targetPos.x=position.x;targetPos.z=position.z;return}
 targetPos.x=THREE.MathUtils.clamp(targetPos.x,-9,Math.abs(targetPos.z-roomCenters[motionRoomIndex])<9?27:9);
 targetPos.z=THREE.MathUtils.clamp(targetPos.z,targetPos.x>10?roomCenters[motionRoomIndex]-6:corridorEnd,targetPos.x>10?roomCenters[motionRoomIndex]+10:10);
 if(targetPos.z>=9.8&&targetPos.x<9&&distance<0){go(0);return}
 entered=true;document.getElementById('intro').classList.add('hide');const near=rooms.reduce((best,room,index)=>Math.abs(room.z-targetPos.z)<Math.abs(rooms[best].z-targetPos.z)?index:best,0);updateUi(near);
}
renderer.domElement.addEventListener('wheel',event=>{if(renderer.xr.isPresenting||detail.classList.contains('open'))return;event.preventDefault();const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);walkInView(delta*.012)},{passive:false});
let clock=new THREE.Clock();renderer.setAnimationLoop(()=>{if(suspended||document.hidden)return;const dt=Math.min(clock.getDelta(),.05);if(!renderer.xr.isPresenting){const step=dt*5;if((activeProject<0||activeProject===motionRoomIndex)&&keys['arrowleft'])targetYaw+=dt*1.15;if((activeProject<0||activeProject===motionRoomIndex)&&keys['arrowright'])targetYaw-=dt*1.15;if(keys['q'])targetPitch=Math.min(1.28,targetPitch+dt);if(keys['r'])targetPitch=Math.max(-1.28,targetPitch-dt);const forward=(keys['w']||keys['arrowup']?1:0)-(keys['s']||keys['arrowdown']?1:0),side=(keys['d']?1:0)-(keys['a']?1:0);if((activeProject<0||activeProject===motionRoomIndex&&!motionExhibition.isBlocking())&&(forward||side)){entered=true;document.getElementById('intro').classList.add('hide');targetPos.x+=(-Math.sin(targetYaw)*forward+Math.cos(targetYaw)*side)*step;targetPos.z+=(-Math.cos(targetYaw)*forward-Math.sin(targetYaw)*side)*step;if(activeProject<0){targetPos.x=THREE.MathUtils.clamp(targetPos.x,-9,Math.abs(targetPos.z-roomCenters[motionRoomIndex])<9?27:9);targetPos.z=THREE.MathUtils.clamp(targetPos.z,targetPos.x>10?roomCenters[motionRoomIndex]-6:corridorEnd,targetPos.x>10?roomCenters[motionRoomIndex]+10:10)}else{const position=clampExhibitionPosition(targetPos,roomCenters[motionRoomIndex],motionRoomIndex%2===0?-1:1,motionEntranceX);targetPos.x=position.x;targetPos.z=position.z}if(activeProject<0&&targetPos.z>=9.8&&forward<0)go(0)}camera.position.lerp(targetPos,Math.min(dt*2.8,1));yaw+=((targetYaw-yaw)*Math.min(dt*4,1));pitch+=((targetPitch-pitch)*Math.min(dt*4,1));camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0)}if(!reducedMotion)sculpture.rotation.y+=dt*.15;sun.intensity=activeProject===motionRoomIndex?.45:2.8;scene.children.find(object=>object.isHemisphereLight).intensity=activeProject===motionRoomIndex?.65:1.9;for(const object of scene.children){if(object.isPointLight||object.isSpotLight){let on=object.userData.room!==undefined?object.userData.room===activeProject:activeProject<0&&Math.abs(object.position.z-camera.position.z)<24;let intensity=object.userData.nominalIntensity;if(object.userData.motionFilmIndex!==undefined&&activeProject===motionRoomIndex){const focus=motionExhibition.activeIndex();on=focus<0||focus===object.userData.motionFilmIndex;if(focus<0)intensity*=.18}object.intensity=THREE.MathUtils.damp(object.intensity,on?intensity:0,5,dt);object.visible=on||object.intensity>.08;if(object.userData.diffuser)object.userData.diffuser.emissiveIntensity=.08+2*object.intensity/Math.max(1,object.userData.nominalIntensity)}else if(object.userData.room!==undefined)object.visible=object.userData.room===activeProject}renderer.render(scene,camera)});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);if(activeProject>=0&&activeProject!==motionRoomIndex)fitStudyCamera(activeProject)});if('xr'in navigator&&location.protocol==='https:'){navigator.xr.isSessionSupported('immersive-vr').then(ok=>{if(ok){let vr=VRButton.createButton(renderer);vr.style.display='none';document.body.append(vr);let b=document.getElementById('enterVR');b.style.display='block';b.onclick=()=>vr.click()}}).catch(()=>{})}document.getElementById('loading')?.remove();parent.postMessage({type:'portfolio:loaded'},hostOrigin);

renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Architectural gallery. WASD to move, drag to look, E to enter a nearby room. Escape to leave.');
window.addEventListener('pagehide',()=>{renderer.setAnimationLoop(null);motionStop();motionExhibition?.dispose();if(introVideo){introVideo.removeAttribute('src');introVideo.load()}const geometries=new Set(),materials=new Set(),textures=new Set();scene.traverse(object=>{if(object.geometry)geometries.add(object.geometry);for(const material of Array.isArray(object.material)?object.material:object.material?[object.material]:[]){materials.add(material);for(const value of Object.values(material))if(value?.isTexture)textures.add(value)}});textures.forEach(texture=>texture.dispose());materials.forEach(material=>material.dispose());geometries.forEach(geometry=>geometry.dispose());renderer.dispose()});
function notify(message){const status=document.getElementById('galleryStatus');status.textContent=message;clearTimeout(notify.timer);notify.timer=setTimeout(()=>status.textContent='',7000)}

for(const [id,name,label] of [['enterVR','Glasses','Enter VR'],['aboutButton','UserRound','The creator'],['start','ArrowRight','Explore my work'],['mobileAhead','ArrowUp',''],['mobileBack','ArrowDown',''],['prevStudy','ArrowLeft',''],['nextStudy','ArrowRight',''],['leaveStudy','DoorOpen',''],['motionLeave','DoorOpen','Leave room'],['close','X','']]){const button=document.getElementById(id);setButton(button,name,label)}

document.querySelectorAll('[data-icon]').forEach(element=>element.innerHTML=icon(element.dataset.icon));

scene.children.forEach(object=>{if(object.userData.room!==undefined)object.visible=false});

function goKitchen(){go(0);entered=true;document.getElementById('intro').classList.add('hide');targetPos.set(20,2.1,roomCenters[motionRoomIndex]);targetYaw=-Math.PI/2;targetPitch=0;updateUi(motionRoomIndex+1)}

function walkKitchen(distance){targetPos.x=THREE.MathUtils.clamp(targetPos.x+Math.sin(targetYaw)*distance,9,27);targetPos.z=THREE.MathUtils.clamp(targetPos.z+Math.cos(targetYaw)*distance,roomCenters[motionRoomIndex]-6,roomCenters[motionRoomIndex]+10)}

window.addEventListener('pointerdown',event=>{if(!creatorButton.contains(event.target))parent.postMessage({type:'portfolio:contact-close'},hostOrigin)});window.addEventListener('keydown',event=>{if(event.key==='Escape')parent.postMessage({type:'portfolio:contact-close'},hostOrigin)});

scene.children.forEach(object=>{if(object.isPointLight||object.isSpotLight){object.userData.nominalIntensity=object.intensity;object.intensity=0;object.visible=false}});

const floorGrain=document.createElement('canvas');floorGrain.width=128;floorGrain.height=128;const grain=floorGrain.getContext('2d');grain.fillStyle='#777';grain.fillRect(0,0,128,128);for(let index=0;index<900;index++){const value=110+Math.floor(Math.random()*28);grain.fillStyle='rgb('+value+','+value+','+value+')';grain.fillRect(Math.random()*128,Math.random()*128,1,1)}grain.fillStyle='#666';grain.fillRect(0,0,128,1);grain.fillRect(0,0,1,128);const grainTexture=new THREE.CanvasTexture(floorGrain);grainTexture.wrapS=grainTexture.wrapT=THREE.RepeatWrapping;grainTexture.repeat.set(6,26);floor.bumpMap=grainTexture;floor.bumpScale=.025;floor.roughness=.82;floor.metalness=.08;floor.needsUpdate=true;
for(const side of [-1,1]){block(side*11.6,8.9,-42,.15,.08,130,mat('#333333',.45,.2),false);block(side*11.7,.3,-42,.06,.45,130,mat('#202020',.72),false)}

for(const [id,label] of [['prevStudy','Previous slide'],['nextStudy','Next slide'],['leaveStudy','Leave room']]){const button=document.getElementById(id);button.setAttribute('aria-label',label);button.title=label}



function presentationBodyText(ctx,text,x,y,width,lineHeight){
 const supportsTracking='letterSpacing' in ctx;if(supportsTracking)ctx.letterSpacing='1.44px';
 const words=text.split(/\s+/);let line='',row=0;
 for(const word of words){const next=line?line+' '+word:word;if(ctx.measureText(next).width>width&&line){ctx.fillText(line,x,y+row++*lineHeight);line=word}else line=next}
 if(line)ctx.fillText(line,x,y+row*lineHeight);if(supportsTracking)ctx.letterSpacing='0px';
}
