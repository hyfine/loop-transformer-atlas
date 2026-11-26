# 循环深度的六条技术路线

[English](routes.en.md) · [技术导读](guide.zh.md)

所有动态流程图均为原创示意，每条路径只追踪一部代表作；其他案例用来说明类比在何处失效。日期取所列预印本或公开发布事件。

<a id="route-a"></a>

## A · 共享与算法

同一条更新规则能否代替多个不同层？

**代表路径: Universal Transformer.** [播放流程图](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#lab/A)

1. **编码位置** — 同时表示序列各位置。深度是迭代编号，并非新增 token。
2. **全局注意** — 每个位置读取可见位置的当前状态，位置与步数信号区分“在哪”和“第几轮”。
3. **共享变换** — 用与上一轮相同的变换参数更新所有活跃状态。
4. **读出结果** — 用尽指定预算后读出表征；ACT 变体还允许各位置在不同深度完成。

**反馈边:** 更新后的状态 → 再次注意.

UT 学习迭代规则，可编程计算机的存在性证明则把规则写入权重。两者的区别是能否学会，而非能否表示。

### Universal Transformer

2018-07 · ICLR 2019 · [arxiv.org](https://arxiv.org/abs/1807.03819) · [openreview.net](https://openreview.net/forum?id=HyzdRiR9Y7) · [github.com](https://github.com/tensorflow/tensor2tensor)

各位置先通过注意力读取全序列，再对更新后的状态重复同一个变换。深度信号区分轮次；可选 ACT 允许不同位置分别停止。

**证据边界:** 一轮内各位置可并行，不代表前后依赖的轮次也可并行。

### Recurrent stacking

2018-07 · AAAI 2019 · [arxiv.org](https://arxiv.org/abs/1807.05353) · [ojs.aaai.org](https://ojs.aaai.org/index.php/AAAI/article/view/4590)

机器翻译实验用一层执行六次代替六个独立层，检验的是缩小权重存储后翻译质量能保留多少。

**证据边界:** 训练和推理均使用固定轮数，不等于测试时可任意加深。

### ALBERT

2019-09 · ICLR 2020 · [arxiv.org](https://arxiv.org/abs/1909.11942)

跨层共享减少编码器参数；词嵌入分解节省的是另一部分参数。

**证据边界:** 这是压缩基线，并未证明给训练好的编码器增加轮数会提升性能。

### Programmable computers

2023-01 · ICML 2023 · [arxiv.org](https://arxiv.org/abs/2301.13196) · [proceedings.mlr.press](https://proceedings.mlr.press/v202/giannou23a.html)

构造权重实现指令解释器，输入编码内存与指令；同一小型机器可通过运行更多步执行更长的程序。

**证据边界:** 存在性构造并不证明梯度下降能从自然文本中学出这样的解释器。

### Learning algorithms in context

2023-11 · ICLR 2024 · [arxiv.org](https://arxiv.org/abs/2311.12424)

在上下文数据拟合任务上，作者用不到十分之一的参数获得了与非共享模型相近的表现；迭代估计与重复更新相契合。

**证据边界:** 受控回归任务的参数量不能换算成总算力或开放域语言能力。

### Length generalization

2024-09 · ICLR 2025 · [arxiv.org](https://arxiv.org/abs/2409.15647)

在具有已知迭代解的任务上学习可重复步骤。对更长输入多执行几轮，而不必学习更多层。

**证据边界:** 输入长度外推、推理深度外推和通用推理能力是三个不同命题。

### Timestep encoding

2024-10 · ICML 2025 · [arxiv.org](https://arxiv.org/abs/2410.01405) · [proceedings.mlr.press](https://proceedings.mlr.press/v267/xu25x.html)

逼近分析引出依赖轮次的缩放：告知当前步数后，同一组权重也能呈现不同作用。

**证据边界:** 逼近速率刻画函数表示能力，并不保证训练好的检查点一定有效。

---

<a id="route-b"></a>

## B · 循环核预训练

怎样训练一个能重复利用深度的语言模型？

**代表路径: Huginn-0125.** [播放流程图](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#lab/B)

1. **前段编码** — 前段只编码一次，所得条件信号供循环核多次使用。
2. **注入输入** — 将条件信号与当前循环状态结合，而非用上次估计覆盖提示词。
3. **共享核心** — 同一个块生成下一状态；训练中采样展开长度，使循环核经历多种预算。
4. **尾段与读出** — 达到选定深度后，独立尾段将状态映为下一 token 的 logits，中途无需输出词。

**反馈边:** 状态与原始条件 → 下一轮.

Huginn 重复整块（ABAB），Loopie 连续重复每层（AABB）。非线性层的执行顺序不同，即使深度相同也不是同一函数。

### Sparse UT

2023-10 · EMNLP 2023 · [arxiv.org](https://arxiv.org/abs/2310.07096) · [aclanthology.org](https://aclanthology.org/2023.emnlp-main.12/)

稀疏专家为共享变换提供更大存储容量，而每轮不必激活全部专家。

**证据边界:** 选择专家与选择执行轮数是两种不同的路由。

### MoEUT

2024-05 · NeurIPS 2024 · [arxiv.org](https://arxiv.org/abs/2405.16039) · [proceedings.nips.cc](https://proceedings.nips.cc/paper_files/paper/2024/file/321387ba926b8e58d3591c0aeb52ffc2-Paper-Conference.pdf)

成组重复专家层，配合专门的注意力和归一化。专家池增大不必让每个 token 的计算路径同比增长。

**证据边界:** 成组共享、稀疏路由和归一化同时改变，不能把效果全归因于共享。

### Huginn-0125

2025-02 · arXiv · [arxiv.org](https://arxiv.org/abs/2502.05171v2) · [github.com](https://github.com/seal-rg/recurrent-pretraining) · [huggingface.co](https://huggingface.co/tomg-group-umd/huginn-0125)

前段编码提示词，循环核在更新状态时反复读取该条件信号。训练时采样深度，使同一个 3.5B 检查点可在推理时选择不同预算。

**证据边界:** 表 1 固定检查点；表 4 另有仅训练 0.18T token 的基线，不能与 0.8T 的结果当作等数据比较。

### Loopie

2026-07 · arXiv · [arxiv.org](https://arxiv.org/abs/2607.16051v3) · [huggingface.co](https://huggingface.co/zitian-gao/Loopie-20B-A2B-preview)

每个 MoE 层连续执行两次再向下传递。把节省的内存用于更大的微批与更宽的模型，同时实测匹配优化器单步耗时。

**证据边界:** 选中配置的理论块计算量代理为 1.42 倍（表 1）。等训练耗时不是等 FLOPs，也不是等服务延迟。

### SMELT

2026-09 · arXiv · [arxiv.org](https://arxiv.org/abs/2609.01343v3)

重复中间一半层两次；重配 MoE 对照组，尽量匹配每 token FLOPs、非嵌入参数及 KV，再分别拟合损失与训练算力的关系。

**证据边界:** 6.8%–18.0% 的训练 FLOPs 节省来自拟合的计算最优前沿，不是实测推理加速。

### SenseNova-Loop Preview

2026-10-31 · Release · [github.com](https://github.com/OpenSenseNova/SenseNova-Loop) · [huggingface.co](https://huggingface.co/sensenova/SenseNova-Loop-9B-Preview)

预览版先于十一月正式版公开了权重与循环式多模态解码器。

**证据边界:** 预览与正式版是同一系列的两个事件，不能混用评测值。

### ARLoop

2026-11-03 · arXiv · [arxiv.org](https://arxiv.org/abs/2611.05234) · [huggingface.co](https://huggingface.co/osunlp/ARLoop-1.2B)

每层在深度方向上读取近期残差状态。局部窗口有时优于完整历史；1.2B 模型在 0.5T token 上按三轮预训练。

**证据边界:** 深度注意力与序列位置注意力不同；跨检查点比较同时改变了多个变量。

### SenseNova-Loop-9B

2026-11-17 · Release · [github.com](https://github.com/OpenSenseNova/SenseNova-Loop) · [huggingface.co](https://huggingface.co/sensenova/SenseNova-Loop-9B) · [huggingface.co · config](https://huggingface.co/sensenova/SenseNova-Loop-9B/blob/main/config.json)

32 个独立层中的 24 个中间层执行两遍。两条残差流通过流形约束超连接交换信息，合计执行 56 层次。

**证据边界:** 公开配置 4 + 24×2 + 4 解释有效深度，不能由此推断一个非共享 56 层模型的速度或参数量。

---

<a id="route-c"></a>

## C · 自适应深度

由谁判断下一轮计算是否值得？

**代表路径: Mixture-of-Recursions.** [播放流程图](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#lab/C)

1. **活跃位置** — 从活跃 token 状态开始，把深度作为按位置分配的资源。
2. **选择位置** — 轻量路由器为各位置的下一轮打分，再按策略筛选保留位置。
3. **子集迭代** — 只对选中 token 执行共享层栈；可读取哪些历史由缓存策略决定。
4. **汇合出口** — 保留已完成位置的出口状态，再汇合计算预测；同一批内深度可以不同。

**反馈边:** 仍活跃的 token → 再次路由.

ACT 学停机概率，MoR 筛选 token，LoopFormer 接收外部预算。比较时要报告平均及尾部深度，并实测批处理延迟。

### Adaptive Computation Time

2016-03 · arXiv · RNN · [arxiv.org](https://arxiv.org/abs/1603.08983)

停机单元累加概率，让一次输入更新可以占用多个内部计算步。

**证据边界:** 这是循环神经网络的前身工作，并非 Transformer 模型。

### Mixture-of-Recursions

2025-07 · NeurIPS 2025 · [arxiv.org](https://arxiv.org/abs/2507.10524) · [proceedings.neurips.cc](https://proceedings.neurips.cc/paper_files/paper/2025/file/8b08bbf8b420faa6eeb4020720582ec7-Paper-Conference.pdf) · [github.com](https://github.com/raymin0223/mixture_of_recursions)

路由器选择哪些 token 再次经过共享栈。只为活跃 token 计算注意力和保留相应缓存，同时改变路径与成本。

**证据边界:** 表 3 的少样本平均准确率 43.1 对 42.3 对应 16.5×10¹⁸ 训练 FLOPs。仅凭 token 稀疏度不能断言设备提速。

### Ouro

2025-10 · arXiv · [arxiv.org](https://arxiv.org/abs/2510.25741) · [huggingface.co](https://huggingface.co/ByteDance/Ouro-2.6B)

以熵正则化的深度分配目标训练循环语言模型，数据量达 7.7T token，使中间出口也具有预测价值。

**证据边界:** 更善于处理给定知识，不意味着能记住与更大模型同样多的独立事实。

### LoopFormer

2026-02 · ICLR 2026 · [arxiv.org](https://arxiv.org/abs/2602.11451)

用时间和步长调节共享变换，并通过捷径一致性损失对齐长短两条轨迹。

**证据边界:** 调用者指定预算不等于模型为每个 token 自主决定停止。

---

<a id="route-d"></a>

## D · 存量模型改造

已有模型的权重能承受第二次访问吗？

**代表路径: Training-free loops.** [播放流程图](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#lab/D)

1. **冻结前段** — 按原模型执行至选定中间窗口，不修改已训练权重。
2. **计算残差** — 计算冻结块的输出，再减去输入，分离出残差位移。
3. **缩短子步** — 仅沿该位移走一小步后重新计算。这里演示阻尼欧拉，不代表论文中的所有求解器。
4. **原始后段** — 将细化状态交还原后段，检查其分布是否仍符合后段预期。

**反馈边:** 新状态 → 重算残差位移.

免训练阻尼以较小步长近似原残差变换；GLM-5.4 等继续训练路线则让模型学会使用新路径。

### Relaxed recursion

2024-10 · ICLR 2025 · [arxiv.org](https://arxiv.org/abs/2410.20672)

用非共享检查点初始化共享层，再用每个深度的小型 LoRA 修正恢复被硬共享抹去的差异。

**证据边界:** 适配器有独立参数，因此每个深度执行的完整函数不再完全相同。

### Retrofitted recurrence

2025-11 · arXiv · [arxiv.org](https://arxiv.org/abs/2511.07384) · [github.com](https://github.com/mcleish7/retrofitting-recurrence) · [huggingface.co](https://huggingface.co/collections/tomg-group-umd/retrofitting-recurrence)

从预训练权重出发，在适配过程中逐渐增加循环深度，而非一步把模型置于完整的新深度。

**证据边界:** 论文的预算比较针对数学任务，而且需要额外训练。

### Training-free loops

2026-05 · arXiv · [arxiv.org](https://arxiv.org/abs/2605.23872)

把冻结的中间块视为残差更新；用多次阻尼子步替代机械地多次走完整原步长。

**证据边界:** 表 3 中 Qwen3-4B-Instruct 的 MMLU-Pro 提升 2.64 个百分点。免训练不等于推理零成本。

### GLM-5.4

2026-11-23 · Publisher report · [z.ai](https://z.ai/blog/glm-5.4)

据智谱发布说明，在 GLM-5 上继续训练，把 28 层执行两次，搭配逐轮更新门控、稀疏索引复用，以及全局共享 KV 与本轮局部窗口。

**证据边界:** 等参数消融在 30B 模型上进行，总训练计算约多 10%；它不是旗舰模型的独立等 FLOPs 实验。

### LoopRes

2026-11-23 · arXiv · [arxiv.org](https://arxiv.org/abs/2611.31094v2)

适配时每层读取前几轮的输出，用可训练轮次键区分相近状态，并用有限窗口避免绕过中间计算。

**证据边界:** 该方法需要训练。它与 SFT 在增加算力条件下的比较不是免训练增益。

---

<a id="route-e"></a>

## E · 调度与缓存

轮次之间要传递什么，什么时候可用？

**代表路径: LoopCoder-v2.** [播放流程图](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#lab/E)

1. **token 序列** — 考虑相邻因果位置。常规串行循环必须等待同一位置的中间状态。
2. **第一遍** — 共享块首轮构建上下文特征与注意力历史。
3. **错位传递** — 从较早位置跨轮传递信息，共享 KV 与门控窗口注意力为新一轮提供上下文。
4. **流水解码** — 重叠执行不同位置的工作；代价是收到的信息不来自正被细化的同一个位置。

**反馈边:** 较早序列位置 → 后续轮次.

LoopCoder 改依赖，Dory 改持久缓存内容，LoopCache 改推测调度及访存；三者都应分别测量字节数、延迟和质量。

### Parallel Loop Transformer

2025-10 · arXiv · [arxiv.org](https://arxiv.org/abs/2510.24824)

沿序列位置错开跨轮信息传递。后续轮次可读取已经就绪的位置，而不必等待同一位置完成。

**证据边界:** 缩短串行依赖会改变可读的状态，并非完全相同计算的免费并行化。

### LoopCoder-v2

2026-06 · arXiv · [arxiv.org](https://arxiv.org/abs/2606.18023) · [huggingface.co](https://huggingface.co/Multilingual-Multimodal-NLP/LoopCoder-V2)

跨轮位置偏移与共享 KV 的门控局部注意力把同位置依赖换成流水执行。7B 代码模型各配置在 18T token 上从头训练。

**证据边界:** SWE-bench Verified 在 R=1、2、3 时为 43.0 → 64.4 → 27.6（表 2）。这是分别训练的配置，而非给同一检查点调节轮数。

### Dory1.0-4B

2026-11-02 · Technical report · [arxiv.org](https://arxiv.org/abs/2611.03998v1) · [huggingface.co](https://huggingface.co/nvidia/NVIDIA-Nemotron-Labs-Dory1.0-4B-BF16)

弹性 nGPT 核可按请求多算几轮；历史 token 仅保留最后一轮 KV，使持久缓存规模不再随访问次数增长。

**证据边界:** 作者报告智能体评测上四轮相较一轮少生成 1.3–2.5 倍 token；输出变短不等于端到端延迟更低。

### LoopCache

2026-11-18 · arXiv · [arxiv.org](https://arxiv.org/abs/2611.24301v1)

随中间预测的变化更新草稿，并轮换读取不同轮次的历史 KV；优化目标是长上下文验证时的访存流量。

**证据边界:** 文中加速比针对 WFD 和 LoopSpec，不是对任意非循环解码器；单步访存量也不是总缓存容量。

### Mixture-of-Loops

2026-11-25 · arXiv · [arxiv.org](https://arxiv.org/abs/2611.34923v1) · [github.com](https://github.com/hustvl/MoLT)

MoLT-R 传递残差状态；MoLT-KV 从嵌入重新开始，并读取前一轮更早位置的 KV。消除同位置依赖改变了解码调度方式。

**证据边界:** 接近等延迟的例子测于约 113M 的 S 配置，并非数十亿参数模型的实测延迟。

---

<a id="route-f"></a>

## F · 结构化状态

如果被细化的是图、动作或世界状态呢？

**代表路径: Looped World Models.** [播放流程图](https://hyfine.github.io/loop-transformer-atlas/?lang=zh#lab/F)

1. **观测与动作** — 用上一潜态、可用观测嵌入及候选动作定义一次状态转移的条件。
2. **形成条件** — 前段对当前模拟时间步的条件进行编码；内循环保持该时间索引不变。
3. **细化潜态** — 重复动力学核，把状态保持、输入注入与非线性残差结合；复杂转移可能需要更多计算。
4. **推进时间** — 返回一个预测的环境潜态。外层 rollout 此时才接收下一动作，观测解码可以延后。

**反馈边:** 同一动作、同一时间 → 再次细化.

潜态收敛仍可能预测错世界。除了内循环更新是否变小，还要检验多步展开误差与下游决策。

### Graph-to-graph parsing

2020-03 · TACL 2021 · [arxiv.org](https://arxiv.org/abs/2003.13118) · [aclanthology.org](https://aclanthology.org/2021.tacl-1.8/)

根据上一棵依存树预测边，解码成新图，再交给同一预测器。反馈信号是可检查的结构。

**证据边界:** 属于相邻的输出迭代路线；并非把所有推理都留在连续隐藏状态中。

### Recurrent-depth VLA

2026-02 · arXiv · [arxiv.org](https://arxiv.org/abs/2602.07845) · [rd-vla.github.io](https://rd-vla.github.io/)

共享动作头反复更新潜在动作表示；推理时可按收敛准则提前停止，再输出连续动作。

**证据边界:** 增加迭代是在细化一次动作预测，并非让机器人多执行几个控制步。

### Looped World Models

2026-06 · Technical report · [arxiv.org](https://arxiv.org/abs/2606.18208v1) · [faceminda.com](https://faceminda.com/)

共享动力学核以观测编码、上一状态及动作为条件。内循环细化一次转移，只有外层 rollout 才推进模拟时间。

**证据边界:** 控制状态保持分量的谱性质，不等于在新环境中长程预测必然准确（第 3 节）。
