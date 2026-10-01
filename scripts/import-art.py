#!/usr/bin/env python3
"""Convertit les dessins de assets/ en pixels du jeu : js/ruins-art.js.

Les dessins ne sont pas retouchés : seules leurs couleurs sont ramenées aux
trois du jeu (traits sombres -> k, demi-teintes -> b, clairs -> s), le blanc
du fond devient transparent (rempli depuis les bords) et le blanc enfermé dans
le dessin devient de la neige (s). Les fichiers « _x1 » sont déjà à l'échelle
du jeu (un pixel de l'image = un pixel du jeu). arche2.png est une grande
image : elle est réduite par moyenne, puis seuillée, à la taille où ses
traits font deux pixels comme ceux des autres.

Il faut ImageMagick (convert). À relancer après chaque changement d'image :
    python3 scripts/import-art.py
"""
import os
import subprocess

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SOURCES = [
    # (clé, fichier, hauteur visée en pixels du jeu, ou None : telle quelle)
    ('arche', 'arche2.png', 116),
    ('ruine', 'arche.png', None),
    ('colonne', 'colonne_x1.png', None),
    ('socle', 'ruine_x1.png', None),
]


def pixels(path, height=None):
    args = ['convert', path, '-alpha', 'remove', '-background', 'white']
    if height:
        # Le dessin seul (sans la marge blanche), réduit par moyenne
        args += ['-fuzz', '10%', '-trim', '+repage', '-filter', 'Box', '-resize', f'x{height}']
    out = subprocess.run(args + ['txt:-'], capture_output=True, text=True, check=True).stdout.splitlines()[1:]
    px = {}
    for line in out:
        pos, rest = line.split(':', 1)
        x, y = map(int, pos.split(','))
        rgb = rest.split('(')[1].split(')')[0].split(',')[:3]
        px[(x, y)] = tuple(round(float(v)) for v in rgb)
    w = max(x for x, _ in px) + 1
    h = max(y for _, y in px) + 1
    return px, w, h


def classify(rgb, thresholded):
    r, g, b = rgb
    lum = (r + g + b) / 3
    if thresholded:
        return 'k' if lum < 128 else 'W'
    if lum > 250:
        return 'W'                       # blanc : le fond, ou la face claire
    if lum > 200:
        return 's'                       # crème : les clairs
    if lum > 90:
        return 'b'                       # demi-teinte
    return 'k'                           # les traits


def convert(path, height):
    px, w, h = pixels(path, height)
    g = [[classify(px[(x, y)], bool(height)) for x in range(w)] for y in range(h)]
    # Le fond : le blanc relié aux bords (4-connexe) devient transparent
    stack = [(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)]
    while stack:
        x, y = stack.pop()
        if 0 <= x < w and 0 <= y < h and g[y][x] == 'W':
            g[y][x] = '.'
            stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    rows = [''.join('s' if c == 'W' else c for c in row) for row in g]
    # Rognure
    while rows and set(rows[0]) == {'.'}:
        rows.pop(0)
    while rows and set(rows[-1]) == {'.'}:
        rows.pop()
    left = min(len(r) - len(r.lstrip('.')) for r in rows)
    right = max(len(r.rstrip('.')) for r in rows)
    return [r[left:right] for r in rows]


def main():
    lines = [
        '/* Généré par scripts/import-art.py depuis assets/ : ne pas modifier à la',
        '   main. Les dessins de l\'arche et des ruines, en pixels du jeu (k traits,',
        '   b demi-teintes, s clairs et neige, . transparent). */',
        '',
        'export const RUIN_ART = {',
    ]
    for key, name, height in SOURCES:
        rows = convert(os.path.join(ROOT, 'assets', name), height)
        lines.append(f'  // {name} : {len(rows[0])} × {len(rows)}')
        lines.append(f'  {key}: [')
        lines += [f"    '{r}'," for r in rows]
        lines.append('  ],')
    lines.append('};')
    with open(os.path.join(ROOT, 'js', 'ruins-art.js'), 'w') as f:
        f.write('\n'.join(lines) + '\n')
    print('js/ruins-art.js écrit')


main()
