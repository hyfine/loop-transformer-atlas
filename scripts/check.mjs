import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {routes} from '../data/routes.mjs';
import {works} from '../data/works.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=name=>readFileSync(join(root,name),'utf8');
const unique=values=>assert.equal(new Set(values).size,values.length,'Duplicate ID');
const bilingual=pair=>{
  assert.equal(pair.length,2);
  assert.match(pair[0],/[A-Za-z]/);
  assert.match(pair[1],/\p{Script=Han}/u);
};
unique(works.map(w=>w.id));unique(routes.map(r=>r.id));
for(const r of routes){
  assert(works.some(w=>w.id===r.example&&w.family===r.id));
  [r.title,r.question,r.feedback,r.contrast,...r.stages.flatMap(s=>[s.label,s.note])].forEach(bilingual);
  assert.equal(r.stages.length,4);
}
for(const w of works){
  assert(routes.some(r=>r.id===w.family));
  assert.match(w.date,/^\d{4}-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?$/);
  assert(w.links.length&&w.links.every(u=>new URL(u).protocol==='https:'));
  bilingual(w.finding);bilingual(w.limit);
}
execFileSync(process.execPath,['scripts/casebook.mjs','--check'],{cwd:root});
execFileSync(process.execPath,['--check','assets/app.mjs'],{cwd:root});
const docs=['README.md','README.zh-CN.md','CONTRIBUTING.md','EVIDENCE.md',
  ...readdirSync(join(root,'docs')).filter(p=>p.endsWith('.md')).map(p=>'docs/'+p)];
for(const name of docs){
  const md=read(name);
  for(const m of md.matchAll(/(?:\]\(|(?:src|href)=")([^)"\s]+)[)"]/g)){
    const u=m[1];
    if(u.startsWith('https://hyfine.github.io/loop-transformer-atlas/')){
      const url=new URL(u), [tab,f,id]=url.hash.slice(1).split('/');
      if(tab)assert(['overview','tree','lanes','time','lab','library'].includes(tab),u);
      if(f)assert(routes.some(r=>r.id===f),u);
      if(id)assert(works.some(w=>w.id===id&&w.family===f),u);
    }else if(!/^[a-z]+:/i.test(u)){
      const [file,frag]=u.split('#'), target=file?resolve(root,dirname(name),file):join(root,name);
      assert(existsSync(target),`${name}: missing ${u}`);
      if(frag)assert(readFileSync(target,'utf8').includes(`id="${frag}"`),`${name}: missing #${frag}`);
    }
  }
}
const inventory=JSON.parse(read('data/seed-files.json')), index=JSON.parse(read('data/seed-index.json'));
const visits=read('data/visits.csv').trimEnd().split(/\r?\n/).slice(1);
assert.equal(visits.length,Object.values(inventory.outcomes).reduce((a,b)=>a+b,0));
assert(inventory.local.every(([, ,status])=>status==='exists'));
for(const w of index)assert(visits.some(line=>line.startsWith(w.url+',')),`Missing seed visit: ${w.url}`);
assert(read('README.md').includes(`${works.length} curated`));
assert(read('README.zh-CN.md').includes(`${works.length} 条`));
assert(read('EVIDENCE.md').includes(`**${visits.length}**`));
console.log(`OK: ${works.length} curated cases, ${routes.length} bilingual flows, ${index.length} indexed works, ${visits.length} visit dispositions; books and local links consistent.`);
