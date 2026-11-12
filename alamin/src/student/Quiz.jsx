import {useState,useEffect,useRef} from "react";
import {h} from "../shared/html.js";
import {L,S,TOP,fmt,BOT,sets_of,mkQ,mkSets} from "../shared/data.js";

export function Quiz(p){
 const set=p.sets.find(s=>s.id==p.ctx.set),qq=p.qs.filter(q=>q.strand==set.strand&&q.status=="Approved");
 const [i,setI]=useState(0),[a,setA]=useState({}),[t,setT]=useState(0);
 useEffect(()=>{const x=setInterval(()=>setT(v=>v+1),1000);return()=>clearInterval(x)},[]);
 const q=qq[i];if(!q)return h`<p>No approved questions yet.</p>`;
 const submit=()=>{const sc=qq.filter(x=>a[x.id]===x.ans).length,r={set:set.id,score:sc,total:qq.length,date:new Date().toLocaleDateString("en-US",{month:"numeric",day:"numeric"}),sync:false,ans:a};
  p.setAtt([r,...p.att]);p.go("score",{set:set.id,res:r})};
 return h`<div class="row sp"><b>Q ${i+1} / ${qq.length}</b><span>⏱ ${fmt(t)}</span></div><div class="bar"><i style=${{width:(i+1)/qq.length*100+"%"}}></i></div>
 <div class="card"><span class="badge">${q.diff}</span><p>${q.text}</p></div>
 ${q.choices.map((c,k)=>h`<div class="ch ${a[q.id]===k?"sel":""}" onClick=${()=>setA({...a,[q.id]:k})}><span>${a[q.id]===k?"◉":"○"}</span><span>${"ABCD"[k]}. ${c}</span></div>`)}
 <div class="row"><button class="btn g" disabled=${i==0} onClick=${()=>setI(i-1)}>← ${p.T("Previous")}</button><button class="btn p g" disabled=${i==qq.length-1} onClick=${()=>setI(i+1)}>${p.T("Next")} →</button></div>
 <button class="btn" onClick=${submit}>${p.T("Submit quiz")}</button><span class="mu">Answers are saved on this device first (IndexedDB in the real build).</span>`;
}
