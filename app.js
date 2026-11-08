import {createClient} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const $=id=>document.getElementById(id),today=()=>new Date().toLocaleDateString("en-CA"),esc=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const defaults=["Levantei no horário planejado","Cuidei do corpo ou respeitei minha recuperação","Fiz ao menos 20 minutos de estudo ou trabalho importante","Enfrentei uma tarefa que estava procrastinando","Fiz minha revisão diária"];
const S={habits:[],checks:{},journal:[],goals:[],reviews:[],sb:null,user:null};
const key="dojo-v1-data",cfgkey="dojo-v1-supabase";
function load(){try{let d=JSON.parse(localStorage.getItem(key)||"{}");S.habits=d.habits||defaults.map((name,i)=>({id:"h"+i,name,custom:false}));S.checks=d.checks||{};S.journal=d.journal||[];S.goals=d.goals||[];S.reviews=d.reviews||[]}catch{S.habits=defaults.map((name,i)=>({id:"h"+i,name}))}}
function save(){localStorage.setItem(key,JSON.stringify({habits:S.habits,checks:S.checks,journal:S.journal,goals:S.goals,reviews:S.reviews}));cloudSave()}
function toast(t){$("toast").textContent=t;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2200)}
function dateLabel(d){return new Date(d+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"})}
function done(id){return !!S.checks[today()]?.[id]}
function render(){let active=S.habits;const markup=h=>`<div class="habit ${done(h.id)?"done":""}"><input type="checkbox" data-check="${esc(h.id)}" ${done(h.id)?"checked":""}><span>${esc(h.name)}</span>${h.custom?`<button class="remove" data-remove="${esc(h.id)}">×</button>`:""}</div>`;
$("todayHabits").innerHTML=active.map(markup).join("");$("habitManager").innerHTML=active.map(markup).join("");
document.querySelectorAll("[data-check]").forEach(x=>x.onchange=()=>{S.checks[today()]??={};S.checks[today()][x.dataset.check]=x.checked;save();render()});
document.querySelectorAll("[data-remove]").forEach(x=>x.onclick=()=>{S.habits=S.habits.filter(h=>h.id!==x.dataset.remove);save();render()});
let n=active.filter(h=>done(h.id)).length;$("score").textContent=`${n} / ${active.length}`;$("progress").style.width=(active.length?100*n/active.length:0)+"%";
let now=new Date(),m=new Date(now);m.setDate(now.getDate()-(now.getDay()+6)%7);let ds=Array.from({length:7},(_,i)=>{let d=new Date(m);d.setDate(m.getDate()+i);return d.toLocaleDateString("en-CA")});let total=ds.length*active.length,complete=0,days=0;ds.forEach(d=>{let c=active.filter(h=>S.checks[d]?.[h.id]).length;complete+=c;if(c)days++});$("weekDone").textContent=complete;$("weekRate").textContent=(total?Math.round(complete/total*100):0)+"%";$("weekDays").textContent=days;
$("journalHistory").innerHTML=S.journal.slice().reverse().map(j=>`<div class="history"><small>${dateLabel(j.date)}</small><p><b>Vitória:</b> ${esc(j.v)}</p><p><b>Dificuldade:</b> ${esc(j.o)}</p><p><b>Aprendizado:</b> ${esc(j.l)}</p></div>`).join("")||'<p class="muted tiny">Suas reflexões aparecerão aqui.</p>';
$("goalList").innerHTML=S.goals.map(g=>`<div class="goal"><b>${esc(g.title)}</b><p>Próxima ação: ${esc(g.next)}</p><button class="secondary" data-toggle="${g.id}">${g.done?"Reabrir":"Concluir"}</button><button class="secondary" data-del="${g.id}">Excluir</button></div>`).join("");
document.querySelectorAll("[data-toggle]").forEach(b=>b.onclick=()=>{let g=S.goals.find(x=>x.id===b.dataset.toggle);g.done=!g.done;save();render()});document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{S.goals=S.goals.filter(x=>x.id!==b.dataset.del);save();render()});
$("reviewHistory").innerHTML=S.reviews.slice().reverse().map(r=>`<div class="history"><small>REVISÃO · ${dateLabel(r.date)}</small><p><b>Compromissos:</b> ${esc(r.a)}</p><p><b>Prioridades:</b> ${esc(r.f)}</p></div>`).join("");
}
document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));$("accountBtn").onclick=()=>go("account");
function go(id){document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===id));document.querySelectorAll(".nav").forEach(v=>v.classList.toggle("active",v.dataset.go===id));render()}
$("todayLabel").textContent=new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"}).toUpperCase();
$("addHabit").onsubmit=e=>{e.preventDefault();let name=$("habitName").value.trim();if(!name)return;S.habits.push({id:crypto.randomUUID(),name,custom:true});e.target.reset();save();render();toast("Compromisso adicionado.")};
$("journalForm").onsubmit=e=>{e.preventDefault();let j={id:crypto.randomUUID(),date:today(),v:$("victory").value,o:$("obstacle").value,l:$("learning").value};if(!j.v&&!j.o&&!j.l)return toast("Escreva uma reflexão.");S.journal.push(j);e.target.reset();save();render();toast("Reflexão salva.")};
$("goalForm").onsubmit=e=>{e.preventDefault();S.goals.push({id:crypto.randomUUID(),title:$("goalTitle").value,next:$("goalNext").value,done:false});e.target.reset();save();render();toast("Meta adicionada.")};
$("reviewForm").onsubmit=e=>{e.preventDefault();let vals=[1,2,3,4,5,6].map(i=>$("r"+i).value.trim());if(!vals.some(Boolean))return toast("Preencha ao menos uma resposta.");S.reviews.push({id:crypto.randomUUID(),date:today(),a:vals[0],b:vals[1],c:vals[2],d:vals[3],e:vals[4],f:vals[5]});e.target.reset();save();render();toast("Revisão salva.")};
$("export").onclick=()=>{let blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),habits:S.habits,checks:S.checks,journal:S.journal,goals:S.goals,reviews:S.reviews},null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="dojo-backup-"+today()+".json";a.click();URL.revokeObjectURL(a.href)};
function config(){try{return JSON.parse(localStorage.getItem(cfgkey)||"{}")}catch{return {}}}
function status(t){$("cloudStatus").textContent="● "+t}
let timer;async function cloudSave(){if(!S.sb||!S.user)return;clearTimeout(timer);timer=setTimeout(async()=>{let payload={user_id:S.user.id,habits:S.habits,checks:S.checks,journal:S.journal,goals:S.goals,reviews:S.reviews,updated_at:new Date().toISOString()};let {error}=await S.sb.from("dojo_profiles").upsert(payload,{onConflict:"user_id"});status(error?"Erro de sincronização: "+error.message:"Conta conectada · dados sincronizados")},600)}
async function loadCloud(){if(!S.user)return;status("Sincronizando...");let {data,error}=await S.sb.from("dojo_profiles").select("*").eq("user_id",S.user.id).maybeSingle();if(error){status("Erro: "+error.message);return}if(data){S.habits=data.habits||S.habits;S.checks=data.checks||{};S.journal=data.journal||[];S.goals=data.goals||[];S.reviews=data.reviews||[];localStorage.setItem(key,JSON.stringify({habits:S.habits,checks:S.checks,journal:S.journal,goals:S.goals,reviews:S.reviews}))}else await cloudSave();render();status("Conta conectada · dados sincronizados")}
async function initCloud(){let c=config();$("sbUrl").value=c.url||"";$("sbKey").value=c.key||"";if(!c.url||!c.key)return status("Modo local · configure a nuvem");try{S.sb=createClient(c.url,c.key);let {data:{session}}=await S.sb.auth.getSession();S.user=session?.user||null;if(S.user){$("authForm").classList.add("hidden");$("logout").classList.remove("hidden");await loadCloud()}else status("Nuvem configurada · entre ou crie sua conta");S.sb.auth.onAuthStateChange(async(_,s)=>{S.user=s?.user||null;if(S.user){$("authForm").classList.add("hidden");$("logout").classList.remove("hidden");await loadCloud()}else{$("authForm").classList.remove("hidden");$("logout").classList.add("hidden");status("Sessão encerrada")}})}catch(e){status("Falha na conexão: "+e.message)}}
$("configForm").onsubmit=e=>{e.preventDefault();let url=$("sbUrl").value.trim(),key=$("sbKey").value.trim();if(!url||!key)return $("configMsg").textContent="Preencha URL e chave pública.";localStorage.setItem(cfgkey,JSON.stringify({url,key}));location.reload()};
$("authForm").onsubmit=async e=>{e.preventDefault();if(!S.sb)return toast("Configure o Supabase primeiro.");let {error}=await S.sb.auth.signInWithPassword({email:$("email").value,password:$("password").value});toast(error?error.message:"Login realizado.")};
$("signup").onclick=async()=>{if(!S.sb)return toast("Configure o Supabase primeiro.");let {data,error}=await S.sb.auth.signUp({email:$("email").value,password:$("password").value});toast(error?error.message:(data.session?"Conta criada!":"Verifique seu e-mail para confirmar."))};
$("logout").onclick=async()=>{
  if(S.sb) await S.sb.auth.signOut();

  clearTimeout(timer);

  S.user=null;
  S.habits=[];
  S.checks={};
  S.journal=[];
  S.goals=[];
  S.reviews=[];
localStorage.removeItem(key);$("authForm").classList.remove("hidden");$("logout").classList.add("hidden");render();status("Sessão encerrada · dados locais removidos");};
load();render();initCloud();if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("./sw.js"));
