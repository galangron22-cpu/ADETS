// STUDENT PORTAL (route: /) – React PWA for ALS learners
import {useState} from "react";
import {h} from "../shared/html.js";
import {usePersist} from "../shared/db.js";
import {useTheme,useToast} from "../shared/hooks.js";
import {L,mkQ,mkSets} from "../shared/data.js";
import {StudentLayout} from "./StudentLayout.jsx";
import "./student.css";
export default function StudentApp(){
 const [lang,setLang]=useState("en"),[online,setOnline]=useState(true),[,toggleTheme]=useTheme();
 const [user,setUser]=useState(null),[scr,setScr]=useState("login"),[ctx,setCtx]=useState({});
 const [saved,setSaved]=usePersist("al-saved",[1]),[att,setAtt]=usePersist("al-att",[{set:0,score:12,total:2,date:"10/12",sync:true}]);
 const [toast,say]=useToast();
 const T=k=>lang=="fil"&&L.fil[k]||k;
 const go=(s,c)=>{setScr(s);if(c)setCtx(c)};
 // qs/sets come from IndexedDB (downloaded via sync) in the real build
 const P={setUser,T,online,go,say,saved,setSaved,att,setAtt,qs:mkQ,sets:mkSets,user,ctx,lang,setLang};
 return h`<div>
  <div class="top"><b>ALAMIN · Student Portal</b>
   <span class="pill" onClick=${()=>setOnline(!online)}>${online?"● Online":"● Offline"} (demo toggle)</span>
   <span class="pill" onClick=${toggleTheme}>◐ Theme</span><a class="pill" href="/admin">Teacher portal →</a></div>
  <${StudentLayout} ...${P} scr=${scr}/>
  ${toast&&h`<div class="toast">${toast}</div>`}</div>`;
}
