import { monochromeMaterial, setMediaGrayscale } from './materials.mjs'
import { icon, setButton, canvasIcon } from './icons.mjs'
import { exhibitionLayout } from './exhibition-layout.mjs'

/** Physical exhibits never move. One shared player owns the only loaded film. */
export function createMotionExhibition({ THREE, scene, centerZ, side, films, block, mat, loader, stopOtherMedia, notify, entranceX = 13 }) {
  const exhibits=[]
  const brass=mat('#888888',.42,.72), charcoal=mat('#242424',.8), concrete=mat('#242424',.94)
  const layout=exhibitionLayout(centerZ,side,films.length,entranceX)
  // Flush concrete lining, shallow metallic picture lights, no stage or central furniture.
  block(side*(entranceX+10.5),.01,centerZ,20,.12,18.6,mat('#181818',.95))
  block(side*(entranceX+20.55),5.8,centerZ,.18,11.5,18.8,concrete)
  for(const direction of [-1,1]) block(side*(entranceX+10.5),5.8,centerZ+direction*9.32,20,11.5,.16,concrete)
  const ceiling=block(side*(entranceX+10.5),11.4,centerZ,20,.12,18.6,mat('#141414'))
  const video=document.getElementById('exhibitVideo'), controls=document.getElementById('filmPlaybackControls');
  const status=document.getElementById('filmStatus'),progress=document.getElementById('filmSeek'),volume=document.getElementById('filmVolume'),play=document.getElementById('filmPlay'),retry=document.getElementById('filmRetry');
  let active=-1,loaded=false,request=0,disposed=false,videoTexture=null;
  video.crossOrigin='anonymous';video.muted=false;video.defaultMuted=false;video.volume=1;volume.value='1';retry.hidden=true;status.hidden=true;
  function formatTime(seconds){if(!Number.isFinite(seconds))return '0:00';return Math.floor(seconds/60)+':'+String(Math.floor(seconds%60)).padStart(2,'0')}
  function sync(){setButton(play,video.paused?'Play':'Pause','');play.setAttribute('aria-label',video.paused?'Play video':'Pause video');progress.disabled=!Number.isFinite(video.duration);progress.value=Number.isFinite(video.duration)?String(video.currentTime/video.duration*100):'0';document.getElementById('filmTime').textContent=formatTime(video.currentTime)+' / '+formatTime(video.duration);const item=exhibits[active];if(item)item.playSurface.visible=video.paused}
  function fitDisplay(item,ratio){const aspect=item.position.width/item.position.height;item.display.scale.set(ratio<aspect?ratio/aspect:1,ratio>aspect?aspect/ratio:1,1)}
  function restore(){const item=exhibits[active];if(item){setMediaGrayscale(item.display.material,false);item.display.material.map=item.poster;item.display.material.needsUpdate=true;item.display.scale.set(...item.posterScale);item.playSurface.visible=true}videoTexture?.dispose();videoTexture=null}
  function pause(){video.pause();sync()}
  function close(){++request;video.pause();restore();video.removeAttribute('src');video.load();active=-1;controls.hidden=true;status.hidden=true;retry.hidden=true;sync()}
  async function open(index){
    const entry=films[index],item=exhibits[index];if(!entry||!item)return;
    if(index===active){toggle();return}
    const ticket=++request;stopOtherMedia();video.pause();restore();active=index;
    video.muted=false;video.defaultMuted=false;video.volume=Number(volume.value);video.setAttribute('aria-label',entry.title);video.src=entry.url;video.load();
    videoTexture=new THREE.VideoTexture(video);videoTexture.colorSpace=THREE.SRGBColorSpace;setMediaGrayscale(item.display.material,false);item.display.material.map=videoTexture;item.display.material.needsUpdate=true;item.playSurface.visible=false;controls.hidden=false;status.textContent='Loading video…';status.hidden=false;retry.hidden=true;
    try{await video.play();if(ticket!==request)return;status.hidden=true;sync()}catch{if(ticket!==request)return;status.hidden=false;status.textContent=video.error?'This video could not load. Check your connection or retry.':'Press Play to start this video with sound.';retry.hidden=!video.error;sync()}
  }
  function toggle(){if(active<0)return;if(video.paused){stopOtherMedia();video.muted=false;video.defaultMuted=false;video.play().catch(()=>{status.hidden=false;status.textContent='Playback could not start. Please press Play again.'})}else video.pause();sync()}
  document.getElementById('filmClose').onclick=close;play.onclick=toggle;
  for(const event of ['play','pause','timeupdate','ended'])video.addEventListener(event,sync);
  video.addEventListener('loadedmetadata',()=>{const item=exhibits[active];if(item&&video.videoWidth&&video.videoHeight)fitDisplay(item,video.videoWidth/video.videoHeight);sync()});
  video.addEventListener('waiting',()=>{if(active>=0){status.textContent='Loading video…';status.hidden=false}});
  video.addEventListener('playing',()=>{status.hidden=true;retry.hidden=true;sync()});
  video.addEventListener('error',()=>{if(active<0)return;status.hidden=false;retry.hidden=false;status.textContent='This video could not load. Check the connection or retry.'});
  progress.oninput=()=>{if(Number.isFinite(video.duration))video.currentTime=video.duration*Number(progress.value)/100};
  volume.oninput=()=>{video.volume=Number(volume.value);video.muted=video.volume===0};
  document.getElementById('filmFullscreen').onclick=()=>{if(video.requestFullscreen)video.requestFullscreen().catch(()=>notify('Fullscreen is unavailable.'));else if(video.webkitEnterFullscreen)video.webkitEnterFullscreen()};
  retry.onclick=()=>{const index=active;close();if(index>=0)open(index)};
  function makePoster(entry){const canvas=document.createElement('canvas');canvas.width=720;canvas.height=1280;const ctx=canvas.getContext('2d');ctx.fillStyle='#292929';ctx.fillRect(0,0,720,1280);ctx.fillStyle='#1b1b1b';ctx.textAlign='center';ctx.font='600 23px Manrope';ctx.fillText('VIDEO EXHIBITION',360,440);ctx.font='500 32px "Neue Montreal",Arial';ctx.fillText('',360,540,630);ctx.font='400 22px Manrope';ctx.fillText(entry.thumbnail?'Loading thumbnail':'Thumbnail not supplied',360,620);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture}
  for(const position of layout){
    const entry=films[position.index],group=new THREE.Group();group.position.set(position.x,position.y,position.z);group.rotation.y=position.rotation;scene.add(group)
    const surround=new THREE.Mesh(new THREE.BoxGeometry(position.width+.10,position.height+.10,.10),brass);group.add(surround)
    const display=new THREE.Mesh(new THREE.PlaneGeometry(position.width,position.height),monochromeMaterial(THREE,{map:makePoster(entry),toneMapped:false}));setMediaGrayscale(display.material,false);display.position.z=.061;display.userData.motionIndex=position.index;group.add(display)
    // Lucide SVG remains a separate surface over the thumbnail.
    const playCanvas=document.createElement('canvas');playCanvas.width=160;playCanvas.height=160;const ctx=playCanvas.getContext('2d');ctx.fillStyle='#111111cc';ctx.beginPath();ctx.arc(80,80,58,0,Math.PI*2);ctx.fill();const playTexture=new THREE.CanvasTexture(playCanvas);const playSurface=new THREE.Mesh(new THREE.PlaneGeometry(.68,.68),monochromeMaterial(THREE,{map:playTexture,transparent:true,depthWrite:false}));playSurface.position.z=.075;playSurface.userData.motionIndex=position.index;group.add(playSurface);canvasIcon(ctx,'Play',40,40,80).then(()=>{playTexture.needsUpdate=true}).catch(()=>{})
    const lightBar=new THREE.Mesh(new THREE.BoxGeometry(1.6,.12,.4),brass);lightBar.position.set(0,position.height/2+.22,.17);group.add(lightBar);
    for(const offset of [-.58,.58]){const mount=new THREE.Mesh(new THREE.BoxGeometry(.06,.23,.12),charcoal);mount.position.set(offset,position.height/2+.12,.04);group.add(mount)}
    const diffuserMaterial=new THREE.MeshStandardMaterial({color:'#dddddd',emissive:'#ffffff',emissiveIntensity:.08});const diffuser=new THREE.Mesh(new THREE.BoxGeometry(1.48,.025,.3),diffuserMaterial);diffuser.position.set(0,position.height/2+.15,.18);group.add(diffuser);
    const light=new THREE.SpotLight('#ffffff',36,10,.5,.8,1);light.position.copy(group.localToWorld(new THREE.Vector3(0,position.height/2+.13,.55)));light.target.position.copy(group.position);light.userData.motionFilmIndex=position.index;light.userData.diffuser=diffuserMaterial;scene.add(light,light.target);
    exhibits.push({group,display,playSurface,entry,position,light,poster:display.material.map,posterScale:[1,1,1]})
  }
  function enter(){if(!loaded){loaded=true;for(const item of exhibits){if(item.entry.thumbnail)loader.load(item.entry.thumbnail,texture=>{if(disposed){texture.dispose();return}texture.colorSpace=THREE.SRGBColorSpace;const imageRatio=texture.image.width/texture.image.height,aspect=item.position.width/item.position.height;item.posterScale=[imageRatio<aspect?imageRatio/aspect:1,imageRatio>aspect?aspect/imageRatio:1,1];item.poster.dispose();item.poster=texture;if(active!==item.position.index){item.display.material.map=texture;item.display.scale.set(...item.posterScale);item.display.material.needsUpdate=true}},undefined,()=>notify('A thumbnail could not load. The film remains available.'))}}document.getElementById('motionRoomControls').hidden=false}
  function leave(){close();document.getElementById('motionRoomControls').hidden=true}
  return {exhibits,open,enter,leave,pause,close,activeIndex:()=>active,isBlocking:()=>false,dispose(){disposed=true;close()}}
}
