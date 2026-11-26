import {routes} from '../data/routes.mjs';
import {works} from '../data/works.mjs';
import {dossiers} from '../data/frontier.mjs';

export const chapters = {overview:['Overview','总览'],map:['Research map','研究地图'],directions:['Research directions','前沿技术方向'],frontier:['Model deep dives','前沿模型深读'],lab:['Mechanism lab','方法实验室'],library:['Library','文献库']};
export const views = {tree:['Family tree','家族树'],lanes:['Swimlanes','泳道'],time:['Timeline','时间轨迹']};
const aliases = {'family-tree':'tree',swimlanes:'lanes',trajectory:'time'};

export function readRoute(hash){
  const [page,key,id,...rest]=hash.replace(/^#/,'').split('/');
  if(rest.length)return null;
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
