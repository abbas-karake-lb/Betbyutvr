import * as T from 'three';
import {panelTarget,createControllerPointer} from './vr-pointer.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {createHuman,animateHuman,makeFurniture,LivingEffects,surface} from './living-art.js';
import {CATALOG,NEEDS,item,key,edge,inside,blocked,path,person,household,order,tick,validSave,upgradeState,welcomeChild,lifeStage,TRAITS,cancelAction,footprint} from './sim.js';
const $=id=>document.getElementById(id);let lot=0,state,selected,mode='live',category='Build',tool='floor',rotation=0,wallMode=1,speed=1,autonomy=true,walk=false,undo=[],dirty=true,uiTime=0,vrPage='Main',vrOffset=0,teleport=false;
const saveKey=i=>'little-lives-v1-'+i;
function load(i){try{const s=JSON.parse(localStorage.getItem(saveKey(i)));if(validSave(s))return upgradeState(s);}catch{}return household(i);}
state=load(0);selected=state.people[0].id;
const scene=new T.Scene();scene.background=new T.Color('#a7c6c4');scene.fog=new T.Fog('#a7c6c4',55,130);
const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.xr.enabled=true;renderer.xr.setFoveation(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;$('game').appendChild(renderer.domElement);
const camera=new T.PerspectiveCamera(48,innerWidth/innerHeight,.05,180),rig=new T.Group();rig.add(camera);scene.add(rig);
const world=new T.Group();scene.add(world);const staticWorld=new T.Group(),peopleWorld=new T.Group();world.add(staticWorld,peopleWorld);const staticMerged=new T.Group();world.add(staticMerged);staticWorld.visible=false;
const ambient=new T.HemisphereLight('#fff4d8','#7e9e8b',2.8);scene.add(ambient);const sun=new T.DirectionalLight('#fff1d7',2.1);sun.position.set(-12,25,10);scene.add(sun);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-16,right:16,top:16,bottom:-16,near:.5,far:60});sun.shadow.bias=-.0004;sun.shadow.normalBias=.02;
const mats=new Map(),boxGeo=new T.BoxGeometry(1,1,1),cylGeo=new T.CylinderGeometry(1,1,1,8),ballGeo=new T.IcosahedronGeometry(1,1);
function mat(color){if(!mats.has(color))mats.set(color,new T.MeshLambertMaterial({color}));return mats.get(color);}
function box(g,x,y,z,w,h,d,color){const m=new T.Mesh(boxGeo,mat(color));m.position.set(x,y,z);m.scale.set(w,h,d);g.add(m);return m;}
function cyl(g,x,y,z,r,h,color){const m=new T.Mesh(cylGeo,mat(color));m.position.set(x,y,z);m.scale.set(r,h,r);g.add(m);return m;}
function ball(g,x,y,z,r,color){const m=new T.Mesh(ballGeo,mat(color));m.position.set(x,y,z);m.scale.setScalar(r);g.add(m);return m;}
const ground=box(world,0,-.12,0,24,.2,24,'#84a777');ground.userData.ground=true;ground.receiveShadow=true;
box(world,0,-.18,0,24.5,.18,24.5,'#536e5d');box(world,0,-.035,11,24,.08,1.6,'#788c87');for(let x=-10;x<12;x+=3)box(world,x,.008,11,1,.009,.06,'#d4decb');
const grid=new T.GridHelper(24,24,'#4f8669','#71976e');grid.position.set(-.5,.012,-.5);grid.visible=false;world.add(grid);
const hover=box(world,0,.035,0,1,.035,1,'#f3d083');hover.material=new T.MeshBasicMaterial({color:'#f3d083',transparent:true,opacity:.5,depthWrite:false});hover.visible=false;
const marker=new T.Group();cyl(marker,0,2,0,.13,.045,'#e5b853');ball(marker,0,2.22,0,.105,'#ffe0a0');peopleWorld.add(marker);
let personMeshes=new Map(),target=new T.Vector3(0,0,0),azimuth=.68,elevation=.77,distance=24,yaw=0,pitch=0;
function psel(){return state.people.find(p=>p.id===selected)||state.people[0];}
const effects=new LivingEffects(world);
function clear(g){for(const child of [...g.children]){child.traverse(m=>{if(m.isMesh&&m.geometry!==boxGeo&&m.geometry!==cylGeo&&m.geometry!==ballGeo)m.geometry.dispose();});g.remove(child);}}
function rebuild(){staticWorld.clear();effects.rebuild(state);
 for(const [k,type]of Object.entries(state.floors)){const [x,z]=k.split(',').map(Number);const floor=box(staticWorld,x,.006,z,.985,.032,.985,item(type)?.color||'#d2bb93');floor.userData.floor={x,z};floor.material=surface(item(type)?.color||'#d2bb93',type==='floor'?'wood':'ceramic');if(type==='floor')box(staticWorld,x,.023,z,.012,.003,.98,'#b38154');}
 for(const [k,type]of Object.entries(state.walls)){const[x,z,o]=k.split(',').map(Number);let h=wallMode===0?.06:wallMode===1?.58:2.4;const g=new T.Group();g.position.set(x-(o===0?.5:0),0,z-(o===1?.5:0));g.rotation.y=o===0?Math.PI/2:0;g.userData.wall=k;let c=type==='brick'?'#bd7358':'#ecddbb';
 if(type==='door'){box(g,-.45,h/2,0,.1,h,.15,'#986e4c');box(g,.45,h/2,0,.1,h,.15,'#986e4c');if(h>2)box(g,0,2.15,0,1,.5,.15,c);}
 else if(type==='window'&&h>1){box(g,0,.42,0,1,.84,.15,c);box(g,0,2.18,0,1,.44,.15,c);box(g,-.44,1.4,0,.12,1.15,.16,c);box(g,.44,1.4,0,.12,1.15,.16,c);box(g,0,1.4,0,.025,1.15,.08,'#769b9a');box(g,0,1.4,0,.88,.025,.08,'#769b9a');}
 else box(g,0,h/2,0,1,h,.15,c);staticWorld.add(g);}
 for(const o of state.objects){const g=makeFurniture(o,item(o.type).color);if(g.userData.door)effects.attachDoor(o,g.userData.door);staticWorld.add(g);}
 for(const [id,g]of personMeshes){peopleWorld.remove(g);g.traverse(m=>{if(m.isSkinnedMesh){m.geometry.dispose();m.skeleton.dispose();}});}personMeshes.clear();
 for(const p of state.people){const g=createHuman(p);peopleWorld.add(g);personMeshes.set(p.id,g);}
 staticWorld.updateMatrixWorld(true);clear(staticMerged);
 const grouped=new Map();staticWorld.traverse(m=>{if(m.isMesh){const geo=m.geometry.clone();// Merge in lot-local space; the VR tabletop transform remains on world.
 const matrix=new T.Matrix4();let node=m;matrix.identity();const chain=[];while(node!==staticWorld){chain.unshift(node);node=node.parent;}matrix.identity();for(const part of chain)matrix.multiply(part.matrix);
 geo.copy(m.geometry).applyMatrix4(matrix);if(!geo.index){const count=geo.attributes.position.count;geo.setIndex(Array.from({length:count},(_,i)=>i));}
 if(!grouped.has(m.material))grouped.set(m.material,[]);grouped.get(m.material).push(geo);}});
 for(const [material,geometries]of grouped){const merged=mergeGeometries(geometries);if(merged){const m=new T.Mesh(merged,material);m.castShadow=m.receiveShadow=true;staticMerged.add(m);}geometries.forEach(g=>g.dispose());}
 dirty=false;
}
function updateCamera(){if(renderer.xr.isPresenting)return;rig.position.set(0,0,0);rig.rotation.set(0,0,0);if(walk){camera.position.set(target.x,1.65,target.z);camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);}else{camera.position.set(target.x+Math.sin(azimuth)*Math.cos(elevation)*distance,Math.sin(elevation)*distance,target.z+Math.cos(azimuth)*Math.cos(elevation)*distance);camera.lookAt(target);}}
function notice(s){$('notice').textContent=s;lastNotice=s;}
let lastNotice='Select a person, then furniture or ground.';
function save(silent=false){try{localStorage.setItem(saveKey(lot),JSON.stringify(state));if(!silent)notice('Household saved.');return true;}catch{notice('Could not save: browser storage is unavailable or full.');return false;}}
function checkpoint(){undo.push(JSON.stringify({money:state.money,floors:state.floors,walls:state.walls,objects:state.objects}));if(undo.length>30)undo.shift();}
function cancelRoutes(){for(const p of state.people){p.path=[];p.task=null;p.queue=[];p.remaining=0;p.x=Math.round(p.x);p.z=Math.round(p.z);p.activity='Idle';}}
function buildAt(x,z,hit){if(!inside(x,z))return;const k=key(x,z),wk=edge(x,z,rotation%2);if(tool==='erase'){
 let o=hit?.object;let wi=hit?.wall;
 if(!o&&!wi)o=state.objects.find(o=>o.x===x&&o.z===z);
 if(!wi&&!o&&state.walls[wk])wi=wk;
 if(!o&&!wi&&!state.floors[k])return;checkpoint();if(o){state.money+=Math.floor(item(o.type).price*.65);state.objects=state.objects.filter(q=>q.id!==o.id);}else if(wi){state.money+=Math.floor(item(state.walls[wi]).price*.65);delete state.walls[wi];}else{state.money+=3;delete state.floors[k];}
 }else{const c=item(tool);if(state.money<c.price){notice('Not enough funds. Send someone to work.');return;}if(state.objects.length>=600){notice('Object limit reached for this lot.');return;}
 if(['floor','tile','stone'].includes(tool)){if(state.floors[k]===tool)return;checkpoint();state.floors[k]=tool;}
 else if(['wall','brick','door','window'].includes(tool)){if(state.walls[wk]===tool)return;checkpoint();state.walls[wk]=tool;}
 else{if(footprint({type:tool,x,z,rot:rotation}).some(([a,b])=>blocked(state,a,b)||state.people.some(p=>Math.round(p.x)===a&&Math.round(p.z)===b))){notice('That square is occupied.');return;}checkpoint();state.objects.push({id:Date.now(),type:tool,x,z,rot:rotation});}state.money-=c.price;}
 cancelRoutes();dirty=true;renderUI();}
