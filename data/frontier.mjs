const pair = s => s.split('|');

export const directions = [
  {
    title:pair('What should a pass inherit?|下一轮究竟应该继承什么？'),
    changed:pair('Compare three answers. ARLoop lets a layer read recent states along depth. LoopRes gives earlier visits distinct learned keys and restricts their residual window. MoLT-KV goes further: it restarts from embeddings and reads earlier-position keys and values from the preceding loop. Only the last change removes the same-position dependency.|三个答案并不等价：ARLoop 沿深度读取近期状态；LoopRes 给不同轮次的状态加上可学习的键，并限制残差窗口；MoLT-KV 则从嵌入重新开始，读取前一轮更早位置的键和值。只有最后一种改变消除了同位置跨轮依赖。'),
    observed:pair('MoLT reports 996.6 vs 1,000.6 ms for U-MoLT with MoL-Hybrid-2 and non-looped OLMo3 on the ~113M configuration. That timing does not establish equal latency at 3B.|MoLT 在约 113M 配置上报告：U-MoLT 搭配 MoL-Hybrid-2 为 996.6 ms，非循环 OLMo3 为 1,000.6 ms。不能据此断言 3B 规模也能等延迟。'),
    test:pair('Hold model size, history length and hardware fixed. Compare state transfer, quality and critical-path latency as separate measurements.|固定模型规模、历史长度和硬件，分别比较跨轮传递的状态、预测质量和关键路径延迟。'),
    refs:['arloop','loopres','molt']
  },{
    title:pair('Can a trained checkpoint learn a second visit?|怎样让已有模型用好第二遍？'),
    changed:pair('A layer trained to act once need not accept its own output a second time. Training-free loops shrink the update without changing weights; LoopRes fine-tunes cross-loop reads; GLM-5.4 continues training with per-pass gates that regulate how much is written back.|只学过执行一次的层，第二次接收自己的输出时可能失稳。免训练循环缩小更新步长，不动权重；LoopRes 微调跨轮读取；GLM-5.4 则继续训练逐轮门控，控制每遍写回多少。'),
    observed:pair('LoopRes evaluated six pretrained LMs and highlights a Qwen3-1.7B result at its 2× compute setting. GLM reports an equal-parameter 30B ablation with about 10% more total training compute. Neither isolates a free gain from weight sharing.|LoopRes 测试六个预训练模型，其 Qwen3-1.7B 重点结果取 2 倍计算量的比较点。GLM 的 30B 等参数消融多用了约 10% 总训练算力。两者都不是“共享权重免费提高能力”的证据。'),
    test:pair('From the same base, spend the extra training compute on ordinary continued training as well as on conversion; then compare at matched output cost.|从同一基座出发，把额外算力分别给普通继续训练和循环改造，最后在匹配输出成本的条件下比较。'),
    refs:['frozen','loopres','glm']
  },{
    title:pair('Save cache capacity or memory traffic?|长上下文：少存 KV，还是少搬 KV？'),
    changed:pair('Dory can keep one historical cache per recurrent attention layer. LoopCache rotates the loop whose cache is read during speculative verification: fewer bytes moved per step is a different goal from fewer bytes stored. Looped CED puts recurrence where global keys and values are produced, in the encoder.|Dory 可让每个循环注意力层只存一份历史缓存。LoopCache 在推测验证时轮换读取不同轮次的缓存，减少每步搬运，而不等于减少总存储。Looped CED 则把循环放进生成全局键值的编码器。'),
    observed:pair('In the Nov 9 CED study, an eight-round serving experiment on four GB200s fits 38 requests of 128K tokens; the per-layer, per-round KV baseline fits none. This is a research modification tested on DeepSeek-V4.1-Flash, not a disclosure about the shipped model’s architecture.|11 月 9 日的 CED 研究在四块 GB200 上测试八轮推理：可容纳 38 个 128K 请求，逐层逐轮各存一份 KV 的基线容不下一个。这是对 DeepSeek-V4.1-Flash 的研究性改造，不是该产品原生使用循环的披露。'),
    test:pair('Report persistent KV bytes per token, bytes read per decode step and throughput at the same batch size; also report maximum feasible batch. These are four different quantities.|分别报告每 token 常驻 KV 字节数、每解码步读出的字节数、同批量吞吐及最大可用批量。四者不能互换。'),
    refs:['dory','loopcache'],extra:['Looped CED · arXiv','https://arxiv.org/abs/2611.13378v1']
  },{
    title:pair('Which inputs earn another pass?|哪类输入值得多算一轮？'),
    changed:pair('MoR spends depth on selected tokens; LoopFormer takes a caller-supplied budget; Dory serves one checkpoint at several request budgets. These operate at different levels: choosing four passes for a request is not learning a token-by-token exit policy.|MoR 为选中的 token 分配深度；LoopFormer 接受调用者指定的预算；Dory 让一个检查点服务多种请求预算。这是不同粒度的选择：给请求指定四轮，不等于为每个 token 学会了何时退出。'),
    observed:pair('On Dory’s model card, moving from two to four passes raises SWE-bench Verified from 59.5 to 61.8 but moves no-tools GPQA Diamond from 72.41 to 72.16. An average can hide tasks with no return on the extra work.|Dory 模型卡中，两轮增至四轮时 SWE-bench Verified 从 59.5 升到 61.8，无工具 GPQA Diamond 却从 72.41 变成 72.16。平均分可能掩盖多算却没有收益的任务。'),
    test:pair('Compare a learned policy against fixed-depth and random allocation at the same average compute. Measure tail latency on a real mixed batch, not just average active depth.|固定平均算力，对比学习到的策略、固定深度和随机分配。再在混合批次上实测尾延迟，而非只报告平均活跃深度。'),
    refs:['mor','loopformer','dory'],extra:['Dory · BF16 model card','https://huggingface.co/nvidia/NVIDIA-Nemotron-Labs-Dory1.0-4B-BF16']
  }
];

