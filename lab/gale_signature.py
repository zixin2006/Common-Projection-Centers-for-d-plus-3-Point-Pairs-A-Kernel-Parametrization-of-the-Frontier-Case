"""Exact ordered configuration signatures from the paired Gale points.

Normalize the first three points on each P1 to infinity, zero, one. The
remaining 2d cross-ratios are coordinates on the corresponding open chart
of the marked moduli space. Labels matter; this is not an unordered matcher.
"""
from fractions import Fraction as F
from pathlib import Path
import json

def signature(points):
    points=list(map(F,points));a,b,c=points[:3]
    if len(set(points))!=len(points):raise ValueError('Gale points must be distinct')
    return [(x-b)*(c-a)/((x-a)*(c-b)) for x in points[3:]]

def transform(points,a,b,c,d):
    if a*d-b*c==0:raise ValueError('Singular projectivity')
    return [(a*F(x)+b)/(c*F(x)+d) for x in points]

def verify():
    rows=[]
    for d in [3,4,5]:
        n=d+3;t=[-3,-2,-1,0,1,2,3,4][:n];s=[F(x,10) for x in [-24,17,-3,28,-11,6,-32,39][:n]]
        first,second=signature(t),signature(s)
        assert first==signature(transform(t,2,3,1,7))
        assert second==signature(transform(s,-1,4,2,9))
        rows.append(dict(d=d,dimension=2*d,first=[str(v) for v in first],second=[str(v) for v in second],projectivity_invariance_verified=True))
    return rows

if __name__=='__main__':
    result=verify();print(json.dumps(result,indent=2))
    (Path(__file__).parent/'gale_signatures.json').write_text(json.dumps(result,indent=2))
