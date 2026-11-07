#!/usr/bin/env python3
"""
Responsive layout + navigation scroll check for the production build.

Serves ./build (with SPA fallback), mocks every API call with realistic sample data
(long titles, a table, code, an embed, long URLs), opens each key page in headless
Chromium at several phone/tablet widths and fails if the document scrolls sideways.

  npm run build
  pip install playwright && python -m playwright install chromium   # once
  python scripts/mobile-check.py                       # overflow check, exits 1 on failure
  python scripts/mobile-check.py --shots out/          # also save full-page screenshots
  python scripts/mobile-check.py --widths 320 --pages home,article
  python scripts/mobile-check.py --widths all --scroll-test   # phones, tablets, laptops, desktops

Set CHROMIUM_PATH to use a system Chromium instead of Playwright's download.
The API base URL is whatever the build was compiled with; any request whose path
contains /api/v1/ is answered from the fixtures below, so no backend is needed.
"""
import argparse
import functools
import http.server
import json
import os
import socketserver
import sys
import threading
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / 'build'

# --------------------------------------------------------------------------- fixtures
def _png(width, height, rgb_top, rgb_bottom):
    """Tiny vertical-gradient PNG so covers look like photos without any network."""
    import struct, zlib
    rows = b''
    for y in range(height):
        t = y / max(height - 1, 1)
        px = bytes(int(a + (b - a) * t) for a, b in zip(rgb_top, rgb_bottom))
        rows += b'\x00' + px * width
    chunk = lambda tag, data: struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
    return (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(rows)) + chunk(b'IEND', b''))


PNG = {
    'warm': _png(160, 100, (214, 160, 120), (90, 50, 35)),
    'cool': _png(160, 100, (120, 160, 200), (30, 50, 80)),
}

AUTHOR = {
    '_id': 'u1', 'name': 'Anaïs Okonkwo-Lindqvist', 'username': 'anais',
    'avatar': '', 'bio': 'Writes about cities, climate and the quiet economics of everyday life.',
    'verified': True, 'articles': 12,
}

LONG_URL = 'https://example.com/a/really/long/path/that/never/breaks/naturally/' + 'x' * 80

ARTICLE_HTML = f"""
<p>Every city has a rhythm. In the mornings the trams fill with commuters and the bakeries open their shutters long before the offices do. This opening paragraph is long enough to wrap several times on a phone.</p>
<h2>A heading that is fairly long so it wraps on small screens</h2>
<p>Here is a link that never breaks: <a href="{LONG_URL}">{LONG_URL}</a>, and some <code>inline_code_that_is_quite_long_without_spaces()</code> too.</p>
<img src="https://img.mock/body.png" alt="Body image" width="1600" height="900">
<blockquote>Design is not just what it looks like and feels like. Design is how it works.</blockquote>
<pre><code>const veryLongLine = someFunctionWithALongName(argumentNumberOne, argumentNumberTwo, argumentNumberThree, argumentNumberFour);
console.log(veryLongLine);</code></pre>
<table><thead><tr><th>City</th><th>Population</th><th>Area (km²)</th><th>Density</th><th>Country</th><th>Founded</th></tr></thead>
<tbody><tr><td>Copenhagen</td><td>1,366,301</td><td>179.8</td><td>7,600</td><td>Denmark</td><td>1167</td></tr>
<tr><td>Bhubaneswar</td><td>1,163,000</td><td>422</td><td>2,756</td><td>India</td><td>1948</td></tr></tbody></table>
<iframe src="about:blank" width="560" height="315" title="Embedded video"></iframe>
<ul><li>First point that is reasonably long and wraps</li><li>Second point</li></ul>
<p>Closing paragraph.</p>
"""

