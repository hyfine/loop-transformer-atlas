"""Typeset the supplied Markdown. No abbreviated article or second copy of its prose."""
import hashlib
import json
import re
from html import escape
from pathlib import Path
from urllib.parse import unquote

from bs4 import BeautifulSoup
from markdown_it import MarkdownIt

HERE = Path(__file__).resolve().parent
MD = HERE.parent / "survey/Loop_Transformer_Survey_zh_illustrated.md"
ATLAS = "https://hyfine.github.io/loop-transformer-atlas/"
WECHAT = "https://mp.weixin.qq.com/s/Poxa25iG-8ZYJcdpjBVsDg"
PUBLIC = "https://github.com/hyfine/loop-transformer-atlas/blob/c9535fb/survey/"
MANIFEST = HERE / "assets-manifest.json"
FONT = "-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif"
SERIF = "Georgia,'Songti SC','STSong',serif"
INK = "#19304c"
TEAL = "#11675f"
MUTE = "#50647a"
LINK = f"color:{TEAL};text-decoration:underline;text-underline-offset:3px;overflow-wrap:anywhere"
SMALL = f"font-size:13px;line-height:1.75;color:{MUTE}"
KICKER = f"font:700 11px/1.5 {FONT};letter-spacing:1.4px;color:{TEAL}"
BODY = f"box-sizing:border-box;max-width:824px;margin:0 auto;background:#fff;color:{INK};font:16px/1.88 {FONT};overflow-wrap:anywhere;word-break:normal"
IMG = "display:block;box-sizing:border-box;width:100%;height:auto;margin:0;border:0"
CHAPTERS = ["digest","design","history","lineage","lanes","taxonomy","families","industry","trends","questions","decisions","sources","glossary"]
EN = ["THE TAKEAWAYS","THE SHARED BLOCK","SIX ERAS","TWO KINDS OF MAP","FOLLOW A LANE","CLASSIFICATION","THIRTEEN FAMILIES","IN THE WILD","RESEARCH FRONTIER","OPEN QUESTIONS","ENGINEERING CHOICES","SOURCES & CREDITS","GLOSSARY"]
VOLUMES = ["入门与全景地图 · 开篇–§4","分类与机制 · §5–F04","训练、改造与服务 · F05–F08","对齐、理解与应用 · F09–F13","模型、趋势与选型 · §7–10","资料与术语 · §11–附录"]
MATH = {
    r"$F_\theta$":"F<sub>θ</sub>", "$e$":"e", "$R$":"R", "$r^{0.46}$":"r<sup>0.46</sup>",
    r"$x \leftarrow (1-\tfrac1K)x + \tfrac1K g(x)$":"x ← (1 − 1/K)x + (1/K) g(x)",
    r"$$h_{k+1} = F_\theta\big(h_k,\; e\big),\quad k=0,1,\dots,R-1$$":
        "h<sub>k+1</sub> = F<sub>θ</sub>(h<sub>k</sub>, e),&emsp; k = 0, 1, …, R − 1",
    r"$$e=P(x),\quad s_0\sim\mathcal N(0,\sigma^2 I),\quad s_i=R(e,s_{i-1}),\quad p=C(s_R)$$":
        "e = P(x),&ensp; s<sub>0</sub> ∼ 𝒩(0, σ<sup>2</sup> I),&ensp; s<sub>i</sub> = R(e, s<sub>i−1</sub>),&ensp; p = C(s<sub>R</sub>)"
}


def fragment(html):
    return BeautifulSoup(html,"html.parser").find()


def extra(html):
    tag=fragment(html)
    tag["data-extra"]=""
    return tag


def style(tag,css):
    tag["style"]=css
    return tag


def link(url,label):
    return f'<a href="{escape(url,quote=True)}" style="{LINK}">{escape(label)}</a>'


def kicker(txt):
    return extra(f'<span style="display:block;margin:0 0 7px;{KICKER}">{escape(txt)}</span>')


def mark_math(m):
    tex=m.group()
    if tex not in MATH:raise ValueError(f"Typeset new formula: {tex}")
    return f'<span data-tex="{escape(tex,quote=True)}" style="font:italic 1.05em/1.85 Georgia,serif;color:#1e4259">{MATH[tex]}</span>'


