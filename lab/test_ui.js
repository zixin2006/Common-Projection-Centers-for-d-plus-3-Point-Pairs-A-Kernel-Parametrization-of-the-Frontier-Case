// Runtime smoke tests for the actual UI handlers in a minimal DOM/canvas host.
// This exercises computation and state changes; it is not a browser-layout test.
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=__dirname,template=fs.readFileSync(path.join(root,'index.template.html'),'utf8');
const elements={},all=[],operations={count:0};
function attrs(s){const a={};for(const m of s.matchAll(/([\w-]+)(?:="([^"]*)")?/g))a[m[1]]=m[2]===undefined?true:m[2];return a;}
class Element{
 constructor(tag,a={}){this.tag=tag;this.attrs=a;this.id=a.id;this.value=a.value||'';this.checked=!!a.checked;this.style={};this.listeners={};this.children=[];this.dataset={};this.className=a.class||'';for(const k in a)if(k.startsWith('data-'))this.dataset[k.slice(5)]=a[k];this.classList={toggle:(c,on)=>{const classes=new Set(this.className.split(' '));on?classes.add(c):classes.delete(c);this.className=[...classes].join(' ');}};all.push(this);if(this.id)elements[this.id]=this;}
 set innerHTML(s){this._html=s;this.children=[];if(this.tag==='select'){const opts=[...s.matchAll(/<option\s+value="([^"]+)"([^>]*)>/g)];if(opts.length)this.value=(opts.find(v=>v[2].includes('selected'))||opts[0])[1];}}
 get innerHTML(){return this._html||'';}
 insertAdjacentHTML(pos,s){this._html=(this._html||'')+s;}
 appendChild(x){this.children.push(x);return x;}
 setAttribute(k,v){this.attrs[k]=v;}
 addEventListener(k,fn){(this.listeners[k]||(this.listeners[k]=[])).push(fn);}
 fire(k){for(const fn of this.listeners[k]||[])fn({target:this,clientX:140,clientY:130,pointerId:1,preventDefault(){}});}
 getBoundingClientRect(){return {width:360,height:this.className.includes('plot-short')?255:330,left:0,top:0};}
 getContext(){return new Proxy({}, {get:(o,k)=>k in o?o[k]:k==='measureText'?s=>({width:String(s).length*6.5}):(...args)=>{for(const x of args)if(typeof x==='number'&&!Number.isFinite(x))throw Error(`Nonfinite ${this.id}.${String(k)}`);operations.count++;},set:(o,k,v)=>{o[k]=v;return true;}});}
 setPointerCapture(){} click(){if(this.onclick)this.onclick();this.fire('click');} toDataURL(){return 'data:image/png;base64,';}
}
for(const m of template.matchAll(/<([a-z][a-z0-9]*)\b([^>]*)>/g)){const a=attrs(m[2]);if(a.id||a['data-tab']||a['data-heat'])new Element(m[1],a);}
for(const m of template.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/g)){const a=attrs(m[1]);if(a.id)elements[a.id].innerHTML=m[2];}
const document={getElementById:id=>{if(!elements[id])throw Error('Missing id '+id);return elements[id];},createElement:tag=>new Element(tag),querySelectorAll:selector=>all.filter(el=>selector==='[data-tab]'?el.dataset.tab:selector==='[data-heat]'?el.dataset.heat:selector==='.panel'?el.className.split(' ').includes('panel'):false)};
const sandbox={document,console,Blob,URL,setTimeout,clearTimeout,devicePixelRatio:1,requestAnimationFrame:fn=>fn(),window:{addEventListener(){}},module:undefined};sandbox.LAB_DATA={geometry:JSON.parse(fs.readFileSync(path.join(root,'viewer_data.json'))),algebra:JSON.parse(fs.readFileSync(path.join(root,'algebra_data.json'))),slices:JSON.parse(fs.readFileSync(path.join(root,'slice_certificates.json')))};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(root,'engine.js'),'utf8'),sandbox);vm.runInContext(fs.readFileSync(path.join(root,'ui.js'),'utf8'),sandbox);
const lab=sandbox.window.CentersLab;
function assert(ok,msg){if(!ok)throw Error(msg);}
let checks=0;
for(const d of [3,4,5]){
 elements.theta.value='18.7';elements.psi.value='-36.8';elements.mode.value='free';
 elements.gd.value=String(d);elements.gd.fire('change');assert(lab.getState().currentPair.matching.valid,'free pair '+d);checks++;
 for(const mode of ['C','D']){elements.mode.value=mode;elements.mode.fire('input');assert(!lab.getState().currentPair.matching.valid,'contracted fiber excluded');checks++;}
 elements.mode.value='free';elements.mode.fire('input');
 elements.bd.value=String(d);elements.bd.fire('change');lab.switchTab('blowup');
 for(let i=0;i<d+3;i++)for(const phi of [0,38,90,133,180]){elements['base-index'].value=String(i);elements.phi.value=String(phi);elements.phi.fire('input');const result=lab.getState().currentException;assert(result.matching.valid===(phi===38||phi===133),'exception endpoint classification');checks++;}
 elements.phi.value='38';elements['exact-limit'].checked=false;elements.epsilon.value='2';elements.epsilon.fire('input');const coarse=lab.getState().currentException.projective_chord_distance;elements.epsilon.value='5';elements.epsilon.fire('input');assert(lab.getState().currentException.projective_chord_distance<coarse*.003,'approach converges');checks++;elements['exact-limit'].checked=true;
 // An off-diagonal boundary cell must set the exact two node parameters.
 elements['boundary-grid'].children.find(e=>e.tag==='button'&&e.textContent==='•').click();assert(!lab.getState().currentPair.matching.valid,'boundary cell must be invalid');checks++;
}
lab.switchTab('algebra');for(let d=3;d<=10;d++){elements.ad.value=String(d);elements.ad.fire('change');assert(elements.missing.textContent===d-1,'missing sections');assert(elements['betti-table'].innerHTML.includes('T('),'Betti render');checks++;}
for(const b of all.filter(e=>e.dataset.heat)){b.click();checks++;}
elements.sd.value='3';elements.sd.fire('change');assert(elements['slice-report'].innerHTML.includes('11'),'slice d3');elements.sd.value='4';elements.sd.fire('change');assert(elements['slice-report'].innerHTML.includes('19'),'slice d4');checks+=2;
const report={handler_checks:checks,finite_canvas_operations:operations.count,browser_layout_verified:false,description:'Actual UI scripts exercised in a DOM/canvas stand-in; browser executable unavailable in build environment.'};fs.writeFileSync(path.join(root,'ui_checks.json'),JSON.stringify(report,null,2));console.log(report);
