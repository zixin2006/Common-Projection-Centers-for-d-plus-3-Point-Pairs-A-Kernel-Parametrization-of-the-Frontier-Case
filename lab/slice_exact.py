"""Certified mixed-hyperplane counts over Q, with approximate root pictures.

Impose alpha.a=0 and beta.b=0. Eliminate the first affine Gale parameter,
remove the d+3 base-point factors, and certify degree, squarefreeness,
denominator coprimality and the real-root count using exact arithmetic.
Only root locations use floating point. No CAS dependency is required.
"""
from fractions import Fraction
from math import gcd,lcm
from functools import reduce
from pathlib import Path
import json
import numpy as np

def trim(p):
    p=list(p)
    while len(p)>1 and p[-1]==0: p.pop()
    return p

def add(p,q):
    out=[0]*max(len(p),len(q))
    for i,c in enumerate(p):out[i]+=c
    for i,c in enumerate(q):out[i]+=c
    return trim(out)

def scale(p,a):return trim([a*c for c in p])

def mul(p,q):
    out=[0]*(len(p)+len(q)-1)
    for i,c in enumerate(p):
        for j,v in enumerate(q):out[i+j]+=c*v
    return trim(out)

def power(p,n):
    out=[1]
    for _ in range(n):out=mul(out,p)
    return out

def divide(p,q):
    r=list(map(Fraction,trim(p)));q=list(map(Fraction,trim(q)))
    assert q!=[0]
    out=[Fraction(0)]*max(1,len(r)-len(q)+1)
    while r!=[0] and len(r)>=len(q):
        shift=len(r)-len(q);c=r[-1]/q[-1];out[shift]=c
        for i,v in enumerate(q):r[i+shift]-=c*v
        r=trim(r)
    return trim(out),trim(r)

def primitive(p):
    den=reduce(lcm,(Fraction(c).denominator for c in p),1)
    ints=[int(Fraction(c)*den) for c in p]
    divisor=reduce(gcd,(abs(c) for c in ints),0) or 1
    return trim([c//divisor for c in ints])

def derivative(p):return trim([i*p[i] for i in range(1,len(p))] or [0])

def poly_gcd(p,q):
    p,q=primitive(p),primitive(q)
    while q!=[0]:p,q=q,primitive(divide(p,q)[1])
    return primitive(p)

def sturm_count(p):
    seq=[primitive(p),primitive(derivative(p))]
    while seq[-1]!=[0]:
        rem=divide(seq[-2],seq[-1])[1]
        if rem==[0]:break
        seq.append(primitive(scale(rem,-1)))
    def variations(direction):
        signs=[(1 if q[-1]>0 else -1)*((-1)**(len(q)-1) if direction<0 else 1) for q in seq]
        return sum(a!=b for a,b in zip(signs,signs[1:]))
    return variations(-1)-variations(1)

def evaluate(p,z):
    out=0
    for c in p[::-1]:out=out*z+c
    return out

def config_integer(nodes):
    n=len(nodes);rows=[]
    for i in range(n-2):
        row=[0]*n;row[i]=nodes[-2]-nodes[-1]
        row[-2]=nodes[-1]-nodes[i];row[-1]=nodes[i]-nodes[-2]
        assert sum(row)==sum(a*b for a,b in zip(row,nodes))==0
        rows.append(row)
    return rows

def coefficients(nodes):
    polys=[]
    for i in range(len(nodes)):
        p=[1]
        for j,x in enumerate(nodes):
            if j!=i:p=mul(p,[-x,1])
        polys.append(p)
    return polys

def slice_instance(d,seed=914):
    n=d+3;m=d+1
    t=[-3,-2,-1,0,1,2,3,4][:n]
    s=[-24,17,-3,28,-11,6,-32,39][:n] # S=10*s in the geometric viewer
    x,y=config_integer(t),config_integer(s)
    rng=np.random.default_rng(seed+d)
    for _ in range(20):
        alpha=rng.integers(-5,6,d+1).tolist();beta=rng.integers(-5,6,d+1).tolist()
        ax=[sum(alpha[j]*x[j][i] for j in range(d+1)) for i in range(n)]
        by=[sum(beta[j]*y[j][i] for j in range(d+1)) for i in range(n)]
        if all(ax) and all(by):break
    else:raise AssertionError('choose hyperplanes avoiding the marked points')
    ss,tt=coefficients(s),coefficients(t)
    aa=[0];bb=[0]
    for i in range(n):
        aa=add(aa,scale(ss[i],ax[i]));bb=add(bb,scale(ss[i],-t[i]*ax[i]))
    assert max(len(aa),len(bb))<=m+1
    # G(t,S)=sum_i c_i(t)*S^0 + e_i(t)*S^1.
    g0=[0];g1=[0]
    for i in range(n):
        g0=add(g0,scale(tt[i],-s[i]*by[i]));g1=add(g1,scale(tt[i],by[i]))
    assert max(len(g0),len(g1))<=m+1
    elimination=[0]
    for coeffs,shift in [(g0,0),(g1,1)]:
        for i,c in enumerate(coeffs):
            term=scale(mul(power(scale(bb,-1),i),power(aa,m-i)),c)
            elimination=add(elimination,[0]*shift+term)
    base=[1]
    for si in s:base=mul(base,[-si,1])
    quot,rem=divide(elimination,base)
    assert rem==[0]
    q=primitive(quot)
    expected=d*d+d-1
    assert len(q)-1==expected
    assert len(poly_gcd(q,derivative(q)))==1
    assert len(poly_gcd(q,aa))==1
    assert len(poly_gcd(q,base))==1
    # Numerical locations in s=S/10 keep the companion matrix better scaled.
    scaled=np.array([float(c)*10.**i for i,c in enumerate(q)])
    scaled/=max(abs(scaled))
    roots=np.polynomial.polynomial.polyroots(scaled)
    for _ in range(8):
        roots-=np.polynomial.polynomial.polyval(roots,scaled)/np.polynomial.polynomial.polyval(roots,np.polynomial.polynomial.polyder(scaled))
    errors=[abs(np.polynomial.polynomial.polyval(z,scaled))/sum(abs(c)*abs(z)**i for i,c in enumerate(scaled)) for z in roots]
    points=[]
    for z in roots:
        tt0=-evaluate(bb,10*z)/evaluate(aa,10*z)
        points.append(dict(s=[float(z.real),float(z.imag)],t=[float(tt0.real),float(tt0.imag)]))
    real=sturm_count(q)
    assert sum(abs(z.imag)<1e-7 for z in roots)==real
    return dict(d=d,N=n,parameter_convention='S=10s; coefficients ascending in S',
                alpha=alpha,beta=beta,X=x,Y=y,t_nodes=t,S_nodes=s,
                polynomial=[str(c) for c in q],base_factors_removed=n,
                raw_eliminant_degree=len(elimination)-1,residual_degree=expected,
                squarefree=True,denominator_coprime=True,base_coprime=True,
                exact_real_roots=real,complex_nonreal_roots=expected-real,
                approximate_points=points,max_relative_polynomial_residual=float(max(errors)))

if __name__=='__main__':
    root=Path(__file__).parent
    out=[]
    for d in [3,4]:
        row=slice_instance(d)
        out.append(row)
        print({k:row[k] for k in ['d','raw_eliminant_degree','base_factors_removed','residual_degree','exact_real_roots','max_relative_polynomial_residual']},flush=True)
    (root/'slice_certificates.json').write_text(json.dumps(out,indent=2))