def read_source():
    text=MD.read_text()
    # CommonMark's closing-delimiter rule misses Chinese text immediately after a bold closing parenthesis.
    text=re.sub(r"\*\*([^\n]+?)\*\*",r"<strong>\1</strong>",text)
    text=re.sub(r"\$\$[^\n]+?\$\$|\$[^\n$]+\$",mark_math,text)
    return BeautifulSoup(MarkdownIt("commonmark",{"html":True}).enable("table").render(text),"html.parser")


def decorate_table(table,guide):
    heads=table.select("thead th")
    rows=table.select("tbody tr")
    labels=[h.get_text(strip=True) for h in heads]
    cards=guide or len(heads)>=4
    style(table,"width:100%;box-sizing:border-box;margin:14px 0 26px;border-collapse:collapse;"+
          ("display:block" if cards else "table-layout:fixed;font-size:14px;line-height:1.7"))
    if not cards:
        for h in heads:style(h,"text-align:left;vertical-align:top;background:#22435a;color:white;padding:8px 6px")
        for i,row in enumerate(rows):
            for cell in row.find_all("td",recursive=False):
                style(cell,f"background:{'#f3f7f7' if i%2==0 else 'white'};border-bottom:1px solid #cfdddd;padding:8px 6px;vertical-align:top;overflow-wrap:anywhere")
        return
    # Keep genuine table headers/cells; inline block layout also works when a client drops style sheets.
    table["data-record-table"]=""
    style(table.thead,"display:block;margin-bottom:8px")
    style(table.thead.tr,"display:block;color:#586d78;line-height:1.4")
    for h in heads:
        style(h,"display:inline-block;margin:0 7px 5px 0;font-size:11px;font-weight:500;text-align:left;padding:1px 4px;border-bottom:1px solid #c6d5d7")
    style(table.tbody,"display:block")
    for i,row in enumerate(rows,1):
        accent=("#166b66","#2e6087","#90602e")[(i-1)%3] if guide else TEAL
        style(row,"display:block;box-sizing:border-box;margin:0 0 12px;padding:12px 14px 10px;background:"+
              ("#f0f6f5" if guide else ("#f4f7f7" if i%2 else "#fafaf7"))+
              f";border:1px solid #d7e2e1;border-left:3px solid {accent};border-radius:3px")
        for j,c in enumerate(row.find_all("td",recursive=False)):
            style(c,("display:block;font-size:17px;font-weight:700;line-height:1.5;margin:0 0 5px;color:"+INK if j==0 else
                     "display:block;font-size:14px;line-height:1.75;margin:3px 0;color:#2c4354")+";padding:0;overflow-wrap:anywhere")
            if not c.get_text(strip=True):continue
            badge=f"{'ROUTE' if guide else '№'} {i:02d} · {labels[j]}" if j==0 else labels[j]
            c.insert(0,extra(f'<span style="display:{"block" if j==0 else "inline"};font-size:11px;letter-spacing:.4px;font-weight:650;color:{accent};margin-right:7px">{escape(badge)}　</span>'))


def decorate_list(node,section):
    is_toc=section=="目录"
    is_digest=section.startswith("0.")
    style(node,"margin:10px 0 24px;padding:0;list-style:none" if is_toc or is_digest else "margin:9px 0 19px;padding-left:1.5em")
    for i,li in enumerate(node.find_all("li",recursive=False),1):
        if is_toc:
            style(li,"list-style:none;border-bottom:1px solid #dde5e6;margin:0;padding:7px 1px;line-height:1.7")
            style(li.a,LINK+";color:#213d53;text-decoration:none;display:block")
        elif is_digest:
            style(li,"list-style:none;margin:0 0 13px;padding:12px 15px 14px;background:#f2f6f5;border-left:3px solid #589e95;border-radius:2px")
            li.insert(0,kicker(f"要点   {i:02d} / 08"))
        else:style(li,"margin:5px 0 8px;padding-left:1px")


def plate_link(img):
    a=fragment(f'<a data-art="" href="{img["src"]}" target="_blank" rel="noopener" style="display:block"></a>')
    img.wrap(a)


