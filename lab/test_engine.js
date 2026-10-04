// Independent JavaScript implementation: ordinary and exceptional camera pairs.
const M=require('./engine.js'),fs=require('fs'),path=require('path');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'viewer_data.json')));
let worst=0,n=0;
for(const d of [3,4,5]){
 const v=data[d];
 for(let j=0;j<45;j++){
  const theta=-1.5+j*.065,psi=Math.sin(j*4.75)*1.5;
  const result=M.matching(v,M.pair(v,theta,psi),theta,psi);
  if(result.valid){
   worst=Math.max(worst,result.residual);n++;
   if(result.residual>1e-7)throw Error(JSON.stringify({d,j,residual:result.residual}));
  }
 }
 for(let i=0;i<d+3;i++)for(const phi of [.13,.45,1.24,2.67]){
  const result=M.matching(v,M.exception(v,i,phi),0,0,{i,phi});
  if(!result.valid||result.residual>1e-7)throw Error('Exceptional matching failed');
  worst=Math.max(worst,result.residual);n++;
 }
}
const report={checks:n,maxResidual:worst};
fs.writeFileSync(path.join(__dirname,'browser_math_checks.json'),JSON.stringify(report,null,2));
console.log(report);
