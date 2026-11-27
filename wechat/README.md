# Loop Transformer 技术全景 · 公众号图解全文版

[点击阅览公众号图文全文](https://hyfine.github.io/loop-transformer-atlas/wechat/公众号正文.html) · [在手机微信中阅读公众号原文](https://mp.weixin.qq.com/s/Poxa25iG-8ZYJcdpjBVsDg) · [打开在线排版台](https://hyfine.github.io/loop-transformer-atlas/wechat/公众号排版台.html)

下载后可打开 **[公众号排版台](./公众号排版台.html)** 阅读与复制；[纯正文](./公众号正文.html) 不带工具栏或脚本。两个文件都可以离线打开，请保持 [assets](./assets/) 在同一目录。论文、代码、模型卡和 [互动 Atlas](https://hyfine.github.io/loop-transformer-atlas/) 需要联网。

这不是摘要。内容直接来自[所附图解版 Markdown](../survey/Loop_Transformer_Survey_zh_illustrated.md)，包括阅读指南、目录、8 条 TL;DR、§§1–11、13 个技术族、全部图注/表格和术语表。原版数据截止 2026-11-26；资料收录或链接可达不等于独立复现实验。新增的动图导读、口径提示与原文分别标识。

## 阅读和发稿

1. 默认按**封面 → 阅读指南 → 目录 → TL;DR** 开篇。排版台在手机上让正文、封面和图解占满可用宽度；桌面保留右侧工具栏。目录可跳章；点静态图可查看高清原尺寸。通过「阅读与发布」可跳到任一族。只想看原图时，选「只读原文与原图」。
2. 用「预览与复制范围」选全文、分卷或单章。六卷顺序为：① 开篇–§4；② §5、§6 引言和 F01–04；③ F05–08；④ F09–13；⑤ §7–10；⑥ §11 和附录。六卷不重复也不遗漏原文，单卷复制末尾另附 Atlas 入口。§6 整章也可一次选取。
3. 点「复制所选正文」，**普通粘贴**至公众号编辑器。宽表以逐条记录粘贴，每个字段、数值和链接仍在；复制后的目录指向公开 Atlas 相应章节。如果浏览器禁用富文本剪贴板，使用已选中的手动稿按 ⌘C / Ctrl+C。「返回图文预览」可退出手动稿。
4. [高清图包](./assets/survey/) 按 `01`–`41` 编号；另有 [5 张 GIF 及同名静帧](./assets/)、[封面](./assets/cover.png) 和 [二维码](./assets/07-atlas-qr.png)。按「【插图位：文件名】」从自己的素材库逐一替换，再设标题与封面。**不要复制本地图片地址**。原图后的动图是补充，不会顶替原图。若 GIF 被转码，可切静态模式再复制。
5. 「阅读原文」填 `https://hyfine.github.io/loop-transformer-atlas/`。长文宜分卷；最终容量、表格、外链及 GIF 播放请用实际账号草稿预览确认。本包不会登录或代发文章。

## 图源与再生成

[素材对照表](./assets-manifest.json) 给出原文件、发布文件、逐图署名/链接、像素尺寸及校验值。41 个图位中，38 张与供稿图片逐字节相同。GLM-5.4 架构、MoLT 的 KV 可见性和 U-MoLT 架构三张使用注明出处的独立重绘；原图说与官方图源链接保留。Dory 图为 CC BY 4.0，Ouro 图沿用 CC BY-SA 4.0，两张 SenseNova 图附 [Apache 许可](./assets/survey/OpenSenseNova-LICENSE.txt)。

在本目录运行 `node build.mjs`，依次重建素材、排版和逐块对照检查；只改排版时可运行 `python3 publish.py && python3 verify.py`。构建读取仓库自带的[图解归档](../survey/)和 [Atlas 示意图](../assets/)，不需要仓库以外的原始资料包。生成依赖 Python 3.10+ 的 `markdown-it-py`、`beautifulsoup4`、`Pillow`、`opencv-python`，以及 macOS `sips` 与中文字体（`LOOP_CJK_FONT` 可覆盖）。**阅读与发稿不需要这些依赖**。