def make_article(i, featured=False):
    titles = [
        'The quiet economics of the corner bakery and why every neighbourhood needs one',
        'How Copenhagen rebuilt its harbour for swimmers',
        'Notes on slow travel: twelve trains across Europe',
        'Understanding interest rates without the jargon',
        'A field guide to urban birdsong',
        'Why your sourdough fails (and how to fix it)',
        'The surprising science of afternoon naps',
        'Electric buses are winning — here is the data',
        'Supercalifragilisticexpialidocious-length-words-in-headlines-are-a-test',
    ]
    cats = ['technology', 'travel', 'food', 'finance', 'science', 'environment', 'health', 'business', 'arts']
    return {
        '_id': f'a{i}', 'slug': f'article-{i}', 'title': titles[i % len(titles)],
        'excerpt': 'A short dek that sets up the story in a sentence or two, long enough to wrap on a phone screen.',
        'content': ARTICLE_HTML, 'coverImage': f'https://img.mock/cover-{i}.png',
        'category': cats[i % len(cats)], 'author': AUTHOR,
        'tags': ['cities', 'urbanism', 'long-reads', 'economics'],
        'publishedAt': '2026-10-2%dT09:00:00.000Z' % (i % 9), 'readTime': 7, 'views': 12840 + i,
        'featured': featured,
    }

ARTICLES = [make_article(i, featured=i < 3) for i in range(9)]
CATEGORIES = [
    {'slug': s, 'name': n, 'icon': ic, 'color': c, 'count': k}
    for (s, n, ic, c, k) in [
        ('technology', 'Technology', 'cpu', '#4F46E5', 14), ('science', 'Science', 'flask-conical', '#0F766E', 6),
        ('business', 'Business', 'briefcase', '#A16207', 4), ('health', 'Health & Wellness', 'heart-pulse', '#BE185D', 9),
        ('arts', 'Arts & Culture', 'palette', '#7E22CE', 3), ('travel', 'Travel', 'plane', '#0369A1', 11),
        ('food', 'Food & Cooking', 'chef-hat', '#C2410C', 8), ('finance', 'Finance', 'wallet', '#15803D', 5),
        ('education', 'Education', 'graduation-cap', '#1D4ED8', 2), ('environment', 'Environment', 'leaf', '#4D7C0F', 7),
        ('sports', 'Sports', 'trophy', '#B45309', 1), ('entertainment', 'Entertainment', 'clapperboard', '#B91C1C', 2),
    ]
]
WRITER = {**AUTHOR, 'id': 'u1', 'totalViews': 98234, 'followers': 1200, 'joinedAt': '2025-03-01T00:00:00.000Z',
          'socialLinks': {'twitter': 'https://x.com/a', 'website': 'https://example.com'}}
USER = {'_id': 'u1', 'name': AUTHOR['name'], 'username': 'anais', 'email': 'anais@example.com',
        'role': 'writer', 'avatar': ''}


def api_response(path, logged_in):
    """Return (status, json) for an API path such as /articles/trending."""
    ok = lambda data: (200, {'success': True, 'data': data})
    pagination = {'page': 1, 'limit': 12, 'total': len(ARTICLES), 'pages': 1}
    if path.startswith('/auth/me'):
        return ok({'user': USER}) if logged_in else (401, {'success': False, 'message': 'Not signed in'})
    if path.startswith('/auth/reset-password/'):
        return ok({'valid': True})
    if path.startswith('/categories'):
        return ok({'categories': CATEGORIES, 'category': CATEGORIES[0], 'articles': ARTICLES})
    if path.startswith('/writers/'):
        return ok({'writer': WRITER, 'articles': ARTICLES[:6]})
    if path.startswith('/writers'):
        return ok({'writers': [WRITER, {**WRITER, 'id': 'u2', 'username': 'b', 'name': 'Bo Chen'}]})
    if path.startswith('/articles/featured'):
        return ok({'articles': ARTICLES[:3]})
    if path.startswith('/articles/trending'):
        return ok({'articles': ARTICLES[:5]})
    if path.startswith('/articles/me'):
        return ok({'articles': ARTICLES[:4]})
    if path.startswith('/articles/'):
        return ok({'article': ARTICLES[0]})
    if path.startswith('/articles'):
        return ok({'articles': ARTICLES, 'pagination': pagination})
    return ok({})