const raycaster=new T.Raycaster(),pointer=new T.Vector2();let pointerDown=null,drag=false,hoverCell=null;
function identify(hit){let m=hit.object;while(m&&m!==world){if(m.userData.person)return {person:m.userData.person};if(m.userData.object)return {object:m.userData.object};if(m.userData.wall)return {wall:m.userData.wall};m=m.parent;}return {};}
function worldHit(){const hits=raycaster.intersectObjects([ground,staticWorld,peopleWorld,...effects.objects.values(),...effects.doors.map(d=>d.root)],true);return hits.find(h=>h.object!==marker&&!marker.children.includes(h.object));}
function handleHit(hit,append=false){if(!hit)return;const local=world.worldToLocal(hit.point.clone()),x=Math.round(local.x),z=Math.round(local.z),data=identify(hit);
 if(teleport&&renderer.xr.isPresenting&&walk){if(!blocked(state,x,z)){rig.position.set(x,0,z);notice('Teleported.');}return;}
 if(mode==='build'){buildAt(x,z,data);return;}
 if(data.person){selected=data.person;renderUI();return;}
 if(psel().job){notice('This person is at work. Select someone at home.');return;}
 let task=data.object?{kind:'object',id:data.object.id}:{kind:'walk',x,z};const ok=order(state,psel(),task,append);notice(ok?(append?'Action queued.':data.object?'On my way to '+item(data.object.type).name+'.':'Walking there.'):'Cannot reach or use that spot. Try an open doorway or another object.');renderUI();}