def credit(r):
    text=escape(r["credit"])
    ref=link(r["url"],"图源" if r["mode"]=="unchanged" else "发布方原作")
    if r["mode"]!="unchanged":ref+=" · "+link(r["art_url"],"本站绘图")
    if r["license"]:ref+=" · "+link(r["license_url"],r["license"])
    return extra(f'<p style="margin:0 0 16px;font-size:12px;line-height:1.65;color:{MUTE}">{text}　{ref}</p>')


def motion_plate(a):
    refs=" · ".join(link(u,("原图解／数据" if "github.com/hyfine" in u else "arXiv "+u.rsplit("/",1)[1])) for u in a["refs"])
    stoptext="　→　".join(escape(s) for s in a["stops"])
    tag=extra(f'''<section data-motion="" style="margin:13px 0 27px;border:1px solid #b6d1cd;border-radius:5px;padding:13px;background:#f1f7f6">
    <p style="margin:0 0 4px;{KICKER}">MOTION STUDY　/　原图放大导读</p>
    <p style="margin:0 0 10px;font-size:19px;font-weight:700">{escape(a["title"])}</p>
    <img src="{a["src"]}" data-gif="{a["src"]}" data-poster="{a["poster"]}" alt="{escape(a["title"])}：原图逐站放大" style="{IMG};max-width:510px;margin:auto"/>
    <p style="margin:9px 0 0;{SMALL}">{stoptext}</p><p style="margin:5px 0 0;{SMALL}">导读依据：{refs}</p></section>''')
    return tag


def cta(manifest):
    return extra(f'''<section data-cta="" style="margin:34px 0 6px;background:#eaf3f1;border-top:4px solid #196d69;padding:20px;text-align:center">
    <p style="margin:0;{KICKER}">CONTINUE READING　/　互动研究地图</p>
    <p style="margin:7px 0;font:700 23px/1.5 {SERIF};color:{INK}">读完一张图，沿着一条线继续。</p>
    <p style="margin:0 0 12px;font-size:15px">在 Atlas 切换家族树、泳道与时间线，打开模型案例，回到论文、代码和工作簿。</p>
    <img src="{manifest["qr"]}" alt="Loop Transformer Atlas 入口二维码" style="{IMG};width:130px;max-width:100%;margin:auto"/>
    <p style="margin:8px 0 0;{SMALL}">长按识别二维码，或点文末「阅读原文」<br>{link(ATLAS,ATLAS)}</p></section>''')


