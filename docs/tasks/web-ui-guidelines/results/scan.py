"""Heuristic scan of apps/web/src/**/*.tsx against the Vercel Web Interface Guidelines.

Machine-detectable rules only; every hit is a candidate to confirm by reading the file.
Usage: python -I scan.py <src-dir> <report.md>
"""
import collections
import os
import re
import sys

root, out = sys.argv[1], sys.argv[2]
files = []
for dp, _dn, fn in os.walk(root):
    for f in fn:
        if f.endswith('.tsx') and not f.endswith('.test.tsx'):
            files.append(os.path.join(dp, f))


def line_of(text, idx):
    return text.count('\n', 0, idx) + 1


findings = collections.defaultdict(set)  # file -> {(line, rule, msg)}


def add(f, ln, rule, msg):
    findings[f].add((ln, rule, msg))


ATTRS = r'(?:[^>{}]|\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\})*?'


def tag_re(name):
    return re.compile(r'<' + name + r'\b' + ATTRS + r'/?>', re.S)


CLASS_RE = re.compile(r'className=(\{`[^`]*`\}|"[^"]*"|\{[^}]*\})', re.S)
NONINTERACTIVE = tag_re(r'(?:div|span|li|tr|td|p|img|section|article|h[1-6])')
CONTROLS = tag_re(r'(?:input|textarea|select)')
IMG = tag_re(r'img')
BUTTON = re.compile(r'<button\b(' + ATTRS + r')>(.*?)</button>', re.S)

for f in files:
    t = open(f, encoding='utf-8').read()
    rel = os.path.relpath(f, root).replace('\\', '/')

    for m in CLASS_RE.finditer(t):
        cls = m.group(1)
        if re.search(r'\boutline-none\b', cls) and not re.search(
                r'focus-visible:|focus:ring|focus:outline|focus:border|focus-within:', cls):
            add(rel, line_of(t, m.start()), 'focus', 'outline-none without focus replacement')
        if re.search(r'\btransition-all\b', cls):
            add(rel, line_of(t, m.start()), 'animation', 'transition-all → list properties')

    for m in NONINTERACTIVE.finditer(t):
        tag = m.group(0)
        if re.search(r'\bonClick=', tag) and not re.search(
                r'role=["\'](button|link|checkbox|tab|option|menuitem|dialog|presentation)', tag):
            name = re.match(r'<(\w+)', tag).group(1)
            add(rel, line_of(t, m.start()), 'a11y', f'<{name} onClick> → <button>/<Link>')

    for m in re.finditer(r'onClick=\{\(\)\s*=>\s*router\.(push|replace)\(', t):
        add(rel, line_of(t, m.start()), 'nav', 'onClick router.push → <Link>')

    for m in BUTTON.finditer(t):
        attrs, body = m.group(1), m.group(2)
        if re.search(r'aria-label|aria-labelledby|\btitle=', attrs):
            continue
        visible = re.sub(r'<[^>]*>', ' ', body)
        has_text_expr = re.search(r'\{[^{}]*(["\'`]|label|name|title|text|children|count|message)[^{}]*\}', visible)
        visible = re.sub(r'\{[^{}]*\}', ' ', visible)
        if not has_text_expr and not re.search(r'[A-Za-zÀ-ỹ0-9]', visible):
            add(rel, line_of(t, m.start()), 'a11y', 'icon-only button missing aria-label')

    for m in CONTROLS.finditer(t):
        tag = m.group(0)
        if re.search(r'type=["\'](hidden|submit|button)', tag):
            continue
        if not re.search(r'aria-label|aria-labelledby|\bid=', tag):
            before = t[max(0, m.start() - 500):m.start()]
            if before.rfind('<label') <= before.rfind('</label>'):
                add(rel, line_of(t, m.start()), 'forms', 'form control without label/aria-label/id')
        if re.search(r'type=["\']email', tag) and 'autoComplete' not in tag:
            add(rel, line_of(t, m.start()), 'forms', 'email input missing autoComplete')
        if re.search(r'type=["\']email', tag) and 'spellCheck' not in tag:
            add(rel, line_of(t, m.start()), 'forms', 'email input missing spellCheck={false}')

    for m in re.finditer(r'[A-Za-zÀ-ỹ0-9)]\.\.\.(?=[\s"\'`<}]|$)', t, re.M):
        add(rel, line_of(t, m.start()), 'typography', '"..." → "…"')

    for m in IMG.finditer(t):
        tag = m.group(0)
        if 'alt=' not in tag:
            add(rel, line_of(t, m.start()), 'images', '<img> missing alt')
        if not (re.search(r'\bwidth=', tag) and re.search(r'\bheight=', tag)):
            add(rel, line_of(t, m.start()), 'images', '<img> missing width/height')

    for pat, rule, msg in [
        (r'\bautoFocus\b', 'touch', 'autoFocus — justify / desktop only'),
        (r'onPaste', 'forms', 'onPaste handler — check paste not blocked'),
        (r'user-scalable|maximum-scale', 'anti', 'zoom disabled'),
        (r'href=["\']#["\']', 'nav', 'href="#" placeholder link'),
        (r'getMonth\(\)\s*\+\s*1', 'i18n', 'hardcoded date format → Intl.DateTimeFormat'),
        (r'\.toFixed\(', 'i18n', 'toFixed for display → Intl.NumberFormat'),
        (r'window\.confirm\(|[^.\w]confirm\(', 'nav', 'native confirm() for destructive action'),
        (r'(?<![-\w])focus:(ring|outline|border)', 'focus', 'focus: → focus-visible:'),
    ]:
        for m in re.finditer(pat, t):
            add(rel, line_of(t, m.start()), rule, msg)

with open(out, 'w', encoding='utf-8') as o:
    for f in sorted(findings):
        o.write(f'## {f}\n\n')
        for ln, rule, msg in sorted(findings[f]):
            o.write(f'{f}:{ln} - [{rule}] {msg}\n')
        o.write('\n')

cnt = collections.Counter()
files_per_msg = collections.defaultdict(set)
for f, items in findings.items():
    for _ln, _rule, msg in items:
        cnt[msg] += 1
        files_per_msg[msg].add(f)
print('files scanned', len(files), '| files with findings', len(findings), '| findings', sum(cnt.values()))
for msg, n in cnt.most_common():
    print(f'{n:5d} hits in {len(files_per_msg[msg]):3d} files  {msg}')
