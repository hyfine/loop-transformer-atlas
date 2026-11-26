"""Inventory the supplied seed snapshot. Never follows links found on remote pages.

Usage: python3 scripts/audit.py inventory|visit|publish INPUT_DIRECTORY WORK_DIRECTORY
Requires pypdf and requests. Run inventory first; review hosts before visit.
"""

import collections
import concurrent.futures
import csv
import difflib
import html
import ipaddress
import json
import logging
import re
import socket
import sys
import time
import zipfile
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
from xml.etree import ElementTree

import requests
from pypdf import PdfReader


URL = re.compile(r"https?://[^\s<>\"'`\\\[\]{}|\u3000-\u303f\u4e00-\u9fff\uff00-\uffef]+")
ATTR = re.compile(r"""(?:href|src)\s*=\s*["']([^"'<>]+)["']""", re.I)
MD = re.compile(r"""\]\(\s*<?([^)\s>]+)>?(?:\s+["'][^)]*)?\)""")


def inventory(root, out):
    urls = collections.defaultdict(set)
    local = set()
    files = []
    warnings = collections.Counter()

    class PDFWarnings(logging.Handler):
        def emit(self, entry):
            warnings[name] += 1

    pdf_log = logging.getLogger("pypdf")
    pdf_log.addHandler(PDFWarnings())
    pdf_log.propagate = False
    seed = root / "awesome_loop_transformer"
    paths = [root / "00_loop_overview.md", *seed.rglob("*"),
             *(root / "papers").glob("*"), *(root / "figures").glob("*")]
    for path in sorted(paths):
        if not path.is_file() or ".git" in path.parts or path.name == ".DS_Store":
            continue
        name = path.relative_to(root).as_posix()
        files.append(name)
        ext = path.suffix.lower()

        def record(target, origin=name, base=seed if name.endswith("/data/readme_zh.md") else path.parent):
            target = re.sub(r"&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-fA-F]+);",
                            lambda m: html.unescape(m[0]), target.strip())
            if target.startswith(("http://", "https://")):
                urls[target].add(origin)
            elif target and not re.match(r"^(?:[a-z][\w+-]*:|/|[$<{])", target, re.I):
                rel = unquote(target.split("#")[0].split("?")[0])
                dest = (base / rel).resolve() if rel else path
                state = "exists" if dest.is_relative_to(root) and dest.exists() else "unresolved"
                local.add((origin, target, state))

        def scan(text, origin=name):
            for match in URL.finditer(text.replace(r"\/", "/")):
                target = match[0].rstrip(".,;:!?*")
                while target.endswith(")") and target.count(")") > target.count("("):
                    target = target[:-1].rstrip(".,;:!?*")
                record(target, origin)

        if ext == ".pdf":
            for page_no, page in enumerate(PdfReader(path).pages, 1):
                origin = f"{name}:p{page_no}"
                scan(page.extract_text(), origin)
                for annotation in page.get("/Annots", []):
                    action = annotation.get_object().get("/A")
                    if action and (uri := action.get_object().get("/URI")):
                        record(str(uri), origin)
        elif ext == ".pptx":
            with zipfile.ZipFile(path) as archive:
                for member in archive.namelist():
                    if member.endswith(".rels"):
                        for node in ElementTree.fromstring(archive.read(member)):
                            if node.get("TargetMode") == "External":
                                record(node.attrib["Target"], f"{name}:{member}")
                    elif member.startswith("ppt/slides/") and member.endswith(".xml"):
                        scan(" ".join(ElementTree.fromstring(archive.read(member)).itertext()), name)
        elif ext not in {".png", ".jpg", ".jpeg", ".gif"}:
            text = path.read_text()
            if ext == ".csv":
                for row in csv.reader(text.splitlines()):
                    for field in row:
                        scan(field)
            else:
                scan(text)
            if ext in {".html", ".md", ".svg"}:
                for target in ATTR.findall(text):
                    record(target)
            if ext == ".md":
                for target in MD.findall(text):
                    record(target)
            if name.endswith("/data/library.json"):
                for work in json.loads(text):
                    for link in work["links"]:
                        record(link["url"], name, seed)
    (out / "inventory.json").write_text(json.dumps(
        {"files": files, "pdf_text_warnings": warnings,
         "targets": {u: sorted(v) for u, v in sorted(urls.items())},
         "local": sorted(local)}, ensure_ascii=False, indent=2) + "\n")
    print(f"{len(files)} files; {len(urls)} distinct external strings; {len(local)} file references")
    print(collections.Counter(urlsplit(u).netloc for u in urls))


