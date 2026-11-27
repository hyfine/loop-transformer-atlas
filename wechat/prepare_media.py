"""Package the illustrated survey plates and render small animated reading guides."""
from functools import lru_cache
import hashlib
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
from xml.etree import ElementTree as ET

import cv2
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent
ATLAS_REPO = ROOT.parent
SOURCE = ATLAS_REPO / "survey"
MD = SOURCE / "Loop_Transformer_Survey_zh_illustrated.md"
ASSETS = ROOT / "assets"
SURVEY = ASSETS / "survey"
ATLAS = "https://hyfine.github.io/loop-transformer-atlas/"
PUBLIC = "https://github.com/hyfine/loop-transformer-atlas/blob/c9535fb/survey/"
MARKDOWN = PUBLIC + MD.name
FONT = os.environ.get("LOOP_CJK_FONT", "/System/Library/Fonts/Hiragino Sans GB.ttc")
INK, NAVY, TEAL, MUTE = "#192f49", "#192e54", "#087f78", "#475e70"
PAPER = "#f3f5f6"
SENSE = "https://github.com/OpenSenseNova/SenseNova-Loop/blob/e19d54117b23e83b6719f1d17bba381b8396b3a5/assets/"
MOLT = "https://github.com/hustvl/MoLT/blob/1313b83adf05f666726bf009014f5f50ae345b23/assets/"
# The original caption describes the source figure. Preserve it and separately credit the publication plate.
EXTERNAL = {
    "dory_architecture.jpg": ("Fishman 等，Dory1.0-4B，Figure 2；图解版所附裁切图。", "https://arxiv.org/abs/2611.03998v1", "CC BY 4.0", "https://creativecommons.org/licenses/by/4.0/"),
    "ouro_looplm_architecture.jpg": ("Zhu 等，Scaling Latent Reasoning via Looped Language Models，Figure 3；图解版所附裁切图。", "https://arxiv.org/abs/2510.25741", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/"),
    "sensenova_loop_architecture.jpg": ("OpenSenseNova 官方架构图；保留图解版提供的尺寸。", SENSE+"hero.png", "Apache 2.0", "https://www.apache.org/licenses/LICENSE-2.0"),
    "sensenova_loop_scaling_zh.png": ("OpenSenseNova 官方 Loop Scaling 实验图；保留图解版提供的尺寸。", SENSE+"loop_scaling_zh_latest.png", "Apache 2.0", "https://www.apache.org/licenses/LICENSE-2.0"),
    "glm54_architecture.png": ("发布插图：Atlas 依据智谱架构说明独立重绘；不是发布方原图。上方保留原版图说。", "https://z.ai/blog/glm-5.4", "", ""),
    "molt_attention_visibility.png": ("发布插图：Atlas 独立示意三种跨轮信息通路。原文所述四联原图见作者链接。", MOLT+"molt_attention_visibility.png", "", ""),
    "molt_architecture.png": ("发布插图：Atlas 依据 U-MoLT 的记忆／读出分工独立重绘。原图见作者链接。", MOLT+"molt_architecture.png", "", "")
}


@lru_cache(None)
def font(n):
    return ImageFont.truetype(FONT,n)


def label(d,xy,s,size,color=INK,bold=False,anchor="lm"):
    box = d.textbbox(xy,s,font=font(size),anchor=anchor,stroke_width=int(bold))
    if box[0]<0 or box[1]<0 or box[2]>d._image.width or box[3]>d._image.height:
        raise ValueError(f"Text outside media: {s}")
    d.text(xy,s,font=font(size),fill=color,anchor=anchor,stroke_width=int(bold),stroke_fill=color)


def ar(a):
    return "https://arxiv.org/abs/"+a


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def package():
    SURVEY.mkdir(parents=True,exist_ok=True)
    manifest_file=ATLAS_REPO/"survey/manifest.json"
    public={x["path"]:x for x in json.loads(manifest_file.read_text())}
    files=re.findall(r'!\[[^\]\n]*\]\((images/[^)\n]+)\)',MD.read_text())
    if len(files)!=len(set(files)) or len(files)!=41:
        raise ValueError("The supplied illustration inventory changed; reconcile the plate list.")
    records=[]
    for i,path in enumerate(files,1):
        rec=public[path];src=SOURCE/path
        if sha(src)!=rec["public_sha256"]:raise ValueError("Unexpected public plate: "+path)
        target=SURVEY/f"{i:02d}-{src.name}"
        drawing={"glm54_architecture.png":"glm54-loop.svg",
                 "molt_architecture.png":"umolt-memory.svg"}.get(src.name)
        if drawing:
            subprocess.run(["sips","-s","format","png",str(ATLAS_REPO/"assets"/drawing),
                            "--out",str(target)],check=True,stdout=subprocess.DEVNULL)
        else:
            shutil.copyfile(src,target)
        with Image.open(target) as im:
            wh=list(im.size);im.verify()
        credit,url,license_name,license_url=EXTERNAL.get(src.name,("图解版原作者绘制；保留原图尺寸与配色。",PUBLIC+path,"",""))
        art_url=PUBLIC+path if not drawing else PUBLIC.removesuffix("survey/")+"assets/"+drawing
        records.append(dict(order=i,source=path,src=target.relative_to(ROOT).as_posix(),size=wh,mode=rec["mode"],art_url=art_url,
                            credit=credit,url=url,license=license_name,license_url=license_url,sha256=sha(target)))
    shutil.copyfile(ATLAS_REPO/"survey/images/external/SenseNova-LICENSE.txt",SURVEY/"OpenSenseNova-LICENSE.txt")
    return records


# Crop coordinates are in the original SVG's coordinate system, not arbitrary screen pixels.
GUIDES = [
    ("01-loop","共享核的两条输入","fig01_recurrent_depth_overview",[
        ("01  固定输入 e","P 只算一次；沿虚线看 e 如何在每一轮重新注入。",(495,280,905,469)),
        ("02  回到同一块","回边送回新状态；上轮的权重没有复制。",(625,170,995,508)),
        ("03  尾段读出","达到选定 R 后才预测下一个 token。",(813,226,1182,491)),
        ("04  展开检查","横向多个 Fθ 是同一参数组的多次访问。",(58,555,636,668))], [ar("2502.05171v2")]),
    ("02-timeline","六个阶段，六次问题转换","g2_timeline",[
        ("2015–2017  前身","循环单元与停机先于循环 Transformer。",(45,287,269,471)),
        ("2018–2022  奠基","UT、DEQ、ALBERT 对应不同的共享问题。",(279,290,504,493)),
        ("2023–2024  理论","存在性构造与训练时学会不是同一命题。",(513,288,737,473)),
        ("2025  规模化","以 Huginn 为例，共享核进入十亿参数级语言建模。",(746,265,970,394)),
        ("2026 上半年  对照","扩展律问：多算一步，相当于多少独立参数？",(979,470,1206,566)),
        ("2026 下半年  落地","同一条时间线出现多模态模型和旗舰模型。",(1212,711,1456,932))],[MARKDOWN,ar("1807.03819"),ar("2502.05171v2")]),
    ("03-family-tree","同一棵树的四个入口","g4_family_tree",[
        ("模型层  /  F03","读稠密架构这一枝：共享块怎样组成语言模型？",(408,251,743,404)),
        ("训练层  /  F05","读稳定性这一枝：怎样让反复迭代不发散？",(50,662,389,823)),
        ("推理层  /  F08","读服务这一枝：延迟、KV 容量与访存分别算账。",(1107,662,1458,823)),
        ("理解与应用层  /  F11","读微型推理器这一枝：深度怎样花在结构化难题上？",(622,992,883,1154))],[MARKDOWN,PUBLIC+"Loop_Transformer_Landscape.xlsx"]),
    ("04-lineage","这些线，分别意味着什么？","g5_lineage",[
        ("01  ACT → Universal Transformer","原图实线：在共享 Transformer 中引入位置级停机。",(190,143,599,434)),
        ("02  Huginn ⇢ Ouro","原图虚线：相关的循环语言建模问题，不是继承权重。",(575,500,975,658)),
        ("03  PLT → LoopCoder-v2","原图实线：跨轮位置偏移被用于代码模型的实际比较。",(755,505,1354,895)),
        ("04  Loopie ⇢ SMELT","原图虚线：同问预算匹配，但步时与 FLOPs 不可互换。",(1325,951,1735,1071)),
        ("05  HRM → TRM","读作结构化谜题中的设计对照与延续，不是能力排序。",(570,1423,969,1548)),
        ("06  读回图例","实线还可指实验底座；虚线不证明直接因果。",(37,1704,1100,1791))],[MARKDOWN,ar("1807.03819"),ar("2606.18023v1"),ar("2607.16051v3"),ar("2609.01343v3")]),
    ("05-swimlanes","横读一族，纵读一个时期","g6_swimlane_global",[
        ("01  看早期比例","早期年份被压缩，横向距离不是统一的时间间隔。",(270,87,795,255)),
        ("02  看模型层","F01／03／04／06 四行：基础、架构、专家、停机。",(42,154,328,356)),
        ("03  看训练层","F05／07／09：稳定性、改造与后训练。",(42,361,328,516)),
        ("04  单独读 F08","2026 Q3 记有 13 篇，Q4 截至 11 月 26 日为 34 篇。",(1245,515,1566,602)),
        ("05  看理解与应用","再看理论、解释、微型递归、跨模态和相邻路线。",(42,589,329,842))],[PUBLIC+"Loop_Transformer_Landscape.xlsx",MARKDOWN]),
]

EDGE_STOPS = {
    "01-loop":[(600,372,790,394),(880,268,750,262),(910,330,971,330),(370,630,406,630)],
    "04-lineage":[(304.6,237,304.6,341),(771.3,565,783.3,565),(960.4,833,1161.6,565),
                  (1527.8,1017,1539.8,1017),(771.3,1485,783.3,1485),None]
}


def source_edges(svg):
    edges={}
    for node in svg.iter():
        if "marker-end" not in node.attrib:continue
        if node.tag.endswith("}line"):
            v=[float(node.attrib[k]) for k in ("x1","y1","x2","y2")]
        elif node.tag.endswith("}path") and re.fullmatch(r"M[\s\d.,-]+C[\s\d.,-]+",node.get("d","")):
            v=list(map(float,re.findall(r"-?[\d.]+",node.attrib["d"])))
            if len(v)!=8:continue
        else:continue
        edges[tuple(v[:2]+v[-2:])]=list(zip(v[::2],v[1::2]))
    return edges


def animate(guide,record):
    name,title,_,stops,refs=guide
    img=Image.open(ROOT/record["src"]).convert("RGB")
    svg=ET.parse((SOURCE/record["source"]).with_suffix(".svg")).getroot()
    vx,vy,vw,vh=map(float,svg.attrib["viewBox"].split())
    if vx or vy:raise ValueError("Expected zero-origin source viewBox")
    sx,sy=img.width/vw,img.height/vh
    edges=source_edges(svg)
    paths=[edges[key] if key else None for key in EDGE_STOPS.get(name,[None]*len(stops))]
    # Persistent overview on top, magnified original detail below; long final hold for reading.
    width,height=880,968
    mapbox=(35,126,845,457)
    overview=ImageOps.contain(img,(mapbox[2]-mapbox[0],mapbox[3]-mapbox[1]),Image.Resampling.LANCZOS)
    ox=(width-overview.width)//2;oy=mapbox[1]+(mapbox[3]-mapbox[1]-overview.height)//2
    def frame(stop,idx,progress):
        stage,note,roi=stop; l,u,r,b=roi
        if not (0<=l<r<=vw and 0<=u<b<=vh):raise ValueError((name,roi))
        im=Image.new("RGB",(width,height),PAPER);d=ImageDraw.Draw(im)
        d.rectangle((0,0,width,102),fill=NAVY)
        label(d,(28,23),"ILLUSTRATED SURVEY     /     原图导读",15,"#b9d8d2")
        label(d,(28,67),title,33,"white",True);label(d,(851,67),f"{idx+1:02d} / {len(stops):02d}",21,"#efcb97",anchor="rm")
        d.rounded_rectangle((22,118,858,465),12,fill="white",outline="#d2dce1",width=2);im.paste(overview,(ox,oy))
        rx=overview.width/vw;ry=overview.height/vh
        d.rounded_rectangle((ox+l*rx,oy+u*ry,ox+r*rx,oy+b*ry),3,outline=TEAL,width=3)
        label(d,(29,504),stage,27,INK,True);label(d,(29,550),note,22,MUTE)
        d.rounded_rectangle((22,581,858,907),13,fill="white",outline="#cedadf",width=2)
        # Slight camera advance without cutting any text off the final, measured window.
        pad=(1-progress)*.05
        crop=(max(0,int((l-(r-l)*pad)*sx)),max(0,int((u-(b-u)*pad)*sy)),
              min(img.width,math.ceil((r+(r-l)*pad)*sx)),min(img.height,math.ceil((b+(b-u)*pad)*sy)))
        detail=ImageOps.contain(img.crop(crop),(813,300),Image.Resampling.LANCZOS)
        dx,dy=(width-detail.width)//2,744-detail.height//2
        im.paste(detail,(dx,dy))
        if paths[idx]:
            # Follow the actual SVG segment, including curved or dashed editorial connections.
            points=paths[idx]
            while len(points)>1:
                points=[(x+(a-x)*progress,y+(b-y)*progress) for (x,y),(a,b) in zip(points,points[1:])]
            x,y=points[0]
            for px,py,rad in ((ox+x*rx,oy+y*ry,5),(dx+(x*sx-crop[0])*detail.width/(crop[2]-crop[0]),
                                                   dy+(y*sy-crop[1])*detail.height/(crop[3]-crop[1]),8)):
                d.ellipse((px-rad,py-rad,px+rad,py+rad),fill="#d36a16",outline="white",width=2)
        for j in range(len(stops)):
            x=29+j*34;d.rounded_rectangle((x,935,x+25,941),3,fill=TEAL if j<=idx else "#c9d5d8")
        label(d,(851,938),"原图放大   ·   光点为导读标记，非实测时间" if paths[idx] else "图解版原图局部放大   ·   非实测时间",17,MUTE,anchor="rm")
        return im
    frames=[];durations=[]
    for i,stop in enumerate(stops):
        times=[(j/6,160) for j in range(6)]+[(1,2300)] if paths[i] else [(0,150),(.5,150),(1,2300)]
        for t,hold in times:
            frames.append(frame(stop,i,t));durations.append(hold)
    sample=Image.new("RGB",(660,math.ceil(len(frames)/3)*242),"white")
    for i,im in enumerate(frames):sample.paste(im.resize((220,242),Image.Resampling.LANCZOS),(i%3*220,i//3*242))
    pal=sample.quantize(colors=192,method=Image.Quantize.MEDIANCUT)
    gif=ASSETS/(name+".gif")
    indexed=[im.quantize(palette=pal,dither=Image.Dither.NONE) for im in frames]
    indexed[0].save(gif,save_all=True,append_images=indexed[1:],duration=durations,loop=0,disposal=1,optimize=False)
    poster=ASSETS/(name+".png")
    frames[durations.index(2300)].save(poster,optimize=True)
    return dict(src=gif.relative_to(ROOT).as_posix(),poster=poster.relative_to(ROOT).as_posix(),after=record["source"],
                title=title,frames=len(frames),stops=[s[0] for s in stops],refs=refs,sha256=sha(gif),poster_sha256=sha(poster))


def main():
    source=package()
    animations=[animate(g,next(r for r in source if Path(r["source"]).stem==g[2])) for g in GUIDES]
    # Use the survey artwork itself on the upload cover, without cropping the title or stretching it.
    hero=Image.open(ROOT/source[0]["src"]).convert("RGB")
    cover=Image.new("RGB",(1200,510),hero.getpixel((1,1)))
    fitted=ImageOps.contain(hero,cover.size,Image.Resampling.LANCZOS)
    cover.paste(fitted,((1200-fitted.width)//2,(510-fitted.height)//2))
    cover.save(ASSETS/"cover.png",optimize=True)
    matrix=cv2.QRCodeEncoder_create().encode(ATLAS)
    qr=ImageOps.expand(Image.fromarray(matrix),border=4,fill=255)
    qr.resize((qr.width*10,qr.height*10),Image.Resampling.NEAREST).save(ASSETS/"07-atlas-qr.png")
    if cv2.QRCodeDetector().detectAndDecode(cv2.imread(str(ASSETS/"07-atlas-qr.png")))[0]!=ATLAS:raise ValueError("QR verification failed")
    meta=dict(source_sha256=sha(MD),survey=source,animations=animations,cover="assets/cover.png",qr="assets/07-atlas-qr.png",atlas=ATLAS)
    (ROOT/"assets-manifest.json").write_text(json.dumps(meta,ensure_ascii=False,indent=2)+"\n")
    print(f"{len(source)} source plates, {len(animations)} original-art guided animations, cover and verified QR.")


if __name__=="__main__":main()
