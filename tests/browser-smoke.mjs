import {chromium} from 'playwright';
import assert from 'node:assert/strict';import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:8080');await page.waitForFunction(()=>!!window.gameDebug);
 await page.waitForTimeout(500);
 assert.equal(await page.locator('#personName').textContent(),'Maya');
 let snap=await page.evaluate(()=>window.gameDebug.snapshot());assert.ok(snap.render.calls>0&&snap.render.calls<150,'draw calls: '+snap.render.calls);
 await fs.mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/household.png'});
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
 await page.locator('#vr').click();assert.match(await page.locator('#notice').textContent(),/VR is unavailable|Could not enter VR/);
 await page.setViewportSize({width:390,height:844});assert.ok(await page.locator('#vr').isVisible());assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);await page.screenshot({path:'test-results/mobile.png'});
 assert.deepEqual(errors,[]);await fs.writeFile('test-results/report.json',JSON.stringify({passed:true,checks:['WebGL initialization','draw call budget','floor placement and cost','undo','furniture purchase','furniture interaction raycast','family creation','save and reload','view toggle','wall mode','audio toggle','non-XR fallback','mobile viewport'],initialDrawCalls:snap.render.calls,errors},null,2));console.log('Browser smoke checks passed; draw calls:',snap.render.calls);
}finally{await browser.close();}
