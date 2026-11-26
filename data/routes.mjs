const text = s => s.split('|');
function route(id, color, title, question, example, stages, feedback, contrast) {
  return {id, color, title:text(title), question:text(question), example,
    stages:stages.map(([label, note]) => ({label:text(label), note:text(note)})),
    feedback:text(feedback), contrast:text(contrast)};
}
export const routes = [
  route('A','#74dfde','Rules & sharing|共享与算法','Can one update rule do the work of many distinct layers?|同一条更新规则能否代替多个不同层？','ut',[
    ['Encode positions|编码位置','Represent all sequence positions together. Depth is an iteration index, not a new token.|同时表示序列各位置。深度是迭代编号，并非新增 token。'],
    ['Attend globally|全局注意','Each position reads the current states of visible positions. Position and step signals distinguish where and when.|每个位置读取可见位置的当前状态，位置与步数信号区分“在哪”和“第几轮”。'],
    ['Apply transition|共享变换','Update every active state with the same transition parameters used on the last visit.|用与上一轮相同的变换参数更新所有活跃状态。'],
    ['Read positions|读出结果','After the fixed budget, read the refined representations. The ACT variant can finish different positions at different depths.|用尽指定预算后读出表征；ACT 变体还允许各位置在不同深度完成。']
  ],'updated states → attend again|更新后的状态 → 再次注意','UT makes the iterative rule learnable. The programmable-computer construction instead writes the rule into the weights; the distinction is learning versus expressibility.|UT 学习迭代规则，可编程计算机的存在性证明则把规则写入权重。两者的区别是能否学会，而非能否表示。'),
  route('B','#ffbc75','Pretrained cores|循环核预训练','How do you train a language model whose depth can be reused?|怎样训练一个能重复利用深度的语言模型？','huginn',[
    ['Prelude|前段编码','Encode the prompt once into a conditioning signal. Keep it available to the recurrent core.|前段只编码一次，所得条件信号供循环核多次使用。'],
    ['Inject input|注入输入','Combine the conditioning signal with the current recurrent state; do not overwrite the prompt with the last estimate.|将条件信号与当前循环状态结合，而非用上次估计覆盖提示词。'],
    ['Shared core|共享核心','Apply the same block to form the next state. During training, sampled unroll lengths expose the core to different budgets.|同一个块生成下一状态；训练中采样展开长度，使循环核经历多种预算。'],
    ['Coda + head|尾段与读出','At the chosen depth a separate coda maps the state to next-token logits. No intermediate word has to be emitted.|达到选定深度后，独立尾段将状态映为下一 token 的 logits，中途无需输出词。']
  ],'state + original signal → next visit|状态与原始条件 → 下一轮','Huginn revisits a block (ABAB); Loopie revisits each layer before moving on (AABB). With nonlinear layers these compute different functions even at identical depth.|Huginn 重复整块（ABAB），Loopie 连续重复每层（AABB）。非线性层的执行顺序不同，即使深度相同也不是同一函数。'),
  route('C','#bdadff','Adaptive depth|自适应深度','Who decides whether one more pass is worth paying for?|由谁判断下一轮计算是否值得？','mor',[
    ['Active tokens|活跃位置','Start with live token states. Depth is a token-level resource, not one fixed bill for the whole sequence.|从活跃 token 状态开始，把深度作为按位置分配的资源。'],
    ['Route tokens|选择位置','A lightweight router scores positions for another recursion; a routing policy controls which survive.|轻量路由器为各位置的下一轮打分，再按策略筛选保留位置。'],
    ['Recur on subset|子集迭代','Execute the shared stack on selected tokens. The cache policy determines which histories they can read.|只对选中 token 执行共享层栈；可读取哪些历史由缓存策略决定。'],
    ['Collect exits|汇合出口','Keep the exit representation for finished positions, then form predictions. Routed depth can vary across the same batch.|保留已完成位置的出口状态，再汇合计算预测；同一批内深度可以不同。']
  ],'surviving tokens → route again|仍活跃的 token → 再次路由','ACT learns halting mass; MoR selects tokens; LoopFormer accepts a budget. To compare them report both mean and tail depths, then measure actual batch latency.|ACT 学停机概率，MoR 筛选 token，LoopFormer 接收外部预算。比较时要报告平均及尾部深度，并实测批处理延迟。'),
  route('D','#ff96ac','Retrofitting|存量模型改造','Can the weights you already have survive a second visit?|已有模型的权重能承受第二次访问吗？','frozen',[
    ['Frozen prefix|冻结前段','Run the checkpoint normally until a chosen middle window; do not change the trained weights.|按原模型执行至选定中间窗口，不修改已训练权重。'],
    ['Evaluate block|计算残差','Evaluate the frozen map on the current state. Subtract the input to isolate its residual displacement.|计算冻结块的输出，再减去输入，分离出残差位移。'],
    ['Damp update|缩短子步','Move only a fraction of that displacement and evaluate again. This panel illustrates damped Euler, not every solver in the paper.|仅沿该位移走一小步后重新计算。这里演示阻尼欧拉，不代表论文中的所有求解器。'],
    ['Original suffix|原始后段','Hand the refined state to the original downstream layers. Check whether the output distribution still matches what those layers expect.|将细化状态交还原后段，检查其分布是否仍符合后段预期。']
  ],'new state → recompute displacement|新状态 → 重算残差位移','Training-free damping approximates one residual displacement with smaller steps. Continued-training retrofits such as GLM-5.4 instead teach the checkpoint to use the new path.|免训练阻尼以较小步长近似原残差变换；GLM-5.4 等继续训练路线则让模型学会使用新路径。'),
  route('E','#a5df7d','Scheduling & KV|调度与缓存','What travels between passes, and when is it available?|轮次之间要传递什么，什么时候可用？','loopcoder',[
    ['Token stream|token 序列','Consider adjacent causal positions. A serial loop would wait for each same-position intermediate state.|考虑相邻因果位置。常规串行循环必须等待同一位置的中间状态。'],
    ['First pass|第一遍','Build contextual features and attention history for the first visit of the shared block.|共享块首轮构建上下文特征与注意力历史。'],
    ['Offset handoff|错位传递','Pass information from an earlier position across the loop boundary. Shared KV and gated window attention supply context for the new pass.|从较早位置跨轮传递信息，共享 KV 与门控窗口注意力为新一轮提供上下文。'],
    ['Decode in pipeline|流水解码','Overlap work at different positions. The overlap comes with a mismatch: the handoff is not from exactly the position being refined.|重叠执行不同位置的工作；代价是收到的信息不来自正被细化的同一个位置。']
  ],'earlier position → later pass|较早序列位置 → 后续轮次','LoopCoder changes dependencies; Dory changes persistent cache contents; LoopCache changes speculative scheduling and cache traffic. All three need separate measurements of bytes, latency and quality.|LoopCoder 改依赖，Dory 改持久缓存内容，LoopCache 改推测调度及访存；三者都应分别测量字节数、延迟和质量。'),
  route('F','#83b5ff','Structured states|结构化状态','What if the thing being refined is a graph, an action or a world state?|如果被细化的是图、动作或世界状态呢？','loopwm',[
    ['Observe + act|观测与动作','Condition one transition on the previous latent state, observation embedding (if available) and proposed action.|用上一潜态、可用观测嵌入及候选动作定义一次状态转移的条件。'],
    ['Form condition|形成条件','The prelude encodes the conditioning signal for this simulated time step. Keep the time index fixed inside the loop.|前段对当前模拟时间步的条件进行编码；内循环保持该时间索引不变。'],
    ['Refine latent|细化潜态','Reapply the dynamics core, combining state retention, input injection and a nonlinear residual. A harder transition may need a deeper update.|重复动力学核，把状态保持、输入注入与非线性残差结合；复杂转移可能需要更多计算。'],
    ['Advance time|推进时间','Return one predicted latent environment state. An outer rollout can now supply the next action; decoding observations can be deferred.|返回一个预测的环境潜态。外层 rollout 此时才接收下一动作，观测解码可以延后。']
  ],'same action & time → refine again|同一动作、同一时间 → 再次细化','A converged latent state can still represent the wrong world. Test multi-step rollout error and downstream decisions, not just whether the inner update became small.|潜态收敛仍可能预测错世界。除了内循环更新是否变小，还要检验多步展开误差与下游决策。')
];