export const dossiers = [
  {
    id:'glm', role:pair('Flagship · publisher disclosure|旗舰模型 · 发布方技术披露'),
    question:pair('How can a pretrained 750B-scale model revisit its middle layers without destabilizing the layers that follow?|750B 规模的已有模型重访中间层，怎样不打乱后续层的输入？'),
    path:[pair('GLM-5 base|GLM-5 基座'),pair('28 layers · pass 1|28 层 · 第一遍'),pair('Same 28 · pass 2|同一组 28 层 · 第二遍'),pair('Remaining layers|后续层')],
    state:pair('The gate controls the size of the update, not whether the layer runs. Each pass proposes a new hidden state; a token-dependent gate blends it into the residual stream. In the publisher’s account the first pass generally writes conservatively, leaving the second to refine the result. Both passes still execute.|门控调的是写回幅度，并不决定是否执行这一层。每遍先提出候选隐状态，再按 token 的门值写回残差流。发布方观察到第一遍通常写得较保守，第二遍再细化；两遍都会运行。'),
    budget:pair('Continued training teaches an existing GLM-5 base the new path. At serving time pass two reuses the first pass’s sparse attention indices and global KV selection, but retains its own local sliding-window KV. The second pass therefore sees updated local detail without storing a second full-context history.|从 GLM-5 基座继续训练，让权重适应新路径。推理时第二遍复用第一遍的稀疏注意力索引及选中的全局 KV，同时保留自己的局部滑窗 KV。它既能读到更新后的局部细节，又不用再存整段上下文历史。'),
    result:pair('Z.ai’s iso-parameter comparison is on 30B, after 200K long-context SFT with thinking enabled. The looped arm used about 10% more total training compute. The team reports 10–14% shorter average outputs on most evaluated benchmarks, including GPQA-Diamond and MMLU-Pro.|智谱的等参数消融在 30B 上进行，经过 200K 长上下文 SFT 并开启思考模式；循环组多用了约 10% 总训练算力。发布方报告，在包含 GPQA-Diamond、MMLU-Pro 在内的多数评测上，平均输出缩短 10%–14%。'),
    limit:pair('This is not a compute-matched ablation on the 750B flagship. Fewer output tokens do not by themselves establish lower time to solution: each token now takes two visits through the middle block.|这不是 750B 旗舰上的等算力消融。输出 token 减少也不能单独证明完成任务更快，因为每个 token 都要两次通过中间块。'),
    locator:pair('Release article: “Architectural Modifications at 750B Scale” and “Controlled Iso-Parameter Ablations”.|发布文：“Architectural Modifications at 750B Scale” 与 “Controlled Iso-Parameter Ablations”。'),
    comparison:pair('Existing GLM-5 → continued training|已有 GLM-5 → 继续训练'), schedule:pair('28 middle layers × 2|28 个中间层 × 2'), control:pair('30B training ablation|30B 训练消融')
  },{
    id:'sense',role:pair('Open multimodal release · code and weights|开放多模态模型 · 代码与权重'),
    question:pair('How can 32 decoder layers execute 56 layer updates without storing 56 sets of weights?|如何只存 32 层解码器权重，却执行 56 层更新？'),
    path:[pair('Layers 0–3|第 0–3 层'),pair('4–27 · first visit|第 4–27 层 · 首遍'),pair('4–27 · revisit|第 4–27 层 · 再访'),pair('28–31 + readout|第 28–31 层与读出')],
    state:pair('Pass one’s output becomes pass two’s input. Inside the repeated block, two residual streams carry features; learned maps read, mix and write them around attention and feed-forward layers. The 20 Sinkhorn normalization iterations constrain the mixing matrix. They are not 20 model passes.|把第一遍输出作为第二遍输入。循环块内的两条残差流携带特征，可学习映射在注意力与前馈层周围读取、混合、写回。20 次 Sinkhorn 归一化约束的是混合矩阵，不是执行了 20 遍模型。'),
    budget:pair('The released configuration uses [4,28) twice: 4 + 2×24 + 4 = 56 executions. Groups of three linear-attention layers followed by one full-attention layer remain intact across the loop boundary. Images and text are inputs; the decoder still outputs text. That is why this case belongs with model design, not graph/action prediction.|发布配置把 [4,28) 执行两次：4 + 2×24 + 4 = 56。三层线性注意力加一层全注意力的分组在循环边界保持完整。输入可含图文，但解码目标仍是文字，因此此例归模型设计，而不是图或动作预测。'),
    result:pair('In the team’s loop-scaling study, training and inference depths are matched for each configuration. Moving from two to four passes gives +1.04 percentage points on LiveCodeBench V6 and +1.35 on AIDABench data visualization. The released checkpoint defaults to two passes.|团队的扩深研究对每个配置匹配训练与推理轮数。由两轮变四轮，LiveCodeBench V6 高 1.04 个百分点，AIDABench 数据可视化高 1.35 个百分点。正式发布的检查点默认两轮。'),
    limit:pair('Do not treat those rows as an inference-only depth sweep on the released weights. Quantized weights, KV precision and context length must also be specified before comparing deployment memory.|不能把这些行解读为对同一份发布权重只改推理深度。比较部署显存时还必须注明权重量化、KV 精度与上下文长度。'),
    locator:pair('Official README: “Looped Decoder”, “Two-Stream mHC”, “Loop Scaling”; checkpoint config: loop_settings.|官方 README 的 Looped Decoder、Two-Stream mHC、Loop Scaling，以及配置中的 loop_settings。'),
    comparison:pair('Released multimodal decoder|开放的多模态解码器'),schedule:pair('24 middle layers × 2|24 个中间层 × 2'),control:pair('Training & inference depth matched|各配置的训推深度相同')
  },{
    id:'dory',role:pair('Open elastic-depth model · paper and checkpoint|开放弹性深度模型 · 论文与检查点'),
    question:pair('Can one checkpoint offer several compute budgets without keeping a new history cache for every pass?|一份权重能否服务多种算力预算，而不为每遍计算再存一份历史缓存？'),
    path:[pair('Encode input x|编码输入 x'),pair('Normalize state + x|归一化状态与 x 之和'),pair('Shared block × R|共享块 × R'),pair('Read final state|读出最终状态')],
    state:pair('Let x be the input block’s output. Initialize s₀=x; each visit computes sᵣ=N(Fθ(N(sᵣ₋₁+x))), where N normalizes each token. Reinjecting x anchors every update to the original condition. The model card groups the stack as 8 input, 20 recurrent and 8 output blocks; the paper separately counts 72 attention-only or MLP-only sublayers.|令 x 为输入段输出，取 s₀=x，每轮按 sᵣ=N(Fθ(N(sᵣ₋₁+x))) 更新，N 表示逐 token 归一化。每遍重注入 x，保留原始条件。模型卡按 8 个输入块、20 个循环块、8 个输出块计数；论文把注意力和 MLP 子层分开计为 72 层，口径不同。'),
    budget:pair('Pretraining exposes the core to depths 1–4. Post-training includes supervised fine-tuning and verifiable rewards with a difficulty-aware curriculum. If last-loop KV is enabled, only the final visit’s KV for past tokens persists per recurrent attention layer. The activations and work for the current token do not disappear.|预训练让循环核经历 1–4 轮，后训练结合监督微调、可验证奖励和按难度分配轮数的课程。开启 last-loop KV 后，每个循环注意力层只常驻历史 token 最后一遍的 KV，当前 token 各遍的激活与计算并不会消失。'),
    result:pair('In NVIDIA’s checkpoint comparison, SWE-bench Verified scores 50.3 / 59.5 / 61.8 at 1 / 2 / 4 visits; no-tools GPQA Diamond scores 69.19 / 72.41 / 72.16. Changing the inference budget on the same weights helps one task more than the other.|NVIDIA 对同一检查点改变推理预算：1、2、4 遍下 SWE-bench Verified 为 50.3／59.5／61.8，无工具 GPQA Diamond 为 69.19／72.41／72.16。相同权重多算几遍，对不同任务的回报不同。'),
    limit:pair('A flat persistent KV footprint is not flat latency or total GPU memory. To choose a deployment depth, compare time to a correct answer at fixed hardware, batch, prompt length and output policy.|常驻 KV 不增长不等于延迟或总显存不增长。选择部署轮数，应固定硬件、批量、提示长度和输出策略，比较得到正确答案所需时间。'),
    locator:pair('Paper §§2–3 for the recurrence and training; BF16 model card, “Benchmarks”, for the same-checkpoint sweep.|递推式与训练见论文第 2–3 节；同检查点扫深度的数据见 BF16 模型卡 Benchmarks。'),
    comparison:pair('One 4B checkpoint|同一份 4B 权重'),schedule:pair('20-block core × chosen depth|20 个块 × 选定轮数'),control:pair('Inference-only depth sweep|只改推理轮数')
  }
];