renderer.domElement.addEventListener('pointerdown',e=>{pointerDown={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY};drag=false;renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener('pointermove',e=>{pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);raycaster.setFromCamera(pointer,camera);const h=worldHit();if(h){const p=world.worldToLocal(h.point.clone());hoverCell={x:Math.round(p.x),z:Math.round(p.z)};hover.position.set(hoverCell.x,.04,hoverCell.z);}if(pointerDown){const dx=e.clientX-pointerDown.lastX,dy=e.clientY-pointerDown.lastY;if(Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y)>5)drag=true;if(drag){if(walk){yaw-=dx*.005;pitch=T.MathUtils.clamp(pitch-dy*.004,-1.2,1.2);}else{azimuth-=dx*.006;elevation=T.MathUtils.clamp(elevation+dy*.005,.2,1.4);}updateCamera();}pointerDown.lastX=e.clientX;pointerDown.lastY=e.clientY;}});
renderer.domElement.addEventListener('pointerup',e=>{if(!drag){pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);raycaster.setFromCamera(pointer,camera);handleHit(worldHit(),e.shiftKey);}pointerDown=null;});
renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();distance=T.MathUtils.clamp(distance+e.deltaY*.02,4,45);updateCamera();},{passive:false});
const keys=new Set();addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName))return;keys.add(e.key.toLowerCase());if(e.key.toLowerCase()==='r')rotate();if(e.code==='Space'){e.preventDefault();setSpeed(speed?0:1);}if(e.key==='Escape')setMode('live');});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>keys.clear());
function renderUI(){const p=psel();$('personName').textContent=p.name;$('activity').textContent=p.activity;$('identity').textContent=`${lifeStage(p)} · ${Math.floor(p.ageYears)} years · ${p.trait} · Generation ${p.generation}`;$('aging').checked=state.aging;$('lineage').textContent=p.parents.length?'Parents: '+p.parents.map(id=>state.people.find(q=>q.id===id)?.name||state.familyHistory.find(q=>q.id===id)?.name||'Previous generation').join(' & '):'Founding generation';$('funds').textContent='$'+Math.floor(state.money).toLocaleString();$('clock').textContent=`Day ${state.day} · ${String(Math.floor(state.minutes/60)).padStart(2,'0')}:${String(Math.floor(state.minutes%60)).padStart(2,'0')}`;
 $('needs').replaceChildren(...NEEDS.map(n=>{const d=document.createElement('div');d.className='need';d.innerHTML=`<label>${n}<span>${Math.round(p.needs[n])}</span></label><div class="track"><div class="fill" style="width:${p.needs[n]}%;background:${p.needs[n]<25?'#c77760':p.needs[n]<50?'#d2a45a':'#6d9f7d'}"></div></div>`;return d;}));
 $('family').replaceChildren(...state.people.map(q=>{const b=document.createElement('button');b.className='person'+(q.id===selected?' active':'');const av=document.createElement('span');av.className='avatar';av.style.background=q.color;const label=document.createElement('span');label.textContent=q.name;const small=document.createElement('small');small.textContent=q.activity;label.append(small);b.append(av,label);b.onclick=()=>{selected=q.id;renderUI();};return b;}));$('queueInfo').textContent=p.queue.length+' queued actions · '+(autonomy?'Autonomy on':'Autonomy off');drawPanel();}
