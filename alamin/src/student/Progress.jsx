import {useState,useEffect,useRef} from "react";
import {h} from "../shared/html.js";
import {L,S,TOP,fmt,BOT,sets_of,mkQ,mkSets} from "../shared/data.js";

export function Prog(p){
 const av=S.map(s=>{const a=p.att.filter(x=>sets_of(p,x.set)==s.id);return a.length?Math.round(a.reduce((t,x)=>t+x.score/x.total,0)/a.length*100):0}),pend=p.att.filter(x=>!x.sync).length;
 return h`<div class="row sp"><h2>${p.T("My Progress")}</h2><button class="btn" disabled=${!p.online} onClick=${()=>{p.setAtt(p.att.map(x=>({...x,sync:true})));p.say("Synced to server")}}>⟳ ${p.T("Sync")}</button></div>
 <div class="cols">${av.map((v,k)=>h`<div><i style=${{height:v+"%"}}></i>LS${k+1}</div>`)}</div><span class="mu">Avg score per strand</span>
 <table><tr><th>Set</th><th>Score</th><th>Date</th></tr>${p.att.map(x=>h`<tr><td>${(p.sets.find(s=>s.id==x.set)||{}).title}</td><td>${x.score}/${x.total}</td><td>${x.date}</td></tr>`)}</table>
 ${pend>0&&h`<div class="card mu">${pend} attempt${pend>1?"s":""} pending upload – will sync when online.</div>`}`;
}
