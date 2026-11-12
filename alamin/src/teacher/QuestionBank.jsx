import {useState,useEffect,useRef} from "react";
import {h} from "../shared/html.js";
import {L,S,TOP,fmt,BOT,sets_of,mkQ,mkSets} from "../shared/data.js";

export function QBank({qs,f,setF,setEd,gen,nw}){
 const list=qs.filter(q=>q.text.toLowerCase().includes(f.q.toLowerCase())&&(!f.s||q.strand==f.s)&&(!f.st||q.status==f.st));
 return h`<div class="row" style=${{flexWrap:"wrap"}}><h2 class="g">Question Bank &amp; Review Queue</h2><button class="btn p" onClick=${nw}>+ New</button><button class="btn" onClick=${gen}>✨ Generate (AI)</button></div>
 <div class="row"><input class="in g" placeholder="Search…" value=${f.q} onInput=${e=>setF({...f,q:e.target.value})}/><select class="in" style=${{width:170}} onChange=${e=>setF({...f,s:e.target.value})}><option value="">Strand</option>${S.map(s=>h`<option value=${s.id}>${s.code}</option>`)}</select>
 <select class="in" style=${{width:140}} onChange=${e=>setF({...f,st:e.target.value})}><option value="">Status</option>${["Draft","Pending","Approved","Rejected"].map(s=>h`<option>${s}</option>`)}</select></div>
 <div class="tw"><table><tr><th>Question</th><th>Source</th><th>Status</th><th></th></tr>${list.map(q=>h`<tr><td>${q.text.slice(0,60)}</td><td>${q.src}</td><td>${q.status}</td><td><button class="btn" onClick=${()=>setEd(q)}>${q.status=="Pending"?"Review":q.status=="Approved"?"Edit":"View"}</button></td></tr>`)}</table></div>`;
}
