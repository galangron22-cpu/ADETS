import {useState,useEffect,useRef} from "react";
import {h} from "../shared/html.js";
import {L,S,TOP,fmt,BOT,sets_of,mkQ,mkSets} from "../shared/data.js";

export function Chat(p){
 const [m,setM]=useState([{b:1,t:"Kumusta! Ask me about your ALS strands."}]),[v,setV]=useState(p.ctx.ask||""),end=useRef();
 useEffect(()=>{end.current&&end.current.scrollIntoView()},[m]);
 const send=()=>{if(!v.trim()||!p.online)return;setM(x=>[...x,{t:v}]);setV("");setTimeout(()=>setM(x=>[...x,{b:1,t:BOT[x.length%3]}]),700)};
 return h`<div class="row sp"><b>← ${p.T("Study Assistant")}</b><${p.Badge}/></div>
 ${m.map(x=>h`<div class="msg ${x.b?"b":"u"}">${x.t}</div>`)}
 ${!p.online&&h`<div class="card mu">Chatbot unavailable offline – connect to internet.</div>`}<div ref=${end}></div>
 <div class="row"><input class="in g" placeholder="Type a message…" value=${v} onInput=${e=>setV(e.target.value)} onKeyDown=${e=>e.key=="Enter"&&send()}/><button class="btn p" disabled=${!p.online} onClick=${send}>${p.T("Send")}</button></div>
 <span class="mu">Limited to ALS learning strands. Demo replies are canned; the real build calls the LLM API via the backend.</span>`;
}
