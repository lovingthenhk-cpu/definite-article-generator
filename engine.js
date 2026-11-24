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
// Only explicitly attested cells contribute evidence. Missing values are not equality.
const SOURCE_CASES=["nom","acc","gen","dat","ins","abl","loc"];
function observed(s, c, k) {
 const n=s[c.n], g={c:"m",a:"m",i:"n"}[c.g]||c.g, i=SOURCE_CASES.indexOf(k);
 if(i<0||!n||!n[g])return null;
 const v=n[g].split(" ")[i];return v&&v!=="-"?v.normalize("NFC").toLowerCase():null;
}
function pairStats(fam,a,ka,b,kb){
 let equal=0,total=0,localEqual=0,localTotal=0;
 for(const s of SOURCES){let x=observed(s,a,ka),y=observed(s,b,kb);if(!x||!y)continue;total++;if(x===y)equal++;if(s.family===fam){localTotal++;if(x===y)localEqual++}}
 // A weak structural prior, shrunk toward pooled observations and then family observations.
 let prior=.06;
 if(a.n===b.n&&a.g===b.g){
  const ks=[ka,kb].sort().join(":");
  if(ks==="acc:nom")prior=["n","i"].includes(a.g)?.90:a.n==="du"?.70:.34;
  else if(ks==="dat:gen")prior=.42;
  else if(ks==="abl:ins"||ks==="abl:dat"||ks==="dat:loc"||ks==="ins:loc")prior=.34;
  else if(ks==="nom:voc")prior=.55;
 }else if(a.n===b.n&&ka===kb){
  prior=["gen","dat","ins","abl","loc"].includes(ka)?.28:.10;
  if([a.g,b.g].includes("n")&&[a.g,b.g].some(g=>g==="m"||g==="c")&&["gen","dat","ins","abl","loc"].includes(ka))prior=.62;
  if(a.n!=="sg")prior=Math.min(.78,prior+.20);
 }else if(a.g===b.g&&ka===kb)prior=.10;
 const pooled=(equal+4*prior)/(total+4);
 return {p:(localEqual+5*pooled)/(localTotal+5),equal,total,localEqual,localTotal,prior};
}
// A pair of forms supplies a reusable ending or prefix alternation, not an unrelated new word.
function alternation(x,y){
 if(!x||!y||x===y)return null;
 let n=0;while(n<Math.min(x.length,y.length)&&x[n]===y[n])n++;
 let m=0;while(m<Math.min(x.length,y.length)&&x[x.length-1-m]===y[y.length-1-m])m++;
 if(n&&n>=m)return {side:"suffix",from:x.slice(n),to:y.slice(n)};
 if(m)return {side:"prefix",from:x.slice(0,x.length-m),to:y.slice(0,y.length-m)};
 return null;
}
function applyAlternation(form,a){
 if(!a)return null;
 if(a.side==="suffix"&&form.endsWith(a.from)){let root=a.from?form.slice(0,-a.from.length):form;return root?root+a.to:null}
 if(a.side==="prefix"&&form.startsWith(a.from)){let root=form.slice(a.from.length);return root?a.to+root:null}
 return null;
}
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
 // Random alphabets are whole orthographic inventories, not independently sampled noise.
 const mode=o.alphabetMode||"manual";
 let alphabetName="手動指定", alphabet;
 if(mode==="auto"||mode==="extended"){
  const ar=rng(String(o.seed)+"|alphabet-v2"), ac=p=>ar()<p;
  const profiles=[["古典ラテン文字","abcdefghiklmnopqrstvx yz",fam==="romance"?28:12],["現代ラテン文字","abcdefghijklmnopqrstuvwxyz",28],["簡素なラテン文字","abcdefghijklmnopqrstuv",20],["ゲルマン風ラテン文字","abcdefghijklmnopqrstuvwxyz",fam==="germanic"?35:10],["拡張ラテン文字","abcdefghijklmnopqrstuvwxyz",mode==="extended"?75:12],["小規模ラテン文字","abdefghiklmnoprstu",8]];
  let roll=ar()*profiles.reduce((a,v)=>a+v[2],0), profile=profiles.at(-1);
  for(const t of profiles){roll-=t[2];if(roll<0){profile=t;break}}
  alphabetName=profile[0];let set=new Set(profile[1].replace(/ /g,""));
  const classical=profile[0]==="古典ラテン文字";
  for(const [c,p] of [["q",.30],["x",.25],["z",.23],["w",fam==="germanic"?.10:.42],["j",.25],["k",fam==="romance"?.48:.12],["y",.22]])if(ac(p))set.delete(c);
  if(!classical&&ac(.10))set.delete("v");
  const extra=mode==="extended"||profile[0]==="拡張ラテン文字";
  const germ=profile[0]==="ゲルマン風ラテン文字"||fam==="germanic";
  const additions=[["ð",germ?.55:extra?.36:.10],["þ",germ?.33:extra?.20:.035],["æ",germ?.36:extra?.35:.07],["œ",fam==="romance"?.23:extra?.30:.05],["š",fam==="slavic"||fam==="baltic"?.45:extra?.27:.045],["ž",fam==="slavic"||fam==="baltic"?.32:extra?.21:.025],["č",fam==="slavic"||fam==="baltic"?.34:extra?.24:.035],["ñ",fam==="romance"?.23:extra?.19:.035],["ç",fam==="romance"?.20:extra?.20:.035],["ŋ",extra?.22:.045],["ł",fam==="slavic"?.21:extra?.18:.025],["ø",germ?.24:extra?.25:.04],["å",germ?.23:extra?.22:.03],["ä",germ?.25:extra?.25:.035],["ö",germ?.26:extra?.25:.035],["ü",germ?.22:extra?.23:.035],["ā",extra?.35:.04],["ē",extra?.30:.035],["ī",extra?.25:.025],["ō",extra?.25:.025],["ū",extra?.25:.025]];
  for(const [c,p] of additions)if(ac(p))set.add(c);
  if(extra&&![...set].some(c=>!/[a-z]/.test(c)))set.add("ð");
  alphabet=[...set].sort((a,b)=>a.localeCompare(b,"en"));
 }else alphabet=[...new Set(String(o.alphabet??"").toLowerCase().normalize("NFC").replace(/[^\p{L}]/gu,""))];
 const unrestricted=mode==="manual"&&!String(o.alphabet??"").trim();
 if(!alphabet.length&&!unrestricted)throw Error("文字を入力するか、空欄にしてください");
 if(unrestricted)alphabetName="文字制限なし";
 const replacements={þ:["ð","th","t","d"],ð:["þ","d","th","t"],æ:["ae","e","a"],œ:["oe","e","o"],q:["k","c"],j:["i","y","g"],w:["v","u"],u:["v","o"],v:["u","w","f"],z:["s","t"],y:["i","u"],k:["c","g","q"],c:["k","s"],x:["ks","cs","s"],š:["sh","s"],ž:["zh","z","s"],č:["ch","c","t"],ñ:["ny","n"],ç:["s","c"],ŋ:["ng","n"],ł:["l"],ø:["o","e"]};
 const valid=x=>unrestricted||[...x].every(c=>alphabet.includes(c));
 const clean=x=>{if(unrestricted)return x.normalize("NFC").toLowerCase().replace(/[^\p{L}\p{M}]/gu,"")||"a";let out="";for(const ch of x.normalize("NFC").toLowerCase()){
  if(alphabet.includes(ch)){out+=ch;continue}
  let base=ch.normalize("NFD").replace(/\p{M}/gu,""), opts=[...(replacements[ch]||[]),base,...(replacements[base]||[])];
  let v=opts.find(t=>t&&valid(t));if(v)out+=v;
 }return out||alphabet[0]};
 history.push("文字体系："+alphabetName+(unrestricted?"（語源・音韻変化で生じた文字をそのまま使用）":"（"+alphabet.join(" ")+"）"));
 const applied=new Set();
 let rows=cases.map(k=>({case:k,label:count===1?"格変化なし":CASES[k],cells:cols.map(col=>{const s=donorMap["case:"+k]||donorMap["gender:"+col.g]||donorMap["number:"+col.n]||primary;const a=get(s,col.n,col.g,k);let word=a.raw;for(const [label,re,repl] of selected){let old=word;word=word.replace(re,repl);if(old!==word)applied.add(label)}return {...a,form:clean(word)}})}));
 if(applied.size)history.push("共通音韻変化："+[...applied].join("、"));
 // Correlated paradigms: one inherited/analogical gender rule can affect several cells,
 // then exact identities are sampled as clusters, not independent unrelated strings.
 const corr=Math.max(0,Math.min(1,Number(o.correlation??70)/100));
 const cr=rng(String(o.seed)+"|correlation-v1"), cc=p=>cr()<p;
 const cp=a=>a[Math.floor(cr()*a.length)];
 const relations=[], relationRules=[];
 const domain=k=>["nom","acc","voc"].includes(k)?"direct":"oblique";
 const donor=(k,c)=>donorMap["case:"+k]||donorMap["gender:"+c.g]||donorMap["number:"+c.n]||primary;
 if(corr>0)for(const n of nd){
  const js=cols.map((c,j)=>c.n===n?j:-1).filter(j=>j>=0);if(js.length<2)continue;
  const base=js[0];
  for(const target of js.slice(1)){
   if(!cc(corr*.72))continue;
   const a=cols[base],b=cols[target], candidates=new Map();
   for(const row of rows){
    if(donor(row.case,a)!==donor(row.case,b))continue;
    for(const src of SOURCES){
     const x=observed(src,a,row.case),y=observed(src,b,row.case);
     const rule=alternation(x&&clean(x),y&&clean(y));if(!rule)continue;
     const group=domain(row.case), key=JSON.stringify([rule,group]), weight=(src.family===fam?3:1)*(src===primary?2:1);
     const prev=candidates.get(key)||{rule,group,weight:0,examples:[]};prev.weight+=weight;prev.examples.push(src.name);candidates.set(key,prev);
    }
   }
   const viable=[...candidates.values()].map(c=>({...c,coverage:rows.filter(row=>domain(row.case)===c.group&&donor(row.case,a)===donor(row.case,b)&&row.cells[base].form!==row.cells[target].form&&applyAlternation(row.cells[base].form,c.rule)).length})).filter(c=>c.coverage);
   if(!viable.length)continue;
   let total=viable.reduce((v,c)=>v+c.weight*c.coverage,0), z=cr()*total, chosen=viable.at(-1);
   for(const c of viable){z-=c.weight*c.coverage;if(z<0){chosen=c;break}}
   let changed=0;for(const row of rows){
    if(domain(row.case)!==chosen.group||donor(row.case,a)!==donor(row.case,b)||row.cells[base].form===row.cells[target].form)continue;
    const next=applyAlternation(row.cells[base].form,chosen.rule);
    if(!next||next===row.cells[target].form||!valid(next))continue;
    row.cells[target].form=next;row.cells[target].origin+="・"+a.label+"からの性の類推";changed++;
   }
   if(changed){const rule=chosen.rule;const label=(chosen.group==="direct"?"直接格":"斜格群")+"・"+(rule.side==="suffix"?"語末":"語頭")+" "+(rule.from||"Ø")+" → "+(rule.to||"Ø");relationRules.push({from:a.label,to:b.label,rule:label,changed,examples:[...new Set(chosen.examples)]});history.push(a.label+"→"+b.label+"：共通の性変化（"+label+"、"+changed+"格）")}
  }
 }
 // Build candidate edges with data-backed probabilities; merge whole equality classes.
 const size=rows.length*cols.length, ids=Array.from({length:size},(_,i)=>i), root=i=>{while(ids[i]!==i){ids[i]=ids[ids[i]];i=ids[i]}return i};
 const cell=i=>rows[Math.floor(i/cols.length)].cells[i%cols.length];
 const coord=i=>({col:cols[i%cols.length],k:rows[Math.floor(i/cols.length)].case});
 const name=i=>rows[Math.floor(i/cols.length)].label+"・"+cols[i%cols.length].label;
 const edges=[];
 for(let i=0;i<size;i++)for(let j=i+1;j<size;j++){
  let a=coord(i),b=coord(j);
  // Same case or same gender/number across cases. Across-number comparisons require same case and gender.
  const nearby=a.col.n===b.col.n&&(a.k===b.k||a.col.g===b.col.g)||a.k===b.k&&a.col.g===b.col.g;
  let st=pairStats(fam,a.col,a.k,b.col,b.k);
  if(!nearby&&!(st.total>=3&&st.equal/st.total>=.35))continue;
  const sameDonor=donor(a.k,a.col)===donor(b.k,b.col);
  let p=st.p*corr*(sameDonor?1:.38);
  if(a.col.n!==b.col.n)p*=.50;
  if(!nearby)p*=.35;
  edges.push({i,j,p,stats:st,sameDonor,order:cr()});
 }
 edges.sort((a,b)=>b.p-a.p||a.order-b.order);
 // Existing identical forms are already equal, including identities inherited from the source.
 const initial=new Map();for(let i=0;i<size;i++){let f=cell(i).form;if(initial.has(f))ids[i]=root(initial.get(f));else initial.set(f,i)}
 const joined=new Set();
 for(const e of edges){
  const {i,j,p,stats}=e;let a=root(i),b=root(j);let wasEqual=cell(i).form===cell(j).form;
  let applied=false;
  if(corr>0&&a!==b&&cc(p)&&(!joined.has(a)||!joined.has(b))){
   const from=cell(a).form,to=cell(b).form;
   if(from!==to){
    const affected=ids.map((_,k)=>k).filter(k=>root(k)===b);
    for(const k of affected){cell(k).form=from;cell(k).origin+="・条件付き格／性融合"}
    ids[b]=a;joined.add(a);applied=true;
    history.push(name(i)+"＝"+name(j)+"（条件付き融合）");
   }
  }
  relations.push({i,j,left:name(i),right:name(j),probability:p,observed:stats.equal,observations:stats.total,familyObserved:stats.localEqual,familyObservations:stats.localTotal,inherited:wasEqual,applied});
 }
 // Defective paradigms: prioritize peripheral cases; allow systematic gender/number gaps.
 const gapRate=Math.max(0,Math.min(1,Number(o.gaps??30)/100));
 const gapWeight={nom:0,acc:.12,gen:.26,dat:.28,ins:1,abl:.85,loc:.88,voc:1.6,obl:.15,com:1.2,par:1.15,all:1.3,ela:1.3};
 const eligible=rows.map((row,i)=>[i,gapWeight[row.case]||0]).filter(x=>x[1]>0);
 let gapCount=0;
 function omit(i,j,why){
  const cell=rows[i].cells[j];if(cell.form==="—"||gapCount>=rows.length*cols.length-1)return false;
  cell.form="—";cell.origin+="・冠詞欠損（"+why+"）";gapCount++;return true;
 }
 if(gapRate>0&&eligible.length&&chance(gapRate)){
  const rounds=1+(chance(gapRate*.65)?1:0)+(chance(gapRate*.35)?1:0);
  for(let t=0;t<rounds;t++){
   const i=w(eligible), row=rows[i], mode=w([["case",25],["gender",25],["number",20],["cell",30]]);
   let js=[];
   if(mode==="case")js=cols.map((_,j)=>j);
   else if(mode==="gender"){const g=pick(cols).g;js=cols.map((c,j)=>c.g===g?j:-1).filter(j=>j>=0)}
   else if(mode==="number"){const n=pick(cols).n;js=cols.map((c,j)=>c.n===n?j:-1).filter(j=>j>=0)}
   else js=[Math.floor(r()*cols.length)];
   const dropped=js.filter(j=>omit(i,j,"格・性・数に条件付けられた脱落"));
   if(dropped.length)history.push(row.label+"の"+dropped.map(j=>cols[j].label).join("・")+"で冠詞が欠損");
  }
 }
 // Some numbers (especially dual) never grammaticalize the article; preserve at least one article.
 if(gapRate>0&&nd.length>1&&chance(gapRate*.22)){
  const n=nd.includes("du")&&chance(.75)?"du":pick(nd.slice(1)), js=cols.map((c,j)=>c.n===n?j:-1).filter(j=>j>=0);
  let dropped=0;for(let i=0;i<rows.length;i++)for(const j of js)if(omit(i,j,"数全体で冠詞が存在しない"))dropped++;
  if(dropped)history.push(LABEL[n]+"の冠詞体系が全体として欠損");
 }
 if(chance(ir*.23)){const a=Math.floor(r()*rows.length),j=Math.floor(r()*cols.length),cell=rows[a].cells[j];if(cell.form!=="—"){let v=clean(cell.form+pick(["e","n","a","s"]));if(v!==cell.form){cell.form+=" / "+v;cell.origin+="・異形態残存";history.push(rows[a].label+"・"+cols[j].label+"に異形態が残存")}}}
 for(const rel of relations){const a=cell(rel.i).form,b=cell(rel.j).form;rel.equal=a!=="—"&&b!=="—"&&a===b}
 const unique=new Set(rows.flatMap(row=>row.cells.flatMap(c=>c.form==="—"?[]:c.form.split(" / ")))).size;
 const usedAlphabet=[...new Set(rows.flatMap(row=>row.cells.flatMap(c=>[...c.form].filter(ch=>/\p{L}/u.test(ch)))))].sort((a,b)=>a.localeCompare(b,"en"));
 return {seed:o.seed,family:FAMILIES[fam],gender,number,cols,rows,sources:sources.map(s=>s.name),history,unique,alphabet,alphabetName,unrestricted,usedAlphabet,gapCount,relations,relationRules};
}
if(typeof module!=="undefined")module.exports={generate,SOURCES,pairStats};
