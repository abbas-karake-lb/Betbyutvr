import {chromium} from 'playwright';
import assert from 'node:assert/strict';import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:8080');await page.waitForFunction(()=>!!window.gameDebug);
 await page.waitForTimeout(500);
 assert.equal(await page.locator('#personName').textContent(),'Maya');
 let snap=await page.evaluate(()=>window.gameDebug.snapshot());assert.ok(snap.render.calls>0&&snap.render.calls<350,'draw calls: '+snap.render.calls);
 await fs.mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/household.png'});
 await livingChecks(page);
 await page.locator('#lot').selectOption('2');await page.locator('#build').click();
 let before=await page.evaluate(()=>window.gameDebug.snapshot());const point=await page.evaluate(()=>window.gameDebug.project(2,.02,0));await page.mouse.click(point.x,point.y);
 let after=await page.evaluate(()=>window.gameDebug.snapshot());assert.equal(Object.keys(after.state.floors).length,Object.keys(before.state.floors).length+1);assert.equal(after.state.money,before.state.money-8);
 await page.locator('#undo').click();after=await page.evaluate(()=>window.gameDebug.snapshot());assert.equal(after.state.money,before.state.money);assert.equal(Object.keys(after.state.floors).length,Object.keys(before.state.floors).length);
 await page.getByRole('button',{name:'Kitchen',exact:true}).click();await page.getByRole('button',{name:'Fridge $320',exact:true}).click();await page.mouse.click(point.x,point.y);
 after=await page.evaluate(()=>window.gameDebug.snapshot());assert.equal(after.state.objects.length,1);assert.equal(after.state.money,before.state.money-320);
 await page.locator('#live').click();const fridge=await page.evaluate(()=>window.gameDebug.project(2,.8,0));await page.mouse.click(fridge.x,fridge.y);assert.match(await page.locator('#notice').textContent(),/On my way/);
 await page.locator('#familyNew').click();await page.locator('#newName').fill('Test Resident');await page.locator('#addPerson').click();assert.equal(await page.locator('#personName').textContent(),'Test Resident');
 await page.locator('#save').click();await page.reload();await page.waitForFunction(()=>!!window.gameDebug);await page.locator('#lot').selectOption('2');assert.ok((await page.locator('#family').textContent()).includes('Test Resident'));
 await page.locator('#view').click();assert.equal((await page.evaluate(()=>window.gameDebug.snapshot())).walk,true);await page.locator('#view').click();assert.equal((await page.evaluate(()=>window.gameDebug.snapshot())).walk,false);
 await page.locator('#walls').click();assert.equal((await page.evaluate(()=>window.gameDebug.snapshot())).wallMode,2);
 await page.locator('#music').click();assert.match(await page.locator('#music').textContent(),/on/);await page.locator('#music').click();
 await page.locator('#vr').click();await page.waitForFunction(()=>/VR is unavailable|Could not enter VR/.test(document.getElementById('notice').textContent));assert.match(await page.locator('#notice').textContent(),/VR is unavailable|Could not enter VR/);
 await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>innerWidth===390&&document.querySelector('#game canvas').clientWidth===390);assert.ok(await page.locator('#vr').isVisible());assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);await page.screenshot({path:'test-results/mobile.png'});
 // Exercise the real panel and controller handlers with synthetic tracked poses.
 await page.setViewportSize({width:1440,height:1000});await page.locator('#view').click();
 const vrCheck=await page.evaluate(async()=>{
  const game=await import('/game.js'),T=await import('/vendor/three.module.js');
  const [right,left]=game.controllers;game.panel.visible=true;game.placePanel();
  for(const [i,c]of game.controllers.entries()){c.matrixAutoUpdate=true;c.visible=true;c.userData.source={handedness:i?'left':'right'};}
  // Put the controller origins in front of the menu, slightly below eye height.
  const panelCenter=game.panel.getWorldPosition(new T.Vector3());
  const facing=new T.Vector3(0,0,1).applyQuaternion(game.panel.quaternion);
  const side=new T.Vector3(1,0,0).applyQuaternion(game.panel.quaternion);
  function aim(c,x,y){const local=new T.Vector3((x/900-.5)*.9,(.5-y/1100)*1.1,0);const target=game.panel.localToWorld(local);c.quaternion.setFromRotationMatrix(new T.Matrix4().lookAt(c.position,target,new T.Vector3(0,1,0)));}
  right.position.copy(panelCenter).addScaledVector(facing,.8).addScaledVector(side,.18);right.position.y-=.25;
  left.position.copy(panelCenter).addScaledVector(facing,.8).addScaledVector(side,-.18);left.position.y-=.25;
  aim(right,650,350);aim(left,200,350);game.updateControllerPointers();
  const pixel=(x,y)=>Array.from(game.panelCanvas.getContext('2d').getImageData(x,y,1,1).data).slice(0,3);
  const hovered=pixel(480,335),activeHovered=pixel(55,335);
  const cursors=game.controllers.map(c=>c.userData.pointer.cursor.visible);
  document.body.classList.add('xr');window.vrPointerFixture={game,right,left,aim,pixel};
  return{hovered,activeHovered,cursors};
 });
 assert.deepEqual(vrCheck.hovered,[57,127,121]);assert.deepEqual(vrCheck.activeHovered,[255,225,160]);assert.deepEqual(vrCheck.cursors,[true,true]);
 await page.screenshot({path:'test-results/vr-pointer-hover.png'});
 const selection=await page.evaluate(()=>{const f=window.vrPointerFixture;f.right.dispatchEvent({type:'selectstart'});return window.gameDebug.snapshot().mode;});assert.equal(selection,'build');
 const cleared=await page.evaluate(()=>{const f=window.vrPointerFixture;for(const c of f.game.controllers)c.dispatchEvent({type:'disconnected'});f.game.updateControllerPointers();const result={cursors:f.game.controllers.map(c=>c.userData.pointer.cursor.visible),color:f.pixel(55,335)};f.game.panel.visible=false;document.body.classList.remove('xr');return result;});assert.deepEqual(cleared.cursors,[false,false]);assert.deepEqual(cleared.color,[49,89,97]);
 assert.deepEqual(errors,[]);await fs.writeFile('test-results/report.json',JSON.stringify({passed:true,checks:['WebGL initialization','full cooking and seated meal routine','visible meal depletion','dishwasher cleanup','sleep and swim poses','animated TV routine','child generation and aging toggle','draw call budget','floor placement and cost','undo','furniture purchase','furniture interaction raycast','family creation','save and reload','view toggle','wall mode','audio toggle','non-XR fallback','mobile viewport','VR cursor visibility','two-controller button hover','VR trigger matches hover','VR disconnect cleanup'],initialDrawCalls:snap.render.calls,errors},null,2));console.log('Browser smoke checks passed; draw calls:',snap.render.calls);
}finally{await browser.close();}

