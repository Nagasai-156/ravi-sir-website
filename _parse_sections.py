import re, html, pathlib
s = pathlib.Path('handshake_home.html').read_text(encoding='utf-8', errors='ignore')
sections = []
for m in re.finditer(r'<section([^>]*)>(.*?)</section>', s, flags=re.S|re.I):
    attrs = m.group(1)
    body = m.group(2)
    sidm = re.search(r'id=\"([^\"]+)\"', attrs, flags=re.I)
    sid = sidm.group(1) if sidm else '(none)'
    h2s = [html.unescape(re.sub(r'<[^>]+>','',x)).strip() for x in re.findall(r'<h2[^>]*>(.*?)</h2>', body, flags=re.S|re.I)]
    chips = [html.unescape(re.sub(r'<[^>]+>','',x)).strip() for x in re.findall(r'<span[^>]*>(.*?)</span>', body, flags=re.S|re.I)]
    chips = [c for c in chips if c and len(c.split()) <= 8][:4]
    sections.append((sid, h2s[:2], chips[:3]))
print('SECTION_COUNT', len(sections))
for i, (sid, h2s, chips) in enumerate(sections, 1):
    print(f'{i:02d}. id={sid}')
    if h2s:
        print('   h2:', ' | '.join(h2s))
    if chips:
        print('   chips:', ' | '.join(chips))