# Pages: name -> (path, logged_in)
PAGES = {
    'home':       ('/', False),
    'explore':    ('/explore', False),
    'trending':   ('/trending', False),
    'latest':     ('/latest', False),
    'categories': ('/categories', False),
    'search':     ('/search?q=cities', False),
    'article':    ('/article/article-0', False),
    'writer':     ('/writer/anais', False),
    'about':      ('/about', False),
    'write':      ('/write', True),
    'write-gate': ('/write', False),
    'login':      ('/login', False),
    'register':   ('/register', False),
    'forgot':     ('/forgot-password', False),
    'reset':      ('/reset-password/abc123', False),
    'privacy':    ('/privacy-policy', False),
    'terms':      ('/terms', False),
    'contact':    ('/contact', False),
    'notfound':   ('/no-such-page', False),
    'menu':       ('/', True),   # screenshot with the mobile menu open
}

PRESETS = {
    'phones':  '320,360,375,390,414,430,740x360',
    'tablets': '768x1024,820x1180,834x1194,1024x768,1180x820',
    'desktop': '1280x720,1366x768,1440x900,1920x1080,2560x1440',
}
PRESETS['all'] = ','.join(PRESETS.values())

# --------------------------------------------------------------------------- server
class SpaHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def send_head(self):
        path = self.translate_path(self.path.split('?')[0])
        if not os.path.exists(path) or os.path.isdir(path) and not os.path.exists(os.path.join(path, 'index.html')):
            self.path = '/index.html'
        return super().send_head()


def serve(directory):
    handler = functools.partial(SpaHandler, directory=str(directory))
    httpd = socketserver.ThreadingTCPServer(('127.0.0.1', 0), handler)
    httpd.daemon_threads = True
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, f'http://127.0.0.1:{httpd.server_address[1]}'


