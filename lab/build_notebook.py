"""Build and execute the companion notebook, including its static outputs."""
from pathlib import Path
import json,io,contextlib,base64,os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
ROOT=Path(__file__).parent
CELLS=[
('markdown',r'''# Common projection centers: computational laboratory

This notebook accompanies **Common projection centers: Gale configurations, boundary geometry, and section algebras** (revised manuscript, 2026).

Run it from the extracted project folder. It uses `geometry.py`, `algebra.py`, `slice_exact.py`, and `gale_signature.py`. Install NumPy and Matplotlib from `requirements.txt`. The interactive companion is `common_centers_lab.html`.

The geometry plots are real slices or affine shadows. Theorems in the paper concern general configurations over an algebraically closed field of characteristic zero. Floating-point residuals below test an implementation; they do not prove the general theorems.
'''),
('code',r'''import json
from pathlib import Path
import numpy as np
import matplotlib.pyplot as plt
from geometry import configuration, centers, exceptional, matching, distance, verify
from algebra import invariants, sections, coordinates, betti
from slice_exact import slice_instance
from gale_signature import signature, transform
print('NumPy', np.__version__)
print('Modules loaded. Geometry examples: d = 3, 4, 5.')
'''),
('markdown',r'''## 1. Generate a valid pair and recover the projectivity

For $N=d+3$, let $K_X=\ker X$ and $K_Y=\ker Y$. At an ordinary parameter pair, $D=\operatorname{diag}(k_i/\ell_i)$ yields $L_X(a)=DL_Y(b)$. Quotient cameras then satisfy $P_bY=H(P_aX)D$.

Change `d`, `theta`, or `psi` and rerun. The code constructs quotient cameras independently of the cleared coordinate formulas and computes the matrix $H$.
'''),
('code',r'''d = 4
data = configuration(d)
theta, psi = 0.33, -0.64
result = matching(data, theta, psi)
print('N =', d+3)
print('center a:', np.array(result['a']))
print('center b:', np.array(result['b']))
print('relative matching residual:', result['residual'])
print('largest projective image discrepancy:', result['image_distance'])
print('H =\n', np.array(result['H']))
'''),
('markdown',r'''## 2. Resolve a base point instead of dividing by zero

At $(t_i,s_i)$, the raw coordinate vectors vanish. A direction $[\xi:\eta]=[\cos\phi:\sin\phi]$ determines a point on $E_i$. The function `exceptional` evaluates the first-derivative formula at that direction. The two excluded directions are $\phi=0$ and $\phi=\pi/2$.
'''),
('code',r'''i, phi = 0, 0.61
limit = exceptional(data, i, phi)
exception_result = matching(data, exception=(i,phi))
print('Matching residual on E_i:', exception_result['residual'])
epsilons = np.logspace(-1,-7,25)
errors=[]
for epsilon in epsilons:
    nearby=centers(data, np.arctan(data['t'][i]+epsilon*np.cos(phi)),
                   np.arctan(data['s'][i]+epsilon*np.sin(phi)))
    errors.append(max(distance(x,y) for x,y in zip(nearby,limit)))
fig,ax=plt.subplots(figsize=(6.5,4))
ax.loglog(epsilons,errors,'o-',color='#087e83',ms=3)
ax.set(xlabel='Approach radius epsilon',ylabel='Projective distance to resolved limit',
       title='Approach to an exceptional center pair, d=4')
ax.grid(alpha=.2)
fig.tight_layout()
plt.show()
'''),
('markdown',r'''## 3. Compare the two rings

The full section dimension is

$$h^0(pA+qB)=1+\frac{(d-1)(p^2+q^2)+2(d^2+d-1)pq+(d+1)(p+q)}2.$$

The coordinate ring differs only at $(1,1)$, by $d-1$ sections. This produces the finite normalization sequence. The table below evaluates the **proved normalization Betti formula**, not a computed resolution of the original ring $R$.
'''),
('code',r'''print(json.dumps(invariants(d),indent=2))
print('At (1,1): full =',sections(d,1,1),'coordinate =',coordinates(d,1,1))
for homological in range(2*d-1):
    terms=[f'T(-{r["p"]},-{r["q"]})^{r["value"]}' for r in betti(d) if r['i']==homological]
    print(homological, ':', ' + '.join(terms))
'''),
('markdown',r'''## 4. Make the degree count visible, with an exact certificate

One general hyperplane constraint on each center intersects the surface in $AB=d^2+d-1$ complex points, counted with multiplicity. Here the specified rational example has a squarefree residual eliminant, so its points are distinct. Before counting, remove the $d+3$ base-point factors.

The univariate degree, gcds, and Sturm real-root count are exact. Only the root locations in the plot are approximate. The hyperplanes here are expressed in the integer configuration coordinates printed in the certificate; those are projectively equivalent to the viewer's orthonormal coordinates.
'''),
('code',r'''certificate=slice_instance(4)
for key in ['raw_eliminant_degree','base_factors_removed','residual_degree',
            'squarefree','denominator_coprime','base_coprime','exact_real_roots',
            'complex_nonreal_roots','max_relative_polynomial_residual']:
    print(key,':',certificate[key])
z=np.array([p['s'] for p in certificate['approximate_points']])
real=abs(z[:,1])<1e-7
fig,ax=plt.subplots(figsize=(6.5,4))
ax.scatter(*z[real].T,color='#087e83',label='9 real center pairs')
ax.scatter(*z[~real].T,color='#7453a1',label='10 nonreal center pairs')
ax.axhline(0,lw=.6,color='gray')
ax.set(xlabel='Re(s)',ylabel='Im(s)',title='The 19-point mixed hyperplane section')
ax.legend(frameon=False)
fig.tight_layout()
plt.show()
'''),
('markdown',r'''## 5. Compress a marked configuration to projective invariants

Normalize the first three Gale points to $\infty,0,1$. The remaining points give $N-3=d$ cross-ratios on each factor: $2d$ coordinates in total. This is a marked projective signature on the chosen chart, not a metric similarity score or an unordered point matcher.
'''),
('code',r'''from fractions import Fraction
t=[-3,-2,-1,0,1,2,3]
s=[Fraction(x,10) for x in [-24,17,-3,28,-11,6,-32]]
sig=(signature(t),signature(s))
changed=(signature(transform(t,2,3,1,7)),signature(transform(s,-1,4,2,9)))
assert sig==changed
print('Two projectivities leave the eight invariants unchanged:')
print([[str(v) for v in row] for row in sig])
'''),
('markdown',r'''## Sources and next experiments

- [Ottaviani and Thomas, the common-image problem](https://arxiv.org/abs/2603.14172).
- [Eisenbud and Popescu, The Projective Geometry of the Gale Transform](https://arxiv.org/abs/math/9807127).
- [Hartley and Zisserman, Multiple View Geometry](https://www.robots.ox.ac.uk/~vgg/hzbook/).
- [Macaulay2 multigraded Betti tables](https://macaulay2.com/doc/Macaulay2/share/doc/Macaulay2/Macaulay2Doc/html/___Multigraded__Betti__Tally.html).
- [HomotopyContinuation.jl parameter homotopies](https://www.juliahomotopycontinuation.org/guides/parameter-homotopies/).

Concrete extensions: vary the hyperplanes and track the 19 points; determine their discriminant and real-root chambers; compute the original ring's remaining mixed syzygies; compare projective signatures across differently represented copies of the same marked input.
''')]

