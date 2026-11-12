#!/usr/bin/env python3
"""Вшивает i18n в lancer/index.html:
1. Добавляет data-i18n="uNNN" / data-i18n-ph="pNNN" в статичный HTML
   (ключи — из ui_strings.json, в порядке документа).
2. Собирает словарь STR {ключ: {ru, en}} из ui_strings.json,
   ui_strings_en.json и dynamic_en.json и вставляет его в <script>
   между // __STR_START__ и // __STR_END__.
Идемпотентен: повторный прогон не дублирует атрибуты и обновляет STR.
Запуск: python3 build_i18n.py
"""
import json, re, sys
from pathlib import Path

HERE = Path(__file__).parent
INDEX = HERE / "index.html"
BLOCK = {'h1', 'h2', 'h3', 'p', 'li', 'summary', 'td', 'th', 'button', 'label'}
CYR = re.compile(r'[А-Яа-яЁё]')

def load_json(name):
    return json.loads((HERE / name).read_text(encoding='utf-8'))

def main():
    ui = load_json('ui_strings.json')
    en = load_json('ui_strings_en.json')
    dyn = load_json('dynamic_en.json')
    src = INDEX.read_text(encoding='utf-8')
    head, sep, tail = src.partition('<script>')
    assert sep, 'no <script> in index.html'
    html, script = head, tail

    # --- 1. data-i18n в статичном HTML (текстовая хирургия) ---
    # Порядок единиц — как в ui_strings.json (порядок документа).
    # Для дублей (одинаковые tag+текст) берём n-е вхождение подряд.
    pos = 0
    seen_counts = {}
    missed = []
    for key in sorted(ui['units']):
        tag = ui['units'][key]['tag']
        ru = ui['units'][key]['ru']
        if f'data-i18n="{key}"' in html:
            continue  # уже вшит
        pat = re.compile(r'<(' + re.escape(tag) + r')\b([^>]*)>' + re.escape(ru) + r'</' + re.escape(tag) + r'>')
        m = pat.search(html, pos)
        if not m:
            # дубли: ищем с начала (порядок документа уже не гарантирует pos)
            m = pat.search(html)
        if not m:
            missed.append((key, tag, ru[:60]))
            continue
        # вставляем атрибут в открывающий тег
        open_tag = m.group(0)
        # найти конец открывающего тега: первый '>' после '<tag'
        gt = open_tag.index('>')
        new_open = open_tag[:gt] + f' data-i18n="{key}"' + open_tag[gt:]
        html = html[:m.start()] + new_open + html[m.end():]
        pos = m.start() + len(new_open)
    if missed:
        print('MISSED units:', missed)
        sys.exit(1)

    # --- 2. data-i18n-ph для плейсхолдеров ---
    for key in sorted(ui['placeholders']):
        ru = ui['placeholders'][key]['ru']
        if f'data-i18n-ph="{key}"' in html:
            continue
        needle = f'placeholder="{ru}"'
        idx = html.find(needle)
        if idx == -1:
            print('MISSED placeholder:', key, repr(ru))
            sys.exit(1)
        html = html[:idx + len(needle)] + f' data-i18n-ph="{key}"' + html[idx + len(needle):]

    # --- 3. словарь STR ---
    STR = {}
    for key in sorted(ui['units']):
        STR[key] = {'ru': ui['units'][key]['ru'], 'en': en['units'][key]['en']}
    for key in sorted(ui['placeholders']):
        STR[key] = {'ru': ui['placeholders'][key]['ru'], 'en': en['placeholders'][key]['en']}
    for key in sorted(dyn):
        STR[key] = {'ru': dyn[key]['ru'], 'en': dyn[key]['en']}
    lit = 'const STR = ' + json.dumps(STR, ensure_ascii=False) + ';'
    start_marker, end_marker = '// __STR_START__', '// __STR_END__'
    if start_marker not in script or end_marker not in script:
        print('STR markers missing in <script>; add them first')
        sys.exit(1)
    s0 = script.index(start_marker) + len(start_marker)
    s1 = script.index(end_marker)
    script = script[:s0] + '\n' + lit + '\n' + script[s1:]

    INDEX.write_text(html + '<script>' + script, encoding='utf-8')
    print(f'i18n ok: {len(ui["units"])} units, {len(ui["placeholders"])} placeholders, {len(dyn)} dynamic, STR keys {len(STR)}')

if __name__ == '__main__':
    main()
