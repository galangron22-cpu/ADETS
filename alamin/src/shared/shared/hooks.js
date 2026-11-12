import {useState,useEffect} from "react";
export function useTheme(){
 const [t,setT]=useState("");
 useEffect(()=>{if(t)document.documentElement.dataset.theme=t;else delete document.documentElement.dataset.theme},[t]);
 return [t,()=>setT(t=="dark"?"light":"dark")];
}
export function useToast(){
 const [m,setM]=useState("");
 return [m,x=>{setM(x);setTimeout(()=>setM(""),2200)}];
}