OVERFLOW_JS = """
() => {
  // Unmask: a global overflow-x:hidden/clip would hide the scrollbar on desktop but
  // iOS still lets people pan sideways, so measure with it switched off.
  const unmask = document.createElement('style');
  unmask.textContent = 'html, body { overflow-x: visible !important; }';
  document.head.appendChild(unmask);
  const doc = document.documentElement;
  const vw = doc.clientWidth;
  const offenders = [];
  if (doc.scrollWidth > vw + 1) {
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (getComputedStyle(el).position === 'fixed') continue;  // fixed boxes stretch with the viewport
      if (r.right > vw + 1 || r.left < -1) {
        // skip elements inside a horizontal scroller (they are meant to overflow it)
        let p = el.parentElement, clipped = false;
        while (p && p !== document.body) {
          const s = getComputedStyle(p);
          if (/(auto|scroll|hidden|clip)/.test(s.overflowX)) { clipped = true; break; }
          p = p.parentElement;
        }
        if (!clipped) offenders.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} [${Math.round(r.left)}..${Math.round(r.right)}]`);
      }
      if (offenders.length >= 8) break;
    }
  }
  const out = { scrollWidth: doc.scrollWidth, clientWidth: vw, offenders };
  unmask.remove();
  return out;
}
"""


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--widths', default='phones',
                    help='comma list of widths or WxH sizes, or a preset: '
                         + ', '.join(f'{k} ({v})' for k, v in PRESETS.items()) + ' (default: %(default)s)')
    ap.add_argument('--scroll-test', action='store_true',
                    help='also check footer/nav links scroll to the top or #section (mouse, touch, keyboard)')
    ap.add_argument('--pages', default=','.join(k for k in PAGES if k != 'menu'), help='comma list of page names')
    ap.add_argument('--shots', help='directory to save full-page screenshots into')
    ap.add_argument('--build', default=str(BUILD), help='build directory (default: ./build)')
    args = ap.parse_args()

    from playwright.sync_api import sync_playwright  # imported late so --help works without it

    build = Path(args.build)
    if not (build / 'index.html').exists():
        sys.exit(f'No build found at {build}. Run `npm run build` first.')
    httpd, base = serve(build)
    shots = Path(args.shots) if args.shots else None
    if shots:
        shots.mkdir(parents=True, exist_ok=True)

    sizes = []
    widths = ','.join(PRESETS.get(w.strip(), w.strip()) for w in args.widths.split(','))
    for w in widths.split(','):
        w = w.strip()
        if 'x' in w:
            a, b = w.split('x')
            sizes.append((int(a), int(b), w))
        else:
            sizes.append((int(w), 800 if int(w) < 700 else 1024, w))

    failures = []
    launch = {'headless': True}
    if os.environ.get('CHROMIUM_PATH'):
        launch['executable_path'] = os.environ['CHROMIUM_PATH']
    # Behind an HTTP(S)_PROXY, keep the local server off the proxy
    proxy_url = os.environ.get('HTTPS_PROXY') or os.environ.get('HTTP_PROXY')
    if proxy_url:
        from urllib.parse import urlsplit
        parts = urlsplit(proxy_url)
        launch['proxy'] = {'server': f'{parts.scheme}://{parts.hostname}:{parts.port}', 'bypass': '127.0.0.1,localhost'}
        if parts.username:
            launch['proxy'].update(username=parts.username, password=parts.password or '')
    with sync_playwright() as pw:
        browser = pw.chromium.launch(**launch)
        for page_name in [p.strip() for p in args.pages.split(',') if p.strip()]:
            path, logged_in = PAGES[page_name]
            for (w, h, label) in sizes:
                ctx = browser.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1,
                                          is_mobile=min(w, h) < 700, has_touch=min(w, h) < 900)
                if logged_in:
                    ctx.add_init_script("localStorage.setItem('token', 'mock-token')")

                ctx.route('**/*', make_handler(base, logged_in))
                page = ctx.new_page()
                page.goto(base + path, wait_until='networkidle')
                page.wait_for_timeout(400)
                if page_name == 'menu':
                    page.click('.navbar__hamburger')
                    page.wait_for_timeout(500)
                result = page.evaluate(OVERFLOW_JS)
                bad = result['scrollWidth'] > result['clientWidth'] + 1
                status = 'FAIL' if bad else 'ok  '
                print(f"{status} {page_name:<11} {label:>9}  scrollWidth={result['scrollWidth']} clientWidth={result['clientWidth']}"
                      + (f"  offenders: {'; '.join(result['offenders'])}" if bad else ''))
                if bad:
                    failures.append((page_name, label))
                if shots:
                    page.screenshot(path=str(shots / f'{page_name}-{label}.png'), full_page=page_name != 'menu')
                ctx.close()
        if args.scroll_test:
            failures += scroll_test(browser, base)
        browser.close()
    httpd.shutdown()
    if failures:
        print(f'\n{len(failures)} checks failed.')
        sys.exit(1)
    print('\nAll checks passed.')


def make_handler(base, logged_in):
    def handle(route, request):
        url = request.url
        if '/api/v1/' in url:
            if request.method == 'OPTIONS':
                return route.fulfill(status=204, headers={'access-control-allow-origin': '*'})
            status, body = api_response(url.split('/api/v1', 1)[1], logged_in)
            return route.fulfill(status=status, content_type='application/json', body=json.dumps(body),
                                 headers={'access-control-allow-origin': base,
                                          'access-control-allow-credentials': 'true'})
        if 'img.mock' in url:
            return route.fulfill(status=200, content_type='image/png',
                                 body=PNG['cool' if 'cover-1' in url else 'warm'])
        if url.startswith(base) or 'fonts.g' in url:
            return route.continue_()
        return route.abort()
    return handle


