'use strict';
// Shared, dependency-free numerical engine. All vectors are homogeneous.
const CentersMath = (() => {
  const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
  const norm=a=>Math.sqrt(dot(a,a));
  const unit=a=>{const n=norm(a);return n>1e-26?a.map(x=>x/n):null;};
  const trans=a=>a[0].map((_,j)=>a.map(row=>row[j]));
  const mv=(a,v)=>a.map(row=>dot(row,v));
  const mm=(a,b)=>{const bt=trans(b);return a.map(row=>bt.map(col=>dot(row,col)));};
  const distance=(a,b)=>{a=unit(a);b=unit(b);return Math.min(norm(a.map((x,i)=>x-b[i])),norm(a.map((x,i)=>x+b[i])));};
  function inverse(a){
    const n=a.length,z=a.map((r,i)=>[...r,...Array.from({length:n},(_,j)=>+(i===j))]);
    for(let j=0;j<n;j++){
      let pivot=j;for(let i=j+1;i<n;i++)if(Math.abs(z[i][j])>Math.abs(z[pivot][j]))pivot=i;
      if(Math.abs(z[pivot][j])<1e-20)throw Error('Numerically singular camera chart');
      [z[j],z[pivot]]=[z[pivot],z[j]];
      const x=z[j][j];z[j]=z[j].map(v=>v/x);
      for(let i=0;i<n;i++)if(i!==j){const c=z[i][j];z[i]=z[i].map((v,k)=>v-c*z[j][k]);}
    }return z.map(r=>r.slice(n));
  }
  function polynomial(matrix,t,s,theta,psi){
    const k=t.map(v=>Math.sin(theta)-v*Math.cos(theta)),l=s.map(v=>Math.sin(psi)-v*Math.cos(psi));
    let weights=k.map((v,i)=>v*l.reduce((a,w,j)=>j===i?a:a*w,1));
    if(Math.abs(Math.cos(psi))>.25)weights=weights.map(v=>v/Math.cos(psi));
    else weights=weights.map((v,i)=>v*s[i]/Math.sin(psi));
    return mv(matrix,weights);
  }
  function pair(data,theta,psi){
    const k=data.t.map(v=>Math.sin(theta)-v*Math.cos(theta)),l=data.s.map(v=>Math.sin(psi)-v*Math.cos(psi));
    if(k.some((v,i)=>Math.abs(v)<1e-10&&Math.abs(l[i])<1e-10))return null;
    return [unit(polynomial(data.X,data.t,data.s,theta,psi)),unit(polynomial(data.Y,data.s,data.t,psi,theta))];
  }
  function exception(data,i,phi){
    const {t,s,X,Y}=data,n=t.length;
    const prod=(nodes,omit)=>nodes.reduce((p,v,k)=>omit.includes(k)?p:p*(nodes[i]-v),1);
    const at=X.map(r=>r[i]*prod(s,[i])),bs=Y.map(r=>r[i]*prod(t,[i]));
    const ass=X.map(r=>r.reduce((a,v,j)=>j===i?a:a+v*(t[i]-t[j])*prod(s,[i,j]),0));
    const bt=Y.map(r=>r.reduce((a,v,j)=>j===i?a:a+v*(s[i]-s[j])*prod(t,[i,j]),0));
    return [unit(at.map((v,j)=>Math.cos(phi)*v+Math.sin(phi)*ass[j])),unit(bt.map((v,j)=>Math.cos(phi)*v+Math.sin(phi)*bs[j]))];
  }
  function camera(a){
    const v=[...unit(a)];v[0]+=(v[0]>=0?1:-1);const den=dot(v,v),n=v.length;
    return Array.from({length:n-1},(_,i)=>Array.from({length:n},(_,j)=>+(i+1===j)-2*v[i+1]*v[j]/den));
  }
  function matching(data,points,theta,psi,exceptional=null){
    if(!points||points.some(p=>!p))return {valid:false,reason:'Base point: select an exceptional direction.'};
    const [a,b]=points;
    let diagonal;
    if(exceptional){
      const {i,phi}=exceptional;
      if(Math.min(Math.abs(Math.sin(phi)),Math.abs(Math.cos(phi)))<1e-9)return {valid:false,reason:'Excluded endpoint: a center equals a data point.'};
      diagonal=data.t.map((v,j)=>j===i?Math.cos(phi)/Math.sin(phi):(data.t[i]-v)/(data.s[i]-data.s[j]));
    }else{
      const k=data.t.map(v=>Math.sin(theta)-v*Math.cos(theta)),l=data.s.map(v=>Math.sin(psi)-v*Math.cos(psi));
      if(Math.min(...k.map(Math.abs),...l.map(Math.abs))<1e-9)return {valid:false,reason:'Boundary pair: at least one center equals a data point.'};
      diagonal=k.map((v,i)=>v/l[i]);
    }
    try{
      const xx=mm(camera(a),data.X),yy=mm(camera(b),data.Y),xd=xx.map(r=>r.map((v,i)=>v*diagonal[i]));
      const h=mm(mm(yy,trans(xd)),inverse(mm(xd,trans(xd))));
      const aligned=mm(h,xx),fit=mm(h,xd);
      const residual=Math.sqrt(yy.flatMap((r,i)=>r.map((v,j)=>(v-fit[i][j])**2)).reduce((a,b)=>a+b,0))/norm(yy.flat());
      return {valid:true,residual,H:h,diagonal,aligned,Y:yy,imageDistance:Math.max(...trans(aligned).map((v,i)=>distance(v,trans(yy)[i])))};
    }catch(e){return {valid:false,reason:e.message};}
  }
  function h0(d,p,q){return 1+((d-1)*(p*p+q*q)+2*(d*d+d-1)*p*q+(d+1)*(p+q))/2;}
  function hr(d,p,q){return h0(d,p,q)-((p===1&&q===1)?d-1:0);}
  return {dot,norm,unit,trans,mv,mm,inverse,distance,pair,exception,camera,matching,h0,hr};
})();
if(typeof module!=='undefined')module.exports=CentersMath;
