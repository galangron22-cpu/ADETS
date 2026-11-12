import {useState,useEffect,useRef} from "react";
import {h} from "../shared/html.js";
import {L,S,TOP,fmt,BOT,sets_of,mkQ,mkSets} from "../shared/data.js";

export function Editor({q,done}){
 const [d,setD]=useState(q),[rr,setRr]=useState(q.rej||"");const set=(k,v)=>setD({...d,[k]:v});
 return h`<h2>Question Editor / Review</h2><select class="in" value=${d.strand} onChange=${e=>set("strand",+e.target.value)}>${S.map(s=>h`<option value=${s.id}>${s.name}</option>`)}</select>
 <textarea class="in" rows="3" placeholder="question_text" value=${d.text} onInput=${e=>set("text",e.target.value)}></textarea>
 ${d.choices.map((c,k)=>h`<div class="row"><span onClick=${()=>set("ans",k)} style=${{cursor:"pointer"}}>${d.ans==k?"◉":"○"} ${"ABCD"[k]}</span><input class="in g" placeholder="choice_text" value=${c} onInput=${e=>set("choices",d.choices.map((x,j)=>j==k?e.target.value:x))}/></div>`)}
 <span class="mu">◉ = is_correct</span><input class="in" placeholder="explanation" value=${d.exp} onInput=${e=>set("exp",e.target.value)}/>
 <div class="row"><select class="in g" value=${d.diff} onChange=${e=>set("diff",e.target.value)}>${["Easy","Medium","Hard"].map(x=>h`<option>${x}</option>`)}</select><input class="in g" placeholder="Rejection reason (if rejected)" value=${rr} onInput=${e=>setRr(e.target.value)}/></div>
 <div class="row"><button class="btn d g" disabled=${!rr} onClick=${()=>done({...d,status:"Rejected",rej:rr})}>Reject</button><button class="btn g" onClick=${()=>done({...d,status:"Draft"})}>Save draft</button><button class="btn p g" disabled=${!d.text||d.choices.some(c=>!c)} onClick=${()=>done({...d,status:"Approved"})}>Approve</button></div><button class="btn" onClick=${()=>done(null)}>Cancel</button>`;
}