function setSpeed(v){speed=v;document.querySelectorAll('[data-speed]').forEach(b=>b.classList.toggle('active',+b.dataset.speed===v));drawPanel();}
function setMode(m){mode=m;document.body.classList.toggle('building',m==='build');$('builder').hidden=m!=='build';$('live').classList.toggle('active',m==='live');$('build').classList.toggle('active',m==='build');grid.visible=m==='build';hover.visible=m==='build';notice(m==='build'?'Choose an item, point at a square, then place. Building pauses time.':'Select a person, then furniture or the ground.');drawPanel();}
function rotate(){rotation=(rotation+1)%4;$('rotate').textContent='Rotate · '+rotation*90+'°';drawPanel();}
function catalogUI(){const categories=[...new Set(CATALOG.map(c=>c.category))];$('categories').replaceChildren(...categories.map(c=>{const b=document.createElement('button');b.textContent=c;b.className=c===category?'active':'';b.onclick=()=>{category=c;catalogUI();};return b;}));$('catalog').replaceChildren(...CATALOG.filter(c=>c.category===category).map(c=>{const b=document.createElement('button');b.className='product'+(tool===c.id?' active':'');b.innerHTML=`<span class="swatch" style="background:${c.color}"></span><span>${c.name}<small>$${c.price}</small></span>`;b.onclick=()=>{tool=c.id;$('erase').classList.remove('active');catalogUI();notice(c.name+' · $'+c.price+' · click a square to place');drawPanel();};return b;}));}
function setWalls(){wallMode=(wallMode+1)%3;dirty=true;$('walls').textContent='Walls: '+['hidden','cutaway','full'][wallMode];drawPanel();}
function setView(){walk=!walk;teleport=false;if(walk){const p=psel();target.set(p.x,0,p.z);yaw=0;pitch=0;wallMode=2;}else{target.set(0,0,0);wallMode=1;}dirty=true;$('view').textContent=walk?'Tabletop view':'Walk inside';$('walls').textContent='Walls: '+['hidden','cutaway','full'][wallMode];applyXRView();updateCamera();drawPanel();}
function switchLot(i){if(!save(true)){notice('Save failed; staying with this household.');$('lot').value=lot;return;}lot=i;state=load(i);selected=state.people[0].id;undo=[];dirty=true;target.set(0,0,0);if(walk){walk=false;setView();}applyXRView();$('lot').value=lot;$('lotTitle').textContent=['Willow Cottage','Maple House','Meadow Plot'][i];renderUI();updateCamera();}
function addPerson(name,color,identity={}){if(state.people.length>=6){notice('This household has six people already.');return;}let cell;for(let z=5;z<10&&!cell;z++)for(let x=-2;x<=2;x++)if(!blocked(state,x,z)&&!state.people.some(p=>Math.round(p.x)===x&&Math.round(p.z)===z)){cell={x,z};break;}if(!cell)return;const p=person(name.slice(0,24)||'Alex',cell.x,cell.z,color,identity);state.people.push(p);selected=p.id;dirty=true;renderUI();}
$('live').onclick=()=>setMode('live');$('build').onclick=()=>setMode('build');$('rotate').onclick=rotate;$('walls').onclick=setWalls;$('view').onclick=setView;$('erase').onclick=()=>{tool='erase';$('erase').classList.add('active');catalogUI();};$('undo').onclick=()=>{if(undo.length){Object.assign(state,JSON.parse(undo.pop()));cancelRoutes();dirty=true;renderUI();}};$('save').onclick=()=>save();$('help').onclick=()=>$('helpDialog').showModal();$('home').onclick=()=>{target.set(0,0,0);distance=24;azimuth=.68;elevation=.77;updateCamera();};$('zoomIn').onclick=()=>{distance=Math.max(4,distance-3);updateCamera();};$('zoomOut').onclick=()=>{distance=Math.min(45,distance+3);updateCamera();};$('lot').onchange=e=>switchLot(+e.target.value);$('autonomy').onchange=e=>autonomy=e.target.checked;document.querySelectorAll('[data-speed]').forEach(b=>b.onclick=()=>setSpeed(+b.dataset.speed));
$('work').onclick=()=>{notice(order(state,psel(),{kind:'work'})?'Heading to work. Pay arrives after three game hours.':'Cannot reach the street. Add a doorway.');};$('chat').onclick=()=>{const other=state.people.find(p=>p.id!==selected&&!p.job);notice(other&&order(state,psel(),{kind:'social',id:other.id})?'Time for a chat.':'No reachable family member is available.');};$('stop').onclick=()=>{cancelAction(psel());};$('familyNew').onclick=()=>$('personDialog').showModal();$('addPerson').onclick=e=>{if(!$('newName').value.trim()){e.preventDefault();return;}addPerson($('newName').value.trim(),$('newColor').value,{gender:$('newGender').value,ageYears:+$('newAge').value,skin:$('newSkin').value,hair:$('newHair').value,hairStyle:$('newStyle').value,trait:$('newTrait').value});};
function addChild(){const p=welcomeChild(state,psel().id);if(p){selected=p.id;dirty=true;notice(p.name+' joins the next generation.');renderUI();}else notice('Select an adult in a household with room for a child.');}
$('child').onclick=addChild;$('aging').onchange=e=>{state.aging=e.target.checked;drawPanel();};
let audioCtx,music=false,noteIndex=0,nextNote=0;const melodies=[[60,64,67,71,69,67,64,62,59,62,65,69,67,65,62,59],[60,67,72,76,74,71,67,64,57,64,69,72,71,67,64,60]];
function toggleMusic(){audioCtx??=new(window.AudioContext||window.webkitAudioContext)();audioCtx.resume();music=!music;nextNote=audioCtx.currentTime;$('music').textContent=music?'♫ Music on':'♫ Music off';drawPanel();}
function musicTick(){if(!music||!audioCtx||audioCtx.state!=='running')return;if(nextNote<audioCtx.currentTime-.3)nextNote=audioCtx.currentTime;while(nextNote<audioCtx.currentTime+.15){const melody=melodies[mode==='build'?1:0],midi=melody[noteIndex%melody.length],o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='triangle';o.frequency.value=440*2**((midi-69)/12);g.gain.setValueAtTime(0,nextNote);g.gain.linearRampToValueAtTime(.035,nextNote+.012);g.gain.exponentialRampToValueAtTime(.0001,nextNote+.8);o.connect(g).connect(audioCtx.destination);o.start(nextNote);o.stop(nextNote+.85);noteIndex++;nextNote+=mode==='build'?.36:.5;}}
$('music').onclick=toggleMusic;
// The VR menu is a raycastable mesh: it works without DOM overlays in immersive mode.
const panelCanvas=document.createElement('canvas');panelCanvas.width=900;panelCanvas.height=1100;const ctx=panelCanvas.getContext('2d'),panelTexture=new T.CanvasTexture(panelCanvas);panelTexture.colorSpace=T.SRGBColorSpace;const panel=new T.Mesh(new T.PlaneGeometry(.9,1.1),new T.MeshBasicMaterial({map:panelTexture,side:T.DoubleSide,depthTest:false}));panel.renderOrder=100;panel.visible=false;scene.add(panel);let panelButtons=[];let hoveredPanelButtons=new Set();
function buttonRect(text,x,y,w,action,active=false){const hovered=hoveredPanelButtons.has(panelButtons.length);ctx.fillStyle=hovered?(active?'#ffe1a0':'#397f79'):(active?'#ddb76e':'#315961');ctx.beginPath();ctx.roundRect(x,y,w,70,12);ctx.fill();if(hovered){ctx.strokeStyle='#96ffe5';ctx.lineWidth=4;ctx.stroke();}ctx.fillStyle=active?'#193b42':'#eff4e9';ctx.font='24px sans-serif';ctx.fillText(text.slice(0,31),x+16,y+44);panelButtons.push({x,y,w,h:70,action});}
function drawPanel(){panelButtons=[];ctx.fillStyle='#183a42';ctx.fillRect(0,0,900,1100);ctx.fillStyle='#e5bf78';ctx.font='bold 34px sans-serif';ctx.fillText('LITTLE LIVES',35,55);ctx.fillStyle='#b7ccc5';ctx.font='22px sans-serif';ctx.fillText(`Day ${state.day}   $${Math.floor(state.money)}   ${mode==='build'?'Building · paused':speed+'× speed'}`,35,95);const p=psel();ctx.fillStyle='#f2f0dd';ctx.font='bold 27px sans-serif';ctx.fillText(p.name+' · '+p.activity,35,144);
 NEEDS.forEach((n,i)=>{const x=35+(i%3)*285,y=178+Math.floor(i/3)*63;ctx.fillStyle='#c7d6ce';ctx.font='19px sans-serif';ctx.fillText(n,x,y);ctx.fillStyle='#31545a';ctx.fillRect(x,y+9,240,9);ctx.fillStyle=p.needs[n]<25?'#d48669':'#99bb8b';ctx.fillRect(x,y+9,p.needs[n]*2.4,9);});
 let rows=[];if(vrPage==='Main'){rows=[['Live',()=>setMode('live'),mode==='live'],['Build & buy',()=>{setMode('build');vrPage='Categories';drawPanel();},mode==='build'],[walk?'Tabletop view':'Walk inside',setView],['Walls: '+['hidden','cutaway','full'][wallMode],setWalls],['Household',()=>{vrPage='People';drawPanel();}],['Neighborhood',()=>{vrPage='Lots';drawPanel();}],['Pause / play',()=>setSpeed(speed?0:1)],['Speed: '+speed+'×',()=>setSpeed(speed===1?3:speed===3?8:1)],['Save household',()=>save()],['Music: '+(music?'on':'off'),toggleMusic],['Teleport: '+(teleport?'on':'off'),()=>{if(!walk)setView();teleport=!teleport;setMode('live');drawPanel();},teleport],['Exit VR',()=>renderer.xr.getSession()?.end()]];}
 else if(vrPage==='Categories'){rows=[...new Set(CATALOG.map(c=>c.category))].map(c=>[c,()=>{category=c;vrPage='Catalog';vrOffset=0;drawPanel();catalogUI();}]);rows.push(['Sell / erase',()=>{tool='erase';drawPanel();},tool==='erase'],['Undo',()=>$('undo').click()],['Rotate: '+rotation*90+'°',rotate],['Back',()=>{vrPage='Main';drawPanel();}]);}
 else if(vrPage==='Catalog'){const list=CATALOG.filter(c=>c.category===category);rows=list.slice(vrOffset,vrOffset+8).map(c=>[c.name+' $'+c.price,()=>{tool=c.id;catalogUI();drawPanel();},tool===c.id]);rows.push(['Rotate: '+rotation*90+'°',rotate],['Categories',()=>{vrPage='Categories';drawPanel();}]);}
 else if(vrPage==='People'){rows=state.people.map(q=>[q.name+' · '+lifeStage(q),()=>{selected=q.id;renderUI();},selected===q.id]);rows.push(['Go to work',()=>$('work').click()],['Chat',()=>$('chat').click()],['Cancel actions',()=>$('stop').click()],['Family & aging',()=>{vrPage='Family';drawPanel();}],['Autonomy: '+(autonomy?'on':'off'),()=>{autonomy=!autonomy;$('autonomy').checked=autonomy;drawPanel();}],['Back',()=>{vrPage='Main';drawPanel();}]);}
 else if(vrPage==='Family'){rows=[['Welcome a child',addChild],['Aging: '+(state.aging?'on':'off'),()=>{state.aging=!state.aging;renderUI();}],['Add woman',()=>addPerson('Mira','#bb8098',{gender:'female',hairStyle:'long'})],['Add man',()=>addPerson('Rami','#628ead',{gender:'male'})],['Add girl',()=>addPerson('Leila','#a68ac5',{gender:'female',ageYears:9,hairStyle:'bob'})],['Add boy',()=>addPerson('Zein','#75a58a',{gender:'male',ageYears:9})],['Back',()=>{vrPage='People';drawPanel();}]];}
 else if(vrPage==='Lots'){rows=['Willow Cottage','Maple House','Meadow Plot'].map((name,i)=>[name,()=>switchLot(i),i===lot]);rows.push(['Back',()=>{vrPage='Main';drawPanel();}]);}
 rows.forEach(([label,action,active],i)=>buttonRect(label,35+(i%2)*425,315+Math.floor(i/2)*85,405,action,active));
 ctx.fillStyle='#b7ccc5';ctx.font='20px sans-serif';ctx.fillText('Trigger: select / place   Grip: bring menu here',35,930);ctx.fillText('Left stick: move   Right stick: turn / scale',35,966);ctx.fillStyle='#e5bf78';ctx.fillText(lastNotice.slice(0,68),35,1015);if(mode==='build')ctx.fillText('Selected: '+(item(tool)?.name||'Sell / erase')+' · '+rotation*90+'°',35,1055);panelTexture.needsUpdate=true;
}
function placePanel(){const cam=renderer.xr.isPresenting?renderer.xr.getCamera():camera,pos=new T.Vector3(),dir=new T.Vector3();cam.getWorldPosition(pos);cam.getWorldDirection(dir);dir.y=0;if(dir.lengthSq()<.001)dir.set(0,0,-1);dir.normalize();panel.position.copy(pos).addScaledVector(dir,1.4);panel.position.y=Math.max(.8,pos.y-.1);panel.lookAt(pos.x,panel.position.y,pos.z);}
function applyXRView(){if(renderer.xr.isPresenting){if(walk){world.scale.setScalar(1);world.position.set(0,0,0);const p=psel();rig.position.set(p.x,0,p.z);}else{world.scale.setScalar(.09);world.position.set(0,.65,-1.9);rig.position.set(0,0,0);}rig.rotation.set(0,0,0);placePanel();}else{world.scale.setScalar(1);world.position.set(0,0,0);}}
const controllers=[];
for(let i=0;i<2;i++){
 const c=renderer.xr.getController(i);rig.add(c);c.userData.pointer=createControllerPointer(c,scene);
 c.addEventListener('connected',e=>c.userData.source=e.data);
 c.addEventListener('disconnected',()=>{c.userData.source=null;c.userData.pointer.hide();updateControllerPointers();});
 c.addEventListener('selectstart',()=>{
  if(!c.userData.source||!c.visible)return;
  const target=panelTarget(raycaster,c,panel,panelButtons,panelCanvas.width,panelCanvas.height);
  c.userData.pointer.update(target.hit,target.hit?panel:null,target.buttonIndex>=0);
  if(target.hit){if(target.button){target.button.action();updateControllerPointers();}return;}
  handleHit(worldHit());
 });
 c.addEventListener('squeezestart',placePanel);controllers.push(c);
}
function updateControllerPointers(){
 const nextHovered=new Set();world.updateWorldMatrix(true,true);
 for(const c of controllers){
  if(!c.userData.source||!c.visible){c.userData.pointer.hide();continue;}
  const target=panelTarget(raycaster,c,panel,panelButtons,panelCanvas.width,panelCanvas.height);
  const hit=target.hit||worldHit();
  c.userData.pointer.update(hit,target.hit?panel:null,target.buttonIndex>=0);
  if(target.buttonIndex>=0)nextHovered.add(target.buttonIndex);
  if(!target.hit&&hit&&mode==='build'){const p=world.worldToLocal(hit.point.clone());hover.position.set(Math.round(p.x),.04,Math.round(p.z));}
 }
 if(nextHovered.size!==hoveredPanelButtons.size||[...nextHovered].some(i=>!hoveredPanelButtons.has(i))){hoveredPanelButtons=nextHovered;drawPanel();}
}
function deadzone(v){return Math.abs(v)<.18?0:Math.sign(v)*(Math.abs(v)-.18)/.82;}
function moveWalk(dx,dz,isVR){const base=isVR?rig.position:target;let nx=T.MathUtils.clamp(base.x+dx,-11.4,11.4),nz=T.MathUtils.clamp(base.z+dz,-11.4,11.4);const old={x:Math.round(base.x),z:Math.round(base.z)};
 const can=(x,z)=>{const ex=Math.round(x),ez=Math.round(z);if(blocked(state,ex,ez))return false;if(ex===old.x&&ez===old.z)return true;const route=path(state,old,{x:ex,z:ez});return route&&route.length<=1;};
 if(can(nx,base.z))base.x=nx;if(can(base.x,nz))base.z=nz;}
