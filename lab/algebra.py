"""Integer formulas for the Hilbert function and normalization Betti table.

These evaluate the proved formulas in the revised manuscript. They do not
compute a free resolution of the original coordinate ring.
"""
from math import comb
from pathlib import Path
import json

def sections(d,p,q):
    if p<0 or q<0: return 0
    return 1+((d-1)*(p*p+q*q)+2*(d*d+d-1)*p*q+(d+1)*(p+q))//2

def coordinates(d,p,q):
    return sections(d,p,q)-(d-1 if (p,q)==(1,1) else 0)

def invariants(d):
    n=d+3
    return dict(d=d,N=n,scroll=[(d-1)//2,d//2],multidegree=[d-1,d*d+d-1,d-1],
                segre_degree=2*d*d+4*d-4,sectional_genus=d*d+d-2,
                boundary_components=2*n,boundary_nodes=n*(n-1),
                log_canonical_square=2*d*d+3*d-1,complex_euler=(d+1)**2,
                missing_sections=d-1,normalization_regularity=2,coordinate_regularity=3)

def numerator(d,p,q):
    """Coefficient of (1-s)^(d+1)(1-t)^(d+1) H_B(s,t)."""
    return sum((-1)**(a+b)*comb(d+1,a)*comb(d+1,b)*sections(d,p-a,q-b)
               for a in range(min(p,d+1)+1) for b in range(min(q,d+1)+1))

def betti(d):
    rows=[dict(i=0,p=0,q=0,value=1)]
    for i in range(1,d-1):
        value=i*comb(d-1,i+1)
        rows.extend([dict(i=i,p=i+1,q=0,value=value),dict(i=i,p=0,q=i+1,value=value)])
    for p in range(1,d+2):
        for q in range(1,d+2):
            i=p+q-2
            value=(-1)**i*numerator(d,p,q)
            assert value>=0,(d,i,p,q,value)
            if value: rows.append(dict(i=i,p=p,q=q,value=value))
    return sorted(rows,key=lambda r:(r['i'],r['p'],r['q']))

def verify():
    checks=[]
    for d in range(3,11):
        table=betti(d)
        assert max(r['i'] for r in table)==2*d-2
        for p in range(d+4):
            for q in range(d+4):
                reconstructed=sum((-1)**r['i']*r['value']*comb(p-r['p']+d,d)*comb(q-r['q']+d,d)
                                  for r in table if p>=r['p'] and q>=r['q'])
                assert reconstructed==sections(d,p,q),(d,p,q)
        checks.append(dict(d=d,nonzero_betti_positions=len(table),resolution_length=max(r['i'] for r in table)))
    return checks

if __name__=='__main__':
    root=Path(__file__).parent
    checks=verify()
    out={str(d):dict(invariants=invariants(d),betti=betti(d),hilbert=[dict(p=p,q=q,sections=sections(d,p,q),coordinates=coordinates(d,p,q)) for p in range(7) for q in range(7)]) for d in range(3,11)}
    (root/'algebra_data.json').write_text(json.dumps(out,indent=2))
    (root/'algebra_checks.json').write_text(json.dumps(checks,indent=2))
    print(json.dumps(checks,indent=2))
