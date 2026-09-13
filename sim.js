import {MEALS,SOCIAL,objectActions} from './actions.js';
export const N=24, NEEDS=['Hunger','Energy','Hygiene','Bladder','Fun','Social'];
export const CATALOG=[
 ['floor','Oak floor',8,'Build','#c99057'],['tile','Blue tile',10,'Build','#9dcbd0'],['stone','Stone path',6,'Build','#bdc3b9'],['wall','Cream wall',40,'Build','#ecddbb'],['brick','Brick wall',50,'Build','#bd7358'],['door','Doorway',65,'Build','#906a46'],['window','Window wall',85,'Build','#77bacb'],
 ['bed','Single bed',280,'Bedroom','#689bb8','Energy'],['doublebed','Double bed',480,'Bedroom','#c58b8b','Energy'],['dresser','Dresser',130,'Bedroom','#a3734e'],['lamp','Floor lamp',65,'Bedroom','#efd491'],
 ['dishwasher','Dishwasher',240,'Kitchen','#d5ddd8'],['fridge','Fridge',320,'Kitchen','#c1d9d8','Hunger'],['stove','Cooker',220,'Kitchen','#455965','Hunger'],['counter','Counter',90,'Kitchen','#e3cba4'],['table','Dining table',120,'Kitchen','#b08558','Social'],['chair','Dining chair',45,'Kitchen','#ce915d'],
 ['toilet','Toilet',180,'Bathroom','#edf0eb','Bladder'],['shower','Shower',260,'Bathroom','#83b8c0','Hygiene'],['sink','Basin',100,'Bathroom','#e0e9e3','Hygiene'],
 ['sofa','Sofa',240,'Living','#d48652','Fun'],['tv','Television',300,'Living','#34444a','Fun'],['bookcase','Bookcase',140,'Living','#bd915d','Fun'],['desk','Work desk',170,'Living','#bd915d'],['rug','Round rug',55,'Living','#ddab6d'],['plant','House plant',40,'Living','#5d9473'],
 ['pool','Swimming pool',1600,'Garden','#52b7c5','Fun'],['tree','Maple tree',110,'Garden','#6b9868'],['pine','Pine tree',95,'Garden','#43786b'],['flowers','Flower bed',35,'Garden','#e6a3a8'],['bench','Garden bench',80,'Garden','#a68a61','Social'],['fence','Picket fence',25,'Garden','#e8dfc6']
].map(([id,name,price,category,color,need])=>({id,name,price,category,color,need}));
export const item=id=>CATALOG.find(c=>c.id===id);
export const key=(x,z)=>`${x},${z}`;
export const edge=(x,z,o)=>`${x},${z},${o}`;
export const inside=(x,z)=>Number.isInteger(x)&&Number.isInteger(z)&&x>=-12&&z>=-12&&x<12&&z<12;
export function footprint(o){const cells=o.type==='pool'?[[0,0],[1,0],[0,1],[1,1]]:['bed','doublebed'].includes(o.type)?[[0,0],[0,1]]:[[0,0]];const r=(o.rot||0)*Math.PI/2;return cells.map(([x,z])=>[o.x+Math.round(x*Math.cos(r)+z*Math.sin(r)),o.z+Math.round(z*Math.cos(r)-x*Math.sin(r))]);}
export function blocked(s,x,z){return !inside(x,z)||s.objects.some(o=>!['rug','flowers'].includes(o.type)&&footprint(o).some(([ox,oz])=>ox===x&&oz===z));}
export function canStep(s,x,z,nx,nz){
 if(blocked(s,nx,nz)) return false;
 const k=nx>x?edge(nx,z,0):nx<x?edge(x,z,0):nz>z?edge(x,nz,1):edge(x,z,1);
 const w=s.walls[k]; return !w||w==='door';
}
export function path(s,start,end){
 const sx=Math.round(start.x),sz=Math.round(start.z),ex=Math.round(end.x),ez=Math.round(end.z);
 if(!inside(ex,ez)||blocked(s,ex,ez))return null;
 const todo=[[sx,sz]],prev=new Map([[key(sx,sz),null]]);
 for(let i=0;i<todo.length;i++){const [x,z]=todo[i];if(x===ex&&z===ez){const out=[];let k=key(x,z);while(prev.get(k)!==null){out.unshift(k.split(',').map(Number));k=prev.get(k);}return out;}
 for(const [nx,nz] of [[x+1,z],[x-1,z],[x,z+1],[x,z-1]]){const k=key(nx,nz);if(!prev.has(k)&&canStep(s,x,z,nx,nz)){prev.set(k,key(x,z));todo.push([nx,nz]);}}}return null;
}
let serial=0;
export const TRAITS=['Creative','Sociable','Active','Bookworm'];
export function lifeStage(p){return p.ageYears<4?'Toddler':p.ageYears<13?'Child':p.ageYears<18?'Teen':p.ageYears<65?'Adult':'Elder';}
export function person(name,x,z,color='#4b9f96',identity={}){return {id:Date.now()+serial++,name,x,z,color,skin:identity.skin||'#c99b77',gender:identity.gender||'male',ageYears:identity.ageYears??27,hair:identity.hair||'#49362d',hairStyle:identity.hairStyle||'short',eyes:identity.eyes||'#4b706b',trait:identity.trait||TRAITS[serial%4],generation:identity.generation||1,parents:identity.parents||[],face:identity.face||'oval',outfit:identity.outfit||'casual',glasses:!!identity.glasses,beard:!!identity.beard,needs:Object.fromEntries(NEEDS.map(n=>[n,75+Math.random()*20])),queue:[],path:[],activity:'Idle',task:null,remaining:0,job:0};}
export function upgradeState(s){
 const migrateInteractions=s.interactionVersion!==1;s.interactionVersion=1;
 s.familyHistory??=[];s.aging??=true;s.car??={phase:'idle',x:-16,timer:0,passenger:null};
 for(const [i,p]of s.people.entries()){
  p.face??='oval';p.outfit??='casual';p.glasses??=false;p.beard??=false;p.skin??='#c99b77';if(p.job>0&&s.car.passenger!==p.id){p.job=0;p.activity='Home from work';}p.gender??=['Maya','Nora','Lina','Jade'].includes(p.name)?'female':'male';p.ageYears??=p.name==='Lina'?9:27+i*3;p.hairStyle??=p.gender==='female'?'long':'short';p.hair??='#49362d';p.eyes??='#4b706b';p.trait??=TRAITS[i%4];p.generation??=1;p.parents??=[];
  if(migrateInteractions||p.task&&!p.task.stages){p.heldBy=null;p.task=null;p.path=[];p.queue=[];p.remaining=0;}
 }
 s.livingVersion=2;return s;
}
export function welcomeChild(s,parentId,partnerId=null){
 const a=s.people.find(p=>p.id===parentId);if(!a||a.ageYears<18||s.people.length>=6)return null;
 const parents=[a,...s.people.filter(p=>p.id!==a.id&&p.ageYears>=18&&(partnerId===null||p.id===partnerId)).slice(0,1)];
 let spot;for(let z=5;z<10&&!spot;z++)for(let x=-2;x<3;x++)if(!blocked(s,x,z)&&!s.people.some(p=>Math.round(p.x)===x&&Math.round(p.z)===z)){spot={x,z};break;}if(!spot)return null;
 const female=Math.random()<.5,names=female?['Leila','Mira','Yara','Aya']:['Rami','Zein','Karim','Noah'];
 const p=person(names[(s.familyHistory?.length||0)%4],spot.x,spot.z,female?'#b785a4':'#6a9daf',{gender:female?'female':'male',ageYears:1,skin:a.skin,hair:parents[parents.length-1].hair,hairStyle:female?'bob':'short',eyes:a.eyes,face:a.face,parents:parents.map(v=>v.id),generation:Math.max(...parents.map(v=>v.generation))+1});
 s.people.push(p);s.familyHistory??=[];s.familyHistory.push({event:'birth',name:p.name,id:p.id,parents:p.parents,generation:p.generation,day:s.day});return p;
}
export function household(preset=0){
 const s={version:1,money:16000,minutes:480,day:1,objects:[],floors:{},walls:{},people:[],relationships:{}};
 const add=(type,x,z,rot=0)=>s.objects.push({id:++serial,type,x,z,rot});
 if(preset===2){s.people=[person('Alex',0,4)];return upgradeState(s);}
 const left=preset===0?-5:-6,right=preset===0?5:6,back=-5,front=4;
 for(let x=left;x<right;x++)for(let z=back;z<front;z++)s.floors[key(x,z)]=x>=2&&z<-1?'tile':'floor';
 for(let z=back;z<front;z++){s.walls[edge(left,z,0)]=z===-2?'window':'wall';s.walls[edge(right,z,0)]=z===1?'window':'wall';}
 for(let x=left;x<right;x++){s.walls[edge(x,back,1)]=x===-2||x===2?'window':'wall';s.walls[edge(x,front,1)]=x===0?'door':x===-3||x===3?'window':'wall';}
 for(let z=-5;z<0;z++)s.walls[edge(1,z,0)]=z===-1?'door':'wall';
 for(let x=left;x<1;x++)s.walls[edge(x,-1,1)]=x===-1?'door':'wall';
 add('bed',-4,-4);add('doublebed',-2,-4);add('dresser',-4,-2);add('lamp',-1,-4);
 add('toilet',4,-4,2);add('shower',2,-4,2);add('sink',4,-2,1);
 add('dishwasher',3,-1,2);add('fridge',4,0,1);add('stove',4,1,1);add('counter',4,2,1);add('table',2,2);add('chair',2,3);
 add('sofa',-3,1,2);add('tv',-3,3);add('rug',-2,2);add('bookcase',-5,0,3);add('plant',-4,3);add('desk',-1,0);
 add('tree',-8,-6);add('tree',8,3);add('pine',-8,5);add('pine',8,-7);add('pool',5,6);add('bench',-4,7);add('flowers',-3,5);add('flowers',3,5);
 for(let z=4;z<11;z++)s.floors[key(0,z)]='stone';
 s.people=[person(preset===0?'Maya':'Nora',-1,2,'#bd7965',{gender:'female',hairStyle:'long',ageYears:28}),person(preset===0?'Adam':'Omar',1,1,'#4b9f96')];
 if(preset===1)s.people.push(person('Lina',0,3,'#a28bcb',{gender:'female',hairStyle:'bob',ageYears:9,generation:2,parents:s.people.map(p=>p.id)}));
 return upgradeState(s);
}
export function wallBetween(s,x,z,nx,nz){const k=nx>x?edge(nx,z,0):nx<x?edge(x,z,0):nz>z?edge(x,nz,1):edge(x,z,1);return !!s.walls[k]&&s.walls[k]!=='door';}
export function accessCells(o){
 const r=(o.rot||0)*Math.PI/2,transform=([x,z,ox=0,oz=0])=>[o.x+Math.round(x*Math.cos(r)+z*Math.sin(r)),o.z+Math.round(z*Math.cos(r)-x*Math.sin(r)),o.x+Math.round(ox*Math.cos(r)+oz*Math.sin(r)),o.z+Math.round(oz*Math.cos(r)-ox*Math.sin(r))];
 if(['bed','doublebed'].includes(o.type))return [[-1,0],[1,0],[-1,1,0,1],[1,1,0,1]].map(transform);
 if(['chair','sofa','bench'].includes(o.type))return [[0,-1],[-1,0],[1,0]].map(transform);
 if(['fridge','stove','counter','dishwasher','sink','shower','toilet','tv','dresser','desk','bookcase'].includes(o.type))return [[0,-1]].map(transform);
 const cells=footprint(o);return cells.flatMap(([x,z])=>[[x+1,z,x,z],[x-1,z,x,z],[x,z+1,x,z],[x,z-1,x,z]]);
}
export function approach(s,p,obj){let best=null;for(const[x,z,ox,oz]of accessCells(obj)){if(wallBetween(s,x,z,ox,oz))continue;const route=path(s,p,{x,z});if(route&&(!best||route.length<best.length))best=route;}return best;}
export function canPlace(s,o,ignoreId=null){const cells=footprint(o);return cells.every(([x,z])=>inside(x,z)&&!s.objects.some(q=>q.id!==ignoreId&&!['rug','flowers'].includes(q.type)&&footprint(q).some(([a,b])=>a===x&&b===z))&&!s.people.some(p=>Math.round(p.x)===x&&Math.round(p.z)===z))&&cells.every(([x,z])=>cells.every(([a,b])=>Math.abs(x-a)+Math.abs(z-b)!==1||!wallBetween(s,x,z,a,b)));}
export function rotateObject(s,id){const o=s.objects.find(q=>q.id===id);if(!o)return false;const next={...o,rot:((o.rot||0)+1)%4};if(!canPlace(s,next,id))return false;o.rot=next.rot;for(const p of s.people)cancelAction(p);return true;}
function available(s,p,o){return !s.people.some(q=>q.id!==p.id&&q.task?.reserved?.includes(o.id));}
function findObject(s,p,types){return s.objects.filter(o=>types.includes(o.type)&&available(s,p,o)).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z)).find(o=>approach(s,p,o));}
function stage(kind,object,duration,need=null){return {kind,objectId:object?.id,duration,need};}
export function cancelAction(p){p.heldBy=null;p.task=null;p.path=[];p.queue=[];p.remaining=0;p.activity='Idle';}
export function order(s,p,task,append=false){if(p.job>0||p.heldBy||s.car?.passenger===p.id)return false;if(append){if(p.queue.length>=8)return false;p.queue.push(task);return true;}cancelAction(p);return begin(s,p,task);}
function begin(s,p,t){
 let partner=null,stages=[],meal=null,need=null;
 if(t.kind==='object'){
  const o=s.objects.find(o=>o.id===t.id);if(!o||!available(s,p,o)||!approach(s,p,o))return false;need=item(o.type).need;const action=t.action;if(action&&!objectActions(o.type).some(a=>a.id===action))return false;
  if(action&&['clean','makeBed','toggle','outfit','hair','water','admire','study','computer','workHome','runWasher','sitDown','snack','washDish'].includes(action)){if(action==='workHome'&&p.ageYears<18)return false;const n=['study','computer','admire','sitDown'].includes(action)?'Fun':action==='snack'?'Hunger':null;if(action==='snack'){if(s.money<3)return false;s.money-=3;meal={name:'Fresh snack',color:'#86a957',hot:false};stages=[stage('prepare',o,4),stage('eat',o,12,'Hunger'),stage('clearPlate',null,3)];}else stages=[stage(action,o,action==='workHome'?35:action==='toggle'?2:15,n)];}
  else if(['fridge','stove'].includes(o.type)){
   const fridge=o.type==='fridge'?o:findObject(s,p,['fridge']),stove=o.type==='stove'?o:findObject(s,p,['stove']),counter=findObject(s,p,['counter']);
   const table=findObject(s,p,['table']);const chair=table?s.objects.find(c=>c.type==='chair'&&Math.hypot(c.x-table.x,c.z-table.z)<1.6&&available(s,p,c)&&approach(s,p,c)):null;
   const washer=findObject(s,p,['dishwasher','sink']);meal=MEALS.find(m=>'meal:'+m.id===action)||MEALS[Math.floor(Math.random()*MEALS.length)];if(s.money<meal.price)return false;s.money-=meal.price;
   if(fridge)stages.push(stage('retrieve',fridge,7));if(counter)stages.push(stage('prepare',counter,5));if(stove)stages.push(stage('cook',stove,12));
   if(chair)stages.push({...stage('sit',chair,3),tableId:table.id});
   stages.push({...stage('eat',chair||table||o,24,'Hunger'),tableId:table?.id,seated:!!chair});
   if(chair)stages.push(stage('stand',chair,3));if(washer)stages.push(stage(washer.type==='dishwasher'?'loadDishwasher':'washDish',washer,8));else stages.push(stage('clearPlate',null,4));
  }else if(need==='Energy'){stages=[stage('getInBed',o,5),stage('sleep',o,action==='nap'?22:65,'Energy'),stage('getOutBed',o,5)];}
  else if(o.type==='pool'){stages=[stage('enterPool',o,5),stage('swim',o,action==='float'?25:45,'Fun'),stage('exitPool',o,5)];}
  else if(o.type==='sofa'&&action==='nap'){stages=[stage('sit',o,3),stage('sofaNap',o,25,'Energy'),stage('stand',o,3)];}
  else if(['tv','sofa'].includes(o.type)){if(action?.startsWith('channel:')){o.channel=action.split(':')[1];o.on=true;}const sofa=o.type==='sofa'?o:findObject(s,p,['sofa']),tv=o.type==='tv'?o:findObject(s,p,['tv']);if(sofa)stages.push(stage('sit',sofa,3));stages.push({...stage('watchTV',sofa||o,35,'Fun'),tvId:tv?.id,seated:!!sofa});if(sofa)stages.push(stage('stand',sofa,3));}
  else if(o.type==='shower')stages=[stage('shower',o,action==='quickShower'?12:35,'Hygiene')];
  else if(o.type==='toilet')stages=[stage('sit',o,3),stage('toilet',o,25,'Bladder'),stage('stand',o,3)];
  else if(o.type==='sink')stages=[stage('washHands',o,25,'Hygiene')];
  else if(o.type==='bookcase')stages=[stage('read',o,35,'Fun')];
  else if(need)stages=[stage('relax',o,30,need)];else return false;
 }else if(t.kind==='walk'){const route=path(s,p,t);if(!route)return false;p.path=route;p.task={...t,stages:[],reserved:[]};p.activity='Walking';return true;}
 else if(t.kind==='social'){
  const other=s.people.find(q=>q.id===t.id&&!q.job);const action=t.action||'talk';if(!other||other.id===p.id||socialReason(s,p,other,action))return false;
  if(other.task||other.path.length||other.heldBy)return false;const route=approach(s,p,{x:Math.round(other.x),z:Math.round(other.z)});if(!route)return false;
  const spec=SOCIAL.find(v=>v.id===action);partner=other;
  if(spec.bed){const bed=findObject(s,p,['doublebed']);const partnerRoute=bed&&approach(s,other,bed);if(!bed||!partnerRoute)return false;other.path=partnerRoute;stages=[stage('getInBed',bed,5),stage('privateTime',bed,20),stage('getOutBed',bed,5)];}
  else {p.path=route;stages=[stage(action,null,action==='marry'?18:12,'Social')];}
  t={...t,action,partnerId:other.id};other.heldBy=p.id;other.activity='Meeting '+p.name;
 }
 else if(t.kind==='work'){if(p.ageYears<18)return false;if(s.car?.phase!=='idle')return false;const route=path(s,p,{x:0,z:10});if(!route)return false;p.path=route;stages=[stage('waitCar',null,0)];s.car={phase:'arriving',x:-16,timer:0,passenger:p.id};}
 else return false;
 p.task={...t,need,stages,index:0,phase:'travel',progress:0,reserved:[...new Set(stages.flatMap(q=>[q.objectId,q.tableId]).filter(Boolean))],meal};
 if(!p.path.length&&!startStage(s,p)){p.task=null;if(partner)partner.heldBy=null;return false;}return true;
}
const LABELS={talk:'Talking',joke:'Telling a joke',compliment:'Giving a compliment',hug:'Hugging',flirt:'Flirting',kiss:'Kissing',propose:'Proposing',marry:'Getting married',privateTime:'Private time',sofaNap:'Napping',clean:'Cleaning',makeBed:'Making the bed',toggle:'Switching power',outfit:'Changing outfit',hair:'Styling hair',water:'Watering plants',admire:'Admiring',study:'Studying',computer:'Playing a game',workHome:'Working from home',runWasher:'Running dishwasher',sitDown:'Sitting',retrieve:'Choosing ingredients',prepare:'Preparing food',cook:'Cooking',sit:'Sitting down',eat:'Eating',stand:'Standing up',loadDishwasher:'Loading dishwasher',washDish:'Washing plate',clearPlate:'Clearing plate',getInBed:'Getting into bed',sleep:'Sleeping',getOutBed:'Getting out of bed',enterPool:'Entering pool',swim:'Swimming',exitPool:'Leaving pool',watchTV:'Watching TV',shower:'Showering',toilet:'Using toilet',washHands:'Washing hands',read:'Reading',relax:'Relaxing',chat:'Chatting',waitCar:'Waiting for car'};
function startStage(s,p){const t=p.task,st=t.stages[t.index];if(!st){completeAction(s,p,t);p.task=null;p.activity='Idle';return true;}t.progress=0;p.remaining=st.duration;t.phase='travel';if(st.objectId){const obj=s.objects.find(o=>o.id===st.objectId);if(!obj)return false;const route=approach(s,p,obj);if(!route)return false;p.path=route;}p.activity=p.path.length?(t.meal&&t.index>1?'Carrying '+(t.index>t.stages.findIndex(st=>st.kind==='eat')?'plate':t.meal.name):'Walking'):LABELS[st.kind];if(!p.path.length)t.phase=st.kind;return true;}
export function activeStage(p){return p.task?.stages?.[p.task.index]||null;}
export function advanceAges(s){if(!s.aging)return;for(const p of [...s.people]){p.ageYears+=1;if(p.ageYears>=90&&s.people.length>1){s.familyHistory.push({event:'remembered',id:p.id,name:p.name,generation:p.generation,parents:p.parents,day:s.day,ageYears:p.ageYears});s.people=s.people.filter(q=>q!==p);}}}
function updateCar(s,dt){const c=s.car;if(!c||c.phase==='idle')return;if(c.phase==='leaving'){c.x+=dt*.8;if(c.x>=16)s.car={phase:'idle',x:-16,timer:0,passenger:null};return;}const p=s.people.find(p=>p.id===c.passenger);if(!p){s.car={phase:'idle',x:-16,timer:0,passenger:null};return;}
 if(c.phase==='arriving'||c.phase==='returning'){c.x=Math.min(0,c.x+dt*.8);if(c.x===0){c.phase=c.phase==='arriving'?'parked':'alighting';c.timer=0;}}
 else if(c.phase==='parked'){if(p.task?.kind!=='work'){c.phase='leaving';c.passenger=null;return;}if(!p.path.length){c.phase='boarding';c.timer=0;p.activity='Getting into car';}}
 else if(c.phase==='boarding'){c.timer+=dt;if(c.timer>=5){c.phase='departing';p.task=null;p.job=180;p.activity='Commuting';}}
 else if(c.phase==='departing'){c.x+=dt*.8;if(c.x>=16){c.phase='away';p.activity='At work';}}
 else if(c.phase==='away'){p.job=Math.max(0,p.job-dt);if(!p.job){c.phase='returning';c.x=-16;}}
 else if(c.phase==='alighting'){c.timer+=dt;p.activity='Getting out of car';if(c.timer>=5){s.money+=450;p.x=0;p.z=10;p.activity='Home from work';c.phase='leaving';c.passenger=null;}}
 else if(c.phase==='leaving'){c.x+=dt*.8;if(c.x>=16)s.car={phase:'idle',x:-16,timer:0,passenger:null};}
}
export function tick(s,dt,autonomy=true){
 if(!s.livingVersion)upgradeState(s);if(dt<=0)return;for(const p of [...s.people])if(p.pregnancy&&s.day>=p.pregnancy.dueDay&&s.people.length<6){const child=welcomeChild(s,p.id,p.pregnancy.partnerId);if(child)p.pregnancy=null;}
 s.minutes+=dt;while(s.minutes>=1440){s.minutes-=1440;s.day++;s.money-=Math.min(s.money,90+s.objects.length*2);advanceAges(s);}
 updateCar(s,dt);
 for(const p of s.people){
  for(const n of NEEDS)p.needs[n]=Math.max(0,p.needs[n]-dt*({Hunger:.08,Energy:.05,Hygiene:.045,Bladder:.065,Fun:.035,Social:.028}[n]));
  if(p.job>0||s.car.passenger===p.id&&['boarding','departing','away','returning','alighting'].includes(s.car.phase))continue;
  if(p.path.length){const[tx,tz]=p.path[0],dx=tx-p.x,dz=tz-p.z,d=Math.hypot(dx,dz),move=dt*.25;if(d<=move){p.x=tx;p.z=tz;p.path.shift();}else{p.x+=dx/d*move;p.z+=dz/d*move;}continue;}
  if(p.heldBy){const leader=s.people.find(q=>q.id===p.heldBy);if(leader?.task?.partnerId===p.id){p.activity=leader.task.phase==='travel'?'Waiting for '+leader.name:LABELS[leader.task.phase]||'Together';continue;}p.heldBy=null;}
  if(p.task){const t=p.task;if(t.kind==='walk'){p.task=null;p.activity='Idle';continue;}const st=activeStage(p);if(!st){cancelAction(p);continue;}
   if(t.partnerId){const partner=s.people.find(q=>q.id===t.partnerId);if(!partner||partner.heldBy!==p.id){cancelAction(p);continue;}if(partner.path.length)continue;}if(t.phase==='travel'){t.phase=st.kind;p.remaining=st.duration;}p.activity=LABELS[st.kind]+(st.kind==='eat'?' '+t.meal.name:'');
   if(st.kind==='waitCar')continue;p.remaining-=dt;t.progress=Math.min(1,1-p.remaining/Math.max(.01,st.duration));
   if(st.need){const rate=st.need==='Hunger'?3:st.need==='Energy'?1.3:2;p.needs[st.need]=Math.min(100,p.needs[st.need]+dt*rate);}
   if(p.remaining<=0){t.index++;if(!startStage(s,p)){cancelAction(p);p.activity='Action interrupted: blocked or missing furniture';}}
   continue;
  }
  if(p.queue.length){begin(s,p,p.queue.shift());continue;}
  p.think=(p.think||0)-dt;if(autonomy&&p.think<=0){p.think=8;const lowest=NEEDS.reduce((a,b)=>p.needs[a]<p.needs[b]?a:b);if(p.needs[lowest]<55){if(lowest==='Social'){const other=s.people.find(q=>q.id!==p.id&&!q.job&&!q.heldBy&&!q.task);if(other)begin(s,p,{kind:'social',id:other.id,action:'talk'});}else{const preference=p.trait==='Active'?'pool':p.trait==='Bookworm'?'bookcase':p.trait==='Creative'?'tv':null;const choices=s.objects.filter(o=>item(o.type).need===lowest).sort((a,b)=>(b.type===preference)-(a.type===preference));for(const o of choices)if(begin(s,p,{kind:'object',id:o.id}))break;}}}
 }
}
export function validSave(s){return s&&s.version===1&&Number.isFinite(s.money)&&Number.isFinite(s.minutes)&&Array.isArray(s.people)&&s.people.length>0&&s.people.length<=6&&s.people.every(p=>typeof p.name==='string'&&p.name.length<=24&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&p.needs&&NEEDS.every(n=>Number.isFinite(p.needs[n]))&&Array.isArray(p.path)&&Array.isArray(p.queue))&&Array.isArray(s.objects)&&s.objects.length<=600&&s.objects.every(o=>item(o.type)&&inside(o.x,o.z))&&s.floors&&s.walls&&s.relationships;}

