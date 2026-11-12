// Minimal IndexedDB key-value store (offline cache for question sets, attempts, sync queue).
import {useState,useEffect} from "react";
const open=()=>new Promise((res,rej)=>{const q=indexedDB.open("alamin",1);q.onupgradeneeded=()=>q.result.createObjectStore("kv");q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});
export const get=async k=>{try{const d=await open();return await new Promise(r=>{const q=d.transaction("kv").objectStore("kv").get(k);q.onsuccess=()=>r(q.result);q.onerror=()=>r(undefined)})}catch(e){return undefined}};
export const put=async(k,v)=>{try{const d=await open();d.transaction("kv","readwrite").objectStore("kv").put(v,k)}catch(e){}};
export function usePersist(key,init){
 const [v,setV]=useState(init);
 useEffect(()=>{get(key).then(x=>{if(x!==undefined)setV(x)})},[key]);
 const set=n=>setV(p=>{const nx=typeof n==="function"?n(p):n;put(key,nx);return nx});
 return [v,set];
}
