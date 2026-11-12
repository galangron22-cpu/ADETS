// TEACHER / ADMIN PORTAL (route: /admin) – desktop web
import {useState} from "react";
import {h} from "../shared/html.js";
import {useTheme,useToast} from "../shared/hooks.js";
import {mkQ,mkSets} from "../shared/data.js";
import {TeacherLayout} from "./TeacherLayout.jsx";
import {TeacherLogin} from "./TeacherLogin.jsx";
import "./teacher.css";
export default function TeacherApp(){
 const [in_,setIn]=useState(false),[,toggleTheme]=useTheme(),[toast,say]=useToast();
 const [qs,setQs]=useState(mkQ),[sets,setSets]=useState(mkSets),[acc,setAcc]=useState([{n:"Juan D.",r:"Learner",s:"Active"},{n:"Ms. Reyes",r:"Teacher",s:"Active"},{n:"Ana L.",r:"Learner",s:"Active"}]);
 const att=[{set:0,score:12,total:2,date:"10/12",sync:true}];
 return h`<div>
  <div class="top"><b>ALAMIN · Teacher / Admin Portal</b><span class="pill" onClick=${toggleTheme}>◐ Theme</span>
   ${in_&&h`<span class="pill" onClick=${()=>setIn(false)}>Log out</span>`}<a class="pill" href="/">← Student portal</a></div>
  ${in_?h`<${TeacherLayout} qs=${qs} setQs=${setQs} sets=${sets} setSets=${setSets} acc=${acc} setAcc=${setAcc} att=${att} say=${say}/>`:h`<${TeacherLogin} onLogin=${()=>setIn(true)}/>`}
  ${toast&&h`<div class="toast">${toast}</div>`}</div>`;
}
