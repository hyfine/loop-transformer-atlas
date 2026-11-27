<p align="center"><a href="README.md">English</a> · <b>简体中文</b></p>

<p align="center"><a href="https://hyfine.github.io/loop-transformer-atlas/?lang=zh"><img width="64" src="assets/mark.svg" alt="循环 Transformer 图谱标志"></a></p>

# Loop Transformer Atlas · 循环 Transformer 技术图谱

**只存一组权重，却能多算几轮。下一轮究竟买到了什么？**

[**从图解综述开始 →**](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#survey/digest) · [中文 Markdown 原件](survey/Loop_Transformer_Survey_zh_illustrated.md) · [下载工作簿](survey/Loop_Transformer_Landscape.xlsx) · [原件归档说明](survey/README.md)

[![前段编码输入，动态反馈边将变化的状态送回同一个共享核，最后由尾段读出。](assets/circuit.svg)](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#lab/B)

循环 Transformer **沿深度**复用同一变换：权重可以不变，激活状态却在每轮变化。它不是智能体反复调用大模型，也不是生成更长的文字思维链。[SenseNova-Loop-9B 配置](https://huggingface.co/sensenova/SenseNova-Loop-9B/blob/main/config.json)很适合作为起点：**32 个独立层，执行 56 层次**。多出的 24 次执行来自重访中间块，而不是多保存了 24 层参数。

## 图解主线：从一次层重访，读到一次工程决策

11 月 26 日的图解版以 **四层技术栈、十三个技术族**组织 **376 篇论文**，另列 17 项模型／工业发布和 7 篇博客／报道。网页版按原文顺序推进；每章可切换中英导读、展开对应中文原文和表格，查看高清图以及随附的可编辑 SVG。

| 按原文顺序读 | 读完应能回答 |
|---|---|
| [§0 一页结论](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#survey/digest) → [§1 概念与设计空间](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#survey/design) | 到底重复了什么？为什么 `ABAB` 与 `AABB` 同样只存两组权重，却不是同一计算？ |
| [§2 六阶段历史](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#survey/history) → [§3 家族树与谱系](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#survey/lineage) → [§4 泳道](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#survey/lanes) | 何时从研究表达力转向训练、服务？图中哪些联系比“先后发表”更强？ |
| [§5 四层分类](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#survey/taxonomy) → [§6 十三族深读](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#survey/families) | 一项工作的核心对照是模型、训练、推理还是理解与应用？每族配有十篇选读。 |
| [§7 模型与工业实践](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#survey/industry) → [§8 趋势](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#survey/trends) → [§9 开放问题](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#survey/questions) | 收益究竟来自同检查点加深、等训练步时，还是等 FLOPs／KV 的结构比较？ |
| [§10 工程选型](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#survey/decisions) → [§11 来源](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#survey/sources) → [术语表](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#survey/glossary) | 哪些权重可以改？瓶颈在哪？做什么对照能推翻预期的收益？ |

**按时间选读：** 5 分钟读 §0、§3、§8；30 分钟读 §1、§2、§4、§5、§7；两小时沿主线阅读全文，对照[每族十篇的 130 篇精选](survey/reading-list.csv)与[43 篇近期增量](survey/latest-papers.csv)。两份清单有重叠；仓库链接到出版方，不托管论文全文。

## 配套交互工具

| 想弄清什么 | 从这里开始 |
|---|---|
| 十分钟建立直觉 | [算例、技术史与四组受控实验](docs/guide.zh.md) |
| 掌握全局 | [研究地图](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#map)：家族树、泳道和时间轨迹可切换，保留当前作品。「分类速查」解释每类看什么对照、为什么归到这里。 |
| 看十一月在解决什么问题 | [前沿技术方向](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#directions)：跨轮传什么、如何改造检查点、怎样少存或少搬 KV、怎样分配轮数。每个方向都列出已有证据和下一步验证方法。 |
| 对照 §7.3 的模型架构图 | [GLM-5.4](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#frontier/glm) · [SenseNova-Loop-9B](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#frontier/sense) · [Dory1.0-4B](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#frontier/dory) · [Ouro](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#frontier/ouro) · [MoLT](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#frontier/molt)。可放大每张图，沿反馈路径看权重如何复用，再核对实验条件。SenseNova 另附轮数扩展实验图。 |
| 跟踪一次代表性计算流程 | [A · 共享层能做什么](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#lab/A) · [B · 训练循环模型](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#lab/B) · [C · 决定循环几轮](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#lab/C) · [D · 给已有模型加循环](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#lab/D) · [E · 降低循环推理开销](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#lab/E) · [F · 细化图、动作或世界状态](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#lab/F) |
| 寻找论文、实现与权重 | [检索文献库](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#library) · [一手资料手册](docs/routes.zh.md) · [逐链接访问记录](data/visits.csv) |

## 前沿手记 · 截至 2026 年 11 月 26 日

| 公开日期 | 进展 | 为什么值得看 |
|---|---|---|
| 11 月 25 日 | [Mixture-of-Loops Transformer](https://arxiv.org/abs/2611.34923v1) · [代码](https://github.com/hustvl/MoLT) | 跨轮可以传递更早位置的 KV 记忆，而非同位置的残差。这会改变哪些计算可以并行。 |
| 11 月 23 日 | [GLM-5.4](https://z.ai/blog/glm-5.4) · [LoopRes](https://arxiv.org/abs/2611.31094v2) | 两种存量改造：前者继续训练一个执行两遍的 28 层门控块，后者学习选择和读取前几轮的残差。证据分别来自厂商披露和预印本。 |
| 11 月 17–18 日 | [SenseNova-Loop-9B](https://github.com/OpenSenseNova/SenseNova-Loop) · [LoopCache](https://arxiv.org/abs/2611.24301v1) | 前者开放双流、中段共享的解码器；后者调度推测验证以减少长上下文 KV 访存。两者节省的不是同一种资源。 |
| 11 月 2–3 日 | [Dory1.0-4B 论文](https://arxiv.org/abs/2611.03998v1)／[权重](https://huggingface.co/nvidia/NVIDIA-Nemotron-Labs-Dory1.0-4B-BF16) · [ARLoop](https://arxiv.org/abs/2611.05234) | Dory 在可变深度下只保存最后一遍的历史 KV；ARLoop 在预训练时学习该读取哪些历史深度状态。 |

**值得记住的一组对照：** [Huginn](https://arxiv.org/html/2502.05171v2) 对*同一个检查点*增加推理深度，从 4 轮到 32 轮，ARC-Easy 从 49.07 升至 69.91。[LoopCoder-v2](https://arxiv.org/html/2606.18023v1) 的一至三轮是*分别训练的配置*，SWE-bench Verified 为 43.0 → 64.4 → 27.6。两项研究改变的实验变量不同，不能据此推出通用最优轮数。

## 收录边界与复用

综述的主索引是 **376 篇、F01–F13 十三族**。交互地图的 **32 条案例、A–F 六个阅读视角**用于对照机制；333 条种子索引用于检索，它们与主库重叠，不能相加。[归档差异与图源](survey/README.md) · [检索与失效链接](EVIDENCE.md) · [贡献与本地运行](CONTRIBUTING.md) · [引用](CITATION.cff) · [许可](LICENSE)。
