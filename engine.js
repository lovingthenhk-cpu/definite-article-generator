/* Definite article generator — deterministic, heuristic historical model. */
const CASES={nom:"主格",acc:"対格",gen:"属格",dat:"与格",ins:"具格",abl:"奪格",loc:"所格",voc:"呼格",obl:"斜格",com:"共格",par:"分格",all:"向格",ela:"出格"};
const GENDERS={none:["x"],mf:["m","f"],mfn:["m","f","n"],cn:["c","n"],ai:["a","i"]};
const LABEL={x:"共通",m:"男性",f:"女性",n:"中性",c:"共性",a:"有生",i:"無生",sg:"単数",du:"双数",pl:"複数"};
// Row order nom acc gen dat ins abl loc. Source spelling is transliterated; null means no independent form.
const mk=(name,family,type,sg,pl,du={})=>({name,family,type,sg,pl,du});
const SOURCES=[
mk("古英語","germanic","指示詞・定冠詞",{m:"se þone þæs þǣm þȳ",f:"sēo þā þǣre þǣre",n:"þæt þæt þæs þǣm þȳ"},{x:"þā þā þāra þǣm"}),
mk("ゴート語","germanic","指示詞",{m:"sa þana þis þamma",f:"sō þō þizōs þizai",n:"þata þata þis þamma"},{m:"þai þans þizē þaim",f:"þōs þōs þizō þaim",n:"þō þō þizē þaim"}),
mk("古ノルド語","germanic","指示詞・定冠詞",{m:"inn inn ins inum",f:"in ina innar inni",n:"it it ins inu"},{m:"inir ina inna inum",f:"inar inar inna inum",n:"in in inna inum"}),
mk("古高ドイツ語","germanic","指示詞",{m:"dër dën dës dëmu diu",f:"diu dea dëra dëru",n:"daz daz dës dëmu diu"},{m:"dea dea dëro dëm",f:"deo deo dëro dëm",n:"diu diu dëro dëm"}),
mk("現代ドイツ語","germanic","定冠詞",{m:"der den des dem",f:"die die der der",n:"das das des dem"},{x:"die die der den"}),
mk("ラテン語 ille","romance","遠称指示詞",{m:"ille illum illīus illī - illō",f:"illa illam illīus illī - illā",n:"illud illud illīus illī - illō"},{m:"illī illōs illōrum illīs - illīs",f:"illae illās illārum illīs - illīs",n:"illa illa illōrum illīs - illīs"}),
mk("ラテン語 is","romance","照応指示詞",{m:"is eum eius eī - eō",f:"ea eam eius eī - eā",n:"id id eius eī - eō"},{m:"eī eōs eōrum eīs - eīs",f:"eae eās eārum eīs - eīs",n:"ea ea eōrum eīs - eīs"}),
mk("古フランス語","romance","定冠詞（代表形）",{m:"li le",f:"la la"},{m:"li les",f:"les les"}),
mk("フランス語","romance","定冠詞",{m:"le",f:"la"},{x:"les"}),
mk("イタリア語","romance","定冠詞（代表形）",{m:"il",f:"la"},{m:"i",f:"le"}),
mk("スペイン語","romance","定冠詞",{m:"el",f:"la"},{m:"los",f:"las"}),
mk("古代ギリシャ語","hellenic","定冠詞（転写）",{m:"ho ton tou tōi",f:"hē tēn tēs tēi",n:"to to tou tōi"},{m:"hoi tous tōn tois",f:"hai tas tōn tais",n:"ta ta tōn tois"},{m:"tō tō toin toin",f:"tō tō toin toin",n:"tō tō toin toin"}),
mk("ロシア語","slavic","遠称指示詞（転写）",{m:"tot tot togo tomu tem - tom",f:"ta tu toj toj toj - toj",n:"to to togo tomu tem - tom"},{x:"te te tex tem temi - tex"}),
mk("リトアニア語","baltic","指示詞",{m:"tas tą to tam tuo - tame",f:"ta tą tos tai ta - toje"},{m:"tie tuos tų tiems tais - tuose",f:"tos tas tų toms tomis - tose"}),
mk("サンスクリット語","indoaryan","指示詞（転写）",{m:"saḥ tam tasya tasmai tena tasmāt tasmin",f:"sā tām tasyāḥ tasyai tayā tasyāḥ tasyām",n:"tat tat tasya tasmai tena tasmāt tasmin"},{m:"te tān teṣām tebhyaḥ taiḥ tebhyaḥ teṣu",f:"tāḥ tāḥ tāsām tābhyaḥ tābhiḥ tābhyaḥ tāsu",n:"tāni tāni teṣām tebhyaḥ taiḥ tebhyaḥ teṣu"},{m:"tau tau tayoḥ tābhyām tābhyām tābhyām tayoḥ",f:"te te tayoḥ tābhyām tābhyām tābhyām tayoḥ",n:"te te tayoḥ tābhyām tābhyām tābhyām tayoḥ"})
];
const FAMILIES={germanic:"ゲルマン",romance:"ロマンス",hellenic:"ギリシャ",slavic:"スラヴ",baltic:"バルト",indoaryan:"インド・アーリア"};
function rng(seed){let h=2166136261;for(const c of seed){h=Math.imul(h^c.charCodeAt(0),16777619)}return()=>{h=(h+0x6D2B79F5)|0;let t=Math.imul(h^h>>>15,1|h);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296}}
function generate(o){
 const r=rng(String(o.seed)), pick=a=>a[Math.floor(r()*a.length)], chance=p=>r()<p, w=a=>{let x=r()*a.reduce((s,v)=>s+v[1],0);for(const [v,n] of a){x-=n;if(x<0)return v}return a.at(-1)[0]};
 const history=[], details=[], fam=o.family==="auto"?w([["germanic",35],["romance",35],["hellenic",10],["slavic",9],["baltic",5],["indoaryan",6]]):o.family;
 const primary=pick(SOURCES.filter(s=>s.family===fam));
 const gdist={romance:[["mf",70],["none",15],["mfn",12],["cn",2],["ai",1]],germanic:[["none",32],["mfn",34],["cn",23],["mf",10],["ai",1]],hellenic:[["mfn",80],["mf",12],["none",8]],slavic:[["mfn",75],["mf",10],["none",10],["ai",5]],baltic:[["mf",72],["mfn",23],["none",5]],indoaryan:[["mf",40],["mfn",42],["none",15],["ai",3]]};
 const gender=o.gender==="auto"?w(gdist[fam]):o.gender, gs=GENDERS[gender];
 const number=o.number==="auto"?w([["sp",88],["sdp",fam==="hellenic"||fam==="indoaryan"?20:7],["sg",4],["none",1]]):o.number;
 const nd=number==="none"?["sg"]:number==="sg"?["sg"]:number==="sdp"?["sg","du","pl"]:["sg","pl"];
 const caseWeights=fam==="romance"?[68,20,7,3,1,1,0,0]:fam==="germanic"?[32,20,12,22,8,4,1,1]:[15,14,13,20,15,12,8,3];
 const count=o.cases==="auto"?w(caseWeights.map((v,i)=>[i+1,v])):Number(o.cases);
 const patterns={1:[["nom"]],2:[["nom","obl"],["nom","acc"]],3:[["nom","acc","gen"],["nom","acc","dat"],["nom","obl","gen"]],4:[["nom","acc","gen","dat"]],5:[["nom","acc","gen","dat","ins"],["nom","acc","gen","dat","abl"],["nom","acc","gen","dat","loc"]],6:[["nom","acc","gen","dat","ins","loc"],["nom","acc","gen","dat","abl","loc"]],7:[["nom","acc","gen","dat","ins","abl","loc"]],8:[["nom","acc","gen","dat","ins","abl","loc","com"],["nom","acc","gen","dat","ins","abl","loc","voc"]],9:[["nom","acc","gen","dat","ins","abl","loc","com","par"]],10:[["nom","acc","gen","dat","ins","abl","loc","com","all","ela"]]};
 const cases=pick(patterns[count]||patterns[4]);
 const cols=[]; for(const n of nd){let split=gs.length>1&&(n==="sg"||(o.plural==="split"||(o.plural==="auto"&&chance(fam==="romance"?.72:.3))));if(o.plural==="merge"&&n!=="sg")split=false; for(const g of split?gs:["x"])cols.push({n,g,label:(number==="none"?"":LABEL[n])+(split?"・"+LABEL[g]:"")||"共通"})}
 const mix=Number(o.mix)/100, ir=Number(o.irregularity)/100, sources=[primary];
 if(chance(mix)){const sameFamily=chance(.55);const pool=SOURCES.filter(s=>s!==primary&&(!sameFamily||s.family===fam));const alt=pick(pool.length?pool:SOURCES.filter(s=>s!==primary));sources.push(alt);if(chance(mix*.13))sources.push(pick(SOURCES.filter(s=>!sources.includes(s))))}
 history.push("基本語源："+primary.name+"（"+primary.type+"）");
 const donorMap={};if(sources.length>1){const mode=pick(["number","gender","case"]);for(let i=1;i<sources.length;i++){const val=mode==="number"?pick(nd.length>1?nd.slice(1):nd):mode==="gender"?pick(gs):pick(cases.length>1?cases.slice(1):cases);donorMap[mode+":"+val]=sources[i];history.push("語形の部分置換："+(LABEL[val]||CASES[val])+"に"+sources[i].name+"系の形を採用")}}
 const idx=["nom","acc","gen","dat","ins","abl","loc"], suff={gen:["s","es","r"],dat:["m","i","n"],acc:["n","m","t"],ins:["y","e","is"],abl:["d","o","ta"],loc:["i","en","e"],voc:["e","a"],com:["mi","sin"],par:["s","en"],all:["te","ad"],ela:["de","ta"],obl:["n","m","r"]};
 const affix={};for(const k of Object.keys(suff))affix[k]=pick(suff[k]);
 const synth=chance(.5+ir*.35);
 const get=(s,n,g,k)=>{let set=s[n];let fallbackNumber=false;if(!Object.keys(set).length){set=s.pl;fallbackNumber=true}if(!Object.keys(set).length)set=s.sg;let target={c:"m",a:"m",i:"n",x:"m"}[g]||g;let key=set[target]?target:set.x?"x":Object.keys(set)[0];let arr=set[key].split(" ");let index=idx.indexOf(k==="obl"?"acc":k);let word=arr[index];let origin=word&&word!=="-"?"原形":"";
 if(!word||word==="-"){if(synth&&k!=="nom"){word=arr[0]+affix[k];origin="類推による格語尾 "+affix[k]}else{word=arr[k==="obl"?1:k==="ins"||k==="abl"||k==="loc"||k==="com"?3:0]||arr[0];if(word==="-")word=arr[0];origin="既存形と融合"}}if(fallbackNumber&&n==="du"){word+=pickDual;origin+="・双数語尾"}
 return {raw:word,origin,source:s.name}};
 const pickDual=pick(["u","i","o"]);
 const transformations=[
 ["þ→ð",/þ/g,"ð"],["þ→th",/þ/g,"th"],["þ→d",/þ/g,"d"],["語末母音脱落",/[aeiouy]$/g,""],["語末 m→n",/m$/g,"n"],["語末 s→r",/s$/g,"r"],["ll→l",/ll/g,"l"],["ai→e",/ai/g,"e"],["ae→e",/ae/g,"e"],["語頭 h 脱落",/^h/g,""],["語末 t→d",/t$/g,"d"],["語末 d 脱落",/d$/g,""],["語中 o→u",/o(?=.)/g,"u"],["語末 a→e",/a$/g,"e"],["語末 i→e",/i$/g,"e"],["語末子音重複の簡略化",/(.)\1$/g,"$1"],["語頭 d→ð",/^d/g,"ð"],["語末 n 脱落",/n$/g,""]];
 const selected=[];for(let i=0;i<Math.floor(1+r()*(2+ir*8));i++){const t=pick(transformations.filter(t=>!selected.includes(t)));if(t)selected.push(t)}
 const alphabet=[...new Set(String(o.alphabet).toLowerCase().normalize("NFC").replace(/[^\p{L}]/gu,""))];if(!alphabet.length)throw Error("使用文字を1文字以上指定してください");
 const clean=x=>{x=x.normalize("NFD").replace(/\p{M}/gu,"").toLowerCase().replace(/æ/g,"ae").replace(/œ/g,"oe").replace(/þ/g,alphabet.includes("ð")?"ð":"th").replace(/ð/g,alphabet.includes("ð")?"ð":"d");let y=[...x].map(c=>alphabet.includes(c)?c:({q:"k",j:"i",w:"v",u:"v",v:"u",z:"s",y:"i",k:"c",c:"k",x:"s"}[c]&&alphabet.includes({q:"k",j:"i",w:"v",u:"v",v:"u",z:"s",y:"i",k:"c",c:"k",x:"s"}[c])?{q:"k",j:"i",w:"v",u:"v",v:"u",z:"s",y:"i",k:"c",c:"k",x:"s"}[c]:"")).join("");return y||alphabet[0]};
 const applied=new Set();
 let rows=cases.map(k=>({case:k,label:count===1?"格変化なし":CASES[k],cells:cols.map(col=>{const s=donorMap["case:"+k]||donorMap["gender:"+col.g]||donorMap["number:"+col.n]||primary;const a=get(s,col.n,col.g,k);let word=a.raw;for(const [label,re,repl] of selected){let old=word;word=word.replace(re,repl);if(old!==word)applied.add(label)}return {...a,form:clean(word)}})}));
 if(applied.size)history.push("共通音韻変化："+[...applied].join("、"));
 for(let j=0;j<cols.length;j++){if(rows.length>1&&chance(.12+ir*.36)){const a=1+Math.floor(r()*(rows.length-1)),b=Math.floor(r()*a);if(rows[a].cells[j].form!==rows[b].cells[j].form){rows[a].cells[j].form=rows[b].cells[j].form;rows[a].cells[j].origin+="・格融合";history.push(cols[j].label+"："+rows[a].label+"と"+rows[b].label+"が融合")}}}
 if(rows.length>1&&chance(ir*.18)){const a=1+Math.floor(r()*(rows.length-1)),j=Math.floor(r()*cols.length);rows[a].cells[j].form="—";rows[a].cells[j].origin+="・冠詞脱落";history.push(cols[j].label+"の"+rows[a].label+"で冠詞が消失")}
 if(chance(ir*.23)){const a=Math.floor(r()*rows.length),j=Math.floor(r()*cols.length),cell=rows[a].cells[j];if(cell.form!=="—"){let v=clean(cell.form+pick(["e","n","a","s"]));if(v!==cell.form){cell.form+=" / "+v;cell.origin+="・異形態残存";history.push(rows[a].label+"・"+cols[j].label+"に異形態が残存")}}}
 const unique=new Set(rows.flatMap(row=>row.cells.flatMap(c=>c.form==="—"?[]:c.form.split(" / ")))).size;
 return {seed:o.seed,family:FAMILIES[fam],gender,number,cols,rows,sources:sources.map(s=>s.name),history,unique};
}
if(typeof module!=="undefined")module.exports={generate,SOURCES};
