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
    # (le roi : traits blancs sur fond noir, voir `negative`)
    ('roi', 'roi.png', 104),
    # (le pont : réduit pour que ses traits fassent un ou deux pixels)
    ('pont', 'pont.png', 120),
    # (clé, fichier, hauteur visée en pixels du jeu, ou None : telle quelle)
    ('arche', 'arche2.png', 116),
    ('ruine', 'arche.png', None),
    ('colonne', 'colonne_x1.png', None),
    ('socle', 'ruine_x1.png', None),
]


def pixels(path, height=None, negative=False):
    args = ['convert', path, '-alpha', 'remove', '-background', 'black' if negative else 'white']
    if height:
        # Le dessin seul (sans la marge), réduit par moyenne
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


NEGATIVE = {'roi.png'}                # traits blancs sur noir : on inverse


def classify(rgb, thresholded, negative=False):
    r, g, b = rgb
    lum = (r + g + b) / 3
    if negative:
        # Les traits blancs (os, pierre éclairée) en neige ; le noir est le
        # vide (le fond, ou le dedans, rempli plus loin en bleu nuit)
        return 's' if lum > 90 else 'W'
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
    negative = os.path.basename(path) in NEGATIVE
    px, w, h = pixels(path, height, negative)
    g = [[classify(px[(x, y)], bool(height), negative) for x in range(w)] for y in range(h)]
    # Le fond : le blanc relié aux bords (4-connexe) devient transparent. En
    # négatif, les traits ne se ferment pas toujours : le dehors se cherche sur
    # les traits épaissis (de 2 pixels), pour que le dedans reste plein
    wall = [[g[y][x] != 'W' for x in range(w)] for y in range(h)]
    if negative:
        r = 2
        wall = [[any(g[yy][xx] != 'W' for yy in range(max(0, y - r), min(h, y + r + 1)) for xx in range(max(0, x - r), min(w, x + r + 1)))
                 for x in range(w)] for y in range(h)]
    outside = [[False] * w for _ in range(h)]
    stack = [(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)]
    while stack:
        x, y = stack.pop()
        if 0 <= x < w and 0 <= y < h and not outside[y][x] and not wall[y][x]:
            outside[y][x] = True
            stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    for y in range(h):
        for x in range(w):
            # (en négatif, le liseré de 2 pixels autour des traits reste dehors)
            near_out = negative and g[y][x] == 'W' and any(outside[yy][xx] for yy in range(max(0, y - 2), min(h, y + 3)) for xx in range(max(0, x - 2), min(w, x + 3)))
            if g[y][x] == 'W' and (outside[y][x] or near_out):
                g[y][x] = '.'
    # Le vide enfermé : la neige (dessin clair), ou le bleu nuit (dessin en négatif)
    rows = [''.join(('k' if negative else 's') if c == 'W' else c for c in row) for row in g]
    # Rognure
    while rows and set(rows[0]) == {'.'}:
        rows.pop(0)
    while rows and set(rows[-1]) == {'.'}:
        rows.pop()
    left = min(len(r) - len(r.lstrip('.')) for r in rows)
    right = max(len(r.rstrip('.')) for r in rows)
    return [r[left:right] for r in rows]


# ── Les loups (assets/loups.png) : quatre poses sur une grille irrégulière
# d'environ 17,7 px (une image générée) ; lues au cœur de chaque case, puis
# réduites de moitié (une case du jeu = 2 × 2 cases du dessin, pleine si l'une
# l'est : les pattes et les oreilles fines restent) pour qu'un loup arrive à
# la hanche du viking. Marche (tête à droite) ; course (tête à gauche,
# retournée pour regarder à droite comme les autres)
WOLF_GRID = (17.82, 16.4, 17.66, 8.4)            # pas et décalage, en x puis en y
WOLF_POSES = [                                   # (nom, cadre x0 x1 y0 y1, retourner)
    ('marche0', (60, 560, 140, 392), False),
    ('course0', (560, 1100, 140, 392), True),
    ('marche1', (40, 560, 580, 795), False),
    ('course1', (560, 1100, 580, 795), True),
]


def wolves():
    out = subprocess.run(['convert', os.path.join(ROOT, 'assets', 'loups.png'), '-colorspace', 'gray', '-threshold', '50%', 'txt:-'],
                         capture_output=True, text=True, check=True).stdout.splitlines()[1:]
    on = set()
    for line in out:
        pos, rest = line.split(':', 1)
        if 'black' in rest or '#000000' in rest:
            on.add(tuple(map(int, pos.split(','))))
    sx, ox, sy, oy = WOLF_GRID

    def cell(cx, cy):
        x0, x1 = int(ox + cx * sx + 4), int(ox + (cx + 1) * sx - 4)
        y0, y1 = int(oy + cy * sy + 4), int(oy + (cy + 1) * sy - 4)
        n = sum((x, y) in on for y in range(y0, y1) for x in range(x0, x1))
        return n * 2 > (x1 - x0) * (y1 - y0)

    poses = {}
    for name, (X0, X1, Y0, Y1), flip in WOLF_POSES:
        cx0, cx1, cy0, cy1 = int((X0 - ox) / sx), int((X1 - ox) / sx), int((Y0 - oy) / sy), int((Y1 - oy) / sy)
        f = [[cell(cx, cy) for cx in range(cx0, cx1)] for cy in range(cy0, cy1)]
        h, w = len(f), len(f[0])
        rows = []
        for y in range(h - 1, 0, -2):           # depuis le sol
            rows.append(''.join('b' if any(f[yy][xx] for yy in (y, y - 1) for xx in (x, x + 1) if xx < w) else '.'
                                for x in range(0, w, 2)))
        rows.reverse()
        while rows and set(rows[0]) == {'.'}:
            rows.pop(0)
        left = min(len(r) - len(r.lstrip('.')) for r in rows)
        right = max(len(r.rstrip('.')) for r in rows)
        rows = [r[left:right] for r in rows]
        if flip:
            rows = [r[::-1] for r in rows]
        poses[name] = rows
    return poses


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
    lines.append('')
    lines.append('// Les loups (assets/loups.png), de profil vers la droite, le bas = le sol')
    lines.append('export const WOLF_ART = {')
    for name, rows in wolves().items():
        lines.append(f'  {name}: [')
        lines += [f"    '{r}'," for r in rows]
        lines.append('  ],')
    lines.append('};')
    with open(os.path.join(ROOT, 'js', 'ruins-art.js'), 'w') as f:
        f.write('\n'.join(lines) + '\n')
    print('js/ruins-art.js écrit')


main()
