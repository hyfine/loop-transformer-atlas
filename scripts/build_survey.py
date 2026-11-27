"""Compile the shipped illustrated survey and workbook for static Pages.

From the repository root: python3 scripts/build_survey.py [--check]
Build-only dependencies: markdown-it-py, beautifulsoup4, openpyxl.
"""
import argparse
import csv
import json
import re
from pathlib import Path
from urllib.parse import unquote, urlsplit

from bs4 import BeautifulSoup
from markdown_it import MarkdownIt
from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "survey"
SECTIONS = ["digest", "design", "history", "lineage", "lanes", "taxonomy",
            "families", "industry", "trends", "questions", "decisions", "sources", "glossary"]
READER = MarkdownIt("commonmark", {"html": False}).enable("table")


def chapter_key(heading):
    if heading.startswith("## 附录"):
        return "glossary"
    if m := re.match(r"## (\d+)\.", heading):
        return SECTIONS[int(m[1])]
    if m := re.match(r"### 6\.(\d+) (F\d\d)", heading):
        assert int(m[1]) == int(m[2][1:])
        return m[2]


def compile_chapter(key, text):
    # The source uses only line breaks/subscripts in prose; never render arbitrary raw HTML.
    html = READER.render(text).replace("&lt;br/&gt;", "<br>").replace("&lt;sub&gt;", "<sub>").replace("&lt;/sub&gt;", "</sub>")
    soup = BeautifulSoup(html, "html.parser")
    figures = []
    for img in soup.select("img"):
        local = img["src"]
        f = SOURCE / local
        if not local.startswith("images/") or not f.resolve().is_relative_to(SOURCE) or not f.is_file():
            raise ValueError(f"Unresolved source illustration: {local}")
        caption = img.find_parent("p").find_next_sibling("p")
        caption = caption.get_text(" ", strip=True) if caption and caption.find("em") else ""
        figures.append(dict(file=local, alt=img.get("alt", ""), caption=caption,
                            svg=f.with_suffix(".svg").relative_to(SOURCE).as_posix() if f.with_suffix(".svg").exists() else None))
        img["src"] = "survey/" + local
        img["loading"] = "lazy"
        img["decoding"] = "async"
    for a in soup.select("a[href]"):
        u = a["href"]
        if u.startswith("#"):
            m = re.match(r"#(\d+)-", u)
            if m and int(m[1]) < len(SECTIONS):
                a["href"] = "#survey/" + SECTIONS[int(m[1])]
            elif "附录" in unquote(u):
                a["href"] = "#survey/glossary"
            else:
                raise ValueError(f"Unknown survey anchor: {u}")
        elif urlsplit(u).scheme not in {"https", "http"}:
            f = SOURCE / u
            if not f.is_file() or not f.resolve().is_relative_to(SOURCE):
                raise ValueError(f"Unsafe or missing survey target: {u}")
            a["href"] = "survey/" + u
    for table in soup.select("table"):
        wrapper = soup.new_tag("div", attrs={"class": "compare-scroll", "tabindex": "0"})
        table.wrap(wrapper)
    return {"id": key, "figures": figures, "html": str(soup)}


def model_notes(md):
    section = md.split("\n### 7.3 ", 1)[1].split("\n### 7.4 ", 1)[0]
    notes = {}
    plate = re.compile(r"^!\[[^\]]*\]\(images/external/([^)\n]+)\)$", re.M)
    for block in re.split(r"\n(?=\*\*)", section)[1:]:
        first = plate.search(block)
        if not first or first[1] in notes:
            raise ValueError(f"Missing or duplicate model architecture in §7.3: {block.splitlines()[0]}")
        # The case already displays the figures; keep their captions, links and accompanying prose.
        notes[first[1]] = READER.render(plate.sub("", block)).strip()
    return notes


def products():
    md = (SOURCE / "Loop_Transformer_Survey_zh_illustrated.md").read_text()
    sections = {"digest": []}
    key = "digest"
    for line in md.splitlines():
        new = chapter_key(line)
        if new:
            key = new
            sections.setdefault(key, [])
        sections[key].append(line)
    chapters = [compile_chapter(key, "\n".join(lines)) for key, lines in sections.items()]
    wb = load_workbook(SOURCE / "Loop_Transformer_Landscape.xlsx", read_only=True, data_only=True)
    with (SOURCE / "reading-list.csv").open() as stream:
        selected = {r["arxiv_id"]: r for r in csv.DictReader(stream)}
    with (SOURCE / "latest-papers.csv").open() as stream:
        recent = {r["arxiv_id"]: r["version_id"] for r in csv.DictReader(stream)}
    assert set(recent) == {r[1].removeprefix("arXiv:") for r in list(wb["New_Since_1106"].values)[2:]}
    corpus = []
    for r in list(wb["All_Papers"].values)[2:]:
        aid = r[1].removeprefix("arXiv:")
        if not re.fullmatch(r"\d{4}\.\d{4,5}", aid):
            raise ValueError(aid)
        row = dict(id=aid, title=r[2], method=r[3] or "", date=r[4].date().isoformat(), family=r[7])
        if aid in recent:
            row["recent"] = recent[aid]
        if aid in selected:
            record = selected[aid]
            assert record["family"] == row["family"]
            row["reading"] = dict(method=record["method"], version=record["version_id"],
                                  citations=record["cited_by"], reason=record["selection"])
        corpus.append(row)
    figures = [f["file"] for ch in chapters for f in ch["figures"]]
    assert len(set(figures)) == len(figures) == 41 and len({r["id"] for r in corpus}) == 376
    assert {r["family"] for r in corpus} <= sections.keys()
    assert sum("reading" in row for row in corpus) == len(selected)
    return {"survey-reader.json": chapters, "survey-library.json": corpus, "survey-model-notes.mjs": model_notes(md)}


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--check", action="store_true")
    args = p.parse_args()
    for name, obj in products().items():
        target = ROOT / "data" / name
        encoded = json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
        data = f"export default {encoded};\n" if target.suffix == ".mjs" else encoded + "\n"
        if args.check:
            if target.read_text() != data:
                raise SystemExit(f"Out of date: {target.name}")
        else:
            target.write_text(data)
        print(name, len(obj))
