"""Real projective geometry behind Common Centers Lab.

The browser uses the same formulas. Floating-point diagnostics are checks,
not proofs. Exact algebraic computations live in algebra.py and slice_exact.py.
"""
from pathlib import Path
import json
import numpy as np


def configuration(d):
    """Deterministic real Gale data; orthonormal rows improve display arithmetic."""
    if d not in (3,4,5):
        raise ValueError('The included real examples support d=3,4,5.')
    n = d + 3
    t = np.array([-3, -2, -1, 0, 1, 2, 3, 4], float)[:n]
    s = np.array([-2.4, 1.7, -.3, 2.8, -1.1, .6, -3.2, 3.9])[:n]
    def matrix(nodes, seed):
        _, _, vt = np.linalg.svd(np.array([np.ones(n), nodes]))
        x = vt[2:]
        rng = np.random.default_rng(seed)
        # Pick a chart whose data columns all stay away from its horizon.
        choices = rng.normal(size=(300, d+1))
        choices /= np.linalg.norm(choices, axis=1)[:, None]
        scores = np.min(abs(choices @ x) / np.linalg.norm(x, axis=0), axis=1)
        h = choices[np.argmax(scores)]
        _, _, v = np.linalg.svd(h[None, :])
        return np.vstack([v[1:], h]) @ x
    x, y = matrix(t, 150+d), matrix(s, 300+d)
    return dict(d=d, t=t, s=s, X=x, Y=y)


def normalize(v):
    v = np.asarray(v, float)
    return v / np.linalg.norm(v)


def distance(a, b):
    """Sign-invariant chord distance of real projective representatives."""
    a, b = normalize(a), normalize(b)
    return float(min(np.linalg.norm(a-b), np.linalg.norm(a+b)))


def center_polynomial(matrix, first, second, theta, psi):
    """No coordinate-ratio division; valid also on a contracted fiber.

    k_i=sin(theta)-first_i*cos(theta), l_i=sin(psi)-second_i*cos(psi).
    Dividing the cleared expression by the complementary kernel coordinate
    gives the vector sum below (a harmless global sign has been suppressed).
    """
    k = np.sin(theta)-first*np.cos(theta)
    l = np.sin(psi)-second*np.cos(psi)
    products = np.array([np.prod(np.delete(l, i)) for i in range(len(l))])
    # Formula with constant complementary relation vector. At cos(psi)=0
    # cancellation is exact algebraically, so use the other complement.
    if abs(np.cos(psi)) > .25:
        return matrix @ (k*products) / np.cos(psi)
    return matrix @ (k*second*products) / np.sin(psi)


def centers(data, theta, psi):
    t,s,x,y = (data[k] for k in ['t','s','X','Y'])
    return (normalize(center_polynomial(x,t,s,theta,psi)),
            normalize(center_polynomial(y,s,t,psi,theta)))


def exceptional(data, i, phi):
    """Exact first derivatives in affine coordinates xi=t-t_i, eta=s-s_i.

    This evaluates the resolved map on E_i without a small-epsilon limit.
    Returned representatives vary projectively linearly in [cos(phi):sin(phi)].
    """
    t,s,x,y=(data[k] for k in ['t','s','X','Y'])
    n=len(t)
    pa=np.prod([s[i]-s[j] for j in range(n) if j!=i])
    pb=np.prod([t[i]-t[j] for j in range(n) if j!=i])
    at=x[:,i]*pa; bs=y[:,i]*pb
    ass=sum((x[:,j]*(t[i]-t[j])*np.prod([s[i]-s[k] for k in range(n) if k not in (i,j)]) for j in range(n) if j!=i),np.zeros(x.shape[0]))
    bt=sum((y[:,j]*(s[i]-s[j])*np.prod([t[i]-t[k] for k in range(n) if k not in (i,j)]) for j in range(n) if j!=i),np.zeros(y.shape[0]))
    return normalize(np.cos(phi)*at+np.sin(phi)*ass), normalize(np.cos(phi)*bt+np.sin(phi)*bs)