export const relationshipKey=(a,b)=>[a.id,b.id].sort().join(':');
export function relationship(s,a,b){const key=relationshipKey(a,b),old=s.relationships[key];if(!old||typeof old==='number')s.relationships[key]={friendship:typeof old==='number'?old:0,romance:0,status:'acquaintances'};return s.relationships[key];}
export function related(s,a,b){const people=[...s.people,...s.familyHistory];function ancestors(p,seen=new Set()){for(const id of p.parents||[])if(!seen.has(id)){seen.add(id);const q=people.find(v=>v.id===id);if(q)ancestors(q,seen);}return seen;}const aa=ancestors(a),bb=ancestors(b);return aa.has(b.id)||bb.has(a.id)||[...aa].some(id=>bb.has(id));}
export function socialReason(s,a,b,id){const spec=SOCIAL.find(v=>v.id===id);if(!spec)return 'Unknown interaction';const r=relationship(s,a,b);if(spec.adult&&(a.ageYears<18||b.ageYears<18||related(s,a,b)))return 'Available to unrelated adults';if(spec.adult&&[a,b].some((p,i)=>p.spouse&&p.spouse!==[b,a][i].id))return 'Already married to someone else';if(r.friendship<spec.friend)return 'Friendship '+spec.friend+' needed';if(r.romance<spec.romance)return 'Romance '+spec.romance+' needed';if(id==='propose'&&['engaged','married'].includes(r.status))return 'Already '+r.status;if(id==='marry'&&r.status!=='engaged')return r.status==='married'?'Already married':'Propose first';if(id==='tryBaby'&&(a.pregnancy||b.pregnancy||s.people.length>=6))return 'Baby expected or household full';if(spec.bed&&!findObject(s,a,['doublebed']))return 'An accessible double bed is needed';return null;}
function completeAction(s,p,t){
 const o=s.objects.find(o=>o.id===t.id),action=t.action;
 if(t.kind==='social'){const q=s.people.find(q=>q.id===t.partnerId),spec=SOCIAL.find(v=>v.id===action);if(!q||!spec)return;const r=relationship(s,p,q);r.friendship=Math.min(100,r.friendship+spec.gain);r.romance=Math.min(100,r.romance+(spec.love||0));r.status=spec.status||(r.status==='acquaintances'&&r.friendship>=30?'friends':r.status);q.needs.Social=Math.min(100,q.needs.Social+15);q.heldBy=null;q.activity='Idle';if(action==='marry'){p.spouse=q.id;q.spouse=p.id;}if(action==='tryBaby'){const parent=p.gender==='female'?p:q.gender==='female'?q:p;parent.pregnancy={partnerId:parent===p?q.id:p.id,dueDay:s.day+2};}s.familyHistory.push({event:action,day:s.day,people:[p.id,q.id]});return;}
 if(!o)return;if(action==='toggle')o.on=o.on===false;else if(action==='makeBed')o.made=true;else if(action==='clean'||action==='runWasher')o.clean=true;else if(action==='water')o.watered=s.day;else if(action==='outfit'){const colors=['#708dc9','#bd7965','#4b9f96','#c39462','#a68bbc'];p.color=colors[(colors.indexOf(p.color)+1)%colors.length];}else if(action==='hair'){const styles=['short','bob','long','ponytail','curly','bun','sidepart','pixie'];p.hairStyle=styles[(styles.indexOf(p.hairStyle)+1)%styles.length];}else if(action==='workHome')s.money+=90;else if(action==='study')p.skill=(p.skill||0)+1;
 if(t.stages.some(st=>st.kind==='sleep'))o.made=false;
}
