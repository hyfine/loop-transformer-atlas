const pair = s => s.split('|');
const senseAssets='https://github.com/OpenSenseNova/SenseNova-Loop/blob/e19d54117b23e83b6719f1d17bba381b8396b3a5/assets/';

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
    figures:[{
      number:'7-2',file:'glm54_architecture.png',diagram:'assets/glm54-loop.svg',
      title:pair('Two visits to the 28-layer middle block|重访中间的 28 层'),
      caption:pair('Follow the state across the top: layers 1–26 run once, 27–54 run twice, and 55–78 run once. The lower arrows carry attention history, not a second set of weights. On pass two, the query reads both the first pass’s sparse prefix and a new 128-token local window.|沿上排读状态：第 1–26 层走一次，第 27–54 层走两遍，第 55–78 层走一次。下方箭头传递的是注意力历史，不是另一套权重。第二遍的查询同时读取首遍选出的稀疏前缀和本遍新建的 128-token 局部窗口。'),
      credit:pair('Atlas schematic after Z.ai’s architecture disclosure|本站依据智谱技术披露独立绘制'),source:'https://z-ai-bj.oss-cn-beijing.aliyuncs.com/prompts-rich-media-resources/5.4-blog/image.png'
    }],
    question:pair('How can a pretrained 750B-scale model revisit its middle layers without destabilizing the layers that follow?|750B 规模的已有模型重访中间层，怎样不打乱后续层的输入？'),
    path:[pair('GLM-5 base|GLM-5 基座'),pair('28 layers · pass 1|28 层 · 第一遍'),pair('Same 28 · pass 2|同一组 28 层 · 第二遍'),pair('Remaining layers|后续层')],
    state:pair('The gate controls the size of the update, not whether the layer runs. Each pass proposes a new hidden state; a token-dependent gate blends it into the residual stream. In the publisher’s account the first pass generally writes conservatively, leaving the second to refine the result. Both passes still execute.|门控调的是写回幅度，并不决定是否执行这一层。每遍先提出候选隐状态，再按 token 的门值写回残差流。发布方观察到第一遍通常写得较保守，第二遍再细化；两遍都会运行。'),
    budget:pair('Continued training teaches an existing GLM-5 base the new path. At serving time pass two reuses the first pass’s sparse attention indices and global KV selection, but retains its own local sliding-window KV. The second pass therefore sees updated local detail without storing a second full-context history.|从 GLM-5 基座继续训练，让权重适应新路径。推理时第二遍复用第一遍的稀疏注意力索引及选中的全局 KV，同时保留自己的局部滑窗 KV。它既能读到更新后的局部细节，又不用再存整段上下文历史。'),
    result:pair('Z.ai’s iso-parameter comparison is on 30B, after 200K long-context SFT with thinking enabled. The looped arm used about 10% more total training compute. The team reports 10–14% shorter average outputs on most evaluated benchmarks, including GPQA-Diamond and MMLU-Pro.|智谱的等参数消融在 30B 上进行，经过 200K 长上下文 SFT 并开启思考模式；循环组多用了约 10% 总训练算力。发布方报告，在包含 GPQA-Diamond、MMLU-Pro 在内的多数评测上，平均输出缩短 10%–14%。'),
    limit:pair('Z.ai’s comparison to 2T–3T models is a capability claim, not the parameter count or a compute-matched flagship ablation. Shorter average outputs do not rule out long reasoning runs. Adaptive depth is a future direction, not what the two write gates implement.|智谱与 2T–3T 模型的对比是能力主张，不是参数量，也不是旗舰的等算力消融。输出平均变短，不代表不会出现过长的推理。自适应深度是后续方向，不能把两个写回门当作停机门。'),
    locator:pair('Release article: “Architectural Modifications at 750B Scale” and “Controlled Iso-Parameter Ablations”.|发布文：“Architectural Modifications at 750B Scale” 与 “Controlled Iso-Parameter Ablations”。'),
    comparison:pair('Existing GLM-5 → continued training|已有 GLM-5 → 继续训练'), schedule:pair('28 middle layers × 2|28 个中间层 × 2'), control:pair('30B training ablation|30B 训练消融')
  },{
    id:'sense',role:pair('Open multimodal release · code and weights|开放多模态模型 · 代码与权重'),
    figures:[{
      number:'7-3',file:'sensenova_loop_architecture.jpg',title:pair('Shared middle layers and two residual streams|中间层共享与双残差流'),
      caption:pair('Read the upper row as a layer schedule: prefix A, two visits to B, suffix C. The inset explains one visit to B: mHC reads from, mixes and writes back to two streams. Two streams describe the state inside a visit; two passes describe how often the block runs.|上半部是层的执行顺序：前段 A、中段 B 走两遍、后段 C。下半部放大 B 的一次访问：mHC 从两条残差流读取、混合并写回。“双流”说的是每遍传递什么，“双遍”说的是 B 执行几次。'),
      credit:pair('OpenSenseNova · official architecture figure|OpenSenseNova · 官方架构图'),source:senseAssets+'hero.png'
    },{
      number:'7-4',file:'sensenova_loop_scaling_zh.png',title:pair('Companion experiment: train and inference loops matched|配套实验：各配置的训练与推理轮数相同'),
      caption:pair('Each point describes a configuration trained and evaluated at the indicated depth. LiveCodeBench V6 peaks at four passes in this plot; Workbuddy-office peaks at three. This is evidence about training configurations, not an inference-only sweep on the released two-pass checkpoint.|每个点表示按该轮数训练、再按相同轮数评估的配置。图中 LiveCodeBench V6 的最高点在四轮，Workbuddy-office 则在三轮。它对照的是不同训练配置，不是对正式版双遍权重只改推理深度。'),
      credit:pair('OpenSenseNova · official loop-scaling experiment|OpenSenseNova · 官方循环扩展实验'),source:senseAssets+'loop_scaling_zh_latest.png'
    }],
    question:pair('How can 32 decoder layers execute 56 layer updates without storing 56 sets of weights?|如何只存 32 层解码器权重，却执行 56 层更新？'),
    path:[pair('Layers 0–3|第 0–3 层'),pair('4–27 · first visit|第 4–27 层 · 首遍'),pair('4–27 · revisit|第 4–27 层 · 再访'),pair('28–31 + readout|第 28–31 层与读出')],
    state:pair('Pass one’s output becomes pass two’s input. Inside the repeated block, two residual streams carry features; learned maps read, mix and write them around attention and feed-forward layers. The 20 Sinkhorn normalization iterations constrain the mixing matrix. They are not 20 model passes.|把第一遍输出作为第二遍输入。循环块内的两条残差流携带特征，可学习映射在注意力与前馈层周围读取、混合、写回。20 次 Sinkhorn 归一化约束的是混合矩阵，不是执行了 20 遍模型。'),
    budget:pair('The released configuration uses [4,28) twice: 4 + 2×24 + 4 = 56 executions. Groups of three linear-attention layers followed by one full-attention layer remain intact across the loop boundary. Images and text are inputs; the decoder still outputs text. That is why this case belongs with model design, not graph/action prediction.|发布配置把 [4,28) 执行两次：4 + 2×24 + 4 = 56。三层线性注意力加一层全注意力的分组在循环边界保持完整。输入可含图文，但解码目标仍是文字，因此此例归模型设计，而不是图或动作预测。'),
    result:pair('In the team’s loop-scaling study, training and inference depths are matched for each configuration. Moving from two to four passes gives +1.04 percentage points on LiveCodeBench V6 and +1.35 on AIDABench data visualization. The released checkpoint defaults to two passes.|团队的扩深研究对每个配置匹配训练与推理轮数。由两轮变四轮，LiveCodeBench V6 高 1.04 个百分点，AIDABench 数据可视化高 1.35 个百分点。正式发布的检查点默认两轮。'),
    limit:pair('The Oct 31 preview and Nov 17 release default to two passes. The reported ~14.6B inference-equivalent parameters describe computation, not stored weights. The 512K context limit is also a different claim from the ~15 GiB deployment estimate at 256K with 4-bit weights and 8-bit KV.|10 月 31 日预览版与 11 月 17 日正式版默认都是两遍。约 14.6B 是推理等效参数，不是实际存储的权重。512K 是上下文上限；约 15 GiB 的部署估算则限定在 256K 上下文、4-bit 权重和 8-bit KV。'),
    locator:pair('Official README: “Looped Decoder”, “Two-Stream mHC”, “Loop Scaling”; checkpoint config: loop_settings.|官方 README 的 Looped Decoder、Two-Stream mHC、Loop Scaling，以及配置中的 loop_settings。'),
    comparison:pair('Released multimodal decoder|开放的多模态解码器'),schedule:pair('24 middle layers × 2|24 个中间层 × 2'),control:pair('Training & inference depth matched|各配置的训推深度相同')
  },{
    id:'dory',role:pair('Open elastic-depth model · paper and checkpoint|开放弹性深度模型 · 论文与检查点'),
    figures:[{
      number:'7-5',file:'dory_architecture.jpg',title:pair('Looped nGPT: input injection and normalization|循环 nGPT：输入注入与归一化'),
      caption:pair('Start at (a): the upper arrow injects the same input u on every visit; the return arrow carries the newly computed state. Panel (b) expands the stack: three sliding-window attention/MLP pairs for each full-attention/MLP pair. Panels (c)–(e) show the attention, SwiGLU and residual blending inside one visit, not three extra loops.|先看 (a)：上方箭头每遍注入同一个输入 u，回边传递刚算出的状态。(b) 展开层栈：每三对滑窗注意力／MLP 配一对全注意力／MLP。(c)–(e) 分别放大单遍内部的注意力、SwiGLU 与残差混合，并不是再多算三轮。'),
      credit:pair('Fishman et al. · paper Fig. 2 · CC BY 4.0|Fishman 等 · 论文图 2 · CC BY 4.0'),source:'https://arxiv.org/abs/2611.03998v1'
    }],
    question:pair('Can one checkpoint offer several compute budgets without keeping a new history cache for every pass?|一份权重能否服务多种算力预算，而不为每遍计算再存一份历史缓存？'),
    path:[pair('Encode input x|编码输入 x'),pair('Normalize state + x|归一化状态与 x 之和'),pair('Shared block × R|共享块 × R'),pair('Read final state|读出最终状态')],
    state:pair('Let x be the input block’s output. Initialize s₀=x; each visit computes sᵣ=N(Fθ(N(sᵣ₋₁+x))), where N normalizes each token. Reinjecting x anchors every update to the original condition. The model card groups the stack as 8 input, 20 recurrent and 8 output blocks; the paper separately counts 72 attention-only or MLP-only sublayers.|令 x 为输入段输出，取 s₀=x，每轮按 sᵣ=N(Fθ(N(sᵣ₋₁+x))) 更新，N 表示逐 token 归一化。每遍重注入 x，保留原始条件。模型卡按 8 个输入块、20 个循环块、8 个输出块计数；论文把注意力和 MLP 子层分开计为 72 层，口径不同。'),
    budget:pair('Pretraining spans 6T tokens (the first 4.5T in NVFP4), exposes the core to depths 1–4 and extends context to 256K. Post-training combines SFT and verifiable rewards with a difficulty-aware curriculum. With last-loop KV, each recurrent attention layer keeps only the final visit’s KV for past tokens; the work for the current token remains.|预训练共 6T token，前 4.5T 使用 NVFP4；循环核经历 1–4 轮，上下文扩至 256K。后训练结合 SFT、可验证奖励与难度课程。开启末轮 KV 后，每个循环注意力层只常驻历史 token 最后一遍的键值，当前 token 各遍的计算仍不可省。'),
    result:pair('In NVIDIA’s checkpoint comparison, SWE-bench Verified scores 50.3 / 59.5 / 61.8 at 1 / 2 / 4 visits; no-tools GPQA Diamond scores 69.19 / 72.41 / 72.16. Changing the inference budget on the same weights helps one task more than the other.|NVIDIA 对同一检查点改变推理预算：1、2、4 遍下 SWE-bench Verified 为 50.3／59.5／61.8，无工具 GPQA Diamond 为 69.19／72.41／72.16。相同权重多算几遍，对不同任务的回报不同。'),
    limit:pair('At two or more loops the authors report a higher 12-benchmark average than selected larger models, not a win on every task. In their agentic tests, four loops produced 1.3–2.5× fewer tokens than one. Neither a shorter output nor constant persistent KV proves lower latency: time the whole answer.|论文报告两遍及以上时，12 项基准均分超过所比的部分更大模型，并非每项皆胜。在作者的智能体测试中，四遍的输出长度约为一遍的 1/1.3 至 1/2.5。输出变短或常驻 KV 不增，都不能证明延迟下降：应实测完成整个任务的耗时。'),
    locator:pair('Paper §§2–3 for the recurrence and training; BF16 model card, “Benchmarks”, for the same-checkpoint sweep.|递推式与训练见论文第 2–3 节；同检查点扫深度的数据见 BF16 模型卡 Benchmarks。'),
    comparison:pair('One 4B checkpoint|同一份 4B 权重'),schedule:pair('20-block core × chosen depth|20 个块 × 选定轮数'),control:pair('Inference-only depth sweep|只改推理轮数')
  },{
    id:'ouro',role:pair('Open looped LM · paper and checkpoints|开放循环语言模型 · 论文和检查点'),
    figures:[{
      number:'7-6',file:'ouro_looplm_architecture.jpg',title:pair('LoopLM: learn the exits, then choose when to use them|LoopLM：训练出口，再决定何时采用'),
      caption:pair('The repeated stacks on the left are visits to the same N layers. Each produces a token loss and an exit probability. On the right, add the exit mass up to the current visit; emit the prediction when it reaches the chosen threshold. This is a learned stopping distribution, not a test of whether consecutive hidden states are identical.|左边画出的多组 N 层是同一栈的多次访问；每遍都给出词预测损失和退出概率。右边累加截至当前遍的退出概率质量，达到指定阈值就读出预测。判断条件是学到的停止分布，不是两遍隐状态是否相同。'),
      credit:pair('Zhu et al. · paper Fig. 3 · CC BY-SA 4.0|Zhu 等 · 论文图 3 · CC BY-SA 4.0'),source:'https://arxiv.org/abs/2510.25741v6'
    }],
    question:pair('If a token is already predictable after two visits, how can the model use that answer without always paying for four?|若两遍后已经能预测一个 token，怎样直接使用这个答案，而不总是付四遍的代价？'),
    path:[pair('Embed the token|编码 token'),pair('Visit shared stack|执行共享栈'),pair('Read logits + exit gate|读词分布与退出门'),pair('Exit or revisit|读出或再访')],
    state:pair('Ouro reuses a decoder stack, not just its middle layers. The state changes at each visit while the stack weights stay fixed. In the 2.6B configuration, 24 stored layers visited four times give 96 layer executions before the final readout if no early exit is taken.|Ouro 重访解码层栈，而非只重访中间层。每遍改变状态，栈的权重不变。以 2.6B 配置为例，24 个独立层执行四遍时，如不提前退出，最终读出前共有 96 次层执行。'),
    budget:pair('The 1.4B and 2.6B base models were trained on 7.7T tokens. The objective weights each visit’s language-model loss by its exit probability and regularizes the distribution’s entropy. At inference the threshold changes the depth policy without changing weights. The model card’s default threshold of 1.0 uses all four visits.|1.4B 和 2.6B 基座训练了 7.7T token。训练目标按退出概率加权各遍的语言建模损失，并对退出分布施加熵正则。推理时可调阈值而不改权重；模型卡的默认阈值 1.0 表示跑满四遍。'),
    result:pair('In the paper’s Fig. 5 MMLU comparison, at about 2.5 visits on average the gate with specialized exit training reaches about 66% accuracy versus about 64% for the gate learned in standard pretraining. The comparison fixes average depth, not elapsed time.|论文图 5 在 MMLU 上对照两种门控：平均约 2.5 遍时，专门做过退出训练的门约为 66% 准确率，常规预训练所得的门约为 64%。这里匹配的是平均访问次数，而不是设备耗时。'),
    limit:pair('The authors report results comparable to models up to 12B on selected benchmarks; this is not equivalent knowledge capacity. The project documents native vLLM support from v0.11.1 through v0.26.0, running all four visits. Gate accuracy alone does not establish a serving speedup.|作者报告部分基准可与最高 12B 的模型相比，不代表知识存储容量相同。项目记录的原生 vLLM 支持为 v0.11.1 至 v0.26.0，该路径实际执行四遍。门控准确率本身不能证明服务提速。'),
    locator:pair('Paper Figs. 3 and 5 explain the gate. The team’s October 2026 project update reports 158 citing papers and 15 follow-ups using Ouro checkpoints directly; these are dated project counts, not benchmarks.|论文图 3、图 5 解释门控。项目方 2026 年 10 月更新列出 158 篇引用，其中整理的后续工作有 15 篇直接使用 Ouro 检查点；这是当时的项目统计，不是模型评测。'),
    comparison:pair('Ouro 1.4B / 2.6B base models|Ouro 1.4B／2.6B 基座'),schedule:pair('Shared stack, up to 4 visits in the release|发布配置：共享整栈，最多四遍'),control:pair('Exit strategies at matched mean depth|相同平均深度下比较退出策略')
  },{
    id:'molt',role:pair('Research architecture · paper and code|研究架构 · 论文与代码'),
    figures:[{
      number:'7-7',file:'molt_architecture.png',diagram:'assets/umolt-memory.svg',title:pair('U-MoLT separates memory construction from prediction|U-MoLT：将构建记忆与预测读出分开'),
      caption:pair('Trace the two outgoing paths from the encoder. One supplies the next loop with memory from earlier positions. The other supplies a causal cross-attention decoder with encoder-derived KV for prediction. There is no arrow from the decoder back to the encoder: omitting an unused intermediate readout does not erase the loop’s memory.|从编码器沿两条出边读图：一条把较早位置的记忆留给下一轮；另一条给因果交叉注意力解码器提供从编码端投影的 KV，用于预测。解码器没有回到编码器的反馈边，因此省去未使用的中间读出，不会丢掉下一轮需要的记忆。'),
      credit:pair('Atlas schematic after Zhu et al. · U-MoLT, paper Fig. 4|本站依据 Zhu 等论文图 4 独立绘制'),source:'https://github.com/hustvl/MoLT/blob/1313b83adf05f666726bf009014f5f50ae345b23/assets/molt_architecture.png'
    }],
    question:pair('Must a token wait for its own previous-loop state, or can it read the useful history from other positions instead?|当前 token 必须等自己上一轮的状态吗？能否改从较早位置读取需要的信息？'),
    path:[pair('Restart from embedding|从嵌入重启'),pair('Read prefix memory KV|读取前缀记忆 KV'),pair('Build encoder memory|构建编码侧记忆'),pair('Decode when needed|按需解码读出')],
    state:pair('MoLT-R carries the residual stream and can read local KV across visits. MoLT-KV instead restarts the token from its embedding: at position t it combines local KV from the current pass with previous-pass memory only from positions j < t. This removes the wait for position t in the preceding pass. U-MoLT uses this second design on its encoder side.|MoLT-R 保留残差流，并允许跨遍读取局部 KV。MoLT-KV 改从嵌入重启：在位置 t，把本遍局部 KV 与前一遍来自 j < t 的记忆 KV 合并，因此不再等待前一遍的同一位置 t。U-MoLT 的编码侧采用后一种设计。'),
    budget:pair('During loop forcing, predictions at successive loops are trained against the same next-token target. At inference, encoder outputs provide feedback; the decoder has its own per-layer projections from encoder output and contributes only to readout. This permits skipping intermediate decoder traversals, not all encoder work.|循环监督（loop forcing）让相继各遍预测同一个下一 token。推理时由编码端输出提供反馈；解码端各层从编码输出分别投影 KV，只负责读出。因此可以跳过不用的中间解码遍历，而不是跳过所有编码计算。'),
    result:pair('After 400B pretraining tokens, the paper reports 1.7× validation cross-entropy token efficiency at 700M and +2.1 percentage points on ten-task accuracy for the 3B MoE comparison. In a separate S-size (~113M) timing test, U-MoLT with MoL-Hybrid-2 took 996.6 ms versus 1,000.6 ms for non-looped OLMo3.|在 400B token 预训练实验中，论文报告 700M 配置的验证交叉熵 token 效率为 1.7 倍；3B MoE 对照中十任务准确率高 2.1 个百分点。另一个约 113M 的 S 规模计时实验中，U-MoLT 搭配 MoL-Hybrid-2 为 996.6 ms，非循环 OLMo3 为 1,000.6 ms。'),
    limit:pair('Token efficiency at a validation loss, accuracy on a task suite and wall time are different measurements made at different scales. The 113M timing does not establish equal latency for the 700M or 3B models.|达到某个验证损失所需的 token、任务准确率与墙钟耗时，是在不同规模上测得的不同量。113M 的计时不能证明 700M 或 3B 也能等延迟。'),
    locator:pair('Paper §§3.3–3.5 and Fig. 4 for the encoder, decoder and loop forcing; author repository for the original diagram.|编码器、解码器与循环监督见论文第 3.3–3.5 节及图 4；原图见作者仓库。'),
    comparison:pair('U-MoLT vs non-looped OLMo3|U-MoLT 与非循环 OLMo3'),schedule:pair('Encoder feedback, separate causal readout|编码端反馈，因果读出独立执行'),control:pair('Training efficiency vs separate small-model timing|训练效率与小模型计时分开对照')
  }
];
