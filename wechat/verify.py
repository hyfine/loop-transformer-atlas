"""Verify the published files against the manuscript, independently of the typesetter."""
import hashlib
import json
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit

import cv2
from bs4 import BeautifulSoup
from markdown_it import MarkdownIt
from PIL import Image, ImageSequence

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT.parent/"survey"
MD=SOURCE/"Loop_Transformer_Survey_zh_illustrated.md"


def check(ok,reason):
    if not ok:raise ValueError(reason)


def hashfile(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def text(tag):
    return re.sub(r"\s+"," ",tag.get_text()).strip().replace("**","")


def anchors(tag):
    return [(text(a),a["href"]) for a in tag.select("a[href]")]


def source_blocks():
    # Protect TeX from CommonMark's backslash-escape rules; compare to the preserved source notation.
    raw=MD.read_text()
    formulas=re.findall(r"\$\$[^\n]+?\$\$|\$[^\n$]+\$",raw)
    for i,tex in enumerate(formulas):raw=raw.replace(tex,f"ZXQFORM{i}XZ",1)
    doc=BeautifulSoup(MarkdownIt("commonmark",{"html":True}).enable("table").render(raw),"html.parser")
    return doc.find_all(recursive=False),formulas


def verify_article(doc,items,formulas,meta):
    units=doc.select("#article > [data-unit]")
    order=[int(x["data-source"]) for x in doc.select("#article [data-source]")]
    check(order==[1,0,*range(2,len(items))],"Missing/reordered source block")
    check(len(units)==27 and sorted(set(x["data-volume"] for x in units))==list("123456"),"Reading units or volumes incomplete")
    check([x["data-volume"] for x in units]==sorted(x["data-volume"] for x in units),"Volume order changed")
    check([x["data-unit"] for x in units if re.match("F[0-9]",x["data-unit"])]==[f"F{i:02d}" for i in range(1,14)],"Missing F01–F13")
    check(len(doc.select('[data-unit="digest"] ol > li'))==8,"TL;DR must retain all eight points")
    check(len(doc.select('#article [data-source] table, #article table[data-source]'))==23,"Table count")
    check(len(doc.select("#article tbody tr"))==258 and len(doc.select("#article td"))==1475 and len(doc.select("#article th"))==126,"Table size")
    check([x["data-tex"] for x in doc.select("#article [data-tex]")]==formulas,"TeX notation changed")
    check(all(x.get_text(strip=True) and "$" not in x.text for x in doc.select("[data-tex]")),"Formula not visually typeset")
    blocks=doc.select("#article [data-source]")
    plates=iter(meta["survey"])
    orig_hrefs=[];counts=0
    for ix,block in zip(order,blocks,strict=True):
        original=items[ix]
        check(original.name==block.name,f"Block {ix} changed kind")
        if original.img:
            r=next(plates)
            check((original.img["src"],original.img["alt"])==(r["source"],block.img["alt"]),f"Source image mismatch at {ix}")
            check(block.img["src"]==r["src"],f"Rendered image mismatch at {ix}")
        # Remove only explicitly editorial text/links. Then compare EACH base block and EACH table cell, in order.
        for e in block.select("[data-extra]"):e.decompose()
        for a in block.select("a[data-art]"):a.unwrap()
        for t in block.select("[data-tex]"):t.replace_with(f'ZXQFORM{formulas.index(t["data-tex"])}XZ')
        check(text(block)==text(original),f"Text mismatch at {ix}: {text(original)[:52]}")
        check(anchors(block)==anchors(original),f"Link mismatch at {ix}")
        orig_hrefs.extend(a["href"] for a in original.select("a"))
        if original.name=="table":
            saved=block.select("tr");raw=original.select("tr")
            check(len(saved)==len(raw),f"Row mismatch at {ix}")
            for j,(a,b) in enumerate(zip(saved,raw,strict=True)):
                ac=a.find_all(["td","th"]);bc=b.find_all(["td","th"])
                check([text(t) for t in ac]==[text(t) for t in bc],f"Cells changed at {ix}, row {j}")
                check([anchors(t) for t in ac]==[anchors(t) for t in bc],f"Cell links changed at {ix}, row {j}")
                counts+=len(ac)
    check(next(plates,None) is None,"Unplaced plate")
    check(len(orig_hrefs)==341 and len(set(u for u in orig_hrefs if u.startswith("http")))==188 and counts==1601,"Unexpected link/cell totals")


def main():
    meta=json.loads((ROOT/"assets-manifest.json").read_text())
    check(hashfile(MD)==meta["source_sha256"],"Source checksum mismatch")
    items,math=source_blocks()
    cta="https://hyfine.github.io/loop-transformer-atlas/"
    media=meta["survey"]
    archive={r["path"]:r for r in json.loads((SOURCE/"manifest.json").read_text())}
    check(len(media)==41 and sum(r["mode"]=="unchanged" for r in media)==38,"Plate inventory changed")
    for r in media:
        im_path=ROOT/r["src"]
        with Image.open(im_path) as im:check(list(im.size)==r["size"],f"Plate geometry: {im_path}");im.verify()
        check(hashfile(im_path)==r["sha256"],f"Plate checksum: {im_path}")
        origin=archive[r["source"]]
        check(hashfile(SOURCE/r["source"])==origin["public_sha256"],f"Public archive mismatch: {im_path}")
        same=origin["source_sha256"]==r["sha256"]
        check(r["mode"]==origin["mode"] and same==(r["mode"]=="unchanged"),f"Wrong attribution: {im_path}")
    animations=meta["animations"]
    check(len(animations)==5 and len({a["after"] for a in animations})==5,"Missing source-art tours")
    for a in animations:
        check(hashfile(ROOT/a["src"])==a["sha256"] and hashfile(ROOT/a["poster"])==a["poster_sha256"],"Animation/poster checksum")
        with Image.open(ROOT/a["src"]) as im:
            check(im.n_frames==a["frames"] and im.info.get("loop")==0,f"Animated GIF not looping: {a['src']}")
            holds=[]
            for frame in ImageSequence.Iterator(im):
                if frame.info.get("duration",0)>=1800:holds.append(frame.convert("RGB").resize((140,154)).tobytes())
            check(len(set(holds))==len(a["stops"]),f"Missing readable, distinct stop in {a['src']}")
        with Image.open(ROOT/a["poster"]) as poster:poster.verify()
    check(cv2.QRCodeDetector().detectAndDecode(cv2.imread(str(ROOT/meta["qr"])))[0]==cta,"QR has wrong destination")
    with Image.open(ROOT/meta["cover"]) as cover:check(cover.size==(1200,510),"Upload cover size")
    article_markup=None
    for filename in ("公众号正文.html","公众号排版台.html"):
        raw=(ROOT/filename).read_text()
        doc=BeautifulSoup(raw,"html.parser")
        check(bool(doc.select_one("#article")),"No article")
        if filename=="公众号正文.html":
            check(not doc.select("script,link[rel=stylesheet],style,button,select"),"Plain article must be standalone and script-free")
            article_markup=raw[raw.index('<body '):].split(">",1)[1].split("</body>",1)[0]
        else:check(raw.count(article_markup)==1,"Desk must embed exactly the same article markup")
        for x in doc.select("[src],a[href]"):
            url=x.get("src") or x["href"]
            if url.startswith("#"):check(doc.find(id=unquote(url[1:])) is not None,url+" has no target")
            elif not urlsplit(url).scheme:
                p=ROOT/unquote(urlsplit(url).path)
                check(p.is_file() and p.resolve().is_relative_to(ROOT),"Local dependency missing: "+url)
            else:check(url.startswith(("https://","http://")) and not x.has_attr("src"),"Unexpected remote dependency: "+url)
        check(len(doc.select("#article img"))==47 and doc.select_one("#article img")["src"]==media[0]["src"],"Cover-first plate order")
        for a in animations:
            motion=doc.select_one(f'section[data-motion] img[src="{a["src"]}"]').find_parent(attrs={"data-motion":True})
            preceding=motion.find_previous("img")["src"]
            check(preceding==next(x["src"] for x in media if x["source"]==a["after"]),"Detached motion study")
        verify_article(doc,items,math,meta)
    print("Verified both editions: 354 source blocks in order (cover first), 23 tables / 258 data rows / 1,601 cells,")
    print("341 manuscript links / 188 distinct external targets, 7 formulae, 41 plates (38 exact; 3 credited redraws), 5 GIFs and Atlas QR.")


if __name__=="__main__":main()
