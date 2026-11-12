import {useState,useEffect,useRef} from "react";
import {h} from "../shared/html.js";
import {L,S,TOP,fmt,BOT,sets_of,mkQ,mkSets} from "../shared/data.js";

export function Login(p){
 const [reg,setReg]=useState(false),[em,setEm]=useState(""),[pw,setPw]=useState(""),[nm,setNm]=useState("");
 const ok=em.includes("@")&&pw.length>=4&&(!reg||nm);
 return h`<div class="phone"><div class="scr"><div class="row sp"><h2>ALAMIN</h2><${p.Lang}/></div>
 <div class="card" style=${{textAlign:"center",padding:28,fontSize:30}}>📖<div class="mu">Alamin</div></div>
 <input class="in" placeholder=${p.T("Email")} value=${em} onInput=${e=>setEm(e.target.value)}/>
 <input class="in" type="password" placeholder=${p.T("Password")} value=${pw} onInput=${e=>setPw(e.target.value)}/>
 ${reg&&h`<input class="in" placeholder=${p.T("Display name")} value=${nm} onInput=${e=>setNm(e.target.value)}/>`}
 <button class="btn p" disabled=${!ok} onClick=${()=>{p.setUser(reg?nm:em.split("@")[0]);p.go("home",{})}}>${p.T(reg?"Create account":"Login")}</button>
 <button class="btn" onClick=${()=>setReg(!reg)}>${reg?p.T("Login"):p.T("Create account")}</button>
 <span class="mu">Demo: any email with @ and a 4+ character password.</span></div></div>`;
}
