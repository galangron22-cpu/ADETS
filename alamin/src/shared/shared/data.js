// Shared sample data (strands, topics, questions, sets). Replace with API/IndexedDB data.
export const L={fil:{Login:"Mag-log in","Create account":"Gumawa ng account",Email:"Email",Password:"Password","Display name":"Pangalan","Overall progress":"Kabuuang progreso",Home:"Home",Progress:"Progreso",Chat:"Chat",Profile:"Profile",Start:"Simulan","Download for offline":"I-download para offline",Saved:"Naka-save",Remove:"Alisin","Submit quiz":"Isumite","Previous":"Nakaraan",Next:"Susunod",Results:"Resulta",Retake:"Ulitin","Ask AI about this question":"Tanungin ang AI tungkol dito","Review answers":"Suriin ang sagot","My Progress":"Aking Progreso",Sync:"I-sync",Send:"Ipadala","Study Assistant":"Study Assistant",Offline:"Offline",Online:"Online",Topics:"Mga Paksa","Log out":"Mag-log out"}};
export const S=[["LS1","Communication Skills (English)"],["LS2","Communication Skills (Filipino)"],["LS3","Math & Problem Solving"],["LS4","Life & Physical Sciences"],["LS5","Understanding the Self & Society"]].map((s,i)=>({id:i,code:s[0],name:"Strand "+(i+1)+" – "+s[1]}));
export const TOP=[["Reading","Grammar"],["Pagbasa","Balarila"],["Arithmetic","Algebra"],["Biology","Physics"],["Civics","History"]];
export const Q0=[[0,"Choose the correct word: She ___ to school every day.",["go","goes","going","gone"],1,"Third-person singular takes -es in present tense.","Easy"],
[0,"What is the synonym of “rapid”?",["slow","quick","weak","late"],1,"Rapid means fast or quick.","Easy"],
[1,"Alin ang pangngalang pantangi?",["bata","lungsod","Maynila","aklat"],2,"Ang pangngalang pantangi ay tiyak na ngalan.","Easy"],
[1,"Ano ang kasingkahulugan ng “masaya”?",["malungkot","tuwa","galit","pagod"],1,"Ang masaya at tuwa ay magkasingkahulugan.","Medium"],
[2,"What is 15% of 200?",["20","25","30","35"],2,"0.15 × 200 = 30.","Medium"],
[2,"Solve: 3x + 4 = 19",["3","4","5","6"],2,"3x = 15, so x = 5.","Medium"],
[3,"Which organ pumps blood in the body?",["Lungs","Liver","Heart","Kidney"],2,"The heart pumps blood through the body.","Easy"],
[3,"Water boils at what temperature at sea level?",["50°C","80°C","100°C","120°C"],2,"Water boils at 100°C at sea level.","Easy"],
[4,"Who is the national hero of the Philippines?",["Bonifacio","Rizal","Aguinaldo","Luna"],1,"José Rizal is the national hero.","Easy"],
[4,"Voting is an example of a:",["duty only","civic right","crime","hobby"],1,"Voting is a civic right and responsibility.","Medium"]];
export const mkQ=Q0.map((q,i)=>({id:i,strand:q[0],text:q[1],choices:q[2],ans:q[3],exp:q[4],diff:q[5],src:i%3==0?"AI":"Manual",status:i==3?"Pending":i==7?"Rejected":"Approved"}));
export const mkSets=[{id:0,strand:0,title:"English Basics",ver:2},{id:1,strand:1,title:"Filipino Basics",ver:1},{id:2,strand:2,title:"Math Practice",ver:1},{id:3,strand:3,title:"Science Review",ver:1},{id:4,strand:4,title:"Society Review",ver:1}].map(s=>({...s,status:"Published"}));
export const fmt=s=>String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");
export const BOT=["Magandang tanong! Break the problem into small steps and check each one.","Kumusta! In ALS, review the strand’s main ideas first, then practice with questions.","Here is a tip: read the question twice and eliminate the wrong choices."];


export const sets_of=(p,id)=>(p.sets.find(s=>s.id==id)||{}).strand;

