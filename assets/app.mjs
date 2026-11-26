import {works} from '../data/works.mjs';
import {routes} from '../data/routes.mjs';

const repo = 'https://github.com/hyfine/loop-transformer-atlas/blob/main/';
const chapters = {overview:['Overview','总览'],tree:['Family tree','家族树'],lanes:['Swimlanes','泳道'],time:['Trajectories','时间轨迹'],lab:['Mechanism lab','方法实验室'],library:['Library','文献库']};
const dates = [...works].sort((a,b)=>a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
const families = Object.fromEntries(routes.map(r=>[r.id,r]));
const byId = Object.fromEntries(works.map(w=>[w.id,w]));
const main = document.querySelector('main');
let zh = new URL(location.href).searchParams.get('lang') === 'zh';
let tab, family = 'B', selected = 'huginn', cellYear = '2025', step = 0, tick = 0, timer, rounds = 2;
let archive, archiveError, loading, shelfPage = 0, query = '', shelfScope = 'all';
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
const routeSelect = ()=>`<label>${tr('Route','路线')} <select id="route">${options(routes.map(r=>[r.id,`${r.id} · ${t(r.title)}`]),family)}</select></label>`;
const legend = ()=>`<div class="legend">${routes.map(r=>`<span style="--accent:${r.color}"><b>● ${r.id}</b> ${t(r.title)}</span>`).join('')}</div>`;
const inspector = w=>`<article class="inspector" style="--accent:${families[w.family].color}"><div class="tag">${w.family} / ${w.date} · ${esc(w.venue)}</div><h3>${esc(w.name)}</h3><p>${esc(t(w.finding))}</p><p class="hint"><b>${tr('Read with care','解读边界')}:</b> ${esc(t(w.limit))}</p>${sources(w)}</article>`;
const svg = (w,h,label,body)=>`<div class="chart" tabindex="0" aria-label="${esc(label)}"><svg viewBox="0 0 ${w} ${h}" role="group" aria-label="${esc(label)}">${body}</svg></div>`;
const line = (d,col,extra='')=>`<path d="${d}" fill="none" stroke="${col}" stroke-width="2" ${extra}/>`;
const txt = (x,y,s,attrs='')=>`<text x="${x}" y="${y}" ${attrs}>${esc(s)}</text>`;
const action = (key,value,label,body)=>`<g tabindex="0" role="button" aria-label="${esc(label)}" data-do="${key}" data-value="${esc(value)}"><title>${esc(label)}</title>${body}</g>`;
const rect = (x,y,w,h,color,active=false)=>`<rect class="hit${active?' active':''}" x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#172e38" stroke="${color}"/>`;
const circle = (x,y,r,color,active=false)=>`<circle class="hit${active?' active':''}" cx="${x}" cy="${y}" r="${r}" fill="${color}" stroke="#13242e"/>`;
function stop(){clearInterval(timer);timer=undefined;}

function overview(){
  const tags = ['molt','glm','loopres','loopcache','sense','arloop','dory'];
  return `<div class="split"><div>${kicker('RESEARCH ATLAS / VOL. 07')}<h1>${tr('One block.<br><em>Many depths.</em>','一组权重，<br><em>多轮计算。</em>')}</h1>
  <p class="lede">${tr('A Transformer can spend more compute before it writes its next token. Follow what changes inside the loop, what stays shared, and what one more pass actually costs.','Transformer 可以在写出下一个 token 前多算几轮。沿着环路看清：什么在变化，什么保持共享，再算一轮究竟要付出什么。')}</p>
  <div class="tools"><a class="primary" href="#tree">${tr('Explore the tree →','展开家族树 →')}</a><a href="${repo}docs/guide.${lang()}.md">${tr('Read the field guide','阅读技术导读')} ↗</a></div></div>
  <div class="plate">${kicker('01 / DEPTH COUNTER')}<img src="assets/circuit.svg" alt="${tr('Prelude, recurrent core with feedback, and coda','前段编码、带状态反馈的共享核心与输出尾段')}">
  <div class="tools">${tr('Core visits','核心访问次数')} ${[1,2,4].map(r=>btn('round',`×${r}`,`data-value="${r}" aria-pressed="${r===rounds}"`)).join('')}</div>
  <div class="numbers"><span><b>32</b><small>${tr('distinct layers','独立层数')}</small></span><span><b>${4+24*rounds+4}</b><small>${tr('layer executions','执行层次')}</small></span><span><b>×${rounds}</b><small>${tr('middle block','中间块')}</small></span></div>
  <small>${tr('4 + 24R + 4. R=2 is the released','4 + 24R + 4。R=2 对应实际发布的')} <a href="#tree/B/sense">SenseNova-Loop-9B</a>${tr('; the other settings are arithmetic examples, not measured models.','；其他设置仅演示计算关系，并非实测模型。')}</small></div></div>
  <section>${heading('02',tr('Where to start','从哪个问题读起'),tr('Six routes into the same design space. Each opens a worked example with a playable dataflow.','六条路线对应六个设计问题。每条路线都可打开一个代表作，逐步查看数据流。'))}<div class="grid">${routes.map(r=>`<a class="card" style="--accent:${r.color}" href="#lab/${r.id}"><span class="tag">${r.id} / ${routeWorks(r.id).length}</span><h3>${t(r.title)}</h3><p>${t(r.question)}</p></a>`).join('')}</div></section>
  <section>${heading('03',tr('Frontier notebook','前沿手记'),tr('November 2026 · New mechanisms and releases, not a leaderboard. Select a record for its evidence boundary.','2026 年 11 月 · 这里按新机制与新发布选录，不按跑分排名。点开条目可见证据边界。'))}<div class="grid">${tags.map(id=>{const w=byId[id];return `<a class="card" style="--accent:${families[w.family].color}" href="#tree/${w.family}/${id}"><span class="meta">${w.date} · ${esc(w.venue)}</span><h3>${w.name} ↗</h3><p>${t(w.finding)}</p></a>`}).join('')}</div></section>`;
}

function tree(){
  const list=routeWorks(family), branchY=i=>42+i*53, leafY=i=>30+i*40;
  const h=Math.max(345,leafY(list.length)+12), cy=h/2;
  let g=txt(22,cy-22,tr('REPEATED STATE','重复更新状态'),'class="small"')+rect(18,cy-12,106,42,'#74dfde')+txt(71,cy+16,'Fθ','text-anchor="middle"');
  routes.forEach((r,i)=>{
    const y=branchY(i);
    g+=line(`M124 ${cy+9} C160 ${cy+9} 150 ${y} 190 ${y}`,r.color,`opacity="${family===r.id?1:.42}"`);
    g+=action('family',r.id,t(r.title),rect(190,y-17,250,35,r.color,family===r.id)+txt(203,y+5,`${r.id} · ${t(r.title)} (${routeWorks(r.id).length})`));
  });
  const startY=branchY(routes.findIndex(r=>r.id===family));
  list.forEach((w,i)=>{
    const y=leafY(i),r=families[family];
    g+=`<g class="reveal">${line(`M440 ${startY} C490 ${startY} 490 ${y} 545 ${y}`,r.color)}
    ${action('work',w.id,w.name,rect(545,y-15,290,31,r.color,w.id===selected)+txt(555,y+5,w.name,'font-size="14"'))}</g>`;
  });
  return heading('04',tr('The family tree','方法家族树'),tr('Select a branch, then a leaf. Branches group the question each work answers; they are not claims of academic descent.','先选分支，再点叶子。分支表示作品主要回答的问题，并不表示论文之间存在直接传承。'))+
    `<div class="plate">${svg(856,h,tr('Family membership','家族归属'),g)}</div>${inspector(byId[selected])}<a class="boxlink" href="#lab/${family}">${tr('Play this family’s mechanism →','播放该家族的代表机制 →')}</a>`;
}

function lanes(){
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
  return heading('05',tr('A lane for each question','每个问题一条泳道'),tr('Rows are families, columns are represented years. Select a numbered stop to see every record in that cell. Size counts records, not importance.','行是家族，列是有收录的年份。选择有数字的站点可看该格的全部作品；大小表示收录数量，不表示重要性。'))+
    `<div class="plate">${svg(x(years.length-1)+55,295,tr('Family by year','家族与年份交叉图'),g)}</div><div class="tools">${group.map(w=>btn('lane-work',w.name,`data-value="${w.id}" aria-pressed="${selected===w.id}"`)).join('')}</div>${inspector(byId[selected])}`;
}

function trajectory(){
  const w=dates[tick], x=i=>60+i*26,y=r=>44+routes.findIndex(f=>f.id===r)*36;
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
  return heading('06',tr('Replay the research record','回放研究轨迹'),tr('Follow dated evidence from ACT to MoLT. Horizontal distance is one publication or release, not elapsed time. Items sharing a month need not have appeared in this order.','从 ACT 到 MoLT，按证据日期回放。横向每步是一个论文或发布事件，不代表等长时间；同月条目不保证先后。'))+
    `<div class="plate">${legend()}${svg(x(dates.length-1)+30,248,tr('Chronological trajectories','各路线时间轨迹'),g)}
    <div class="tools">${btn('play',timer?tr('Pause','暂停'):tr('Play','播放'))}<label>${tr('Record','事件')} <input id="scrub" type="range" min="0" max="${dates.length-1}" value="${tick}"> ${tick+1}/${dates.length}</label></div></div>${inspector(w)}`;
}

function lab(){
  const r=families[family], w=byId[r.example], pos=[115,315,515,715];
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
    <p class="readout">${t(r.stages[step].note)}</p><p class="hint">${t(r.contrast)}</p></div>${inspector(w)}<a href="${repo}docs/routes.${lang()}.md#route-${r.id.toLowerCase()}">${tr('Read the full route and its comparison cases →','阅读完整路线与同类对照 →')}</a>`;
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
  document.documentElement.lang=zh?'zh-CN':'en';
  document.title=`${t(chapters[tab])} · Loop Transformer Atlas`;
  document.querySelector('#language').textContent=tr('中文','English');
  document.querySelector('#nav').innerHTML=Object.entries(chapters).map(([id,p])=>`<a href="#${id}" ${id===tab?'aria-current="page"':''}>${t(p)}</a>`).join('');
  main.innerHTML=({overview,tree,lanes,time:trajectory,lab,library})[tab]();
  if(id)document.getElementById(id)?.focus({preventScroll:true});
  else if(cmd)Array.from(main.querySelectorAll('[data-do]')).find(el=>el.dataset.do===cmd&&el.dataset.value===value)?.focus({preventScroll:true});
}
function navigate(){
  const previous=tab;
  stop();const [page,f,id]=location.hash.slice(1).split('/');
  tab=Object.hasOwn(chapters,page)?page:'overview';
  if(families[f])family=f;
  selected=byId[id]?.family===family?id:families[family].example;
  cellYear=year(byId[selected]);step=0;
  render();
  if(previous&&previous!==tab){main.focus({preventScroll:true});window.scrollTo(0,0);}
}
function handle(key,val){
  if(key==='play'){
    if(timer)stop();
    else{
      if(tab==='time'&&tick===dates.length-1)tick=0;
      if(tab==='lab'&&step===3)step=0;
      timer=setInterval(()=>{
        if(tab==='time')tick++;else step++;
        if((tab==='time'&&tick===dates.length-1)||(tab==='lab'&&step===3))stop();
        render();
      },tab==='time'?950:2600);
    }
  }else{
    stop();
    if(key==='round')rounds=Number(val);
    if(key==='family'){location.hash=`tree/${val}`;return;}
    if(key==='work'){location.hash=`tree/${family}/${val}`;return;}
    if(key==='lane-work')selected=val;
    if(key==='cell'){[family,cellYear]=val.split(':');selected=routeWorks(family).find(w=>year(w)===cellYear).id;}
    if(key==='tick')tick=Number(val);
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