def scroll_test(browser, base):
    """Footer/nav links must land at the top of the new page or on their #section,
    whether clicked with a mouse, tapped, or activated from the keyboard."""
    failures = []
    cases = [
        # (device label, viewport, touch, how)
        ('phone-touch', {'width': 375, 'height': 740}, True, 'tap'),
        ('tablet-touch', {'width': 820, 'height': 1180}, True, 'tap'),
        ('laptop-mouse', {'width': 1366, 'height': 768}, False, 'click'),
        ('desktop-keyboard', {'width': 1920, 'height': 1080}, False, 'keyboard'),
    ]
    links = [  # (start page, footer link text, expected: 'top' or element id)
        ('/about', 'Contact', 'top'),
        ('/contact', 'Home', 'top'),
        ('/about', 'Trending', 'trending'),
        ('/terms', 'Latest', 'latest'),
        ('/privacy-policy', 'Categories', 'categories'),
        ('/', 'Home', 'top'),            # link to the page you are on
    ]
    for label, viewport, touch, how in cases:
        ctx = browser.new_context(viewport=viewport, has_touch=touch, is_mobile=touch and viewport['width'] < 700)
        ctx.route('**/*', make_handler(base, False))
        page = ctx.new_page()
        for start, text, expect in links:
            page.goto(base + start, wait_until='networkidle')
            page.wait_for_timeout(300)
            page.evaluate('window.scrollTo({top: document.documentElement.scrollHeight, behavior: "instant"})')
            page.wait_for_timeout(200)
            link = page.locator('footer.footer a', has_text=text).first
            link.scroll_into_view_if_needed()
            if how == 'tap':
                link.tap()
            elif how == 'keyboard':
                link.focus()
                page.keyboard.press('Enter')
            else:
                link.click()
            page.wait_for_timeout(1800)  # smooth scroll + async sections
            state = page.evaluate("""(id) => {
              const nav = document.querySelector('.navbar').getBoundingClientRect().bottom;
              const el = id === 'top' ? null : document.getElementById(id);
              return { y: Math.round(window.scrollY), path: location.pathname + location.hash,
                       top: el ? Math.round(el.getBoundingClientRect().top) : null, nav: Math.round(nav) };
            }""", expect)
            if expect == 'top':
                ok = state['y'] <= 2
            else:
                ok = state['top'] is not None and state['nav'] <= state['top'] <= state['nav'] + 40
            print(f"{'ok  ' if ok else 'FAIL'} scroll {label:<16} {how:<8} {start:>16} -> {text:<11} {state}")
            if not ok:
                failures.append((label, text))
        ctx.close()

    # Phone menu: opens, locks scroll, Esc closes; a link closes it and lands at the top
    ctx = browser.new_context(viewport={'width': 375, 'height': 740}, has_touch=True, is_mobile=True)
    ctx.route('**/*', make_handler(base, False))
    page = ctx.new_page()
    page.goto(base + '/about', wait_until='networkidle')
    page.evaluate('window.scrollTo({top: 1200, behavior: "instant"})')
    page.tap('.navbar__hamburger')
    page.wait_for_timeout(450)
    opened = page.evaluate("""() => ({
      expanded: document.querySelector('.navbar__hamburger').getAttribute('aria-expanded'),
      locked: document.documentElement.classList.contains('is-scroll-locked'),
      inert: document.querySelector('.page-content').inert })""")
    page.keyboard.press('Escape')
    page.wait_for_timeout(300)
    after_esc = page.evaluate("document.querySelector('.navbar__hamburger').getAttribute('aria-expanded')")
    page.tap('.navbar__hamburger')
    page.wait_for_timeout(450)
    page.locator('#mobile-menu a', has_text='Trending').first.tap()
    page.wait_for_timeout(1500)
    landed = page.evaluate("""() => ({ path: location.pathname, y: Math.round(scrollY),
      open: document.querySelector('.navbar__hamburger').getAttribute('aria-expanded'),
      locked: document.documentElement.classList.contains('is-scroll-locked') })""")
    ok = (opened == {'expanded': 'true', 'locked': True, 'inert': True} and after_esc == 'false'
          and landed == {'path': '/trending', 'y': 0, 'open': 'false', 'locked': False})
    print(f"{'ok  ' if ok else 'FAIL'} menu   phone-touch  open={opened} esc->{after_esc} link->{landed}")
    if not ok:
        failures.append(('menu', 'phone'))
    ctx.close()
    return failures


if __name__ == '__main__':
    main()
