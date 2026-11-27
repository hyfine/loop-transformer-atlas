import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {routes} from '../data/routes.mjs';
import {works} from '../data/works.mjs';
import {directions,dossiers} from '../data/frontier.mjs';
import {readRoute,views} from '../assets/navigation.mjs';
import {layers,story} from '../data/story.mjs';

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
  [r.title,r.question,r.criterion,r.feedback,r.contrast,...r.stages.flatMap(s=>[s.label,s.note])].forEach(bilingual);
  assert.equal(r.stages.length,4);
}
for(const w of works){
  assert(routes.some(r=>r.id===w.family));
  assert.match(w.date,/^\d{4}-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?$/);
  assert(w.links.length&&w.links.every(u=>new URL(u).protocol==='https:'));
  bilingual(w.finding);bilingual(w.limit);
  for(const view of Object.keys(views))
    assert.deepEqual(readRoute(`#${view}/${w.family}/${w.id}`),{tab:'map',view,work:w.id});
}
assert.deepEqual(readRoute('#swimlanes'),readRoute('#lanes'));
assert.deepEqual(readRoute('#library/all/recent'),{tab:'library',family:'',scope:'recent'});
assert.deepEqual(readRoute('#library/F04/reading'),{tab:'library',family:'F04',scope:'reading'});
assert.equal(readRoute('#library/F04/seed'),null);
assert.equal(readRoute('#tree/A/dory'),null);
for(const d of directions){
  [d.title,d.changed,d.observed,d.test].forEach(bilingual);
  assert(d.refs.length&&d.refs.every(id=>works.some(w=>w.id===id)),d.refs);
  if(d.extra)assert.equal(new URL(d.extra[1]).protocol,'https:');
}
for(const d of dossiers){
  assert(works.some(w=>w.id===d.id));
  [d.role,d.question,...d.path,d.state,d.budget,d.result,d.limit,d.locator,d.comparison,d.schedule,d.control].forEach(bilingual);
  assert.deepEqual(readRoute(`#frontier/${d.id}`),{tab:'frontier',model:d.id});
}
execFileSync(process.execPath,['scripts/casebook.mjs','--check'],{cwd:root});
execFileSync(process.execPath,['--check','assets/app.mjs'],{cwd:root});
const chapters=JSON.parse(read('data/survey-reader.json')), corpus=JSON.parse(read('data/survey-library.json'));
assert.deepEqual(chapters.map(c=>c.id),story.map(s=>s.id));
const familyIds=layers.flatMap(l=>l.ids);
unique(familyIds);unique(corpus.map(r=>r.id));assert.equal(corpus.length,376);
assert.equal(corpus.filter(r=>r.recent).length,43);
assert.equal(corpus.filter(r=>r.recent||r.reading).length,147);
for(const s of story){
  [s.title,s.idea,s.test].forEach(bilingual);
  assert.deepEqual(readRoute(`#survey/${s.id}`),{tab:'survey',section:s.id});
}
for(const id of familyIds){
  assert.equal(corpus.filter(r=>r.family===id&&r.reading).length,10,id);
  assert.deepEqual(readRoute(`#library/${id}`),{tab:'library',family:id});
}
const manifest=JSON.parse(read('survey/manifest.json'));
for(const row of manifest){
  const bytes=readFileSync(join(root,'survey',row.path));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),row.public_sha256,row.path);
  assert.equal(row.mode==='unchanged',row.source_sha256===row.public_sha256,row.path);
}
const plates=chapters.flatMap(c=>c.figures);
assert.equal(plates.length,41);unique(plates.map(f=>f.file));
const assets=plates.flatMap(f=>f.svg?[f.file,f.svg]:[f.file]).sort();
assert.deepEqual(assets,manifest.map(r=>r.path).filter(p=>p.startsWith('images/')).sort());
for(const c of chapters)assert.doesNotMatch(c.html,/<(?:script|iframe|object)\b|(?:src|href)="javascript:/i);
const docs=['README.md','README.zh-CN.md','CONTRIBUTING.md','EVIDENCE.md',
  ...readdirSync(join(root,'docs')).filter(p=>p.endsWith('.md')).map(p=>'docs/'+p)];
for(const name of docs){
  const md=read(name);
  for(const m of md.matchAll(/(?:\]\(|(?:src|href)=")([^)"\s]+)[)"]/g)){
    const u=m[1];
    if(u.startsWith('https://hyfine.github.io/loop-transformer-atlas/')){
      assert(readRoute(new URL(u).hash),u);
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
