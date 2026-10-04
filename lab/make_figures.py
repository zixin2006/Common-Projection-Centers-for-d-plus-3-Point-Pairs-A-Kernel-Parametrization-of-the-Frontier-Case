"""Publication-friendly static figures for the computational companion."""
from pathlib import Path
import json
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from geometry import configuration,centers,exceptional,distance,matching

ROOT=Path(__file__).parent
INK='#17292e';TEAL='#087e83';AMBER='#b45c27';PURPLE='#7453a1'
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':10,'axes.spines.top':False,'axes.spines.right':False,'axes.labelcolor':INK,'text.color':INK,'axes.titleweight':'medium','figure.facecolor':'white','savefig.facecolor':'white','svg.fonttype':'none'})

def overview():
    data=configuration(3);stored=json.loads((ROOT/'viewer_data.json').read_text())['3'];theta,psi=.33,-.64;a,b=centers(data,theta,psi)
    fig=plt.figure(figsize=(12,9),layout='constrained');axes=[]
    ax=fig.add_subplot(221);axes.append(ax)
    tt=np.degrees(np.arctan(data['t']));ss=np.degrees(np.arctan(data['s']))
    for v in tt:ax.axvline(v,color=AMBER,alpha=.28,lw=.8)
    for v in ss:ax.axhline(v,color=TEAL,alpha=.28,lw=.8)
    ax.scatter(tt,ss,c=INK,s=25)
    for i,(x,y) in enumerate(zip(tt,ss)):ax.annotate(str(i+1),(x,y),xytext=(4,4),textcoords='offset points',fontsize=9)
    ax.scatter([np.degrees(theta)],[np.degrees(psi)],c=TEAL,s=80,marker='x',lw=2)
    ax.set(xlim=(-90,90),ylim=(-90,90),xlabel=r'First Gale angle $\theta$ (degrees)',ylabel=r'Second Gale angle $\psi$ (degrees)',title='A. Two parameters, six paired base points')
    ax.set_xticks([-90,-45,0,45,90]);ax.set_yticks([-90,-45,0,45,90])
    def show_scroll(pos,which,p,title):
        ax=fig.add_subplot(pos,projection='3d');raw=np.array(stored['clouds'][which]);mask=np.abs(raw[:,-1])>.02;aff=raw[mask,:3]/raw[mask,-1,None];aff=aff[np.max(abs(aff),axis=1)<4]
        ax.scatter(*aff.T,s=1.7,c=TEAL,alpha=.22,depthshade=False)
        coords=p[:3]/p[-1];ax.scatter(*coords,c=INK,s=40,marker='x')
        xx=(data['X'] if which==0 else data['Y']);xx=xx[:3]/xx[-1]
        ax.scatter(*xx,c=AMBER,s=18,depthshade=False)
        ax.set(xlim=(-4,4),ylim=(-4,4),zlim=(-4,4),xlabel='u',ylabel='v',zlabel='w',title=title)
        ax.view_init(24,35);ax.set_box_aspect((1,1,.85));return ax
    show_scroll(222,0,a,'B. First quadric scroll in an affine chart')
    show_scroll(223,1,b,'C. Second quadric scroll in an affine chart')
    ax=fig.add_subplot(224);info=matching(data,theta,psi);aa=np.array(info['aligned_X']);bb=np.array(info['image_Y']);an=aa/np.linalg.norm(aa,axis=0);bn=bb/np.linalg.norm(bb,axis=0);chart=np.argmax(np.minimum(np.min(abs(an),axis=1),np.min(abs(bn),axis=1)));inds=[i for i in range(3) if i!=chart];aa=aa[inds]/aa[chart];bb=bb[inds]/bb[chart]
    ax.scatter(*aa,c=TEAL,s=25,label='H · projected X');ax.scatter(*bb,facecolors='none',edgecolors=AMBER,s=80,label='projected Y')
    for i,p in enumerate(bb.T):ax.annotate(str(i+1),p,xytext=(7,5),textcoords='offset points')
    ax.set(xlabel='First image coordinate',ylabel='Second image coordinate',title=f'D. Identical projective images (residual {info["residual"]:.1e})');ax.legend(frameon=False,fontsize=9)
    fig.suptitle('Common Centers Lab · a real six-point example',fontsize=17)
    fig.savefig(ROOT/'geometry_overview.png',dpi=180);fig.savefig(ROOT/'geometry_overview.svg');plt.close(fig)

def algebra_figure():
    fig,ax=plt.subplots(1,3,figsize=(14,4.2),layout='constrained')
    c=configuration(4);eps=np.logspace(-1,-7,25)
    for phi,col in zip([.22,.61,1.13],[TEAL,AMBER,PURPLE]):
        exact=exceptional(c,0,phi);errors=[]
        for e in eps:
            a,b=centers(c,np.arctan(c['t'][0]+e*np.cos(phi)),np.arctan(c['s'][0]+e*np.sin(phi)))
            errors.append(max(distance(a,exact[0]),distance(b,exact[1])))
        ax[0].loglog(eps,errors,color=col,label=f'φ = {np.degrees(phi):.1f}°')
    ax[0].set(xlabel='Approach radius ε',ylabel='Projective chord distance to limit',title='A. Resolving an exceptional direction');ax[0].legend(frameon=False,fontsize=8);ax[0].grid(alpha=.2)
    deficit=np.zeros((7,7));deficit[1,1]=3
    ax[1].imshow(deficit,origin='lower',cmap='Blues',vmin=0,vmax=3,interpolation='none')
    for i in range(7):
        for j in range(7):ax[1].text(j,i,str(int(deficit[i,j])),ha='center',va='center',color='white' if deficit[i,j] else '#68777a',fontsize=8)
    ax[1].set(xlabel='p',ylabel='q',title='B. Missing sections in dimension four',xticks=range(7),yticks=range(7))
    cert=json.loads((ROOT/'slice_certificates.json').read_text())[1];roots=np.array([p['s'] for p in cert['approximate_points']]);mask=abs(roots[:,1])<1e-7
    ax[2].scatter(*roots[mask].T,c=TEAL,s=25,label='9 real');ax[2].scatter(*roots[~mask].T,c=PURPLE,s=25,label='10 nonreal');ax[2].axhline(0,color='#acb7b4',lw=.7,zorder=0)
    ax[2].set(xlabel='Re(s)',ylabel='Im(s)',title='C. 19 constrained complex center pairs');ax[2].legend(frameon=False,fontsize=8);ax[2].margins(.15)
    fig.savefig(ROOT/'algebra_and_boundary.png',dpi=180);fig.savefig(ROOT/'algebra_and_boundary.svg');plt.close(fig)

if __name__=='__main__':overview();algebra_figure()
