# Illustrated survey edition · 图解版归档

[Read by chapter](https://hyfine.github.io/loop-transformer-atlas/#survey/digest) · [中文阅读器](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#survey/digest) · [Chinese Markdown](Loop_Transformer_Survey_zh_illustrated.md) · [Workbook](Loop_Transformer_Landscape.xlsx)

The November 26, 2026 source edition contains 376 papers, 13 primary families, 17 model/release records and seven blogs/reports. The reader preserves §§0–11, all 13 §6 subsections, the glossary, the tables and the 41 in-text figure positions. English guides are editorial summaries, **not** a claimed full English translation. For equations in their original TeX notation use the Markdown source.

## File fidelity / 原件核对

[Manifest](manifest.json) lists **every one of the 77 supplied files**, its source and public SHA-256, and the publication mode.

- **73 unchanged files:** the original Markdown (including its relative image paths), 34 original illustrations in both PNG and editable SVG, and four licensed external illustrations.
- **Workbook:** the original file contains an organization-linked account in its OOXML `lastModifiedBy` property. The downloadable workbook omits this identity only. All 23 worksheets, their data, styles, relationships and every ZIP member except `docProps/core.xml` are unchanged. It is a content-preserving public copy, **not a byte-identical original**. The untouched original remains with the supplied local bundle.
- **Three figure positions:** the GLM-5.4 blog architecture plate and two MoLT images had no verified public redistribution grant for the supplied artwork. At the same relative paths the public edition provides **clearly labeled independent explanatory drawings**, with the original art linked below and in the reader. The archived Markdown captions are unchanged and describe the supplied originals; the headings on replacement plates identify the difference.

资料包原有的 41 个正文图位均可离线打开，34 组 PNG／SVG 保持原样。下表区分原作者授权图片与本站重新绘制的示意图；不将“网页可读”视为“允许重新发布”。工作簿只去除了身份元数据，未改动表内内容。

## External art / 外部图源

| Public file | Credit, changes and applicable terms |
|---|---|
| [Dory](images/external/dory_architecture.jpg) | Fishman et al., [Dory1.0-4B, Fig. 2](https://arxiv.org/abs/2611.03998v1), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Source package’s cropped JPEG; no further edits. |
| [Ouro](images/external/ouro_looplm_architecture.jpg) | Zhu et al., [Scaling Latent Reasoning via Looped Language Models, Fig. 3](https://arxiv.org/abs/2510.25741), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Source package’s figure extraction; this image retains BY-SA. |
| [SenseNova architecture](images/external/sensenova_loop_architecture.jpg) and [scaling](images/external/sensenova_loop_scaling_zh.png) | OpenSenseNova contributors, [SenseNova-Loop](https://github.com/OpenSenseNova/SenseNova-Loop/tree/e19d54117b23e83b6719f1d17bba381b8396b3a5/assets); [Apache 2.0 notice](images/external/SenseNova-LICENSE.txt). Reproduced at the supplied resized resolution. |
| [GLM reading plate](images/external/glm54_architecture.png) | Atlas-authored substitute. See [Z.ai’s GLM-5.4 article and architecture figure](https://z.ai/blog/glm-5.4). |
| [MoLT visibility](images/external/molt_attention_visibility.png) and [architecture](images/external/molt_architecture.png) | Atlas-authored substitutes. Originals: [attention visibility](https://github.com/hustvl/MoLT/blob/1313b83adf05f666726bf009014f5f50ae345b23/assets/molt_attention_visibility.png) and [U-MoLT architecture](https://github.com/hustvl/MoLT/blob/1313b83adf05f666726bf009014f5f50ae345b23/assets/molt_architecture.png), Zhu et al., [paper](https://arxiv.org/abs/2611.34923v1). |

## Find the underlying record / 资料怎么查

The workbook’s `Taxonomy`, `Timeline`, `Key_Papers`, `Open_Models` and `Blogs_Industry` support the reading sequence; `All_Papers`, `New_Since_1106`, the 13 family sheets and `Link_Audit` retain the bibliographic evidence. `README` and `Dashboard` explain the workbook. Abstract excerpts and third-party material are not relicensed by the atlas.

[Reading list](reading-list.csv): ten distinct papers per family, selected for historical role, representative mechanisms, citation standing within the family, and recent results. [Recent releases](latest-papers.csv): all 43 workbook additions after November 6, including 26 already on the reading list. The two lists therefore cover **147 distinct papers**. Dates are first arXiv submissions, not conference years. `cited_by` is a snapshot of **OpenAlex work-level citations** on November 27; blank means no confirmed match, not zero. New preprints are not labeled “high impact” on the basis of recency. The full text belongs to each paper’s authors/publisher; bibliographic IDs here link to public reading copies.
