#!/usr/bin/env python3
"""Publish or update a BlogSphere Mag post through the API, with the same checks Hark uses.

No browser clicking needed: the editor's Publish Now / Update Article buttons call this same API.

Usage
  python tools/blogsphere_publish.py check  <import-file>                 # dry run: validate the draft, find duplicates
  python tools/blogsphere_publish.py publish <import-file> --yes          # create a NEW post (refuses if the title is already live)
  python tools/blogsphere_publish.py update  <import-file> <live-slug> --yes   # update an existing post in place

<import-file> is a path like blogsphere-client/public/imports/amla-....json
Credentials come from env vars BLOGSPHERE_EMAIL and BLOGSPHERE_PASSWORD (never hard-code or print them).
Only run publish/update after Sairanjan says yes.
"""
import json, os, re, sys, urllib.request, urllib.error, urllib.parse

API = os.environ.get("BLOGSPHERE_API", "https://blogsphere-api-odr7.onrender.com/api/v1")
FIELDS = ["title", "seoTitle", "category", "excerpt", "coverImage", "tags", "content"]
CATEGORIES = {"health", "technology", "science", "business", "travel", "food", "finance", "environment", "jobs-careers"}


def call(method, path, body=None, token=None, timeout=90):
    req = urllib.request.Request(API + path, method=method,
                                 data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Content-Type": "application/json", "User-Agent": "blogsphere-agent",
                                          **({"Authorization": f"Bearer {token}"} if token else {})})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.load(r)
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.load(e)
        except Exception:
            return e.code, {"message": str(e)}


def url_ok(u):
    try:
        req = urllib.request.Request(u, method="GET", headers={"User-Agent": "Mozilla/5.0 blogsphere-agent"})
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return 0


def words(html):
    return len(re.sub(r"<[^>]+>", " ", html).split())


def check(d):
    """Return a list of problems. Empty list = ready."""
    probs = []
    for f in FIELDS:
        if not d.get(f):
            probs.append(f"missing field: {f}")
    if d.get("category") not in CATEGORIES:
        probs.append(f"unknown category: {d.get('category')}")
    if len(d.get("seoTitle", "")) > 70:
        probs.append("seoTitle over 70 chars")
    if len(d.get("excerpt", "")) > 300:
        probs.append("excerpt over 300 chars (server limit)")
    elif len(d.get("excerpt", "")) > 160:
        print("note: excerpt over 160 chars; Google may cut it")
    c = d.get("content", "")
    if "₹" not in c:
        probs.append("no ₹ prices (house rule: India-specific costs)")
    if re.search(r"\b(last week|yesterday|recently|this year|next month)\b", c, re.I):
        probs.append("relative date wording found; use absolute dates")
    imgs = [d.get("coverImage", "")] + re.findall(r'<img[^>]+src="([^"]+)"', c)
    for u in imgs:
        if u and not u.startswith("https://"):
            probs.append(f"image not absolute https: {u}")
        elif u:
            s = url_ok(u)
            if s == 429:  # Wikimedia rate limit: wait and retry once
                import time; time.sleep(4); s = url_ok(u)
            if s == 429:
                print(f"note: rate-limited (429), check by eye: {u}")
            elif s != 200:
                probs.append(f"image returns {s}: {u}")
    print(f"words: {words(c)}, links: {c.count('<a ')}, images: {len(imgs)}")
    return probs


def live_by_title(title):
    s, r = call("GET", "/articles?" + urllib.parse.urlencode({"search": title, "limit": 20}))
    arts = (r.get("data") or {}).get("articles") or r.get("articles") or []
    return [a for a in arts if a.get("title", "").strip().lower() == title.strip().lower()]


def login():
    email, pw = os.environ.get("BLOGSPHERE_EMAIL"), os.environ.get("BLOGSPHERE_PASSWORD")
    if not email or not pw:
        sys.exit("Set BLOGSPHERE_EMAIL and BLOGSPHERE_PASSWORD env vars first.")
    s, r = call("POST", "/auth/login", {"email": email, "password": pw})
    if s != 200 or not r.get("token"):
        sys.exit(f"Login failed ({s}): {r.get('message')}")
    return r["token"]


def verify(slug, expect_content):
    s, r = call("GET", f"/articles/{slug}")
    a = (r.get("data") or {}).get("article")
    if s != 200 or not a:
        sys.exit(f"VERIFY FAILED: /articles/{slug} -> {s} {r.get('message')}")
    c = a["content"]
    print(f"live: {a['slug']} status={a['status']} words={words(c)} links={c.count('<a ')} (draft had {expect_content.count('<a ')})")
    page = url_ok(f"https://blogspheremag.com/article/{a['slug']}")
    print(f"page https://blogspheremag.com/article/{a['slug']} -> {page}")
    return a


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    cmd, path = sys.argv[1], sys.argv[2]
    d = json.load(open(path, encoding="utf-8"))
    probs = check(d)
    for p in probs:
        print("PROBLEM:", p)
    dupes = live_by_title(d.get("title", ""))
    if dupes:
        print("ALREADY LIVE with this title:", ", ".join(a["slug"] for a in dupes))
    if cmd == "check":
        print("READY" if not probs else "NOT READY")
        return
    if "--yes" not in sys.argv:
        sys.exit("Refusing: add --yes only after Sairanjan approved this exact action.")
    if probs:
        sys.exit("Refusing: fix the problems above first.")
    payload = {k: d[k] for k in FIELDS}
    payload["status"] = "published"
    token = login()
    if cmd == "publish":
        if dupes:
            sys.exit("Refusing: this title is already live. Use `update` with its slug instead.")
        s, r = call("POST", "/articles", payload, token)
    elif cmd == "update":
        if len(sys.argv) < 4 or sys.argv[3].startswith("--"):
            sys.exit("update needs the live slug")
        slug = sys.argv[3]
        s, r = call("GET", f"/articles/{slug}")
        a = (r.get("data") or {}).get("article")
        if not a:
            sys.exit(f"Live article {slug} not found")
        s, r = call("PUT", f"/articles/{a.get('_id') or a.get('id')}", payload, token)
    else:
        sys.exit(f"unknown command {cmd}")
    if s not in (200, 201):
        sys.exit(f"API error {s}: {r.get('message')}")
    art = (r.get("data") or {}).get("article") or {}
    print("API says:", r.get("message"))
    verify(art.get("slug") or sys.argv[3], d["content"])


if __name__ == "__main__":
    main()
