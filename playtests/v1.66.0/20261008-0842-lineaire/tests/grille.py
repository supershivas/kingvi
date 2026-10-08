# Analyse jetable : alignement des bords nets sur la grille des pixels du jeu, phase des lignes CRT.
import sys, json
from PIL import Image
import numpy as np
def analyse(png, m, thr=60):
    im = np.asarray(Image.open(png).convert('RGB')).astype(int)
    dpr = m['dpr']; f = m['factor']
    x0 = round(m['canvas']['left']*dpr); y0 = round(m['canvas']['top']*dpr)
    sy0 = round(m['screen']['top']*dpr); sy1 = round((m['screen']['top']+m['screen']['h'])*dpr); sx1 = round(m['screen']['w']*dpr)
    # zone de jeu, sans le coin du compteur (haut droite) ni le bas (bulles)
    a = im[sy0+int(60*dpr):sy1-int(120*dpr), x0+4:sx1-4]
    oy = (sy0+int(60*dpr)-y0); ox = 4
    dx = np.abs(np.diff(a, axis=1)).sum(2); dy = np.abs(np.diff(a, axis=0)).sum(2)
    ex = np.argwhere(dx > thr); ey = np.argwhere(dy > thr)
    # un bord entre colonne j et j+1 : est-il à une frontière de pixel du jeu ?
    colb = ((ex[:,1] + 1 + ox) % f == 0) if len(ex) else np.array([])
    rowb = ((ey[:,0] + 1 + oy) % f == 0) if len(ey) else np.array([])
    # phase des lignes : luminance moyenne par rang (y - top canevas) mod f
    lum = a.mean(2)
    ph = [float(lum[[i for i in range(lum.shape[0]) if (i+oy) % f == k]].mean()) for k in range(f)]
    return {'bordsX': int(len(ex)), 'alignesX': round(float(colb.mean())*100,2) if len(ex) else None,
            'bordsY': int(len(ey)), 'alignesY': round(float(rowb.mean())*100,2) if len(ey) else None,
            'phaseLum': [round(v,1) for v in ph]}
if __name__ == '__main__':
    d = json.load(open(sys.argv[1]))
    import os; base = os.path.dirname(sys.argv[1])
    for r in d['res']:
        print(r['name'], 'f=%s dpr=%s' % (r['m']['factor'], r['m']['dpr']), analyse(os.path.join(base, r['name']+'.png'), r['m']))