def main():
    os.chdir(ROOT);namespace={};cells=[];count=0
    for kind,source in CELLS:
        source=source.replace('\\\\','\\')
        cell=dict(cell_type=kind,metadata={},source=source.splitlines(keepends=True))
        if kind=='code':
            count+=1;outputs=[];stream=io.StringIO()
            def show(*args,**kwargs):
                for number in plt.get_fignums():
                    buff=io.BytesIO();plt.figure(number).savefig(buff,format='png',dpi=125,bbox_inches='tight')
                    outputs.append(dict(output_type='display_data',data={'image/png':base64.b64encode(buff.getvalue()).decode()},metadata={}))
                plt.close('all')
            oldshow=plt.show;plt.show=show
            try:
                with contextlib.redirect_stdout(stream):exec(compile(source,'notebook-cell','exec'),namespace)
            finally:plt.show=oldshow
            if stream.getvalue():outputs.insert(0,dict(output_type='stream',name='stdout',text=stream.getvalue().splitlines(keepends=True)))
            cell.update(execution_count=count,outputs=outputs)
        cells.append(cell)
    book=dict(nbformat=4,nbformat_minor=5,metadata={'kernelspec':{'display_name':'Python 3','language':'python','name':'python3'},'language_info':{'name':'python','version':'3.11'}},cells=cells)
    for i,c in enumerate(cells):c['id']=f'centers-{i:02d}'
    (ROOT/'common_centers_experiments.ipynb').write_text(json.dumps(book,indent=1))
    print('Executed',count,'code cells without errors.')

if __name__=='__main__':main()
