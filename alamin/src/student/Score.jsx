import {useState,useEffect,useRef} from "react";
import {h} from "../shared/html.js";
import {L,S,TOP,fmt,BOT,sets_of,mkQ,mkSets} from "../shared/data.js";

export function Score(p){
 const r=p.ctx.res,set=p.sets.find(s=>s.id==r.set),qq=p.qs.filter(q=>q.strand==set.strand&&q.status=="Approved");
 return h`<h2>${p.T("Results")}</h2><div class="card" style=${{textAlign:"center",fontWeight:700,fontSize:20}}>Score ${r.score} / ${r.total} (${Math.round(r.score/r.total*100)}%)</div>
 <div class="card"><b>${p.T("Review answers")}</b>${qq.map((q,k)=>{const ok=r.ans[q.id]===q.ans;return h`<div style=${{marginTop:10}}><div class="row sp"><span>Q${k+1} ${ok?"✓":"✗"} Your answer: ${"ABCD"[r.ans[q.id]]||"–"}</span><span class="badge ${ok?"on":"off"}">${ok?"Correct":"Correct: "+"ABCD"[q.ans]}</span></div><div class="mu">${q.exp}</div></div>`})}</div>
 <button class="btn p" onClick=${()=>p.go("chat",{ask:"Explain: "+qq[0].text})}>${p.T("Ask AI about this question")}</button>
 <div class="row"><button class="btn g" onClick=${()=>p.go("quiz",{set:set.id,n:Math.random()})}>${p.T("Retake")}</button><button class="btn g" onClick=${()=>p.go("home")}>${p.T("Home")}</button></div>`;
}