function xrInput(dt){for(const c of controllers){const src=c.userData.source;if(!src||!c.visible)continue;
 const gp=src.gamepad;if(!gp)continue;const ax=gp.axes,ix=ax.length>=4?2:0,iz=ax.length>=4?3:1,x=deadzone(ax[ix]||0),z=deadzone(ax[iz]||0);
 if(src.handedness==='left'){const forward=new T.Vector3();renderer.xr.getCamera().getWorldDirection(forward);forward.y=0;forward.normalize();const right=new T.Vector3(-forward.z,0,forward.x),delta=forward.multiplyScalar(-z*dt*(walk?1.6:.6)).addScaledVector(right,x*dt*(walk?1.6:.6));if(walk)moveWalk(delta.x,delta.z,true);else rig.position.add(delta);}
 if(src.handedness==='right'){if(x){const eye=new T.Vector3();renderer.xr.getCamera().getWorldPosition(eye);const offset=rig.position.clone().sub(eye);offset.applyAxisAngle(new T.Vector3(0,1,0),-x*dt*1.2);rig.rotation.y-=x*dt*1.2;rig.position.copy(eye).add(offset);rig.position.y=0;}if(!walk&&z){world.scale.setScalar(T.MathUtils.clamp(world.scale.x-z*dt*.055,.045,.25));}}
 }updateControllerPointers();}
