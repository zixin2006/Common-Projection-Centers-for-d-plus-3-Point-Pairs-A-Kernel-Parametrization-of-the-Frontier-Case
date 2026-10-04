"""Rebuild exact/numerical datasets and the offline browser explorer."""
from pathlib import Path
import json
import numpy as np
from fractions import Fraction
from geometry import configuration,centers,verify as verify_geometry
from algebra import invariants,betti,sections,coordinates,verify as verify_algebra
from slice_exact import slice_instance,poly_gcd
from gale_signature import verify as verify_signatures

ROOT=Path(__file__).parent

def rank_q(matrix):
    a=[list(map(Fraction,row)) for row in matrix];row=0
    for j in range(len(a[0])):
        pivot=next((i for i in range(row,len(a)) if a[i][j]),None)
        if pivot is None:continue
        a[row],a[pivot]=a[pivot],a[row];v=a[row][j];a[row]=[x/v for x in a[row]]
        for i in range(len(a)):
            if i!=row:
                v=a[i][j];a[i]=[x-v*y for x,y in zip(a[i],a[row])]
        row+=1
        if row==len(a):break
    return row

def interpolation_checks():
    rows=[]
    for d in [3,4,5]:
        n=d+3;t=[-3,-2,-1,0,1,2,3,4][:n];s=[Fraction(v,10) for v in [-24,17,-3,28,-11,6,-32,39][:n]]
        for swap in [False,True]:
            first,second=(s,t) if swap else (t,s)
            for h in range(n-1):
                matrix=[[second[i]**j for j in range(h+1)]+[first[i]*second[i]**j for j in range(h+1)] for i in range(n)]
                rank=rank_q(matrix);assert rank==min(n,2*h+2),(d,swap,h,rank)
        rows.append(dict(d=d,all_interpolation_ranks_maximal_over_Q=True))
    return rows

def main():
    geometry_checks=verify_geometry();algebra_checks=verify_algebra();interpolation=interpolation_checks()
    for name,value in [('geometry_checks',geometry_checks),('algebra_checks',algebra_checks),('interpolation_checks',interpolation),('gale_signatures',verify_signatures())]:
        (ROOT/f'{name}.json').write_text(json.dumps(value,indent=2))
    adata={str(d):dict(invariants=invariants(d),betti=betti(d),hilbert=[dict(p=p,q=q,sections=sections(d,p,q),coordinates=coordinates(d,p,q)) for p in range(7) for q in range(7)]) for d in range(3,11)}
    (ROOT/'algebra_data.json').write_text(json.dumps(adata,indent=2))
    slices=[slice_instance(d) for d in [3,4]]
    (ROOT/'slice_certificates.json').write_text(json.dumps(slices,indent=2))
    geometry={}
    for d in [3,4,5]:
        c=configuration(d);v={k:x.tolist() if isinstance(x,np.ndarray) else x for k,x in c.items()};clouds=[[],[]]
        for a in np.linspace(-np.pi/2+.003,np.pi/2-.003,67):
            for b in np.linspace(-np.pi/2+.005,np.pi/2-.005,67):
                pair=centers(c,a,b)
                for i,point in enumerate(pair):clouds[i].append([round(float(x),7) for x in point])
        v['clouds']=clouds;geometry[str(d)]=v
    (ROOT/'viewer_data.json').write_text(json.dumps(geometry,separators=(',',':')))
    data=dict(geometry=geometry,algebra=adata,slices=slices)
    template=(ROOT/'index.template.html').read_text()
    html=template.replace('/*__ENGINE__*/',(ROOT/'engine.js').read_text()).replace('/*__DATA__*/',json.dumps(data,separators=(',',':'))).replace('/*__UI__*/',(ROOT/'ui.js').read_text())
    assert '/*__' not in html
    (ROOT/'common_centers_lab.html').write_text(html)
    print(json.dumps(dict(geometry=geometry_checks,interpolation=interpolation,
                         slices=[{k:r[k] for k in ['d','residual_degree','exact_real_roots']} for r in slices]),indent=2))

if __name__=='__main__':main()
