import {useState,useEffect,useRef} from "react";
import {h} from "../shared/html.js";
import {L,S,TOP,fmt,BOT,sets_of,mkQ,mkSets} from "../shared/data.js";

export const Dash=({qs,att,acc})=>h`<h2>Dashboard</h2><div class="stats"><div class="card stat">Learners<b>${acc.filter(a=>a.r=="Learner").length+117}</b></div><div class="card stat">Pending Qs<b>${qs.filter(q=>q.status=="Pending").length+13}</b></div><div class="card stat">Avg score<b>72%</b></div></div>
<b>Performance per strand</b><div class="cols">${[78,70,58,66,74].map((v,k)=>h`<div><i style=${{height:v+"%"}}></i>${S[k].code} ${v}%</div>`)}</div>`;
