export const HAIRSTYLES=['short','sidepart','curly','pixie','bob','long','ponytail','bun'];
export const FACES=['oval','heart','round','angular','soft','long'];
const names=['Mira','Leila','Yara','Nora','Jade','Lina','Aya','Rana','Adam','Omar','Rami','Zein','Karim','Sam','Noah','Alex'];
export const PRESETS=names.map((name,i)=>({name,gender:i<8?'female':'male',ageYears:27,face:FACES[i%6],skin:['#e8bd9e','#c99b77','#ae7957','#81573e'][i%4],hair:['#392b24','#71472d','#ba8a50','#1e2429'][i%4],eyes:['#51766e','#684834','#587b9f','#7e8049'][i%4],hairStyle:HAIRSTYLES[(i+4)%8],color:['#b77d95','#709ba1','#6c85b1','#ba9471'][i%4],outfit:i<8&&i%2===0?'dress':'casual',glasses:i===5||i===13,beard:i===9||i===12}));
