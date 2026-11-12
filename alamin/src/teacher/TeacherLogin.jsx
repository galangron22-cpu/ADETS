import {useState} from "react";
import {h} from "../shared/html.js";
export function TeacherLogin({onLogin}){
 const [em,setEm]=useState(""),[pw,setPw]=useState("");
 return h`<div class="card" style=${{maxWidth:380,margin:"60px auto",display:"flex",flexDirection:"column",gap:12}}><h2>Teacher / Admin Sign in</h2>
 <input class="in" placeholder="Email" value=${em} onInput=${e=>setEm(e.target.value)}/>
 <input class="in" type="password" placeholder="Password" value=${pw} onInput=${e=>setPw(e.target.value)}/>
 <button class="btn p" disabled=${!em.includes("@")||pw.length<4} onClick=${onLogin}>Log in</button>
 <span class="mu">Demo: any email with @ and a 4+ character password. The real build checks the profiles.role field (teacher/admin) via Supabase Auth.</span></div>`;
}