async function livingChecks(page){
 await page.locator('[data-speed="0"]').click();
 for(const [type,phase]of [['fridge','cook'],['fridge','eat'],['fridge','loadDishwasher'],['bed','sleep'],['pool','swim'],['tv','watchTV']]){
  const result=await page.evaluate(async({type,phase})=>{const game=await import('/game.js'),sim=await import('/sim.js');const s=game.state,p=s.people[0];sim.cancelAction(p);const ok=sim.order(s,p,{kind:'object',id:s.objects.find(o=>o.type===type).id});for(let i=0;i<2400&&p.task?.phase!==phase;i++)sim.tick(s,.25,false);game.effects.update(s,5);return {ok,phase:p.task?.phase,food:game.effects.meals.get(p.id)?.root.visible,door:game.effects.doors.find(d=>d.o.type==='dishwasher')?.door.rotation.x};},{type,phase});
  assert.ok(result.ok);assert.equal(result.phase,phase);if(['cook','eat','loadDishwasher'].includes(phase))assert.ok(result.food);
  await page.waitForTimeout(100);await page.evaluate(async()=>{const g=await import('/game.js'),p=g.personMeshes.get(g.state.people[0].id);window.savedCamera={position:g.camera.position.clone(),quaternion:g.camera.quaternion.clone()};g.camera.position.copy(p.position).add({x:2.4,y:2,z:3.4});g.camera.lookAt(p.position.x,p.position.y+.8,p.position.z);document.body.classList.add('xr');});await page.waitForTimeout(150);await page.screenshot({path:'test-results/routine-'+phase+'.png'});await page.evaluate(async()=>{const g=await import('/game.js');g.camera.position.copy(window.savedCamera.position);g.camera.quaternion.copy(window.savedCamera.quaternion);document.body.classList.remove('xr');});
 }
 const empty=await page.evaluate(async()=>{const g=await import('/game.js'),sim=await import('/sim.js'),s=g.state,p=s.people[0];sim.cancelAction(p);sim.order(s,p,{kind:'object',id:s.objects.find(o=>o.type==='fridge').id});for(let i=0;i<2400&&p.task?.phase!=='eat';i++)sim.tick(s,.25,false);p.task.progress=.99;g.effects.update(s,3);return g.effects.meals.get(p.id).root.userData.food.visible;});assert.equal(empty,false);
 await page.locator('#child').click();assert.match(await page.locator('#identity').textContent(),/Toddler.*Generation 2/);
 await page.locator('#aging').uncheck();assert.equal((await page.evaluate(()=>window.gameDebug.snapshot())).state.aging,false);
 await page.locator('[data-speed="1"]').click();
}
