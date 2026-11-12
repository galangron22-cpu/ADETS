import {useState,useEffect,useRef} from "react";
import {h} from "../shared/html.js";
import {L,S,TOP,fmt,BOT,sets_of,mkQ,mkSets} from "../shared/data.js";
import {Dash} from "./Dashboard.jsx";
import {QBank} from "./QuestionBank.jsx";
import {Editor} from "./QuestionEditor.jsx";
import {Sets} from "./QuestionSets.jsx";
import {Acc} from "./Accounts.jsx";
import {Rep} from "./Reports.jsx";

export function TeacherLayout({qs,setQs,sets,setSets,acc,setAcc,att,say}){
 const [pg,setPg]=useState("Dashboard"),[ed,setEd]=useState(null),[f,setF]=useState({q:"",s:"",st:""});
 return h`<div class="adm"><div class="side"><b style=${{marginBottom:8}}>ALAMIN Admin</b>${["Dashboard","Questions","Question Sets","Accounts","Reports"].map(n=>h`<button class=${pg==n?"on":""} onClick=${()=>{setPg(n);setEd(null)}}>${n}</button>`)}</div>
 <div class="main">${pg=="Dashboard"?h`<${Dash} qs=${qs} att=${att} acc=${acc}/>`:pg=="Questions"?(ed?h`<${Editor} q=${ed} done=${(n)=>{if(n)setQs(qs.map(x=>x.id==n.id?n:x));setEd(null);n&&say("Saved: "+n.status)}}/>`:h`<${QBank} qs=${qs} f=${f} setF=${setF} setEd=${setEd} gen=${()=>{setQs([...qs,{id:qs.length,strand:2,text:"AI draft: What is 12 × 8?",choices:["86","96","106","98"],ans:1,exp:"12 × 8 = 96.",diff:"Easy",src:"AI",status:"Pending"}]);say("AI generated 1 draft")}} nw=${()=>setEd({id:qs.length,strand:0,text:"",choices:["","","",""],ans:0,exp:"",diff:"Easy",src:"Manual",status:"Draft",isNew:1})}/>`):pg=="Question Sets"?h`<${Sets} sets=${sets} setSets=${setSets} qs=${qs} say=${say}/>`:pg=="Accounts"?h`<${Acc} acc=${acc} setAcc=${setAcc}/>`:h`<${Rep} att=${att} say=${say} sets=${sets}/>`}</div></div>`;
}
