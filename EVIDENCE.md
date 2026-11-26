# Evidence, scope and provenance · 证据与来源

**Snapshot / 截止日期: 2026-11-26.** This is a curated synthesis, not a claim to enumerate the entire internet or a replication of model results. 本项目区分三件事：访问到了链接、核对了来源、独立复现了实验。前两者不能证明第三者。

## Three layers of evidence / 三层资料

1. **32 curated records / 精读记录.** The [bilingual casebook](docs/routes.en.md) / [中文案例手册](docs/routes.zh.md) covers six editorial routes. Each record identifies a mechanism, a limitation and at least one primary source. A conference/journal label concerns the particular paper, not its associated model card. `arXiv` denotes the evidence used here, not a claim that the work never appeared elsewhere. Code and weights are separate artifact types. Preview and release can be separate dated records; membership is not descent.
2. **333 discovery records / 发现索引.** [Seed index](data/seed-index.json): bibliographic metadata adapted from the [public asimfish collection at the reviewed commit](https://github.com/asimfish/awesome_loop_transformer/tree/f84531abb70c08147d7def77e8197b5636e90260). Its broader scope includes neighboring latent-reasoning work. The `year` and category are the seed’s, not independent venue confirmations. We omit its abstracts/translations and add the observed page title. Six records had title similarity below 0.78 after removing the arXiv ID, punctuation and case; `titleReview` means **check the version**, not “wrong paper.” Neither the seed count nor its overlap with the curated set is a count of architectures.
3. **URL-level audit / 逐链接审阅.** [Visits (CSV)](data/visits.csv) records the extracted target, HTTP result or exception, final target, observed title when available, origin file/page and disposition. [File inventory](data/seed-files.json) records source scope, local file checks and PDF text warnings. These are access observations, not peer review. A status of 200 alone is not evidence for a technical claim.

## Discovery beyond the seed / 种子以外的检索

We searched the public web and arXiv by `universal transformer`, `recurrent stacking`, `looped transformer`, `recurrent depth`, `recursive parameter sharing`, `adaptive halting`, `cross-loop KV` and named releases, then followed author-provided code and model-card links. For the frontier pass we also searched the week of November 23–26. GitHub project metadata and Hugging Face model search were checked separately from papers. We preferred the release organization or the author’s card rather than an unrelated quantization mirror.

检索覆盖论文索引、会议和期刊出版页、项目库、模型卡及发布方博客。代表性出版来源包括 [AAAI](https://ojs.aaai.org/index.php/AAAI/article/view/4590)、[ICLR](https://arxiv.org/abs/2409.15647)、[ICML/PMLR](https://proceedings.mlr.press/v267/xu25x.html)、[NeurIPS](https://proceedings.neurips.cc/paper_files/paper/2025/file/8b08bbf8b420faa6eeb4020720582ec7-Paper-Conference.pdf)、[EMNLP](https://aclanthology.org/2023.emnlp-main.12/) 及期刊 [TACL](https://aclanthology.org/2021.tacl-1.8/)。另见 [Findings of EMNLP: Block Recursive Transformers](https://aclanthology.org/2026.findings-emnlp.1868/) 与[独立综述及其筛选数据](https://arminazizi98.github.io/looped-lm-survey/)。综述的计数属于其作者，不并入本项目。

**Independent additions** include the TACL graph parser, the AAAI translation comparator, [LoopCache](https://arxiv.org/abs/2611.24301v1), [LoopRes v2](https://arxiv.org/abs/2611.31094v2) and [MoLT v1](https://arxiv.org/abs/2611.34923v1). The [MoLT code](https://github.com/hustvl/MoLT) is linked by its paper; the [Huginn paper](https://arxiv.org/abs/2502.05171v2) separately identifies its [training code](https://github.com/seal-rg/recurrent-pretraining) and [checkpoint](https://huggingface.co/tomg-group-umd/huginn-0125). No release, checkpoint or benchmark was run as part of this survey.

## Reading the frontier chapters / 如何解读前沿专题

The [research directions](https://hyfine.github.io/loop-transformer-atlas/#directions) chapter also cites [Looped CED](https://arxiv.org/abs/2611.13378v1) as supplementary primary reading, **not** a new map record. Proposed comparison experiments are editorial suggestions, not published results. The [model deep dives](https://hyfine.github.io/loop-transformer-atlas/#frontier) distinguish Z.ai's 30B training ablation, SenseNova's matched training/inference configurations and NVIDIA's same-checkpoint inference sweep. 技术方向中的「下一步怎样验证」是建议实验，不是复现结论；三个模型的数值因对照条件不同，不组成排行榜。

## What was traversed / 遍历范围

The input consisted of the supplied overview, four overview figures, three local papers and 138 files in the companion repository, excluding version-control internals and OS metadata: **146 files**. We examined the overview, the local papers, model directory, bilingual survey and five core paper/report pairs. The extractor scanned text sources (including generated HTML, CSV, JSON, translation caches, SVG and TeX), PDF page text and URI annotations, and slides’ PPTX text and external relationships. The four overview images were inspected for labels; the diagrams on this site are original. File references are checked relative to their rendered base; an `exists` result checks the file, not an HTML fragment. We do not recursively crawl a remote site’s navigation, treat Git history as another document, or run third-party repository code.

| Disposition | Count | Interpretation / 解读 |
|---|---:|---|
| `responded` | 712 | HTTP 200 without a recognized challenge. May be a binary, JS shell or soft error. 不是 712 项独立研究。 |
| `challenge` | 63 | Redirect/title indicated a verification page, including OpenReview. 不绕过验证码，不把验证页当论文。 |
| `unconfirmed` | 36 | Non-200, timeout or TLS error; includes malformed/truncated literals and empty query templates. 失败仍保留，不猜造成功结果。 |
| `not-requested` | 5 | Localhost, a loopback address or incomplete host strings; recorded, not sent. |
| **Distinct literal external targets** | **816** | **811** requests attempted; duplicate occurrences retain origin pointers. |
| **Local references checked** | **171** | All resolved to files/directories or the referring file for fragment-only references. |

All external URLs in the **333 structured seed records** occur in the visit ledger. Some translated PDF font maps produced extraction warnings: the original paper sources, PDF link annotations and translation text caches supplement those files. This is an audit of extractable links, **not** a guarantee that arbitrary pixels or damaged glyphs contain none. A URL split across lines in a PDF can result in an unusable literal. We preserve evidence of failure instead of silently inventing a replacement.

### The nine distinct overview destinations / 起点文档的九个外链

| Source | How it was used / 如何使用 |
|---|---|
| [GLM-5.4 release](https://z.ai/blog/glm-5.4) | Publisher’s rendered article: 28 shared layers, two visits, gated progressive updates, sparse index reuse and a hybrid KV design. 30B 等参数消融不冒充旗舰规模等算力复现。 |
| [SenseNova repository](https://github.com/OpenSenseNova/SenseNova-Loop) · [final model](https://huggingface.co/sensenova/SenseNova-Loop-9B) | Release log distinguishes Oct 31 preview from Nov 17 final; verify middle indices against the checkpoint config. |
| [Dory paper](https://arxiv.org/abs/2611.03998) · [BF16 card](https://huggingface.co/nvidia/NVIDIA-Nemotron-Labs-Dory1.0-4B-BF16) | Elastic depth and last-loop-only historical KV. 模型卡用于确认权重类型，不替代论文消融。 |
| [LoopWM report](https://arxiv.org/abs/2606.18208) · [FaceMind](https://faceminda.com/) | Use the report (§3) for the architecture; the lab homepage provides context, not independent verification. |
| [Training-Free Looped Transformers](https://arxiv.org/abs/2605.23872) | Compare naïve reuse to damped residual substeps, with the evaluated checkpoint and metric attached. |
| [TiGa-RCE community article](https://huggingface.co/blog/TiGa-RCE/training-looped-transformers) | Small symbolic training/retention experiments. Distinguishes a recurrent forward pass from an outer training/review loop. 社区实验不升级为顶会论文或大规模训练证据。 |

**Limitations.** For the curated links, OpenReview served a challenge on the UT forum and the AAAI publisher endpoint timed out on a direct probe; the author preprints remain available, and the AAAI record was also located via publisher search. Model cards and blogs can change. Manufacturer benchmarks remain manufacturer-reported. A news report about an undisclosed architecture is not sufficient to add it as a verified family member.

## Attribution and visual rights / 署名与图片

Bibliographic fields in the discovery index are adapted from **awesome_loop_transformer contributors**, [original collection](https://github.com/asimfish/awesome_loop_transformer) ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)). Changes: select metadata, separate discovery from close reading, add observed titles and checks. The atlas text, mark, circuit illustration and interactive plates were written/drawn for this project; plates cite the representative source at the point of use. No third-party PDF, translated paper, slide, screenshot, model weight or publisher figure is redistributed. [RSI Atlas](https://github.com/hyfine/rsi-atlas) and [Embodied World Models Atlas](https://hyfine.github.io/embodied-world-models-atlas/index.html) inspired the navigation, not the technical evidence.
