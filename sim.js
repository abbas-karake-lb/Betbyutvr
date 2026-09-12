export const N=24, NEEDS=['Hunger','Energy','Hygiene','Bladder','Fun','Social'];
export const CATALOG=[
 ['floor','Oak floor',8,'Build','#c99057'],['tile','Blue tile',10,'Build','#9dcbd0'],['stone','Stone path',6,'Build','#bdc3b9'],['wall','Cream wall',40,'Build','#ecddbb'],['brick','Brick wall',50,'Build','#bd7358'],['door','Doorway',65,'Build','#906a46'],['window','Window wall',85,'Build','#77bacb'],
 ['bed','Single bed',280,'Bedroom','#689bb8','Energy'],['doublebed','Double bed',480,'Bedroom','#c58b8b','Energy'],['dresser','Dresser',130,'Bedroom','#a3734e'],['lamp','Floor lamp',65,'Bedroom','#efd491'],
 ['fridge','Fridge',320,'Kitchen','#c1d9d8','Hunger'],['stove','Cooker',220,'Kitchen','#455965','Hunger'],['counter','Counter',90,'Kitchen','#e3cba4'],['table','Dining table',120,'Kitchen','#b08558','Social'],['chair','Dining chair',45,'Kitchen','#ce915d'],
 ['toilet','Toilet',180,'Bathroom','#edf0eb','Bladder'],['shower','Shower',260,'Bathroom','#83b8c0','Hygiene'],['sink','Basin',100,'Bathroom','#e0e9e3','Hygiene'],
 ['sofa','Sofa',240,'Living','#d48652','Fun'],['tv','Television',300,'Living','#34444a','Fun'],['bookcase','Bookcase',140,'Living','#bd915d','Fun'],['desk','Work desk',170,'Living','#bd915d'],['rug','Round rug',55,'Living','#ddab6d'],['plant','House plant',40,'Living','#5d9473'],
 ['tree','Maple tree',110,'Garden','#6b9868'],['pine','Pine tree',95,'Garden','#43786b'],['flowers','Flower bed',35,'Garden','#e6a3a8'],['bench','Garden bench',80,'Garden','#a68a61','Social'],['fence','Picket fence',25,'Garden','#e8dfc6']
].map(([id,name,price,category,color,need])=>({id,name,price,category,color,need}));
export const item=id=>CATALOG.find(c=>c.id===id);
export const key=(x,z)=>`${x},${z}`;
export const edge=(x,z,o)=>`${x},${z},${o}`;
export const inside=(x,z)=>Number.isInteger(x)&&Number.isInteger(z)&&x>=-12&&z>=-12&&x<12&&z<12;
export function blocked(s,x,z){return !inside(x,z)||s.objects.some(o=>o.x===x&&o.z===z&&!['rug','flowers'].includes(o.type));}
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
export function person(name,x,z,color='#4b9f96'){return {id:Date.now()+serial++,name,x,z,color,skin:'#d0a078',needs:Object.fromEntries(NEEDS.map(n=>[n,75+Math.random()*20])),queue:[],path:[],activity:'Idle',task:null,remaining:0,job:0};}
export function household(preset=0){
 const s={version:1,money:16000,minutes:480,day:1,objects:[],floors:{},walls:{},people:[],relationships:{}};
 const add=(type,x,z,rot=0)=>s.objects.push({id:++serial,type,x,z,rot});
 if(preset===2){s.people=[person('Alex',0,4)];return s;}
 const left=preset===0?-5:-6,right=preset===0?5:6,back=-5,front=4;
 for(let x=left;x<right;x++)for(let z=back;z<front;z++)s.floors[key(x,z)]=x>=2&&z<-1?'tile':'floor';
 for(let z=back;z<front;z++){s.walls[edge(left,z,0)]=z===-2?'window':'wall';s.walls[edge(right,z,0)]=z===1?'window':'wall';}
 for(let x=left;x<right;x++){s.walls[edge(x,back,1)]=x===-2||x===2?'window':'wall';s.walls[edge(x,front,1)]=x===0?'door':x===-3||x===3?'window':'wall';}
 for(let z=-5;z<0;z++)s.walls[edge(1,z,0)]=z===-1?'door':'wall';
 for(let x=left;x<1;x++)s.walls[edge(x,-1,1)]=x===-1?'door':'wall';
 add('bed',-4,-4);add('doublebed',-2,-4);add('dresser',-4,-2);add('lamp',-1,-4);
 add('toilet',4,-4);add('shower',2,-4);add('sink',4,-2);
 add('fridge',4,0);add('stove',4,1);add('counter',4,2);add('table',2,2);add('chair',2,3);
 add('sofa',-3,1);add('tv',-3,3);add('rug',-2,2);add('bookcase',-5,0);add('plant',-4,3);add('desk',-1,0);
 add('tree',-8,-6);add('tree',8,3);add('pine',-8,5);add('pine',8,-7);add('bench',-4,7);add('flowers',-3,5);add('flowers',3,5);
 for(let z=4;z<11;z++)s.floors[key(0,z)]='stone';
 s.people=[person(preset===0?'Maya':'Nora',-1,2,'#dd8264'),person(preset===0?'Adam':'Omar',1,1,'#4b9f96')];
 if(preset===1)s.people.push(person('Lina',0,3,'#a28bcb'));
 return s;
}
export function approach(s,p,obj){let best=null;for(const [x,z]of[[obj.x+1,obj.z],[obj.x-1,obj.z],[obj.x,obj.z+1],[obj.x,obj.z-1]]){const route=path(s,p,{x,z});if(route&&(!best||route.length<best.length))best=route;}return best;}
export function order(s,p,task,append=false){if(p.job>0)return false;if(append){if(p.queue.length>=8)return false;p.queue.push(task);return true;}p.task=null;p.path=[];p.queue=[];p.remaining=0;return begin(s,p,task);}
function begin(s,p,t){let route=[];
 if(t.kind==='object'){const o=s.objects.find(o=>o.id===t.id);if(!o)return false;route=approach(s,p,o);t={...t,need:item(o.type).need,label:item(o.type).name};if(!t.need)return false;}
 else if(t.kind==='walk'){route=path(s,p,t);}
 else if(t.kind==='social'){const other=s.people.find(v=>v.id===t.id);if(!other||other.job>0)return false;route=approach(s,p,{x:Math.round(other.x),z:Math.round(other.z)});}
 else if(t.kind==='work'){route=path(s,p,{x:0,z:10});}
 if(!route)return false;p.task=t;p.path=route;p.activity=route.length?'Walking':(t.label||t.kind);p.remaining=t.kind==='object'?35:t.kind==='social'?25:0;return true;
}
export function tick(s,dt,autonomy=true){
 s.minutes+=dt;while(s.minutes>=1440){s.minutes-=1440;s.day++;const bill=Math.min(s.money,90+s.objects.length*2);s.money-=bill;}
 for(const p of s.people){
 for(const n of NEEDS)p.needs[n]=Math.max(0,p.needs[n]-dt*({Hunger:.08,Energy:.05,Hygiene:.045,Bladder:.065,Fun:.035,Social:.028}[n]));
 if(p.job>0){p.job-=dt;p.activity='At work';if(p.job<=0){p.job=0;s.money+=450;p.activity='Home from work';}continue;}
 if(p.path.length){const [tx,tz]=p.path[0],dx=tx-p.x,dz=tz-p.z,d=Math.hypot(dx,dz),move=dt*.19;if(d<=move){p.x=tx;p.z=tz;p.path.shift();}else{p.x+=dx/d*move;p.z+=dz/d*move;}continue;}
 if(p.task){const t=p.task;p.activity=t.kind==='object'?t.label:t.kind==='social'?'Chatting':t.kind==='work'?'Going to work':'Idle';
 if(t.kind==='object'){p.needs[t.need]=Math.min(100,p.needs[t.need]+dt*1.9);p.remaining-=dt;}
 if(t.kind==='social'){p.needs.Social=Math.min(100,p.needs.Social+dt*2);const other=s.people.find(v=>v.id===t.id);if(other){other.needs.Social=Math.min(100,other.needs.Social+dt);const k=[p.id,other.id].sort().join(':');s.relationships[k]=Math.min(100,(s.relationships[k]||0)+dt*.15);}p.remaining-=dt;}
 if(t.kind==='work'){p.job=180;p.activity='At work';}
 if(p.remaining<=0||t.kind==='walk'||t.kind==='work'){p.task=null;p.activity=p.job?'At work':'Idle';}continue;}
 if(p.queue.length){begin(s,p,p.queue.shift());continue;}
 if(autonomy){const lowest=NEEDS.reduce((a,b)=>p.needs[a]<p.needs[b]?a:b);if(p.needs[lowest]<55){
 if(lowest==='Social'){const other=s.people.find(q=>q.id!==p.id&&!q.job);if(other)begin(s,p,{kind:'social',id:other.id});}
 else{let choices=s.objects.filter(o=>item(o.type).need===lowest).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z));for(const o of choices)if(begin(s,p,{kind:'object',id:o.id}))break;}}
 }
 }
}
export function validSave(s){return s&&s.version===1&&Number.isFinite(s.money)&&Number.isFinite(s.minutes)&&Array.isArray(s.people)&&s.people.length>0&&s.people.length<=6&&s.people.every(p=>typeof p.name==='string'&&p.name.length<=24&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&p.needs&&NEEDS.every(n=>Number.isFinite(p.needs[n]))&&Array.isArray(p.path)&&Array.isArray(p.queue))&&Array.isArray(s.objects)&&s.objects.length<=600&&s.objects.every(o=>item(o.type)&&inside(o.x,o.z))&&s.floors&&s.walls&&s.relationships;}
