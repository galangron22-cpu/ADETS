import {useState,useEffect,useRef} from "react";
import {h} from "../shared/html.js";
import {L,S,TOP,fmt,BOT,sets_of,mkQ,mkSets} from "../shared/data.js";
import {Login} from "./Login.jsx";
import {Quiz} from "./Quiz.jsx";
import {Score} from "./Score.jsx";
import {Chat} from "./Chat.jsx";
import {Prog} from "./Progress.jsx";

export function StudentLayout(p){
 const {T,online,go,scr,user,att,saved}=p;
 const Lang=()=>h`<span class="pill" onClick=${()=>p.setLang(p.lang=="en"?"fil":"en")}>${p.lang=="en"?"EN | fil":"en | FIL"}</span>`;
 const Badge=()=>h`<span class="badge ${online?"on":"off"}">● ${T(online?"Online":"Offline")}</span>`;
 if(scr=="login"||!user)return h`<${Login} ...${p} Lang=${Lang}/>`;
 const nav=h`<div class="nav">${[["Home","home"],["Progress","progress"],["Chat","chat"],["Log out","profile"]].map(n=>h`<button class=${scr==n[1]?"on":""} onClick=${()=>n[1]=="profile"?(p.setUser(null),go("login",{})):go(n[1],{})}>${T(n[0])}</button>`)}</div>`;
 let body;
 if(scr=="home"){const pr=S.map(s=>{const a=att.filter(x=>sets_of(p,x.set)==s.id);return a.length?Math.round(a.reduce((t,x)=>t+x.score/x.total,0)/a.length*100):0});
  body=h`<div class="row sp"><h3>Hi, ${user}</h3><${Badge}/></div><div class="bar"><i style=${{width:Math.round(pr.reduce((a,b)=>a+b,0)/5)+"%"}}></i></div><span class="mu">${T("Overall progress")} ${Math.round(pr.reduce((a,b)=>a+b,0)/5)}%</span>
  ${S.map(s=>h`<div class="card" style=${{cursor:"pointer"}} onClick=${()=>go("topics",{strand:s.id})}><b>${s.name}</b><div class="bar" style=${{marginTop:8}}><i style=${{width:pr[s.id]+"%"}}></i></div></div>`)}`}
 else if(scr=="topics"){const st=S[p.ctx.strand],ss=p.sets.filter(x=>x.strand==st.id&&x.status=="Published");
  body=h`<div class="row sp"><b style=${{cursor:"pointer"}} onClick=${()=>go("home")}>← ${st.name}</b><${Lang}/></div><span class="mu">${T("Topics")}</span><div class="chips">${TOP[st.id].map(t=>h`<span class="badge">${t}</span>`)}</div>
  ${ss.map(s=>{const n=p.qs.filter(q=>q.strand==s.strand&&q.status=="Approved").length,sv=saved.includes(s.id);
   return h`<div class="card"><div class="row sp"><b>${s.title} v${s.ver}</b><span class="badge">${n} Qs</span></div><div class="row" style=${{marginTop:10}}>
   ${sv?h`<button class="btn g d" onClick=${()=>p.setSaved(saved.filter(x=>x!=s.id))}>${T("Remove")}</button>`:h`<button class="btn g" disabled=${!online} onClick=${()=>{p.setSaved([...saved,s.id]);p.say("Downloaded for offline")}}>⬇ ${T("Download for offline")}</button>`}
   <button class="btn p g" disabled=${!sv&&!online} onClick=${()=>go("quiz",{set:s.id})}>${T("Start")}</button></div>${sv&&h`<span class="mu">✓ ${T("Saved")}</span>`}</div>`})}`}
 else if(scr=="quiz")body=h`<${Quiz} ...${p} key=${p.ctx.set+"-"+(p.ctx.n||0)}/>`;
 else if(scr=="score")body=h`<${Score} ...${p}/>`;
 else if(scr=="chat")body=h`<${Chat} ...${p} Badge=${Badge}/>`;
 else if(scr=="progress")body=h`<${Prog} ...${p}/>`;
 return h`<div class="phone"><div class="scr">${body}</div>${nav}</div>`;
}
