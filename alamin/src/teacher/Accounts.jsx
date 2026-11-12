import {useState,useEffect,useRef} from "react";
import {h} from "../shared/html.js";
import {L,S,TOP,fmt,BOT,sets_of,mkQ,mkSets} from "../shared/data.js";

export function Acc({acc,setAcc}){
 const [q,setQ]=useState(""),[r,setR]=useState("");
 return h`<h2>Account Management</h2><div class="row"><input class="in g" placeholder="Search…" value=${q} onInput=${e=>setQ(e.target.value)}/><select class="in" style=${{width:140}} onChange=${e=>setR(e.target.value)}><option value="">Role</option><option>Learner</option><option>Teacher</option></select></div>
 <div class="tw"><table><tr><th>Name</th><th>Role</th><th>Status</th><th></th></tr>${acc.filter(a=>a.n.toLowerCase().includes(q.toLowerCase())&&(!r||a.r==r)).map(a=>h`<tr><td>${a.n}</td><td>${a.r}</td><td>${a.s}</td><td><button class="btn" onClick=${()=>setAcc(acc.map(x=>x.n==a.n?{...x,s:x.s=="Active"?"Suspended":"Active"}:x))}>${a.s=="Active"?"Suspend":"Reactivate"}</button></td></tr>`)}</table></div>`;
}