def article(manifest):
    soup=read_source()
    blocks=soup.find_all(recursive=False)
    if [b.name for b in blocks[:3]]!=["h1","p","blockquote"] or not blocks[1].img:
        raise ValueError("Unexpected source opener")
    records={r["source"]:r for r in manifest["survey"]}
    motions={r["after"]:r for r in manifest["animations"]}
    toc=soup.find("h2",string="目录").find_next_sibling("ul")
    anchors=[unquote(a["href"][1:]) for a in toc.select("a")]
    if len(anchors)!=len(CHAPTERS):raise ValueError("Source TOC changed")
    result=fragment(f'<section id="article" lang="zh-CN" style="{BODY}"></section>')
    units=[]
    def unit(key,volume,title):
        tag=fragment(f'<section data-unit="{key}" data-volume="{volume}" style="display:flow-root;padding:0 4%"></section>')
        result.append(tag);units.append((key,volume,title))
        return tag
    current=unit("front",1,"封面 · 阅读指南 · 目录")
    section=subsection=""
    c=-1;pending=None
    for ix in [1,0,*range(2,len(blocks))]:
        node=blocks[ix];name=node.name;txt=node.get_text(strip=True)
        node["data-source"]=str(ix)
        for a in node.select("a"):style(a,LINK)
        for k in node.select("code"):style(k,"font-family:ui-monospace,monospace;font-size:.87em;color:#435876;background:#eff2f4;overflow-wrap:anywhere")
        for k in node.select("strong"):style(k,f"color:{INK};font-weight:715")
        for k in node.select("sub:not([data-tex] sub)"):style(k,"vertical-align:baseline;font-size:.82em;color:#526774")
        if name=="h2":
            section=txt;subsection=""
            if section not in ("阅读指南","目录"):
                c+=1
                current=unit(CHAPTERS[c],1 if c<=4 else 2 if c<=6 else 5 if c<=10 else 6,txt)
                node["id"]=anchors[c]
            else:node["id"]="guide" if section=="阅读指南" else "contents"
        elif name=="h3":
            subsection=txt
            family=re.match(r"6\.(\d+) (F\d\d) ",txt)
            if family:
                n=int(family[1]);current=unit(family[2],2 if n<=4 else 3 if n<=8 else 4,txt)
            node["id"]=f"part-{txt.split()[0].replace('.','-')}"
        current.append(node.extract())
        if name=="h1":
            style(node,f"margin:16px 0 13px;font:700 28px/1.48 {SERIF};color:{INK};letter-spacing:.1px")
            main,sep,deck=txt.partition("：")
            node.clear();node.append(kicker("研究手记　/　ILLUSTRATED SURVEY　　№ 01"))
            node.append(main+sep)
            node.append(fragment(f'<span style="display:block;margin-top:4px;font:500 17px/1.7 {FONT};color:{MUTE}">{escape(deck)}</span>'))
            node.insert_after(extra(f'<p style="margin:0 0 15px;{SMALL}">{link(WECHAT,"在手机微信中阅读公众号原文 ↗")}</p>'))
        elif name=="h2":
            style(node,f"border-top:3px solid {'#318e84' if c<0 else '#234a65'};padding-top:12px;margin:31px 0 13px;font:700 25px/1.5 {SERIF};color:{INK}")
            node.insert(0,kicker("START HERE　/　选择阅读路线" if section=="阅读指南" else "CONTENTS　/　全文导航" if section=="目录" else f"{'APPENDIX' if c==12 else f'CHAPTER {c:02d}'}　/　{EN[c]}"))
        elif name=="h3":
            style(node,f"margin:26px 0 11px;padding:1px 0 1px 10px;border-left:4px solid #30887f;font:700 20px/1.5 {FONT};color:{INK}")
            if family:
                node.insert(0,kicker("FAMILY DOSSIER　/　机制档案"))
                node["style"]+=f";background:#edf4f3;padding:13px 15px;font-family:{SERIF}"
        elif name=="table":decorate_table(node,section=="阅读指南")
        elif name in ("ul","ol"):
            decorate_list(node,section)
            if name=="ol" and section.startswith("0."):
                node.insert_after(extra(f'<p style="margin:10px 0 20px;padding:10px 13px;background:#faf5eb;{SMALL}"><strong>编者注｜怎样读「匹配」：</strong> {link("https://arxiv.org/abs/2607.16051v3","Loopie")} 对照实测训练单步耗时；{link("https://arxiv.org/abs/2609.01343v3","SMELT")} 对照训练 FLOPs。两者都不能直接推出线上每个 token 的延迟或 KV 成本相同。</p>'))
        elif name=="hr":style(node,"margin:23px auto 5px;border:0;width:44px;border-top:2px solid #ccd8d7")
        elif name=="blockquote":
            style(node,"margin:12px 0 18px;padding:11px 15px;border-left:3px solid #bf975c;background:#faf6ed;font-size:14px;line-height:1.85;color:#425363")
            for p in node.select("p"):style(p,"margin:0")
            if ix==2:
                style(node,"margin:10px 0 18px;padding:13px 15px;background:#edf3f6;border-left:3px solid #5d8399;font-size:14px;line-height:1.8;color:#3b5267")
                style(node.p,"margin:0;white-space:pre-line")
                node.insert_after(extra(f'<p style="margin:0 0 15px;{SMALL}">本期据 2026-11-26 图解版编排。收录数与模型判断均为该版快照，而非实时排名。封面与结构图：{link(PUBLIC+MD.name,"原始图解综述")} · {link(PUBLIC+"Loop_Transformer_Landscape.xlsx","配套工作簿")}</p>'))
        elif name=="p":
            style(node,"margin:9px 0 15px")
            if node.img:
                if pending:raise ValueError("Missing original figure caption")
                im=node.img;src=im["src"];r=records[src];hero=ix==1
                im["src"]=r["src"];im["width"],im["height"]=map(str,r["size"]);style(im,IMG)
                if not hero:im["loading"]="lazy"
                node["data-plate"]=""
                plate_link(im)
                style(node,("margin:0 -4.34% 0" if hero else "margin:19px 0 0;padding:4px;border:1px solid #d6e0e2;border-radius:4px;background:#fff"))
                if not hero:pending=(r,motions.get(src))
            elif pending:
                r,motion=pending;pending=None
                style(node,f"margin:0;padding:7px 9px 6px;border-left:2px solid #a2bbbb;{SMALL}")
                for em in node.select("em"):style(em,"font-style:normal")
                annotation=credit(r);node.insert_after(annotation)
                if motion:annotation.insert_after(motion_plate(motion))
            elif node.select_one('[data-tex^="$$"]'):
                style(node,"margin:17px 0;padding:13px 15px;border-left:3px solid #297e78;background:#edf5f4;font-size:18px;line-height:1.8")
            elif subsection.startswith("7.3") and node.strong and node.contents[0]==node.strong:
                node.insert(0,kicker("MODEL NOTES　/　模型解读"))
                style(node,"margin:21px 0 9px;border-top:1px solid #8ca9b4;padding-top:12px")
                if txt.startswith("MoLT"):
                    node.insert_after(extra(f'<p style="margin:6px 0 14px;padding:9px 12px;background:#faf5eb;{SMALL}"><strong>编者注｜两组实验：</strong>996.6 / 1000.6 ms 来自约 113M 配置；1.7× token 效率来自 700M 配置。不要把后者解读为 700M 模型也已实现等延迟。{link("https://arxiv.org/abs/2611.34923v1","MoLT 论文")}</p>'))
            elif subsection.startswith("11.2") and txt.startswith("所有图片"):
                node.insert_after(extra(f'<p style="margin:5px 0 13px;{SMALL}">编排说明：下表保留图解版的原始文件名。公众号素材以图序编号；三处重绘见相应图注及{link(PUBLIC+"README.md","公开图源与许可说明")}。</p>'))
            elif node.strong and node.strong.get_text(strip=True)==txt:
                style(node,"margin:21px 0 6px;padding-bottom:4px;border-bottom:1px solid #cddbd9;font-size:17px")
            elif node.strong and node.strong.get_text(strip=True)=="演进脉络":
                style(node,"margin:13px 0;padding:11px 13px;border-left:3px solid #cb9e69;background:#faf6ee")
    if pending or c!=12:raise ValueError("Incomplete chapter or caption")
    current.append(cta(manifest))
    return result,units