def public_target(url):
    parsed = urlsplit(url)
    if (parsed.scheme not in {"http", "https"} or parsed.username or parsed.password
            or parsed.port not in {None, 80, 443} or not parsed.hostname
            or "." not in parsed.hostname):
        return False
    return all(ipaddress.ip_address(row[4][0]).is_global
               for row in socket.getaddrinfo(parsed.hostname, None))


def visit_one(item):
    url, origins = item
    current = url
    status, title = "", ""
    try:
        for _ in range(6):
            if not public_target(current):
                status = "not-public-or-template"
                break
            with requests.get(current, stream=True, allow_redirects=False, timeout=(6, 12),
                              auth=lambda request: request,
                              headers={"User-Agent": "LoopTransformerAtlas/1.0 bibliography check"}) as res:
                status = str(res.status_code)
                if res.is_redirect:
                    current = urljoin(current, res.headers["location"])
                    continue
                if res.ok and "html" in res.headers.get("content-type", ""):
                    chunks = bytearray()
                    for chunk in res.iter_content(8192):
                        chunks.extend(chunk)
                        end = chunks.lower().find(b"</title>")
                        if end != -1 or len(chunks) >= 131072:
                            break
                    match = re.search(rb"<title[^>]*>(.*?)</title>", chunks, re.I | re.S)
                    if match:
                        title = " ".join(html.unescape(match[1].decode("utf-8", "replace")).split())[:240]
                break
        else:
            status = "redirect-limit"
    except (requests.RequestException, OSError, ValueError) as exc:
        status = type(exc).__name__
    return url, status, current, title, "; ".join(origins)


def visit(out):
    targets = json.loads((out / "inventory.json").read_text())["targets"]
    # Spread consecutive requests across domains rather than hammering a single origin.
    groups = collections.defaultdict(list)
    for item in targets.items():
        groups[urlsplit(item[0]).netloc].append(item)
    items = [g[i] for i in range(max(map(len, groups.values()))) for g in groups.values() if i < len(g)]
    with (out / "visits.csv").open("w", newline="") as handle, concurrent.futures.ThreadPoolExecutor(5) as pool:
        writer = csv.writer(handle)
        writer.writerow(["url", "status", "final_url", "page_title", "references"])
        for row in pool.map(visit_one, items):
            writer.writerow(row)
            handle.flush()
            time.sleep(0.05)


def publish(root, out):
    data = Path(__file__).resolve().parents[1] / "data"
    inventory = json.loads((out / "inventory.json").read_text())
    with (out / "visits.csv").open() as file:
        rows = list(csv.DictReader(file))
    if {r["url"] for r in rows} != set(inventory["targets"]) or len(rows) != len(inventory["targets"]):
        raise ValueError("Traversal did not produce one disposition per extracted target")
    for r in rows:
        final = r["final_url"].lower()
        if re.search(r"/challenge\?|captcha|verifycode", final) or "verifying your browser" in r["page_title"].lower():
            outcome = "challenge"
        elif r["status"] == "200":
            outcome = "responded"
        elif r["status"] == "not-public-or-template":
            outcome = "not-requested"
        else:
            outcome = "unconfirmed"
        r["outcome"] = outcome
    with (data / "visits.csv").open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(sorted(rows, key=lambda r: r["url"]))
    by_url = {r["url"]: r for r in rows}
    index = []
    for w in json.loads((root / "awesome_loop_transformer/data/library.json").read_text()):
        url = w["links"][0]["url"]
        actual = re.sub(r"^\[[\d.v]+\]\s*", "", by_url[url]["page_title"])
        a, b = (re.sub(r"[^\w]", "", s).lower() for s in (w["title"], actual))
        similarity = difflib.SequenceMatcher(None, a, b).ratio()
        index.append({"title": w["title"], "url": url, "year": w["year"], "category": w["category"],
                      "tags": w["tags"], "observedTitle": actual,
                      "titleReview": similarity < 0.78})
    (data / "seed-index.json").write_text(json.dumps(index, ensure_ascii=False, indent=1) + "\n")
    del inventory["targets"]
    inventory["outcomes"] = dict(collections.Counter(r["outcome"] for r in rows))
    (data / "seed-files.json").write_text(json.dumps(inventory, ensure_ascii=False, indent=1) + "\n")
    print(len(index), "seed works;", len(rows), "targets;", inventory["outcomes"])


if __name__ == "__main__":
    mode, root_arg, out_arg = sys.argv[1:]
    out = Path(out_arg)
    out.mkdir(exist_ok=True, parents=True)
    if mode == "inventory":
        inventory(Path(root_arg).resolve(), out)
    elif mode == "visit":
        visit(out)
    elif mode == "publish":
        publish(Path(root_arg), out)
    else:
        sys.exit("Expected inventory, visit or publish")
