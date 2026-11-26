# Reading a looped Transformer

[简体中文](guide.zh.md) · [Interactive edition](https://hyfine.github.io/loop-transformer-atlas/) · [Six worked routes](routes.en.md)

## Start with a single prediction

Imagine answering “Who taught the author of this book?” with a paragraph in front of you. One pass may associate *book → author*; a later pass may use that revised representation to retrieve *author → teacher*. This is an intuition, **not** a claim that one attention layer equals one reasoning hop. Nothing requires the model to print the author’s name between passes.

In an untied stack the state visits different functions: `A → B → C → D`. A block loop can do `A → B → A → B`; layer-wise looping does `A → A → B → B`. Both latter examples store two layer parameter sets and execute four layers, yet generally compute different functions. A block may also sit between a unique prefix and suffix:

```text
e = P(x)                          encode the input once
h[r+1] = Fθ(h[r], e, r)           revise the state; θ is shared
y = head(C(h[R]))                 read out at the chosen depth
```

This is a notation for comparison, not a universal implementation. The initial state can be encoded input or noise; the time signal and repeated input injection are optional. A layer-wise adapter can relax strict sharing. With `p` prefix layers, `b` shared layers, `c` suffix layers and `R` visits, **distinct layers = p+b+c** and **layer executions = p+Rb+c**. Count the first visit: “one extra loop” means `R=2`. The [SenseNova configuration](https://huggingface.co/sensenova/SenseNova-Loop-9B/blob/main/config.json) makes this concrete: `4 + 24 + 4 = 32` stored layers, `4 + 2×24 + 4 = 56` executions. This says nothing by itself about tokens per second.

## How the research question changed

| Period | What changed | A useful comparison |
|---|---|---|
| 2016–19 | [ACT](https://arxiv.org/abs/1603.08983) made internal steps per input learnable in an RNN. [Universal Transformers](https://arxiv.org/abs/1807.03819) applied a shared attention/transition repeatedly across depth; [recurrent stacking](https://ojs.aaai.org/index.php/AAAI/article/view/4590) asked how far fixed reuse could compress translation. | Same weights does not imply adaptive stopping. [ALBERT](https://arxiv.org/abs/1909.11942) illustrates the distinction. |
| 2020–24 | [RNGTr](https://aclanthology.org/2021.tacl-1.8/) fed a predicted graph back into a parser. Theory separated what a [constructed interpreter](https://proceedings.mlr.press/v202/giannou23a.html) can execute from what a [trained model](https://arxiv.org/abs/2311.12424) learns in context. [Sparse UT](https://aclanthology.org/2023.emnlp-main.12/) and [MoEUT](https://arxiv.org/abs/2405.16039) broadened stored capacity without making every expert active. | Feedback can be a graph or a hidden vector. A proof of representability is not a training recipe. |
| 2024–25 | [Length generalization](https://arxiv.org/abs/2409.15647) tied step count to algorithmic difficulty. [Relaxed recursion](https://arxiv.org/abs/2410.20672) converted existing weights; [Huginn](https://arxiv.org/abs/2502.05171v2) trained one elastic checkpoint; [MoR](https://arxiv.org/abs/2507.10524) allocated visits per token. | Separate choosing a budget per request from choosing the next active tokens inside one request. |
| 2026, first three quarters | [Training-free loops](https://arxiv.org/abs/2605.23872) split a frozen update into smaller substeps. [LoopCoder-v2](https://arxiv.org/abs/2606.18023) changed cross-position dependencies. [Loopie](https://arxiv.org/abs/2607.16051v3) and [SMELT](https://arxiv.org/abs/2609.01343v3) built different matched-budget baselines. [LoopWM](https://arxiv.org/abs/2606.18208v1) applied inner depth to one transition of a world model. | “More passes help” became a measurable question only after specifying **which budget** stays fixed. |
| Oct–Nov 2026 | [SenseNova](https://github.com/OpenSenseNova/SenseNova-Loop) separates the October preview from the November release. [Dory](https://arxiv.org/abs/2611.03998) stores the final pass’s history; [GLM-5.4](https://z.ai/blog/glm-5.4) reports global sharing with local exceptions; [MoLT](https://arxiv.org/abs/2611.34923v1) asks whether KV itself should carry information between rounds. | The engineering dispute is no longer just “how many loops?” It is “what can the next visit read, from which position, and at what cost?” |

## Six families, four independent design choices

The [tree](https://hyfine.github.io/loop-transformer-atlas/#tree) gives each work a primary address, not an exclusive identity. Dory is a trained language model *and* a cache design; we file it under execution to make the serving comparison easier.

| Route | The question to ask | Work through it |
|---|---|---|
| A · Rules & sharing | Is a learned or constructed operator reused? Does it know its depth? | [Universal Transformer and algorithmic controls](routes.en.md#route-a) |
| B · Pretrained cores | How are states initialized, reconditioned and stabilized? | [Huginn versus layer-wise Loopie](routes.en.md#route-b) |
| C · Adaptive depth | Does a caller, a halting probability or a router allocate compute? | [Mixture-of-Recursions](routes.en.md#route-c) |
| D · Retrofitting | Freeze the model, train small corrections, or continue training the whole path? | [Training-free damping versus learned gates](routes.en.md#route-d) |
| E · Scheduling & KV | Which dependency can overlap, and whose keys/values survive? | [LoopCoder-v2, Dory and LoopCache](routes.en.md#route-e) |
| F · Structured states | What is refined before a real-world or simulated time step advances? | [Graph, action and world-state examples](routes.en.md#route-f) |

To classify a new paper, write four fields rather than one label: **unit of reuse** (whole stack, middle block, one layer, sublayer); **feedback** (residual state, conditioned input, graph, KV); **training provenance** (from scratch, continued training, adapter, frozen); **budget policy** (fixed, sampled during training, user-selected at inference, or data-dependent exit). For instance, *frozen/middle block/damped state/fixed substeps* describes the training-free recipe much better than “latent reasoning”.

## Four experiments that should not share a leaderboard

| Source and actual control | Observation | What it does **not** establish |
|---|---|---|
| [Huginn, Table 1](https://arxiv.org/html/2502.05171v2). Same 3.5B checkpoint, 0.8T training tokens; change inference depth. | ARC-Easy at 4/8/16/32 visits: **49.07 / 65.11 / 69.49 / 69.91**. The last doubling buys 0.42 points. | No universal optimum; no equality to a 50B-parameter knowledge store. Do not silently substitute the 0.18T fixed-depth baseline from Table 4. |
| [LoopCoder-v2, Table 2](https://arxiv.org/html/2606.18023v1). Matched instruction tuning, **separately trained** loop counts. | SWE-bench Verified at 1/2/3: **43.0 / 64.4 / 27.6**. The authors diagnose diminishing refinement against positional mismatch. | This is not Huginn’s inference-depth experiment and not a two-pass ceiling for all architectures. |
| [Loopie, §3 and Table 1](https://arxiv.org/html/2607.16051v3). Match measured optimizer-step time, token budget and updates; tune batch/parallelism. | Repeated layers make a larger microbatch feasible; the selected design’s analytical block-work proxy is **1.42×** the reference. | Neither equal theoretical FLOPs nor evidence of equal decode latency. |
| [SMELT, scaling study](https://arxiv.org/html/2609.01343v3). Closely match per-token FLOPs, non-embedding parameters and KV across sparse MoE designs. | The fitted compute-optimal frontiers imply **6.8–18.0%** less training compute at the compared losses. | Not a measured 6.8–18.0% reduction in wall-clock time for an arbitrary model. |

**Practical test.** Fix the prompt set, tokenizer, output policy, batch, precision and hardware. Record quality, emitted tokens, prefill time, decode time/token, latency distribution, peak memory and persistent KV bytes. For variable depth, publish the depth histogram, not only its mean. Compare an untied model at both the same stored parameter count and a matched compute budget. They answer different questions.

## What can go wrong

- **More iterations undo a good answer.** The state can drift or oscillate. Inspect intermediate readouts and forced exits; small state changes need not mean the answer is correct. [LoopCoder-v2](https://arxiv.org/abs/2606.18023) is an empirical counterexample to monotonicity.
- **A frozen block sees the wrong input on its second visit.** If `F(h)=h+Δ(h)`, naïvely applying it twice takes another full step. Damped Euler uses `h ← h + αΔ(h)` and recomputes the displacement each time. This ODE analogy motivates a wrapper, not a proof that every block is a continuous flow. [Training-Free Looped Transformers, Tables 2–3](https://arxiv.org/abs/2605.23872).
- **Shared weights do not imply shared activations.** For the same historical token, two visits can produce different K/V vectors. Sharing or discarding them changes what later tokens can attend to. Contrast [Dory](https://arxiv.org/abs/2611.03998), [LoopCache](https://arxiv.org/abs/2611.24301) and [MoLT](https://arxiv.org/abs/2611.34923v1).
- **Not every latent loop is recurrent depth.** Generating extra reasoning tokens grows the sequence; a tied core revisits depth inside a prediction. An agent’s plan–act loop and recurrence over environment time sit outside that prediction. Hybrids exist; label both axes rather than inferring a hidden architecture from a product’s outputs.

**Next:** inspect the [casebook and primary artifacts](routes.en.md), the [wider survey and search protocol](../EVIDENCE.md), or [play the trajectories](https://hyfine.github.io/loop-transformer-atlas/#time).
