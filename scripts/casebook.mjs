import {readFileSync, writeFileSync} from 'node:fs';
import {works} from '../data/works.mjs';
import {routes} from '../data/routes.mjs';

for (const [i,lang] of ['en','zh'].entries()) {
  const t=(en,cn)=>i?cn:en;
  const links=w=>w.links.map(u=>`[${new URL(u).hostname}${u.endsWith('config.json')?' · config':''}](${u})`).join(' · ');
  const body=routes.map(r=>{
    const rep=works.find(w=>w.id===r.example);
    const stages=r.stages.map((s,n)=>`${n+1}. **${s.label[i]}** — ${s.note[i]}`).join('\n');
    const records=works.filter(w=>w.family===r.id).map(w=>`### ${w.name}\n\n${w.date} · ${w.venue} · ${links(w)}\n\n${w.finding[i]}\n\n**${t('Evidence boundary','证据边界')}:** ${w.limit[i]}`).join('\n\n');
    return `<a id="route-${r.id.toLowerCase()}"></a>\n\n## ${r.id} · ${r.title[i]}\n\n${r.question[i]}\n\n**${t('Worked path','代表路径')}: ${rep.name}.** [${t('Play the diagram','播放流程图')}](https://hyfine.github.io/loop-transformer-atlas/${i?'?lang=zh':''}#lab/${r.id})\n\n${stages}\n\n**${t('Feedback edge','反馈边')}:** ${r.feedback[i]}.\n\n${r.contrast[i]}\n\n${records}`;
  }).join('\n\n---\n\n');
  const page=`# ${t('Six routes through recurrent depth','循环深度的六条技术路线')}\n\n[${t('简体中文','English')}](routes.${i?'en':'zh'}.md) · [${t('Reading guide','技术导读')}](guide.${lang}.md)\n\n${t('The animated paths are original explanatory diagrams. Each follows one named representative; the other records show where the analogy breaks. Dates are those of the indexed preprint or public release.','所有动态流程图均为原创示意，每条路径只追踪一部代表作；其他案例用来说明类比在何处失效。日期取所列预印本或公开发布事件。')}\n\n${body}\n`;
  const path=new URL(`../docs/routes.${lang}.md`,import.meta.url);
  if(process.argv.includes('--check')){
    if(readFileSync(path,'utf8')!==page)throw new Error(`Stale casebook: ${path.pathname}`);
  } else writeFileSync(path,page);
}
