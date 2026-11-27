import {routes} from '../data/routes.mjs';
import {works} from '../data/works.mjs';
import {dossiers} from '../data/frontier.mjs';
import {story} from '../data/story.mjs';

export const chapters = {overview:['Start here','阅读起点'],survey:['Illustrated survey','图解综述'],map:['Interactive map','交互地图'],lab:['Mechanism lab','方法实验室'],frontier:['Model cases','模型深读'],directions:['Frontiers','前沿方向'],library:['Paper library','论文库']};
export const views = {tree:['Family tree','家族树'],lanes:['Swimlanes','泳道'],time:['Timeline','时间轨迹']};
const aliases = {'family-tree':'tree',swimlanes:'lanes',trajectory:'time'};

export function readRoute(hash){
  const [page,key,id,...rest]=hash.replace(/^#/,'').split('/');
  if(rest.length)return null;
  if(page==='survey'&&!id&&(!key||story.some(s=>s.id===key)))return {tab:'survey',section:key||'digest'};
  if(page==='library'&&key){
    const family=key==='all'?'':key;
    if(family&&!story.some(s=>s.id===family&&/^F\d\d$/.test(family)))return null;
    if(id&&!['survey','reading','recent','cards','seed'].includes(id))return null;
    if(family&&['cards','seed'].includes(id))return null;
    return id?{tab:'library',family,scope:id}:{tab:'library',family};
  }
  const view=Object.hasOwn(aliases,page)?aliases[page]:page;
  if(Object.hasOwn(views,view)){
    const route=routes.find(r=>r.id===key);
    if((key&&!route)||(id&&!works.some(w=>w.id===id&&w.family===key)))return null;
    return {tab:'map',view,work:id||route?.example};
  }
  if(page==='lab'&&!id&&(!key||routes.some(r=>r.id===key)))return {tab:'lab',family:key};
  if(page==='frontier'&&!id&&(!key||dossiers.some(d=>d.id===key)))return {tab:'frontier',model:key||dossiers[0].id};
  if(!key&&(!page||Object.hasOwn(chapters,page)))return {tab:page||'overview'};
  return null;
}
