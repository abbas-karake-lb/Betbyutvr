import * as T from './vendor/three.module.js';
import {PRESETS,FACES,HAIRSTYLES} from './appearance.js';import {createHuman} from './living-art.js';import {person} from './sim.js';
const $=id=>document.getElementById(id);
export function readAppearance(){return {gender:$('newGender').value,ageYears:+$('newAge').value,skin:$('newSkin').value,hair:$('newHair').value,hairStyle:$('newStyle').value,trait:$('newTrait').value,eyes:$('newEyes').value,face:$('newFace').value,outfit:$('newOutfit').value,glasses:$('newGlasses').checked,beard:$('newBeard').checked};}
export function setupCharacterEditor(){
 for(const [id,list]of [['newStyle',HAIRSTYLES],['newFace',FACES]])$(id).replaceChildren(...list.map(v=>{const o=document.createElement('option');o.value=o.textContent=v;return o;}));
 $('newPreset').replaceChildren(...PRESETS.map((p,i)=>{const o=document.createElement('option');o.value=i;o.textContent=p.name+' · '+p.hairStyle;return o;}));
 let renderer,scene,camera,model;function preview(){if(!renderer){renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setSize(280,270);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;$('characterPreview').append(renderer.domElement);scene=new T.Scene();scene.add(new T.HemisphereLight('#fff4dd','#607a85',3));const sun=new T.DirectionalLight('#fff4e5',2);sun.position.set(-3,5,4);scene.add(sun);camera=new T.PerspectiveCamera(31,280/270,.05,10);}
 if(model){scene.remove(model);model.traverse(m=>{if(m.isSkinnedMesh){m.geometry.dispose();m.skeleton.dispose();}});}const p=person('Preview',0,0,$('newColor').value,readAppearance());model=createHuman(p);model.rotation.y=.23;scene.add(model);const scale=model.scale.x;camera.position.set(0,1.05*scale,3.45*scale);camera.lookAt(0,.96*scale,0);renderer.render(scene,camera);
 }
 $('newPreset').onchange=()=>{const p=PRESETS[+$('newPreset').value];for(const [field,id]of Object.entries({name:'newName',gender:'newGender',skin:'newSkin',hair:'newHair',hairStyle:'newStyle',eyes:'newEyes',face:'newFace',outfit:'newOutfit',color:'newColor'}))$(id).value=p[field];$('newGlasses').checked=p.glasses;$('newBeard').checked=p.beard;preview();};
 $('personDialog').addEventListener('input',preview);return preview;
}