def camera(center):
    """An orthonormal matrix with kernel equal to the center line."""
    _, _, vt=np.linalg.svd(normalize(center)[None,:])
    return vt[1:]


def matching(data,theta=None,psi=None,exception=None):
    t,s,x,y=(data[k] for k in ['t','s','X','Y'])
    if exception is None:
        a,b=centers(data,theta,psi)
        k=np.sin(theta)-t*np.cos(theta)
        l=np.sin(psi)-s*np.cos(psi)
        if min(np.min(abs(k)),np.min(abs(l)))<1e-10:
            return dict(valid=False)
        diagonal=k/l
    else:
        i,phi=exception
        a,b=exceptional(data,i,phi)
        if min(abs(np.cos(phi)),abs(np.sin(phi)))<1e-10:
            return dict(valid=False)
        diagonal=np.array([(t[i]-t[j])/(s[i]-s[j]) if j!=i else np.cos(phi)/np.sin(phi) for j in range(len(t))])
    px,py=camera(a),camera(b)
    xx,yy=px@x,py@y
    xd=xx*diagonal
    h=yy @ np.linalg.pinv(xd)
    residual=np.linalg.norm(yy-h@xd)/np.linalg.norm(yy)
    image_distance=max(distance(h@xx[:,i],yy[:,i]) for i in range(len(t)))
    return dict(valid=True,residual=float(residual),image_distance=image_distance,
                a=a.tolist(),b=b.tolist(),H=h.tolist(),diagonal=diagonal.tolist(),
                image_X=xx.tolist(),image_Y=yy.tolist(),aligned_X=(h@xx).tolist())


def verify():
    results=[]
    rng=np.random.default_rng(84192)
    for d in [3,4,5]:
        data=configuration(d)
        t,s,x,y=(data[k] for k in ['t','s','X','Y'])
        kernel=max(np.linalg.norm(x@np.array([np.ones(len(t)),t]).T),np.linalg.norm(y@np.array([np.ones(len(t)),s]).T))
        ordinary=[]; exceptional_checks=[]; contractions=[]; convergence=[]
        for theta,psi in rng.uniform(-1.5,1.5,(100,2)):
            if min(np.min(abs(np.sin(theta)-t*np.cos(theta))),np.min(abs(np.sin(psi)-s*np.cos(psi))))<.02:
                continue
            ordinary.append(matching(data,theta,psi)['residual'])
        for i in range(len(t)):
            for phi in [.19,.73,1.92,2.76]:
                exceptional_checks.append(matching(data,exception=(i,phi))['residual'])
                a,b=exceptional(data,i,phi)
                errors=[]
                for eps in [1e-2,1e-3,1e-4]:
                    aa,bb=centers(data,np.arctan(t[i]+eps*np.cos(phi)),np.arctan(s[i]+eps*np.sin(phi)))
                    errors.append(max(distance(a,aa),distance(b,bb)))
                assert errors[-1]<errors[0]*.03,(d,i,phi,errors)
                convergence.append(errors[-1])
            for theta in [-1.43,-.53,.39,1.21]:
                a,_=centers(data,theta,np.arctan(s[i]))
                contractions.append(distance(a,x[:,i]))
            for psi in [-1.39,-.49,.41,1.19]:
                _,b=centers(data,np.arctan(t[i]),psi)
                contractions.append(distance(b,y[:,i]))
            assert distance(exceptional(data,i,0)[0],x[:,i])<1e-10
            assert distance(exceptional(data,i,np.pi/2)[1],y[:,i])<1e-10
        row=dict(d=d,kernel_residual=float(kernel),ordinary_samples=len(ordinary),
                 ordinary_residual=max(ordinary),exceptional_residual=max(exceptional_checks),
                 contraction_distance=max(contractions),limit_distance_at_1e_4=max(convergence))
        assert row['ordinary_residual']<1e-8,row
        assert row['exceptional_residual']<1e-8,row
        assert row['contraction_distance']<1e-8,row
        results.append(row)
    return results


if __name__=='__main__':
    root=Path(__file__).parent
    results=verify()
    (root/'geometry_checks.json').write_text(json.dumps(results,indent=2))
    print(json.dumps(results,indent=2))