def options(rows):
    return "".join(f'<option value="{escape(str(k),quote=True)}">{escape(t)}</option>' for k,t in rows)


def render():
    manifest=json.loads(MANIFEST.read_text())
    if hashlib.sha256(MD.read_bytes()).hexdigest()!=manifest["source_sha256"]:raise ValueError("Rebuild media for this Markdown snapshot")
    article_tag,units=article(manifest)
    body=str(article_tag)
    doctype='<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    title="Loop Transformer 技术全景 · 图解全文版"
    (HERE/"公众号正文.html").write_text(doctype+f'<title>{title}</title></head><body style="margin:0;background:#fff">{body}</body></html>\n')
    unit_options=options((f"u-{k}",t) for k,_,t in units)
    scope=('<option value="all">全文 · 封面至术语表</option><optgroup label="分卷连载">'+
           options((f"v-{i}",f"{i:02d}　{n}") for i,n in enumerate(VOLUMES,1))+
           '</optgroup><optgroup label="章节或单一技术族">'+unit_options+'</optgroup>')
    gallery="".join(f'<li>{link(r["src"],Path(r["src"]).name)}</li>' for r in manifest["survey"])
    motions="".join(f'<li>{link(r["src"],r["title"]+" · GIF")} ／ {link(r["poster"],"静帧")}</li>' for r in manifest["animations"])
    parts={"@@CSS@@":(HERE/"desk.css").read_text(),"@@BODY@@":body,"@@SCOPE@@":scope,"@@GALLERY@@":gallery+motions,
           "@@JUMP@@":options((k,t) for k,_,t in units),"@@JS@@":(HERE/"desk.js").read_text()}
    desk=(HERE/"desk.template.html").read_text()
    for k,v in parts.items():
        if desk.count(k)!=1:raise ValueError(f"Missing/duplicate template slot {k}")
        desk=desk.replace(k,v)
    (HERE/"公众号排版台.html").write_text(desk)
    print(f"Typeset {len(units)} reading units in six volumes, with {len(article_tag.select('[data-source]'))} source blocks.")


if __name__=="__main__":render()
