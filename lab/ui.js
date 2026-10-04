'use strict';
(() => {
const M=CentersMath,$=id=>document.getElementById(id),RAD=Math.PI/180;
const C={ink:'#17292e',muted:'#51656a',line:'#d8dfdb',teal:'#087e83',amber:'#b45c27',purple:'#7453a1',white:'#fffefa'};
let active='centers',currentPair=null,currentException=null,heat='deficit',selectedPQ=[1,1];
function fmt(x,n=4){return Number.isFinite(x)?Number(x.toPrecision(n)).toString():'—';}
function sci(x){return Number.isFinite(x)?x.toExponential(2):'—';}
function context(id){const el=$(id),r=el.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),w=Math.max(240,r.width),h=r.height||320;el.width=w*dpr;el.height=h*dpr;const ctx=el.getContext('2d');ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);ctx.font='12px system-ui';ctx.fillStyle=C.ink;return {el,ctx,w,h};}
function line(ctx,a,b,color=C.line,width=1){ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function point(ctx,x,y,color,r=4,ring=false){ctx.beginPath();ctx.arc(x,y,r,0,2*Math.PI);ctx.fillStyle=color;ctx.strokeStyle=color;ctx.lineWidth=2;ring?ctx.stroke():ctx.fill();}
function text(ctx,s,x,y,color=C.muted,align='left'){ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(s,x,y);ctx.textAlign='left';}
function wrapped(ctx,s,x,y,width,color=C.muted){let row='';for(const word of s.split(' ')){const next=row?row+' '+word:word;if(ctx.measureText(next).width>width&&row){text(ctx,row,x,y,color);y+=18;row=word;}else row=next;}if(row)text(ctx,row,x,y,color);}
function download(name,obj){const b=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function setIndices(id,n,prefix){const el=$(id),old=+el.value||0;el.innerHTML=Array.from({length:n},(_,i)=>`<option value="${i}">${prefix}${i+1}</option>`).join('');el.value=Math.min(old,n-1);}
function affine(v){if(!v||Math.abs(v[v.length-1])<.007)return null;let q=v.slice(0,-1).map(x=>x/v[v.length-1]);return [q[0],q[1],q[2]+(q[3]||0)*.63-(q[4]||0)*.41];}
class Scene{
 constructor(id){this.id=id;this.yaw=.6;this.pitch=.4;this.zoom=1;this.data=null;this.drag=null;const el=$(id);el.addEventListener('pointerdown',e=>{this.drag=[e.clientX,e.clientY];el.setPointerCapture(e.pointerId);});el.addEventListener('pointermove',e=>{if(!this.drag)return;this.yaw+=(e.clientX-this.drag[0])*.009;this.pitch=Math.max(-1.5,Math.min(1.5,this.pitch+(e.clientY-this.drag[1])*.009));this.drag=[e.clientX,e.clientY];this.draw();});el.addEventListener('pointerup',()=>this.drag=null);el.addEventListener('pointercancel',()=>this.drag=null);el.addEventListener('wheel',e=>{e.preventDefault();this.zoom=Math.max(.5,Math.min(2,this.zoom*Math.exp(-e.deltaY*.001)));this.draw();},{passive:false});}
 set(data,which,p,path=[]){if(this.data!==data||this.which!==which){this.data=data;this.which=which;this.cloud=data.clouds[which].map(affine).filter(Boolean);const sizes=this.cloud.map(p=>Math.max(...p.map(Math.abs))).sort((a,b)=>a-b);this.radius=Math.max(2.4,Math.min(10,sizes[Math.floor(sizes.length*.76)]));}this.p=p;this.path=path;this.draw();}
 draw(){if(!this.data)return;const {ctx,w,h}=context(this.id),cy=Math.cos(this.yaw),sy=Math.sin(this.yaw),cp=Math.cos(this.pitch),sp=Math.sin(this.pitch);const selected=affine(this.p),rad=Math.max(this.radius,selected?Math.min(18,M.norm(selected)*.9):0),sc=Math.min(w,h)*.34/rad*this.zoom;
 const rotate=p=>{let x=cy*p[0]-sy*p[1],y=sy*p[0]+cy*p[1];return [x,cp*y-sp*p[2],sp*y+cp*p[2]];};
 const screen=p=>{let a=rotate(p);return [w*.5+a[0]*sc,h*.52-a[1]*sc,a[2]];};
 for(let axis=0;axis<3;axis++){const a=[0,0,0],b=[0,0,0];a[axis]=-rad;b[axis]=rad;const aa=screen(a),bb=screen(b);line(ctx,aa,bb,C.line);text(ctx,['u','v','w'][axis],bb[0]+5,bb[1]+3);}
 const visible=this.cloud.filter(p=>Math.max(...p.map(Math.abs))<rad);const pts=visible.map(screen).sort((a,b)=>a[2]-b[2]);ctx.fillStyle='rgba(8,126,131,.17)';for(const p of pts){ctx.beginPath();ctx.arc(p[0],p[1],1.15,0,Math.PI*2);ctx.fill();}
 let old=null,oldV=null;for(const v of this.path){const a=affine(v);if(!a||Math.max(...a.map(Math.abs))>rad*1.1){old=null;continue;}const p=screen(a);if(old&&v[v.length-1]*oldV[oldV.length-1]>0&&Math.hypot(p[0]-old[0],p[1]-old[1])<w*.4)line(ctx,old,p,C.purple,2);old=p;oldV=v;}
 const matrix=this.which===0?this.data.X:this.data.Y;M.trans(matrix).forEach((v,i)=>{const a=affine(v);if(a&&Math.max(...a.map(Math.abs))<rad*1.2){const p=screen(a);point(ctx,p[0],p[1],C.amber,3);text(ctx,String(i+1),p[0]+5,p[1]-4,C.amber);}});
 if(selected&&Math.max(...selected.map(Math.abs))<rad*1.2){const p=screen(selected);point(ctx,p[0],p[1],C.white,7);point(ctx,p[0],p[1],C.ink,5);line(ctx,[p[0]-10,p[1]],[p[0]+10,p[1]],C.ink,1);line(ctx,[p[0],p[1]-10],[p[0],p[1]+10],C.ink,1);}else if(this.p)text(ctx,'Chosen center is outside this affine window.',14,h-14,C.amber);
 text(ctx,`window ±${rad.toFixed(1)}`,12,18);text(ctx,this.data.d===3?'affine P³':`3D shadow of affine P${this.data.d}`,w-12,18,C.muted,'right');
 }
}
const scenes={a:new Scene('scroll-a'),b:new Scene('scroll-b'),ea:new Scene('exception-a'),eb:new Scene('exception-b')};
function drawGale(data,theta,psi){const {ctx,w,h}=context('gale'),margin={l:45,r:20,t:25,b:38},ww=w-margin.l-margin.r,hh=h-margin.t-margin.b;const x=a=>margin.l+(a+Math.PI/2)/Math.PI*ww,y=a=>h-margin.b-(a+Math.PI/2)/Math.PI*hh;
 for(const deg of [-90,-45,0,45,90]){let z=deg*RAD;line(ctx,[x(z),margin.t],[x(z),h-margin.b]);line(ctx,[margin.l,y(z)],[w-margin.r,y(z)]);text(ctx,`${deg}°`,x(z),h-margin.b+19,C.muted,'center');text(ctx,`${deg}°`,margin.l-8,y(z)+4,C.muted,'right');}
 data.t.forEach(v=>line(ctx,[x(Math.atan(v)),margin.t],[x(Math.atan(v)),h-margin.b],'rgba(180,92,39,.4)'));
 data.s.forEach(v=>line(ctx,[margin.l,y(Math.atan(v))],[w-margin.r,y(Math.atan(v))],'rgba(8,126,131,.4)'));
 for(let i=0;i<data.t.length;i++){const xx=x(Math.atan(data.t[i])),yy=y(Math.atan(data.s[i]));point(ctx,xx,yy,C.white,5);point(ctx,xx,yy,C.ink,4,true);text(ctx,String(i+1),xx+6,yy-5,C.ink);}
 point(ctx,x(theta),y(psi),C.teal,6);point(ctx,x(theta),y(psi),C.white,2);text(ctx,'θ',w-7,h-margin.b+5);text(ctx,'ψ',margin.l-7,13);$('gale').plotMap={margin,ww,hh,w,h};
}
function drawImages(info,d){const {ctx,w,h}=context('images');if(!info.valid){wrapped(ctx,'The projected configuration is undefined at this boundary.',18,h/2,w-36,C.amber);return;}
 const a=M.trans(info.aligned),b=M.trans(info.Y),an=a.map(M.unit),bn=b.map(M.unit);let chart=0,best=-1;
 for(let j=0;j<d;j++){const score=Math.min(...an.map(v=>Math.abs(v[j])),...bn.map(v=>Math.abs(v[j])));if(score>best){chart=j;best=score;}}
 const inds=Array.from({length:d},(_,j)=>j).filter(j=>j!==chart).slice(0,2),toxy=v=>inds.map(j=>v[j]/v[chart]);const aa=a.map(toxy),bb=b.map(toxy),all=[...aa,...bb];
 const bounds=[0,1].map(j=>{let vals=all.map(p=>p[j]);let min=Math.min(...vals),max=Math.max(...vals),pad=(max-min||1)*.2;return [min-pad,max+pad];});
 const sx=v=>45+(v-bounds[0][0])/(bounds[0][1]-bounds[0][0])*(w-80),sy=v=>h-35-(v-bounds[1][0])/(bounds[1][1]-bounds[1][0])*(h-65);
 ctx.strokeStyle=C.line;ctx.strokeRect(45,20,w-80,h-55);for(let i=0;i<a.length;i++){let p=aa[i],q=bb[i];point(ctx,sx(p[0]),sy(p[1]),C.teal,3.4);point(ctx,sx(q[0]),sy(q[1]),C.amber,6,true);text(ctx,String(i+1),sx(q[0])+8,sy(q[1])-7,C.ink);}
 text(ctx,`image coordinate ${inds[0]}/${chart}`,w/2,h-8,C.muted,'center');ctx.save();ctx.translate(15,h/2);ctx.rotate(-Math.PI/2);text(ctx,`coordinate ${inds[1]}/${chart}`,0,0,C.muted,'center');ctx.restore();
 $('image-label').textContent=d===3?'P² affine chart':`2D shadow of P${d-1}`;
}
function drawCenters(){const data=LAB_DATA.geometry[$('gd').value],i=+$('curve-index').value,mode=$('mode').value;let theta=+$('theta').value*RAD,psi=+$('psi').value*RAD;
 if(mode==='C')psi=Math.atan(data.s[i]);if(mode==='D')theta=Math.atan(data.t[i]);
 $('theta').disabled=mode==='D';$('psi').disabled=mode==='C';$('theta-value').textContent=(theta/RAD).toFixed(1)+'°';$('psi-value').textContent=(psi/RAD).toFixed(1)+'°';
 const pair=M.pair(data,theta,psi),path=[[],[]];if(mode!=='free')for(let j=0;j<=260;j++){let v=-Math.PI/2+Math.PI*j/260;let p=M.pair(data,mode==='D'?theta:v,mode==='C'?psi:v);if(p)for(let k=0;k<2;k++)path[k].push(p[k]);}
 drawGale(data,theta,psi);scenes.a.set(data,0,pair&&pair[0],path[0]);scenes.b.set(data,1,pair&&pair[1],path[1]);const info=M.matching(data,pair,theta,psi);currentPair={d:data.d,theta,psi,mode,index:i+1,centers:pair,matching:info,X:data.X,Y:data.Y};
 $('pair-status').textContent=info.valid?'Valid center pair':info.reason;$('pair-status').className=info.valid?'':'error';$('residual').textContent=info.valid?`relative camera-matching residual ${sci(info.residual)}`:'Validity excludes centers equal to data points.';
 const desc=`S(${$('gd').value%2?(data.d-1)/2:(data.d-2)/2},${Math.floor(data.d/2)}) · degree ${data.d-1}. `;
 $('a-caption').textContent=desc+(mode==='C'?`C${i+1} collapses to x${i+1}.`:mode==='D'?`D${i+1} traces a degree-${data.d} rational normal curve.`:'Black cross: a. Amber points: X.');
 $('b-caption').textContent=desc+(mode==='D'?`D${i+1} collapses to y${i+1}.`:mode==='C'?`C${i+1} traces a degree-${data.d} rational normal curve.`:'Black cross: b. Amber points: Y.');
 $('coordinates').textContent=pair?`a = [${pair[0].map(x=>fmt(x)).join(', ')}]\nb = [${pair[1].map(x=>fmt(x)).join(', ')}]`:'The base point needs an exceptional direction.';$('coordinates').style.whiteSpace='pre-wrap';drawImages(info,data.d);
}
function drawExceptionDiagram(phi,eps,i){const {ctx,w,h}=context('exceptional-diagram'),cx=w/2,cy=h*.51,r=Math.min(w*.32,h*.30);ctx.strokeStyle=C.line;ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,r,0,2*Math.PI);ctx.stroke();
 for(let angle=0;angle<Math.PI;angle+=Math.PI/12){const x=cx+Math.cos(2*angle)*r,y=cy-Math.sin(2*angle)*r;line(ctx,[cx+Math.cos(2*angle)*(r-4),cy-Math.sin(2*angle)*(r-4)],[x,y],C.line);}
 for(const angle of [0,Math.PI/2]){let x=cx+Math.cos(2*angle)*r,y=cy-Math.sin(2*angle)*r;point(ctx,x,y,C.white,6);line(ctx,[x-4,y-4],[x+4,y+4],C.amber,2);line(ctx,[x-4,y+4],[x+4,y-4],C.amber,2);}
 const xx=cx+Math.cos(2*phi)*r,yy=cy-Math.sin(2*phi)*r;line(ctx,[cx,cy],[xx,yy],C.teal,1.5);point(ctx,xx,yy,C.teal,6);
 text(ctx,`E${i+1}(R)`,cx,cy-6,C.ink,'center');text(ctx,eps===0?'ε = 0':`ε = ${eps.toExponential(1)}`,cx,cy+15,C.muted,'center');text(ctx,'b = yᵢ',cx-r,cy+24,C.amber,'center');text(ctx,'a = xᵢ',cx+r,cy+24,C.amber,'center');text(ctx,'φ and φ + 180° represent the same direction.',cx,h-23,C.muted,'center');
}
function drawBlowup(){const data=LAB_DATA.geometry[$('bd').value],i=+$('base-index').value,phi=+$('phi').value*RAD,limit=$('exact-limit').checked,eps=limit?0:10**(-+$('epsilon').value),exact=M.exception(data,i,phi),theta=Math.atan(data.t[i]+eps*Math.cos(phi)),psi=Math.atan(data.s[i]+eps*Math.sin(phi)),pair=limit?exact:M.pair(data,theta,psi);
 $('epsilon').disabled=limit;$('phi-value').textContent=(phi/RAD).toFixed(1)+'°';$('epsilon-value').textContent=limit?'0 · resolved limit':eps.toExponential(1);
 const path=[[],[]];for(let k=0;k<=250;k++){const p=M.exception(data,i,Math.PI*k/250);path[0].push(p[0]);path[1].push(p[1]);}
 scenes.ea.set(data,0,pair&&pair[0],path[0]);scenes.eb.set(data,1,pair&&pair[1],path[1]);drawExceptionDiagram(phi,eps,i);
 const info=M.matching(data,pair,theta,psi,limit?{i,phi}:null),error=pair?Math.max(M.distance(exact[0],pair[0]),M.distance(exact[1],pair[1])):null;
 $('exception-status').textContent=info.valid?(limit?`Valid point on E${i+1}`:'Valid nearby center pair'):info.reason;$('exception-status').className=info.valid?'':'error';$('exception-error').textContent=limit?(info.valid?`matching residual ${sci(info.residual)}`:'φ = 0° and 90° are removed'):`distance to resolved limit ${sci(error)}`;
 currentException={d:data.d,index:i+1,phi,epsilon:eps,centers:pair,resolved_centers:exact,projective_chord_distance:error,matching:info};
}
function drawBoundary(){const n=+$('bd').value+3,box=$('boundary-grid');box.style.gridTemplateColumns=`30px repeat(${n},minmax(0,1fr))`;box.innerHTML='<span></span>'+Array.from({length:n},(_,j)=>`<span class="label">D${j+1}</span>`).join('');for(let i=0;i<n;i++){box.insertAdjacentHTML('beforeend',`<span class="label">C${i+1}</span>`);for(let j=0;j<n;j++){const b=document.createElement('button');b.type='button';b.textContent=i===j?'—':'•';b.className=i===j?'diag':'';b.setAttribute('aria-label',i===j?`Inspect E${i+1}, which separates C${i+1} and D${j+1}`:`Inspect C${i+1} intersect D${j+1}`);b.onclick=()=>{if(i===j){$('base-index').value=i;$('exact-limit').checked=true;drawBlowup();}else{$('gd').value=$('bd').value;setIndices('curve-index',n,'i=');$('mode').value='free';const d=LAB_DATA.geometry[$('gd').value];$('theta').value=Math.atan(d.t[j])/RAD;$('psi').value=Math.atan(d.s[i])/RAD;switchTab('centers');}};box.appendChild(b);}}
 $('boundary-count').textContent=`${2*n} boundary components · ${n*(n-1)} transverse nodes · no triple intersections.`;
}
function drawHilbert(){const d=+$('ad').value,box=$('hgrid');box.innerHTML='<span class="axis">q ↓ / p →</span>'+Array.from({length:7},(_,i)=>`<span class="axis">${i}</span>`).join('');let maximum=heat==='deficit'?d-1:heat==='sections'?M.h0(d,6,6):M.hr(d,6,6);
 for(let q=0;q<=6;q++){box.insertAdjacentHTML('beforeend',`<span class="axis">${q}</span>`);for(let p=0;p<=6;p++){const value=heat==='deficit'?M.h0(d,p,q)-M.hr(d,p,q):heat==='sections'?M.h0(d,p,q):M.hr(d,p,q),b=document.createElement('button');const intensity=maximum?Math.sqrt(value/maximum):0;b.textContent=value;b.style.background=`rgba(8,126,131,${.035+.81*intensity})`;b.style.color=intensity>.55?'white':C.ink;b.className=(p===selectedPQ[0]&&q===selectedPQ[1])?'selected':'';b.setAttribute('aria-label',`p ${p}, q ${q}: ${value}`);b.onclick=()=>{selectedPQ=[p,q];drawHilbert();};box.appendChild(b);}}
 const [p,q]=selectedPQ;$('hdetail').textContent=`At (${p},${q}): h⁰ = ${M.h0(d,p,q)}, dim R = ${M.hr(d,p,q)}, missing = ${M.h0(d,p,q)-M.hr(d,p,q)}. ${p===1&&q===1?'This is the unique deficient bidegree.':'Restriction is surjective in this bidegree.'}`;
}
function drawAlgebra(){const d=+$('ad').value,row=LAB_DATA.algebra[d],inv=row.invariants;$('multidegree').textContent=inv.multidegree.join(' · ');$('segre').textContent=inv.segre_degree;$('missing').textContent=d-1;$('resolution-length').textContent=`length ${2*d-2}; reg B = 2`;
 const by={};for(const r of row.betti)(by[r.i]||(by[r.i]=[])).push(r);$('betti-table').innerHTML=Object.entries(by).map(([i,terms])=>`<tr><td>${i}</td><td>${terms.map(r=>`<span class="term">T(−${r.p},−${r.q})${r.value>1?`<sup>${r.value}</sup>`:''}</span>`).join(' ⊕ ')}</td></tr>`).join('');
 $('generators').innerHTML=`<p>${(d-1)*(d-2)/2} in each pure bidegree (2,0), (0,2).<br>${(d-1)*(d-2)} in each mixed bidegree (2,1), (1,2).</p>`;drawHilbert();drawSlice();
}
function drawSlice(){const row=LAB_DATA.slices.find(r=>r.d===+$('sd').value),{ctx,w,h}=context('slice-plot'),points=row.approximate_points.map(r=>r.s);let xmin=Math.min(...points.map(p=>p[0])),xmax=Math.max(...points.map(p=>p[0])),ym=Math.max(...points.map(p=>Math.abs(p[1])))*1.3;let pad=(xmax-xmin)*.13;xmin-=pad;xmax+=pad;ym=Math.max(.025,ym);const left=65,right=20,top=25,bottom=50,sx=x=>left+(x-xmin)/(xmax-xmin)*(w-left-right),sy=y=>h-bottom-(y+ym)/(2*ym)*(h-bottom-top);
 ctx.strokeStyle=C.line;ctx.strokeRect(left,top,w-left-right,h-top-bottom);for(let i=0;i<=4;i++){let x=xmin+(xmax-xmin)*i/4,y=-ym+2*ym*i/4;line(ctx,[sx(x),top],[sx(x),h-bottom]);line(ctx,[left,sy(y)],[w-right,sy(y)]);text(ctx,fmt(x,3),sx(x),h-bottom+19,C.muted,'center');text(ctx,fmt(y,2),left-8,sy(y)+4,C.muted,'right');}
 line(ctx,[left,sy(0)],[w-right,sy(0)],'#9eaca8');for(const p of points)point(ctx,sx(p[0]),sy(p[1]),Math.abs(p[1])<1e-7?C.teal:C.purple,4.2);text(ctx,'Re(s)',w/2,h-10,C.muted,'center');ctx.save();ctx.translate(15,h/2);ctx.rotate(-Math.PI/2);text(ctx,'Im(s)',0,0,C.muted,'center');ctx.restore();
 $('slice-report').innerHTML=`<div class="metrics"><div class="metric"><span>Complex roots</span><strong>${row.residual_degree}</strong></div><div class="metric"><span>Real roots</span><strong>${row.exact_real_roots}</strong></div><div class="metric"><span>Nonreal roots</span><strong>${row.complex_nonreal_roots}</strong></div></div><p>Eliminant degree ${row.raw_eliminant_degree} − ${row.base_factors_removed} base factors = <strong>${row.residual_degree}</strong>.</p><p>The residual polynomial is squarefree and coprime to both the denominator and all base factors. Its real-root count is certified by Sturm’s theorem.</p><p class="help">Largest relative polynomial residual of the plotted roots: ${sci(row.max_relative_polynomial_residual)}.</p>`;
}
function switchTab(name){active=name;document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===name)));document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.id===name));requestAnimationFrame(()=>{if(name==='centers')drawCenters();if(name==='blowup'){drawBoundary();drawBlowup();}if(name==='algebra')drawAlgebra();});}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
['theta','psi','mode','curve-index'].forEach(id=>$(id).addEventListener('input',drawCenters));$('gd').addEventListener('change',()=>{setIndices('curve-index',+$('gd').value+3,'i=');drawCenters();});
$('gale').addEventListener('pointerdown',e=>{const p=$('gale').plotMap,r=$('gale').getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;if(!p)return;$('theta').value=Math.max(-90,Math.min(90,(x-p.margin.l)/p.ww*180-90));$('psi').value=Math.max(-90,Math.min(90,(p.h-p.margin.b-y)/p.hh*180-90));$('mode').value='free';drawCenters();});
['phi','epsilon','base-index','exact-limit'].forEach(id=>$(id).addEventListener('input',drawBlowup));$('bd').addEventListener('change',()=>{setIndices('base-index',+$('bd').value+3,'E');drawBoundary();drawBlowup();});
$('ad').innerHTML=Array.from({length:8},(_,i)=>`<option value="${i+3}"${i===1?' selected':''}>${i+3}</option>`).join('');$('ad').addEventListener('change',drawAlgebra);$('sd').addEventListener('change',drawSlice);
document.querySelectorAll('[data-heat]').forEach(b=>b.addEventListener('click',()=>{heat=b.dataset.heat;document.querySelectorAll('[data-heat]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));drawHilbert();}));
$('export-pair').onclick=()=>download('center-pair.json',currentPair);$('export-exception').onclick=()=>download('exceptional-direction.json',currentException);$('export-algebra').onclick=()=>download(`algebra-d${$('ad').value}.json`,LAB_DATA.algebra[$('ad').value]);$('export-slice').onclick=()=>download(`slice-d${$('sd').value}.json`,LAB_DATA.slices.find(r=>r.d===+$('sd').value));$('export-scroll').onclick=()=>{const a=document.createElement('a');a.download='first-scroll.png';a.href=$('scroll-a').toDataURL('image/png');a.click();};
setIndices('curve-index',6,'i=');setIndices('base-index',7,'E');let resizing;window.addEventListener('resize',()=>{clearTimeout(resizing);resizing=setTimeout(()=>switchTab(active),80);});switchTab('centers');
window.CentersLab={getState:()=>({active,currentPair,currentException,heat,selectedPQ}),switchTab};
})();
