import {works} from '../data/works.mjs';
import {routes} from '../data/routes.mjs';
import {directions,dossiers} from '../data/frontier.mjs';
import {chapters,views,readRoute} from './navigation.mjs';

const repo = 'https://github.com/hyfine/loop-transformer-atlas/blob/main/';
const dates = [...works].sort((a,b)=>a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
const families = Object.fromEntries(routes.map(r=>[r.id,r]));
const byId = Object.fromEntries(works.map(w=>[w.id,w]));
const main = document.querySelector('main');
let zh = new URL(location.href).searchParams.get('lang') === 'zh';
let tab, mapView='tree', selected='huginn', labFamily='B', model='glm', step=0, timer, rounds=2;
let archive, archiveError, loading, shelfPage = 0, query = '', shelfScope = 'all', treeFit = false;
const tr = (en,cn)=>zh ? cn : en;
const t = pair=>pair[Number(zh)];
const esc = s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lang = ()=>zh?'zh':'en';
const routeWorks = id=>dates.filter(w=>w.family===id);
const year = w=>w.date.slice(0,4);
const linkType = url=>{
  const h = new URL(url).hostname;
  if(h==='github.com') return tr('Repository','代码库');
  if(h==='huggingface.co') return url.includes('/config.json')?tr('Configuration','模型配置'):tr('Model card / collection','模型卡／集合');
  return h==='arxiv.org'?'arXiv':h;
};
const sources = w=>`<div class="links">${w.links.map(u=>`<a href="${esc(u)}">${esc(linkType(u))} ↗</a>`).join('')}</div>`;
const btn = (key,label,attrs='')=>`<button type="button" data-do="${key}" ${attrs}>${label}</button>`;
const kicker = s=>`<div class="eyebrow">${s}</div>`;
const heading = (n,title,lead)=>`<div class="sectionhead">${kicker('FIELD PLATE / '+n)}<h2>${title}</h2><p class="lede">${lead}</p></div>`;
const options = (arr,value)=>arr.map(([id,name])=>`<option value="${esc(id)}"${id===value?' selected':''}>${esc(name)}</option>`).join('');
const routeSelect = ()=>`<label>${tr('Research question','研究问题')} <select id="route">${options(routes.map(r=>[r.id,`${r.id} · ${t(r.title)}`]),labFamily)}</select></label>`;
const legend = ()=>`<div class="legend">${routes.map(r=>`<span style="--accent:${r.color}"><b>● ${r.id}</b> ${t(r.title)}</span>`).join('')}</div>`;
const inspector = w=>`<article class="inspector" style="--accent:${families[w.family].color}"><div class="tag">${w.family} · ${t(families[w.family].title)} / ${w.date} · ${esc(w.venue)}</div><h3>${esc(w.name)}</h3><p>${esc(t(w.finding))}</p><p class="hint"><b>${tr('Read with care','解读边界')}:</b> ${esc(t(w.limit))}</p>${sources(w)}</article>`;
const svg = (w,h,label,body)=>`<div class="chart" tabindex="0" aria-label="${esc(label)}"><svg viewBox="0 0 ${w} ${h}" role="group" aria-label="${esc(label)}">${body}</svg></div>`;
const line = (d,col,extra='')=>`<path d="${d}" fill="none" stroke="${col}" stroke-width="2" ${extra}/>`;
const txt = (x,y,s,attrs='')=>`<text x="${x}" y="${y}" ${attrs}>${esc(s)}</text>`;
const action = (key,value,label,body)=>`<g tabindex="0" role="button" aria-label="${esc(label)}" data-do="${key}" data-value="${esc(value)}"><title>${esc(label)}</title>${body}</g>`;
const rect = (x,y,w,h,color,active=false)=>`<rect class="hit${active?' active':''}" x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#172e38" stroke="${color}"/>`;
const circle = (x,y,r,color,active=false)=>`<circle class="hit${active?' active':''}" cx="${x}" cy="${y}" r="${r}" fill="${color}" stroke="#13242e"/>`;
function stop(){clearInterval(timer);timer=undefined;}
const mapHref=(view,id=selected)=>`#${view}/${byId[id].family}/${id}`;
function chooseWork(id){
  selected=id;
  history.replaceState(null,'',mapHref(mapView));
}
const switcher=(label,items)=>`<div class="switcher" role="navigation" aria-label="${esc(label)}">${items.map(([href,name,active])=>`<a href="${href}"${active?' aria-current="location"':''}>${esc(name)}</a>`).join('')}</div>`;

function overview(){
  const tags = ['molt','glm','loopres','loopcache','sense','arloop','dory'];
  return `<div class="split"><div>${kicker('RESEARCH ATLAS / VOL. 07')}<h1>${tr('One block.<br><em>Many depths.</em>','一组权重，<br><em>多轮计算。</em>')}</h1>
  <p class="lede">${tr('A Transformer can spend more compute before it writes its next token. Follow what changes inside the loop, what stays shared, and what one more pass actually costs.','Transformer 可以在写出下一个 token 前多算几轮。沿着环路看清：什么在变化，什么保持共享，再算一轮究竟要付出什么。')}</p>
  <div class="tools"><a class="primary" href="#map">${tr('Explore the research map →','打开研究地图 →')}</a><a href="${repo}docs/guide.${lang()}.md">${tr('Read the field guide','阅读技术导读')} ↗</a></div></div>
  <div class="plate">${kicker('01 / DEPTH COUNTER')}<img src="assets/circuit.svg" alt="${tr('Prelude, recurrent core with feedback, and coda','前段编码、带状态反馈的共享核心与输出尾段')}">
  <div class="tools">${tr('Core visits','核心访问次数')} ${[1,2,4].map(r=>btn('round',`×${r}`,`data-value="${r}" aria-pressed="${r===rounds}"`)).join('')}</div>
  <div class="numbers"><span><b>32</b><small>${tr('distinct layers','独立层数')}</small></span><span><b>${4+24*rounds+4}</b><small>${tr('layer executions','执行层次')}</small></span><span><b>×${rounds}</b><small>${tr('middle block','中间块')}</small></span></div>
  <small>${tr('4 + 24R + 4. R=2 is the released','4 + 24R + 4。R=2 对应实际发布的')} <a href="#tree/B/sense">SenseNova-Loop-9B</a>${tr('; the other settings are arithmetic examples, not measured models.','；其他设置仅演示计算关系，并非实测模型。')}</small></div></div>
  <section>${heading('02',tr('Which question are you asking?','你想弄清哪个问题？'),tr('We group works by the question their evidence answers, not by size or benchmark rank. Choose a question to trace a representative model.','按每项工作的证据主要回答什么问题归类，不按大小或跑分排名。选一个问题，就能跟着代表作走一遍。'))}<div class="grid">${routes.map(r=>`<a class="card" style="--accent:${r.color}" href="#lab/${r.id}"><span class="tag">${r.id} / ${byId[r.example].name}</span><h3>${t(r.title)}</h3><p>${t(r.question)}</p></a>`).join('')}</div></section>
  <section>${heading('03',tr('Frontier notebook','前沿手记'),tr('November 2026 · New mechanisms and releases, not a leaderboard.','2026 年 11 月 · 按新机制与新发布选录，不按跑分排名。'))}<div class="tools"><a href="#directions">${tr('Compare research directions →','对照最新技术方向 →')}</a><a href="#frontier/glm">${tr('Inside GLM-5.4 →','深读 GLM-5.4 →')}</a></div><div class="grid">${tags.map(id=>{const w=byId[id];return `<a class="card" style="--accent:${families[w.family].color}" href="${dossiers.some(d=>d.id===id)?'#frontier/'+id:mapHref('tree',id)}"><span class="meta">${w.date} · ${esc(w.venue)}</span><h3>${w.name} ↗</h3><p>${t(w.finding)}</p></a>`}).join('')}</div></section>`;
}

function tree(){
  const family=byId[selected].family;
  const groups=[
    {tone:'blue',ids:['B','A','D'],xs:[244,435,626],side:-1,title:tr('Design the update','设计更新规则')},
    {tone:'teal',ids:['F','C','E'],xs:[665,856,1047],side:1,title:tr('Allocate & apply it','分配与应用计算')}
  ];
  const years=[...new Set(dates.map(year))].reverse(), bands=new Map(), rowPitch=40;
  let bottom=72;
  for(const yr of years){
    const cells=Object.fromEntries(routes.map(r=>[r.id,routeWorks(r.id).filter(w=>year(w)===yr)]));
    const height=8+rowPitch*Math.max(...Object.values(cells).map(cell=>cell.length));
    bands.set(yr,{top:bottom,height,cells});
    bottom+=height;
  }
  const rootX=646, rootY=bottom+99;
  const stem=(d,cls)=>`<path class="tree-stem ${cls}" pathLength="1" d="${d}"/>`;
  let stems='',chips='',caps='',grid='';
  const font=document.createElement('canvas').getContext('2d');
  font.font='600 13px system-ui';
  for(const [i,yr] of years.entries()){
    const {top,height}=bands.get(yr), y=top+height;
    grid+=`<path class="tree-rule" d="M39 ${y}H1220"/><rect class="tree-year-pill" x="10" y="${y-10}" width="49" height="20" rx="5"/>`+txt(34.5,y+4,yr,'class="tree-year" text-anchor="middle"');
    for(const {tone,ids,xs,side} of groups){
      ids.forEach((id,j)=>{
        const cell=bands.get(yr).cells[id],x=xs[j];
        cell.forEach((w,k)=>{
          const cy=top+height/2+((cell.length-1)/2-k)*rowPitch;
          const lines=[''];
          for(const word of w.name.split(' ')){
            const last=lines.at(-1), next=last?`${last} ${word}`:word;
            if(last&&font.measureText(next).width>147)lines.push(word);else lines[lines.length-1]=next;
          }
          const width=Math.ceil(Math.max(...lines.map(s=>font.measureText(s).width)))+17;
          const h=lines.length*14+8, x0=side===1?x+13:x-13-width;
          const body=`<path class="tree-twig" d="M${x} ${cy}h${side*14}"/><circle class="tree-pin" cx="${x}" cy="${cy}" r="3"/>`+
            `<rect class="hit tree-chip${selected===w.id?' chosen':''}" x="${x0}" y="${cy-h/2}" width="${width}" height="${h}" rx="4"/>`+
            lines.map((s,n)=>txt(x0+width/2,cy+4.5+(n-(lines.length-1)/2)*14,s,'class="tree-name" text-anchor="middle"')).join('');
          chips+=`<g class="tree-${tone} tree-leaf" style="--lag:${(years.length-1-i)*75}ms">${action('work',w.id,`${w.name} · ${w.date} · ${t(families[id].title)}`,body)}</g>`;
        });
      });
    }
  }
  for(const {tone,ids,xs,side,title} of groups){
    const hub=xs[1];
    let wood=stem(`M${rootX} ${rootY} C${rootX} ${bottom+40} ${hub} ${bottom+65} ${hub} ${bottom-4}`,'tree-trunk');
    ids.forEach((id,j)=>{
      const x=xs[j], first=bands.get(year(routeWorks(id)[0]));
      const bend=first.top+first.height;
      const d=j===1?`M${hub} ${bottom-4}V55`:
        `M${hub} ${Math.min(bottom-4,bend+54)} C${hub} ${bend+12} ${x} ${bend+38} ${x} ${bend-5}V55`;
      wood+=stem(d,'tree-arm')+`<path class="tree-tip" d="M${x-14} 60L${x} 33l14 27Z"/>`;
      const cx=x+side*77, label=t(families[id].title);
      caps+=`<g class="tree-${tone}">${action('family',id,label,`<rect class="hit tree-heading${id===family?' chosen':''}" x="${cx-86}" y="6" width="172" height="25" rx="7"/>`+
        txt(cx,23,`${id} · ${label}`,'class="tree-caption" text-anchor="middle"'))}</g>`;
    });
    stems+=`<g class="tree-${tone}">${wood}</g>`;
    caps+=`<g class="tree-${tone}">${txt(hub+side*67,bottom+64,title,'class="tree-group" text-anchor="middle"')}</g>`;
  }
  const drawing=`<defs><linearGradient id="tree-root-fill"><stop stop-color="#407bb6"/><stop offset="1" stop-color="#167f80"/></linearGradient></defs>`+
    `<path class="tree-axis" d="M34 ${bottom+25}V46m-5 8 5-8 5 8"/>${stems}${grid}${chips}${caps}`+
    `<rect x="${rootX-99}" y="${rootY-19}" width="198" height="38" rx="9" fill="url(#tree-root-fill)"/>`+
    txt(rootX,rootY+6,tr('Loop Transformers','循环 Transformer'),'class="tree-root-label" text-anchor="middle"');
  return `<p class="hint">${tr('Read up from the root: blue branches explore or build the repeated layer; teal branches choose, schedule or apply its computation.','从树根向上读：蓝色分支研究或构建共享层；青色分支讨论如何分配、执行或应用这份计算。')}</p>`+
    `<div class="tools">${btn('grow',tr('Replay growth ↑','重播生长 ↑'))} ${btn('tree-fit',treeFit?tr('Enlarge labels','放大标签'):tr('Fit whole tree','查看全图'))} ${btn('tree-evidence',tr('View selection','查看所选条目')+` · ${esc(byId[selected].name)} ↓`)}</div>
    <div class="tree-paper${treeFit?' fit':''}">${svg(1236,rootY+31,tr('Research families by year, oldest at the bottom','研究家族年份图，较早的工作在下方'),drawing)}</div>
    <p class="hint">${tr('Dashed lines mark the base of each year band; spacing accommodates labels, not elapsed time. Forks mean shared questions, not paper-to-paper descent. On small screens, swipe across the plate.','虚线标记各年份区间的下界；间距按标签排布，不代表时间长度。分叉表示问题分类，不表示论文师承关系。小屏幕可横向滑动。')}</p>`;
}

function lanes(){
  const family=byId[selected].family, cellYear=year(byId[selected]);
  const years=[...new Set(dates.map(year))], x=i=>200+i*72,y=i=>52+i*42;
  let g=years.map((v,i)=>txt(x(i),20,v,'class="small" text-anchor="middle"')).join('');
  routes.forEach((r,i)=>{
    g+=txt(8,y(i)+5,`${r.id} · ${t(r.title)}`,'font-size="14"')+line(`M182 ${y(i)} H${x(years.length-1)+27}`,r.color,'opacity=".35"');
    years.forEach((v,j)=>{
      const group=routeWorks(r.id).filter(w=>year(w)===v);
      if(!group.length)return;
      g+=action('cell',`${r.id}:${v}`,`${t(r.title)} · ${v} · ${group.length}`,circle(x(j),y(i),10+Math.sqrt(group.length)*2,r.color,family===r.id&&cellYear===v)+txt(x(j),y(i)+5,group.length,'text-anchor="middle" style="fill:#10212a" font-size="13"'));
    });
  });
  const group=routeWorks(family).filter(w=>year(w)===cellYear);
  return `<p class="hint">${tr('Rows are research questions; columns are years. Choose a numbered stop, then a work. The number counts records, not importance.','每行一个研究问题，每列一个年份。先选有数字的站点，再选具体作品；数字是收录数，不是重要性。')}</p>
    <div class="plate">${svg(x(years.length-1)+55,295,tr('Family by year','家族与年份交叉图'),g)}</div><div class="tools">${group.map(w=>btn('lane-work',w.name,`data-value="${w.id}" aria-pressed="${selected===w.id}"`)).join('')}</div>`;
}

function trajectory(){
  const tick=dates.indexOf(byId[selected]), x=i=>60+i*26,y=r=>44+routes.findIndex(f=>f.id===r)*36;
  let g='';
  for(const r of routes){
    g+=txt(9,y(r.id)+5,r.id,'font-weight="bold"')+line(`M50 ${y(r.id)}H${x(dates.length-1)+14}`,r.color,'opacity=".2"');
    const seen=dates.flatMap((v,i)=>i<=tick&&v.family===r.id?[i]:[]);
    if(seen.length)g+=line(`M${x(seen[0])} ${y(r.id)}H${x(seen.at(-1))}`,r.color);
  }
  dates.forEach((v,i)=>{
    if(!i||year(v)!==year(dates[i-1]))g+=txt(x(i),i%2?26:14,year(v),'class="small" text-anchor="middle"');
    g+=action('tick',i,`${v.date} · ${v.name}`,circle(x(i),y(v.family),i===tick?9:6,i<=tick?families[v.family].color:'#394951',i===tick));
  });
  return `<p class="hint">${tr('Play or scrub from ACT to MoLT. One horizontal step is one publication or release, not elapsed time; same-month items need not have appeared in this order.','从 ACT 到 MoLT，可播放也可拖动。横向每步是一个论文或发布事件，不代表等长时间；同月条目不保证先后。')}</p>
    <div class="plate">${legend()}${svg(x(dates.length-1)+30,248,tr('Chronological trajectories','各路线时间轨迹'),g)}
    <div class="tools">${btn('play',timer?tr('Pause','暂停'):tr('Play','播放'))}<label>${tr('Record','事件')} <input id="scrub" type="range" min="0" max="${dates.length-1}" value="${tick}"> ${tick+1}/${dates.length}</label></div></div>`;
}

function researchMap(){
  const w=byId[selected];
  const guide=`<details class="route-key"><summary>${tr('Classification key: six questions and their examples','分类速查：六个问题与对应例子')}</summary>
    <dl>${routes.map(r=>`<dt><a href="${mapHref(mapView,r.example)}">${r.id} · ${t(r.title)}</a></dt><dd>${t(r.criterion)} <b>${byId[r.example].name}</b></dd>`).join('')}</dl>
    <p>${tr('When several labels fit, we choose the comparison discussed in the record. GLM-5.4 has a cache design, but here its main question is how to convert GLM-5 (D). Dory is a trained model, but our map entry examines its last-loop KV cache (E). Neither classification excludes the other contributions.','有交叉时，按条目正在分析的那组证据确定主类。GLM-5.4 也改了缓存，但这里关心如何从 GLM-5 改造，因此归 D；Dory 也有训练配方，但本条聚焦最后一轮 KV，因此归 E。主类不排除它的其他贡献。')}</p></details>`;
  return heading('04–06',t(chapters.map),tr('Classify the question, not the model: Huginn asks how to train a repeated block (B); MoR asks which tokens should revisit it (C); LoopCache asks how to read less memory during decoding (E). Switch views without losing your selected work.','按研究问题分类，而不是给模型贴标签：Huginn 问怎样训练共享块（B），MoR 问哪些 token 应该再算一轮（C），LoopCache 问解码时怎样少读缓存（E）。切换下方视角会保留当前作品。'))+
    guide+switcher(tr('Map views','地图视角'),Object.entries(views).map(([v,label])=>[mapHref(v),t(label),v===mapView]))+
    `<div class="map-view" aria-label="${t(views[mapView])}">${({tree,lanes,time:trajectory})[mapView]()}</div>`+
    inspector(w)+`<div class="links"><a href="#lab/${w.family}">${tr('Trace a representative mechanism','查看该类的代表流程')} →</a>${dossiers.some(d=>d.id===w.id)?`<a href="#frontier/${w.id}">${tr('Read the full model case','阅读该模型深读')} →</a>`:''}</div>`;
}

function researchDirections(){
  return heading('09',t(chapters.directions),tr('November 2026 · Four open design decisions. For each one, compare the published mechanisms, the actual measurement and the experiment that would distinguish them.','2026 年 11 月 · 四个仍未定论的设计选择。每个方向分别看：方法改了什么、现有证据说明什么、下一步怎样验证。'))+
    `<div class="direction-grid">${directions.map((d,i)=>`<article class="card direction">
      ${kicker(`0${i+1} / ${tr('RESEARCH QUESTION','研究问题')}`)}<h3>${t(d.title)}</h3><p>${t(d.changed)}</p>
      <h4>${tr('What the evidence shows','已有证据')}</h4><p>${t(d.observed)}</p>
      <h4>${tr('What to test next','下一步怎样验证')}</h4><p>${t(d.test)}</p>
      <div class="links">${d.refs.map(id=>`<a href="${esc(byId[id].links[0])}">${esc(byId[id].name)} ↗</a>`).join('')}${d.extra?`<a href="${esc(d.extra[1])}">${esc(d.extra[0])} ↗</a>`:''}</div></article>`).join('')}</div>`;
}

function frontierModels(){
  const d=dossiers.find(item=>item.id===model), w=byId[d.id];
  const block=(label,copy)=>`<div><h4>${label}</h4><p>${t(copy)}</p></div>`;
  return heading('10',t(chapters.frontier),tr('One flagship disclosure and two open models answer different questions. Follow one prediction through each model, then check which comparison its authors actually ran. This is not a ranking of frontier capability.','一份旗舰技术披露与两个开放模型回答了不同问题。先跟着一次预测看内部如何执行，再看作者真正做了哪种对照。这里不是前沿能力排行榜。'))+
    switcher(tr('Choose a model','选择模型'),dossiers.map(row=>[`#frontier/${row.id}`,byId[row.id].name,row.id===model]))+
    `<article class="plate dossier"><div class="meta">${w.date} · ${t(d.role)}</div><h2>${w.name}</h2><p class="lede">${t(d.question)}</p>
      <ol class="model-path" aria-label="${tr('Forward path','一次前向路径')}">${d.path.map(s=>`<li>${t(s)}</li>`).join('')}</ol><div class="case-grid">
      ${block(tr('01 · What changes between passes?','01 · 轮次之间什么在变？'),d.state)}
      ${block(tr('02 · What is trained, stored or recomputed?','02 · 学什么、存什么、重算什么？'),d.budget)}
      ${block(tr('03 · What did the authors measure?','03 · 作者实际测了什么？'),d.result)}
      ${block(tr('04 · What cannot be inferred?','04 · 哪些结论不能推出？'),d.limit)}</div>
      <p class="hint">${t(d.locator)}</p>${sources(w)}<a class="boxlink" href="${mapHref('tree',w.id)}">${tr('Locate this work on the map','在地图中定位该模型')} →</a></article>
    <section><h3>${tr('Compare the experiments, not the headlines','三组实验究竟在比较什么？')}</h3><div class="compare-scroll"><table class="comparison"><thead><tr>${[tr('Case','案例'),tr('Starting point','起点'),tr('Repeated work','重复哪部分'),tr('Comparison behind the claim','证据的比较口径')].map(s=>`<th scope="col">${s}</th>`).join('')}</tr></thead><tbody>${dossiers.map(row=>`<tr><th scope="row"><a href="#frontier/${row.id}">${byId[row.id].name}</a></th><td>${t(row.comparison)}</td><td>${t(row.schedule)}</td><td>${t(row.control)}</td></tr>`).join('')}</tbody></table></div></section>`;
}

function lab(){
  const r=families[labFamily], w=byId[r.example], pos=[115,315,515,715];
  let g=`<defs><marker id="arr" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="m0 0 6 3-6 3z" fill="${r.color}"/></marker></defs>`;
  for(let i=0;i<3;i++)g+=line(`M${pos[i]+77} 100H${pos[i+1]-80}`,r.color,'marker-end="url(#arr)"');
  const edge=r.id==='F'?'M555 72V46Q555 35 544 35H485Q475 35 475 46V71':
    r.id==='E'?'M315 72V46Q315 35 326 35H503Q515 35 515 46V71':'M515 70V46Q515 35 504 35H326Q315 35 315 46V71';
  g+=line(edge,r.color,`marker-end="url(#arr)" ${step===2?'class="running"':''}`);
  g+=txt(r.id==='F'?515:416,23,t(r.feedback),'class="small" text-anchor="middle"');
  if(r.id==='C')g+=line('M315 128V154H715V131',r.color,'stroke-dasharray="4 4" marker-end="url(#arr)"')+txt(515,177,tr('tokens that exit bypass the next recursion','已退出的位置跳过下一轮'),'class="small" text-anchor="middle"');
  if(r.id==='F')g+=line('M715 128V154H115V131',r.color,'stroke-dasharray="4 4" marker-end="url(#arr)"')+txt(415,177,tr('outer rollout: next action, next time step','外层展开：下一个动作、下一个时间步'),'class="small" text-anchor="middle"');
  r.stages.forEach((s,i)=>g+=action('step',i,t(s.label),rect(pos[i]-76,73,152,55,r.color,i===step)+txt(pos[i],95,`0${i+1}`,'class="small" text-anchor="middle"')+txt(pos[i],116,t(s.label),'text-anchor="middle" font-size="15"')));
  return heading('07',tr('Mechanism lab','方法实验室'),tr('Each plate traces one representative design, not a universal algorithm for its family. Select a stage or play the explanation.','每幅图追踪一种代表性设计，而非整个家族的通用算法。可选择步骤或播放解说。'))+
    `<div class="tools">${routeSelect()} <b>${w.name}</b></div><div class="plate">${svg(830,['C','F'].includes(r.id)?192:149,t(r.title),g)}
    <div class="tools">${btn('play',timer?tr('Pause','暂停'):tr('Play','播放'))}${btn('next',tr('Next stage →','下一步 →'))} <b>${step+1}/4 · ${t(r.stages[step].label)}</b></div>
    <p class="readout">${t(r.stages[step].note)}</p><p class="hint">${t(r.contrast)}</p></div>    ${inspector(w)}<a href="${repo}docs/routes.${lang()}.md#route-${r.id.toLowerCase()}">${tr('Read the full route and its comparison cases →','阅读完整路线与同类对照 →')}</a>`;
}

function filterRows(){
  const key=query.trim().toLowerCase();
  const cards=dates.map(w=>({title:w.name,meta:`${w.date} · ${w.venue} · ${t(families[w.family].title)}`,url:`#tree/${w.family}/${w.id}`,text:[...w.finding,...w.limit].join(' ')}));
  const seed=(archive||[]).map(a=>({title:a.title,meta:`${a.year} · ${tr('Discovery index','检索索引')} · ${a.category}${a.titleReview?' · '+tr('Check current title: ','请核对当前标题：')+a.observedTitle:''}`,url:a.url,text:[...a.tags,a.observedTitle].join(' ')}));
  const rows=(shelfScope==='cards'?cards:shelfScope==='seed'?seed:[...cards,...seed]).filter(r=>(r.title+' '+r.meta+' '+r.text).toLowerCase().includes(key));
  const slice=rows.slice(shelfPage*20,shelfPage*20+20);
  return `<p class="hint">${rows.length} ${tr('matching records (curated and seed entries may overlap)','条匹配记录（精读与种子索引可能重叠）')}</p><ul class="shelf">${slice.map(v=>`<li><a href="${esc(v.url)}">${esc(v.title)}</a><br><small>${esc(v.meta)}</small></li>`).join('')}</ul><div class="tools">${btn('prev-page',tr('Previous','上一页'),shelfPage===0?'disabled':'')} ${shelfPage+1}/${Math.max(1,Math.ceil(rows.length/20))} ${btn('next-page',tr('Next','下一页'),(shelfPage+1)*20>=rows.length?'disabled':'')}</div>`;
}
async function loadArchive(){
  if(archive||loading||archiveError)return;
  loading=true;
  try{
    const res=await fetch('data/seed-index.json');if(!res.ok)throw new Error(`HTTP ${res.status}`);
    archive=await res.json();
  }catch(error){archiveError=String(error);}
  finally{loading=false;if(tab==='library')render();}
}
function library(){
  void loadArchive();
  return heading('08',tr('Evidence library','证据文献库'),tr('The curated record explains a mechanism and its limits. The larger seed index is for discovery; inclusion is not an endorsement or an independent replication.','精读条目解释机制及其局限。更大的种子索引用于发现文献，不代表认同其结论或已独立复现。'))+
  `<div class="links"><a href="${repo}EVIDENCE.md">${tr('Search & audit method','检索与审阅方法')}</a><a href="data/visits.csv">${tr('Per-URL ledger (CSV)','逐链接审计表（CSV）')}</a><a href="${repo}docs/routes.${lang()}.md">${tr('Offline casebook','离线案例手册')}</a></div>
  <div class="tools"><label>${tr('Search','搜索')} <input id="search" type="search" value="${esc(query)}" placeholder="MoLT / KV / 共享"></label><label>${tr('Collection','集合')} <select id="scope">${options([['all',tr('Both collections','两个集合')],['cards',tr('Curated','精读')],['seed',tr('Discovery','种子索引')]],shelfScope)}</select></label></div>
  ${archiveError?`<p role="alert">${tr('Could not load the discovery index','无法载入种子索引')}: ${esc(archiveError)} ${btn('retry',tr('Retry','重试'))}</p>`:loading?`<p>${tr('Loading discovery index…','正在载入种子索引…')}</p>`:''}<div id="results">${filterRows()}</div>`;
}
function render(){
  const focus=document.activeElement;
  const id=focus.id, cmd=focus.dataset.do, value=focus.dataset.value;
  const focusedHref=focus.closest('#nav a, .switcher a')?.getAttribute('href');
  const treeScroll=main.querySelector('.tree-paper .chart')?.scrollLeft;
  const keyOpen=main.querySelector('.route-key')?.open;
  document.documentElement.lang=zh?'zh-CN':'en';
  document.title=`${tab==='map'?t(views[mapView])+' · ':''}${t(chapters[tab])} · Loop Transformer Atlas`;
  document.querySelector('#language').textContent=tr('中文','English');
  const nav=document.querySelector('#nav');
  nav.setAttribute('aria-label',tr('Atlas chapters','图谱章节'));
  nav.innerHTML=Object.entries(chapters).map(([id,p])=>`<a href="#${id}" ${id===tab?'aria-current="page"':''}>${t(p)}</a>`).join('');
  main.innerHTML=({overview,map:researchMap,directions:researchDirections,frontier:frontierModels,lab,library})[tab]();
  if(tab==='map'&&keyOpen)main.querySelector('.route-key').open=true;
  const chart=main.querySelector('.tree-paper .chart');
  if(chart&&treeScroll!==undefined)chart.scrollLeft=treeScroll;
  else if(chart&&location.hash.startsWith('#tree/')){
    const selectedRect=chart.querySelector('.tree-chip.chosen').getBoundingClientRect();
    chart.scrollLeft=selectedRect.left-chart.getBoundingClientRect().left+(selectedRect.width-chart.clientWidth)/2;
  }
  if(id)document.getElementById(id)?.focus({preventScroll:true});
  else if(cmd)Array.from(main.querySelectorAll('[data-do]')).find(el=>el.dataset.do===cmd&&el.dataset.value===value)?.focus({preventScroll:true});
  else if(focusedHref)Array.from(document.querySelectorAll('#nav a,.switcher a')).find(el=>el.getAttribute('href')===focusedHref)?.focus({preventScroll:true});
}
function navigate(){
  const previous=tab;
  stop();const route=readRoute(location.hash);
  tab=route?.tab||'overview';
  if(tab==='map'){
    mapView=route.view||mapView;
    selected=route.work||(!previous&&mapView==='time'?dates[0].id:selected);
    if(!route.work)history.replaceState(null,'',mapHref(mapView));
  }
  if(tab==='lab'){labFamily=route.family||byId[selected].family;step=0;}
  if(tab==='frontier')model=route.model;
  render();
  if(previous&&previous!==tab){main.focus({preventScroll:true});window.scrollTo(0,0);}
}
function handle(key,val){
  if(key==='play'){
    if(timer)stop();
    else{
      if(tab==='map'&&selected===dates.at(-1).id)chooseWork(dates[0].id);
      if(tab==='lab'&&step===3)step=0;
      timer=setInterval(()=>{
        if(tab==='map')chooseWork(dates[dates.indexOf(byId[selected])+1].id);else step++;
        if((tab==='map'&&selected===dates.at(-1).id)||(tab==='lab'&&step===3))stop();
        render();
      },tab==='map'?950:2600);
    }
  }else{
    stop();
    if(key==='round')rounds=Number(val);
    if(key==='family'){location.hash=`tree/${val}`;return;}
    if(key==='work'){location.hash=`tree/${byId[val].family}/${val}`;return;}
    if(key==='tree-fit')treeFit=!treeFit;
    if(key==='grow'){
      const paper=main.querySelector('.tree-paper');
      paper.classList.remove('growing');void paper.offsetWidth;paper.classList.add('growing');return;
    }
    if(key==='tree-evidence'){const card=main.querySelector('.inspector');card.tabIndex=-1;card.focus();return;}
    if(key==='lane-work')chooseWork(val);
    if(key==='cell'){const [family,cellYear]=val.split(':');chooseWork(routeWorks(family).find(w=>year(w)===cellYear).id);}
    if(key==='tick')chooseWork(dates[Number(val)].id);
    if(key==='step')step=Number(val);
    if(key==='next')step=(step+1)%4;
    if(key==='prev-page')shelfPage--;
    if(key==='next-page')shelfPage++;
    if(key==='retry')archiveError=undefined;
  }
  render();
}
main.addEventListener('click',e=>{const el=e.target.closest('[data-do]');if(el)handle(el.dataset.do,el.dataset.value);});
main.addEventListener('keydown',e=>{const el=e.target.closest('svg [role=button]');if(el&&['Enter',' '].includes(e.key)){e.preventDefault();handle(el.dataset.do,el.dataset.value);}});
main.addEventListener('input',e=>{
  if(e.target.id==='scrub')stop();
  if(e.target.id==='search'){query=e.target.value;shelfPage=0;document.querySelector('#results').innerHTML=filterRows();}
});
main.addEventListener('change',e=>{
  if(e.target.id==='scrub')handle('tick',e.target.value);
  if(e.target.id==='route')location.hash=`lab/${e.target.value}`;
  if(e.target.id==='scope'){shelfScope=e.target.value;shelfPage=0;render();}
});
document.querySelector('#language').addEventListener('click',()=>{
  zh=!zh;const u=new URL(location.href);if(zh)u.searchParams.set('lang','zh');else u.searchParams.delete('lang');
  history.replaceState(null,'',u);render();
});
document.querySelector('.skip').addEventListener('click',e=>{e.preventDefault();main.focus();});
window.addEventListener('hashchange',navigate);
navigate();
