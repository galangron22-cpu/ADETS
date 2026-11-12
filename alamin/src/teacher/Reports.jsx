import {useState,useEffect,useRef} from "react";
import {h} from "../shared/html.js";
import {L,S,TOP,fmt,BOT,sets_of,mkQ,mkSets} from "../shared/data.js";

export function Rep({att,say,sets}){
 const [s,setS]=useState("");const rows=[["Juan D.",5,78],["Ana L.",3,64],["Mark R.",7,81]];
 return h`<h2>Reports &amp; Export</h2><div class="row"><select class="in g" onChange=${e=>setS(e.target.value)}><option value="">Strand</option>${S.map(x=>h`<option>${x.code}</option>`)}</select><input class="in g" type="date"/><select class="in g"><option>Learner</option>${rows.map(r=>h`<option>${r[0]}</option>`)}</select></div>
 <div class="cols">${[78,84,60].map((v,k)=>h`<div><i style=${{height:v+"%"}}></i>Week ${k+1}</div>`)}</div>
 <div class="tw"><table><tr><th>Learner</th><th>Attempts</th><th>Avg</th></tr>${rows.map(r=>h`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}%</td></tr>`)}</table></div>
 <div class="row"><button class="btn g" onClick=${()=>say("CSV export (demo)")}>Export CSV</button><button class="btn p g" onClick=${()=>say("PDF export (demo)")}>Export PDF</button></div>`;
}
