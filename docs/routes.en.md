# Six routes through recurrent depth

[简体中文](routes.zh.md) · [Reading guide](guide.en.md)

The animated paths are original explanatory diagrams. Each follows one named representative; the other records show where the analogy breaks. Dates are those of the indexed preprint or public release.

<a id="route-a"></a>

## A · What can sharing do?

What can the same layer learn or compute when applied repeatedly?

**Classification cue:** Look for a tied-versus-untied control, a constructive proof, or a test on longer inputs. The object of study is the shared rule itself.

**Worked path: Universal Transformer.** [Play the diagram](https://hyfine.github.io/loop-transformer-atlas/#lab/A)

1. **Encode positions** — Represent all sequence positions together. Depth is an iteration index, not a new token.
2. **Attend globally** — Each position reads the current states of visible positions. Position and step signals distinguish where and when.
3. **Apply transition** — Update every active state with the same transition parameters used on the last visit.
4. **Read positions** — After the fixed budget, read the refined representations. The ACT variant can finish different positions at different depths.

**Feedback edge:** updated states → attend again.

UT makes the iterative rule learnable. The programmable-computer construction instead writes the rule into the weights; the distinction is learning versus expressibility.

### Universal Transformer

2018-07 · ICLR 2019 · [arxiv.org](https://arxiv.org/abs/1807.03819) · [openreview.net](https://openreview.net/forum?id=HyzdRiR9Y7) · [github.com](https://github.com/tensorflow/tensor2tensor)

Every position attends to the sequence, then the same transition acts again on the revised states. A depth signal distinguishes visits; optional ACT lets positions finish separately.

**Evidence boundary:** Parallel over positions within a pass does not mean parallel over dependent passes.

### Recurrent stacking

2018-07 · AAAI 2019 · [arxiv.org](https://arxiv.org/abs/1807.05353) · [ojs.aaai.org](https://ojs.aaai.org/index.php/AAAI/article/view/4590)

Train a translation model in which six applications of one layer replace six distinct layers. The experiment isolates a storage question: how close can the compact translator get?

**Evidence boundary:** Fixed reuse during training and inference does not license extra test-time depth.

### ALBERT

2019-09 · ICLR 2020 · [arxiv.org](https://arxiv.org/abs/1909.11942)

Cross-layer sharing reduces encoder parameters; factorized embeddings address a different part of the parameter budget.

**Evidence boundary:** A compression baseline, not evidence that a pretrained encoder improves if run for more steps.

### Programmable computers

2023-01 · ICML 2023 · [arxiv.org](https://arxiv.org/abs/2301.13196) · [proceedings.mlr.press](https://proceedings.mlr.press/v202/giannou23a.html)

Constructed weights implement an instruction interpreter. The input encodes memory and instructions, so the same small machine can execute a longer program by running longer.

**Evidence boundary:** An existence construction is not evidence that gradient descent discovers this interpreter on natural text.

### Learning algorithms in context

2023-11 · ICLR 2024 · [arxiv.org](https://arxiv.org/abs/2311.12424)

On in-context data-fitting tasks, the authors find comparable performance to untied Transformers with under 10% of the parameters. Reusing the update fits the iterative nature of estimation.

**Evidence boundary:** Parameter count on controlled regression tasks is not total compute or open-domain language quality.

### Length generalization

2024-09 · ICLR 2025 · [arxiv.org](https://arxiv.org/abs/2409.15647)

Learn a reusable step on tasks with known iterative solutions. Longer inputs can be handled by running the learned step more often instead of learning new layers.

**Evidence boundary:** Input-length extrapolation, extra inference depth and general reasoning are three separate claims.

### Timestep encoding

2024-10 · ICML 2025 · [arxiv.org](https://arxiv.org/abs/2410.01405) · [proceedings.mlr.press](https://proceedings.mlr.press/v267/xu25x.html)

An approximation analysis motivates loop-dependent scales: the same weights can behave differently when told which visit they are on.

**Evidence boundary:** An approximation-rate result is about representable functions, not a guarantee about a trained checkpoint.

---

<a id="route-b"></a>

## B · Build a looped model

How do you design and train a model around a repeated block?

**Classification cue:** Look for a model architecture or pretraining recipe: where the loop sits, how its state is initialized, or how it learns at scale. Starting from an existing non-looped checkpoint is the defining contrast with D.

**Worked path: Huginn-0125.** [Play the diagram](https://hyfine.github.io/loop-transformer-atlas/#lab/B)

1. **Prelude** — Encode the prompt once into a conditioning signal. Keep it available to the recurrent core.
2. **Inject input** — Combine the conditioning signal with the current recurrent state; do not overwrite the prompt with the last estimate.
3. **Shared core** — Apply the same block to form the next state. During training, sampled unroll lengths expose the core to different budgets.
4. **Coda + head** — At the chosen depth a separate coda maps the state to next-token logits. No intermediate word has to be emitted.

**Feedback edge:** state + original signal → next visit.

Huginn revisits a block (ABAB); Loopie revisits each layer before moving on (AABB). With nonlinear layers these compute different functions even at identical depth.

### Sparse UT

2023-10 · EMNLP 2023 · [arxiv.org](https://arxiv.org/abs/2310.07096) · [aclanthology.org](https://aclanthology.org/2023.emnlp-main.12/)

Sparse experts let a shared transition access more stored capacity without activating every expert on every pass.

**Evidence boundary:** Routing experts is a choice of computation, not itself a choice of how many passes to run.

### MoEUT

2024-05 · NeurIPS 2024 · [arxiv.org](https://arxiv.org/abs/2405.16039) · [proceedings.nips.cc](https://proceedings.nips.cc/paper_files/paper/2024/file/321387ba926b8e58d3591c0aeb52ffc2-Paper-Conference.pdf)

Repeat groups of expert layers, with specialized attention and normalization. Increasing available experts need not increase every token’s path by the same amount.

**Evidence boundary:** The grouped design, sparse routing and normalization change together; not a test of weight sharing alone.

### Huginn-0125

2025-02 · arXiv · [arxiv.org](https://arxiv.org/abs/2502.05171v2) · [github.com](https://github.com/seal-rg/recurrent-pretraining) · [huggingface.co](https://huggingface.co/tomg-group-umd/huginn-0125)

A prelude encodes the prompt; the recurrent core reads that conditioning signal as it updates its state. Sampled training depths prepare one 3.5B checkpoint for different inference budgets.

**Evidence boundary:** Table 1 holds the checkpoint fixed; Table 4 also contains a 0.18T-token baseline. Do not compare that baseline to the 0.8T run as equal-data training.

### Loopie

2026-07 · arXiv · [arxiv.org](https://arxiv.org/abs/2607.16051v3) · [huggingface.co](https://huggingface.co/zitian-gao/Loopie-20B-A2B-preview)

Run each MoE layer twice before moving to the next. Spend the memory headroom on a larger microbatch and a wider model while matching measured optimizer-step time.

**Evidence boundary:** The selected design has a 1.42× analytical block-work proxy (Table 1). Matched wall time is not matched FLOPs or matched serving latency.

### SMELT

2026-09 · arXiv · [arxiv.org](https://arxiv.org/abs/2609.01343v3)

Repeat the middle half twice; redesign the MoE comparator to closely match per-token FLOPs, non-embedding parameters and KV. Fit loss versus training compute separately.

**Evidence boundary:** 6.8–18.0% training-FLOP savings describe the fitted compute-optimal frontier, not measured inference speed.

### SenseNova-Loop Preview

2026-10-31 · Release · [github.com](https://github.com/OpenSenseNova/SenseNova-Loop) · [huggingface.co](https://huggingface.co/sensenova/SenseNova-Loop-9B-Preview)

The preview exposed weights and a looped multimodal decoder before the November release.

**Evidence boundary:** The preview and final release are two events of one model line; do not pool their benchmark values.

### ARLoop

2026-11-03 · arXiv · [arxiv.org](https://arxiv.org/abs/2611.05234) · [huggingface.co](https://huggingface.co/osunlp/ARLoop-1.2B)

Let each layer attend over recent residual states in depth. A window can be better than the full history; the 1.2B model was pretrained at three recurrences on 0.5T tokens.

**Evidence boundary:** Attention across depth is distinct from attention across token positions; comparisons to other checkpoints change more than one variable.

### SenseNova-Loop-9B

2026-11-17 · Release · [github.com](https://github.com/OpenSenseNova/SenseNova-Loop) · [huggingface.co](https://huggingface.co/sensenova/SenseNova-Loop-9B) · [huggingface.co · config](https://huggingface.co/sensenova/SenseNova-Loop-9B/blob/main/config.json)

A 32-layer decoder executes its 24 middle layers twice. Two residual streams exchange information through manifold-constrained hyper-connections; the total is 56 layer executions.

**Evidence boundary:** The published 4 + 24×2 + 4 layout explains effective depth, not the speed or parameter count of an untied 56-layer decoder.

---

<a id="route-c"></a>

## C · Choose the depth

Who decides which inputs or tokens should get another pass?

**Classification cue:** Look for a stop rule, token router or externally specified budget. Merely running an experiment at several fixed depths is not a depth policy.

**Worked path: Mixture-of-Recursions.** [Play the diagram](https://hyfine.github.io/loop-transformer-atlas/#lab/C)

1. **Active tokens** — Start with live token states. Depth is a token-level resource, not one fixed bill for the whole sequence.
2. **Route tokens** — A lightweight router scores positions for another recursion; a routing policy controls which survive.
3. **Recur on subset** — Execute the shared stack on selected tokens. The cache policy determines which histories they can read.
4. **Collect exits** — Keep the exit representation for finished positions, then form predictions. Routed depth can vary across the same batch.

**Feedback edge:** surviving tokens → route again.

ACT learns halting mass; MoR selects tokens; LoopFormer accepts a budget. To compare them report both mean and tail depths, then measure actual batch latency.

### Adaptive Computation Time

2016-03 · arXiv · RNN · [arxiv.org](https://arxiv.org/abs/1603.08983)

A halting unit accumulates probability until enough internal work has been done for one input step.

**Evidence boundary:** A precursor in recurrent networks, not a Transformer release.

### Mixture-of-Recursions

2025-07 · NeurIPS 2025 · [arxiv.org](https://arxiv.org/abs/2507.10524) · [proceedings.neurips.cc](https://proceedings.neurips.cc/paper_files/paper/2025/file/8b08bbf8b420faa6eeb4020720582ec7-Paper-Conference.pdf) · [github.com](https://github.com/raymin0223/mixture_of_recursions)

A router selects which tokens revisit the shared stack. Restricting attention work and cache entries to the active tokens changes the cost as well as the path.

**Evidence boundary:** In Table 3, 43.1 vs 42.3 average few-shot accuracy is at 16.5×10¹⁸ training FLOPs. Token sparsity alone does not establish device speedup.

### Ouro

2025-10 · arXiv · [arxiv.org](https://arxiv.org/abs/2510.25741) · [huggingface.co](https://huggingface.co/ByteDance/Ouro-2.6B) · [ouro-llm.github.io](https://ouro-llm.github.io/)

Train looped LMs with an entropy-regularized depth-allocation objective and up to 7.7T tokens. The objective teaches intermediate exits to be useful.

**Evidence boundary:** Better manipulation of supplied facts does not imply the capacity to memorize as many independent facts as a larger model.

### LoopFormer

2026-02 · ICLR 2026 · [arxiv.org](https://arxiv.org/abs/2602.11451)

Condition a shared transition on time and step size. A shortcut-consistency loss makes a short trajectory agree with a longer one.

**Evidence boundary:** A budget chosen by a caller is different from a model independently deciding to stop each token.

---

<a id="route-d"></a>

## D · Convert a checkpoint

How can an existing non-looped checkpoint use its layers twice?

**Classification cue:** Look at the starting weights: a frozen wrapper, learned adapters and continued training are different ways of converting an existing model. They do not share the same training cost.

**Worked path: Training-free loops.** [Play the diagram](https://hyfine.github.io/loop-transformer-atlas/#lab/D)

1. **Frozen prefix** — Run the checkpoint normally until a chosen middle window; do not change the trained weights.
2. **Evaluate block** — Evaluate the frozen map on the current state. Subtract the input to isolate its residual displacement.
3. **Damp update** — Move only a fraction of that displacement and evaluate again. This panel illustrates damped Euler, not every solver in the paper.
4. **Original suffix** — Hand the refined state to the original downstream layers. Check whether the output distribution still matches what those layers expect.

**Feedback edge:** new state → recompute displacement.

Training-free damping approximates one residual displacement with smaller steps. Continued-training retrofits such as GLM-5.4 instead teach the checkpoint to use the new path.

### Relaxed recursion

2024-10 · ICLR 2025 · [arxiv.org](https://arxiv.org/abs/2410.20672)

Initialize shared layers from an untied checkpoint. Small per-depth LoRA corrections restore distinctions that strict tying would discard.

**Evidence boundary:** The adapters are distinct parameters; the entire executed function is no longer identical at every depth.

### Retrofitted recurrence

2025-11 · arXiv · [arxiv.org](https://arxiv.org/abs/2511.07384) · [github.com](https://github.com/mcleish7/retrofitting-recurrence) · [huggingface.co](https://huggingface.co/collections/tomg-group-umd/retrofitting-recurrence)

Start from pretrained weights and increase recurrence gradually during adaptation, rather than asking a pretrained model to tolerate the full new depth immediately.

**Evidence boundary:** The reported compute-budget comparison is on mathematics and requires additional training.

### Training-free loops

2026-05 · arXiv · [arxiv.org](https://arxiv.org/abs/2605.23872)

Treat a frozen middle block as a residual update. Take several damped substeps, rather than repeatedly applying the full original displacement.

**Evidence boundary:** Table 3 reports +2.64 percentage points on MMLU-Pro for Qwen3-4B-Instruct. No training does not mean no extra inference work.

### GLM-5.4

2026-11-23 · Publisher report · [z.ai](https://z.ai/blog/glm-5.4)

Z.ai reports continued training of GLM-5 with a 28-layer group run twice, per-pass update gates, reused sparse indices and global KV sharing plus a pass-specific local window.

**Evidence boundary:** The controlled iso-parameter ablation is on a 30B model with about 10% more total training compute; it is not an independent matched-FLOP test of the flagship.

### LoopRes

2026-11-23 · arXiv · [arxiv.org](https://arxiv.org/abs/2611.31094v2)

During adaptation a layer attends to outputs of recent earlier loops. Learned loop keys distinguish similar states; a short residual window discourages bypassing intermediate work.

**Evidence boundary:** This is a trained retrofit. Its comparison against SFT at increased compute is not a training-free gain.

---

<a id="route-e"></a>

## E · Run loops efficiently

What must wait for the previous pass, and which past states must stay in memory?

**Classification cue:** Look for a changed execution order or key/value (KV) cache policy. The relevant evidence is latency, throughput, memory or a dependency diagram—not just the number of parameters.

**Worked path: LoopCoder-v2.** [Play the diagram](https://hyfine.github.io/loop-transformer-atlas/#lab/E)

1. **Token stream** — Consider adjacent causal positions. A serial loop would wait for each same-position intermediate state.
2. **First pass** — Build contextual features and attention history for the first visit of the shared block.
3. **Offset handoff** — Pass information from an earlier position across the loop boundary. Shared KV and gated window attention supply context for the new pass.
4. **Decode in pipeline** — Overlap work at different positions. The overlap comes with a mismatch: the handoff is not from exactly the position being refined.

**Feedback edge:** earlier position → later pass.

LoopCoder changes dependencies; Dory changes persistent cache contents; LoopCache changes speculative scheduling and cache traffic. All three need separate measurements of bytes, latency and quality.

### Parallel Loop Transformer

2025-10 · arXiv · [arxiv.org](https://arxiv.org/abs/2510.24824)

Offset cross-loop information along sequence positions. A later pass can read information that is already available instead of waiting for the same position to finish.

**Evidence boundary:** Shortening the serial dependency changes which state is available; it is not a free parallelization of identical arithmetic.

### LoopCoder-v2

2026-06 · arXiv · [arxiv.org](https://arxiv.org/abs/2606.18023) · [huggingface.co](https://huggingface.co/Multilingual-Multimodal-NLP/LoopCoder-V2)

Cross-loop position offsets and shared-KV gated local attention trade a same-position dependency for a pipeline. The 7B coding variants were trained from scratch on 18T tokens.

**Evidence boundary:** SWE-bench Verified: 43.0 → 64.4 → 27.6 for R=1,2,3 (Table 2). These are separately trained variants, not a slider on one checkpoint.

### Dory1.0-4B

2026-11-02 · Technical report · [arxiv.org](https://arxiv.org/abs/2611.03998v1) · [huggingface.co](https://huggingface.co/nvidia/NVIDIA-Nemotron-Labs-Dory1.0-4B-BF16)

An elastic nGPT core can spend more loops per request. Retaining only the last loop’s KV for history decouples persistent cache size from the number of visits.

**Evidence boundary:** The authors report 1.3–2.5× fewer output tokens at four versus one loop on agentic benchmarks. Fewer emitted tokens is not the same as lower end-to-end latency.

### LoopCache

2026-11-18 · arXiv · [arxiv.org](https://arxiv.org/abs/2611.24301v1)

Update speculative drafts as intermediate predictions change, and rotate which loop’s history KV is loaded. This attacks memory traffic during long-context verification.

**Evidence boundary:** Its reported speedups are against WFD and LoopSpec, not against every non-looped decoder. Traffic per step and total KV capacity differ.

### Mixture-of-Loops

2026-11-25 · arXiv · [arxiv.org](https://arxiv.org/abs/2611.34923v1) · [github.com](https://github.com/hustvl/MoLT)

MoLT-R carries residual state; MoLT-KV restarts from embeddings and reads earlier-position KV from the preceding loop. Removing the same-position dependency changes the decode schedule.

**Evidence boundary:** The near-equal latency example is on the ~113M S-size configuration, not a timing measurement for the multi-billion-parameter models.

---

<a id="route-f"></a>

## F · Refine non-text states

What does one more pass improve before the system emits a graph, takes an action or advances the simulated world?

**Classification cue:** Identify the object fed back: a dependency graph, latent action or environment state. An ordinary next-token model is not in F just because it accepts images.

**Worked path: Looped World Models.** [Play the diagram](https://hyfine.github.io/loop-transformer-atlas/#lab/F)

1. **Observe + act** — Condition one transition on the previous latent state, observation embedding (if available) and proposed action.
2. **Form condition** — The prelude encodes the conditioning signal for this simulated time step. Keep the time index fixed inside the loop.
3. **Refine latent** — Reapply the dynamics core, combining state retention, input injection and a nonlinear residual. A harder transition may need a deeper update.
4. **Advance time** — Return one predicted latent environment state. An outer rollout can now supply the next action; decoding observations can be deferred.

**Feedback edge:** same action & time → refine again.

A converged latent state can still represent the wrong world. Test multi-step rollout error and downstream decisions, not just whether the inner update became small.

### Graph-to-graph parsing

2020-03 · TACL 2021 · [arxiv.org](https://arxiv.org/abs/2003.13118) · [aclanthology.org](https://aclanthology.org/2021.tacl-1.8/)

Predict arcs conditioned on the previous dependency graph, decode a new graph, and apply the same predictor again. An inspectable tree is the feedback signal.

**Evidence boundary:** An adjacent output-refinement loop; it does not keep all reasoning inside continuous hidden states.

### Recurrent-depth VLA

2026-02 · arXiv · [arxiv.org](https://arxiv.org/abs/2602.07845) · [rd-vla.github.io](https://rd-vla.github.io/)

Iterate a weight-tied action head on a latent action representation. At inference, a convergence criterion can stop refinement before emitting a continuous action.

**Evidence boundary:** Extra iterations refine one action prediction; they are not additional robot control steps.

### Looped World Models

2026-06 · Technical report · [arxiv.org](https://arxiv.org/abs/2606.18208v1) · [faceminda.com](https://faceminda.com/)

Condition a shared dynamics core on the encoded observation, previous state and action. Inner loops refine one transition; only the outer rollout advances simulated time.

**Evidence boundary:** Spectral control of a state-retention component is not a blanket guarantee of accurate long rollouts in a new environment (§3).
