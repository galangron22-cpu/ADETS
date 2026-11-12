import {useState,useEffect,useRef} from "react";
import {h} from "../shared/html.js";
import {L,S,TOP,fmt,BOT,sets_of,mkQ,mkSets} from "../shared/data.js";

export function Sets({sets,setSets,qs,say}){
 const [t,setT]=useState(""),[st,setSt]=useState(0);
 const add=()=>{if(!t)return;setSets([...sets,{id:sets.length,strand:+st,title:t,ver:1,status:"Draft"}]);setT("")};
 return h`<h2>Question Sets</h2><div class="row"><input class="in g" placeholder="Title" value=${t} onInput=${e=>setT(e.target.value)}/><select class="in" style=${{width:130}} onChange=${e=>setSt(e.target.value)}>${S.map(s=>h`<option value=${s.id}>${s.code}</option>`)}</select><button class="btn p" onClick=${add}>+ New set</button></div>
 <div class="tw"><table><tr><th>Title</th><th>Ver.</th><th>Status</th><th>Qs</th><th></th></tr>${sets.map(s=>h`<tr><td>${s.title}</td><td>${s.ver}</td><td>${s.status}</td><td>${qs.filter(q=>q.strand==s.strand&&q.status=="Approved").length}</td><td>${s.status=="Draft"?h`<button class="btn p" onClick=${()=>{setSets(sets.map(x=>x.id==s.id?{...x,status:"Published"}:x));say("Published – learners will receive it on next sync")}}>Publish</button>`:h`<button class="btn" onClick=${()=>setSets(sets.map(x=>x.id==s.id?{...x,ver:x.ver+1}:x))}>New version</button>`}</td></tr>`)}</table></div>
 <span class="mu">Sets are built from approved questions of the strand (drag-to-reorder is planned for the full build).</span>`;
}