$('vr').onclick=async()=>{try{if(renderer.xr.isPresenting){await renderer.xr.getSession().end();return;}if(!navigator.xr||!await navigator.xr.isSessionSupported('immersive-vr')){notice('VR is unavailable here. Open this HTTPS page in the Quest browser.');return;}const session=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor','bounded-floor']});await renderer.xr.setSession(session);}catch(e){notice('Could not enter VR: '+e.message);}};
renderer.xr.addEventListener('sessionstart',()=>{document.body.classList.add('xr');renderer.shadowMap.enabled=false;camera.position.set(0,0,0);camera.rotation.set(0,0,0);applyXRView();panel.visible=true;vrPage='Main';drawPanel();setTimeout(placePanel,250);});renderer.xr.addEventListener('sessionend',()=>{document.body.classList.remove('xr');renderer.shadowMap.enabled=true;panel.visible=false;hoveredPanelButtons.clear();for(const c of controllers)c.userData.pointer.hide();rig.position.set(0,0,0);rig.rotation.set(0,0,0);applyXRView();updateCamera();});
let prevTime=0,visualTime=0,lastPopulation="";renderer.setAnimationLoop(time=>{const dt=Math.min((time-prevTime)/1000,.05);prevTime=time;if(mode==='live'){tick(state,dt*4*speed,autonomy);visualTime+=dt*speed;}const population=state.people.map(p=>p.id+':'+lifeStage(p)).join(',');if(population!==lastPopulation){dirty=true;lastPopulation=population;}if(dirty)rebuild();
 for(const p of state.people){const g=personMeshes.get(p.id);if(!g)continue;animateHuman(g,p,state,visualTime);if(walk&&Math.hypot(g.position.x-(renderer.xr.isPresenting?rig.position.x:target.x),g.position.z-(renderer.xr.isPresenting?rig.position.z:target.z))<.35)g.visible=false;}
 effects.update(state,visualTime);const daylight=Math.max(.15,Math.sin((state.minutes/1440-.25)*Math.PI*2));sun.intensity=.3+daylight*2.1;ambient.intensity=1.1+daylight*1.7;
 const p=psel();marker.visible=!p.job;marker.position.set(p.x,Math.sin(time*.003)*.05,p.z);hover.visible=mode==='build';if(renderer.xr.isPresenting)xrInput(dt);else if(walk){let x=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),z=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);if(x||z){const len=Math.hypot(x,z);x=x/len*dt*2;z=z/len*dt*2;moveWalk(x*Math.cos(yaw)+z*Math.sin(yaw),z*Math.cos(yaw)-x*Math.sin(yaw),false);updateCamera();}}
 uiTime+=dt;if(uiTime>.5){renderUI();uiTime=0;}musicTick();renderer.render(scene,camera);});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});setInterval(()=>save(true),20000);addEventListener('pagehide',()=>save(true));
rebuild();catalogUI();renderUI();updateCamera();
// Read-only diagnostic snapshot used by the browser smoke test.
window.gameDebug={snapshot:()=>JSON.parse(JSON.stringify({state,mode,walk,wallMode,tool,selected,render:renderer.info.render})),project:(x,y,z)=>{const p=new T.Vector3(x,y,z).applyMatrix4(world.matrixWorld).project(camera);return{x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2};}};

// Export interaction components for headless integration tests without a headset.
export {state,rebuild,effects,personMeshes,scene,camera,renderer,controllers,panel,panelCanvas,placePanel,updateControllerPointers};
