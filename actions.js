export const MEALS=[{id:'pasta',name:'Tomato pasta',color:'#c76c37',price:8},{id:'rice',name:'Garden rice',color:'#ded295',price:6},{id:'stew',name:'Vegetable stew',color:'#8fac59',price:7},{id:'pancakes',name:'Berry pancakes',color:'#bf955a',price:9},{id:'soup',name:'Pumpkin soup',color:'#dc953c',price:6},{id:'fish',name:'Grilled fish',color:'#d8bba0',price:12}];
export const SOCIAL=[
 {id:'talk',label:'Talk',friend:0,romance:0,gain:8},
 {id:'joke',label:'Tell a joke',friend:8,romance:0,gain:10},
 {id:'compliment',label:'Give a compliment',friend:18,romance:0,gain:7},
 {id:'hug',label:'Friendly hug',friend:30,romance:0,gain:8},
 {id:'flirt',label:'Flirt',friend:30,romance:0,gain:4,love:12,adult:true},
 {id:'kiss',label:'Kiss',friend:45,romance:30,gain:5,love:10,adult:true},
 {id:'propose',label:'Propose marriage',friend:65,romance:55,gain:5,love:10,adult:true,status:'engaged'},
 {id:'marry',label:'Get married',friend:70,romance:65,gain:10,love:10,adult:true,status:'married'},
 {id:'privateTime',label:'Share a romantic night',friend:70,romance:70,gain:3,love:5,adult:true,bed:true},
 {id:'tryBaby',label:'Try for a baby',friend:75,romance:75,gain:3,love:3,adult:true,bed:true}
];
const a=(id,label)=>({id,label});
export function objectActions(type){
 if(['fridge','stove'].includes(type))return [...MEALS.map(m=>a('meal:'+m.id,m.name+' · $'+m.price)),...(type==='fridge'?[a('snack','Quick cold snack · $3')]:[]),a('clean','Clean appliance')];
 const groups={bed:[a('sleep','Sleep'),a('nap','Take a nap'),a('makeBed','Make the bed')],doublebed:[a('sleep','Sleep'),a('nap','Take a nap'),a('makeBed','Make the bed')],counter:[a('snack','Prepare a snack · $3'),a('clean','Clean the counter')],dishwasher:[a('runWasher','Run dishwasher'),a('clean','Clean dishwasher')],table:[a('relax','Relax at the table'),a('clean','Wipe the table')],chair:[a('sitDown','Sit down'),a('clean','Clean chair')],sofa:[a('watchTV','Watch television'),a('nap','Nap on the sofa'),a('clean','Clean sofa')],tv:[a('channel:nature','Watch nature'),a('channel:comedy','Watch cartoons'),a('channel:news','Watch the news'),a('toggle','Turn on / off')],toilet:[a('toilet','Use toilet'),a('clean','Clean toilet')],shower:[a('shower','Take a shower'),a('quickShower','Quick rinse'),a('clean','Clean shower')],sink:[a('washHands','Wash hands'),a('washDish','Wash dishes'),a('clean','Clean basin')],dresser:[a('outfit','Change outfit'),a('hair','Change hairstyle'),a('clean','Tidy dresser')],lamp:[a('toggle','Turn on / off'),a('clean','Dust lamp')],bookcase:[a('read','Read a novel'),a('study','Study a skill'),a('clean','Organize books')],desk:[a('computer','Play a computer game'),a('workHome','Work from home · +$90'),a('study','Study at the desk')],pool:[a('swim','Go swimming'),a('float','Relax in the water'),a('clean','Clean the pool')],plant:[a('water','Water plant'),a('admire','Admire plant')],tree:[a('water','Water tree'),a('admire','Enjoy the shade')],pine:[a('water','Water tree'),a('admire','Enjoy the shade')],flowers:[a('water','Water flowers'),a('admire','Admire flowers')],rug:[a('clean','Vacuum the rug'),a('admire','Admire the room')],bench:[a('sitDown','Sit and relax'),a('clean','Clean bench')],fence:[a('clean','Repaint fence'),a('admire','Admire the garden')]};
 return groups[type]||[a('admire','Look at this')];
}
