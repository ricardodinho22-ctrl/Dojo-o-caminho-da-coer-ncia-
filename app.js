
import {createClient} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const $=id=>document.getElementById(id);
const today=()=>new Date().toLocaleDateString("en-CA");
const esc=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

const SUPABASE_URL="https://rhqfrsaiooddrudhbhum.supabase.co";
const SUPABASE_KEY="sb_publishable_1qAVSqUAj2D6pPH-wrBv6Q_uwmrC3T3";
const ADMIN_UID="510c3187-29e8-4d30-a159-bf8de7dd25fc";

const defaults=[
  "Levantei no horário planejado",
  "Cuidei do corpo ou respeitei minha recuperação",
  "Fiz ao menos 20 minutos de estudo ou trabalho importante",
  "Enfrentei uma tarefa que estava procrastinando",
  "Fiz minha revisão diária"
];

const S={
  habits:[],
  checks:{},
  journal:[],
  goals:[],
  reviews:[],
  sb:null,
  user:null
};

const cfgkey="dojo-v1-supabase";
const offlineKey="dojo-v1-data-offline";

function isAdmin(){
  return S.user?.id===ADMIN_UID;
}

function dataKey(){
  return S.user
    ? "dojo-v1-data-user-"+S.user.id
    : offlineKey;
}

function getData(){
  return {
    habits:S.habits,
    checks:S.checks,
    journal:S.journal,
    goals:S.goals,
    reviews:S.reviews
  };
}

function load(){
  try{
    const d=JSON.parse(localStorage.getItem(dataKey())||"{}");

    S.habits=Array.isArray(d.habits)
      ?d.habits
      :defaults.map((name,i)=>({id:"h"+i,name,custom:false}));

    S.checks=d.checks||{};
    S.journal=d.journal||[];
    S.goals=d.goals||[];
    S.reviews=d.reviews||[];
  }catch{
    S.habits=defaults.map((name,i)=>({id:"h"+i,name,custom:false}));
    S.checks={};
    S.journal=[];
    S.goals=[];
    S.reviews=[];
  }
}

function save(){
  localStorage.setItem(dataKey(),JSON.stringify(getData()));
  cloudSave();
}

function toast(t){
  $("toast").textContent=t;
  $("toast").classList.add("show");
  setTimeout(()=>$("toast").classList.remove("show"),2200);
}

function dateLabel(d){
  return new Date(d+"T12:00:00").toLocaleDateString("pt-BR",{
    day:"2-digit",
    month:"long",
    year:"numeric"
  });
}

function done(id){
  return !!S.checks[today()]?.[id];
}

function syncAccountUI(){
  const logged=!!S.user;

  $("authForm").classList.toggle("hidden",logged);
  $("logout").classList.toggle("hidden",!logged);

  // A configuração técnica só aparece para o administrador autenticado.
  $("adminConfigPanel").classList.toggle("hidden",!isAdmin());

  if(isAdmin()){
    const c=config();
    $("sbUrl").value=c.url;
    $("sbKey").value=c.key;
  }
}

function render(){
  const active=S.habits;

  const markup=h=>`<div class="habit ${done(h.id)?"done":""}">
    <input type="checkbox" data-check="${esc(h.id)}" ${done(h.id)?"checked":""}>
    <span>${esc(h.name)}</span>
    ${h.custom?`<button class="remove" data-remove="${esc(h.id)}">×</button>`:""}
  </div>`;

  $("todayHabits").innerHTML=active.map(markup).join("");
  $("habitManager").innerHTML=active.map(markup).join("");

  document.querySelectorAll("[data-check]").forEach(x=>x.onchange=()=>{
    S.checks[today()]??={};
    S.checks[today()][x.dataset.check]=x.checked;
    save();
    render();
  });

  document.querySelectorAll("[data-remove]").forEach(x=>x.onclick=()=>{
    S.habits=S.habits.filter(h=>h.id!==x.dataset.remove);
    save();
    render();
  });

  const n=active.filter(h=>done(h.id)).length;

  $("score").textContent=`${n} / ${active.length}`;
  $("progress").style.width=(active.length?100*n/active.length:0)+"%";

  const now=new Date(),m=new Date(now);
  m.setDate(now.getDate()-(now.getDay()+6)%7);

  const ds=Array.from({length:7},(_,i)=>{
    const d=new Date(m);
    d.setDate(m.getDate()+i);
    return d.toLocaleDateString("en-CA");
  });

  const total=ds.length*active.length;
  let complete=0,days=0;

  ds.forEach(d=>{
    const c=active.filter(h=>S.checks[d]?.[h.id]).length;
    complete+=c;
    if(c)days++;
  });

  $("weekDone").textContent=complete;
  $("weekRate").textContent=(total?Math.round(complete/total*100):0)+"%";
  $("weekDays").textContent=days;

  $("journalHistory").innerHTML=S.journal.slice().reverse().map(j=>`
    <div class="history">
      <small>${dateLabel(j.date)}</small>
      <p><b>Vitória:</b> ${esc(j.v)}</p>
      <p><b>Dificuldade:</b> ${esc(j.o)}</p>
      <p><b>Aprendizado:</b> ${esc(j.l)}</p>
    </div>
  `).join("")||'<p class="muted tiny">Suas reflexões aparecerão aqui.</p>';

  $("goalList").innerHTML=S.goals.map(g=>`
    <div class="goal">
      <b>${esc(g.title)}</b>
      <p>Próxima ação: ${esc(g.next)}</p>
      <button class="secondary" data-toggle="${esc(g.id)}">${g.done?"Reabrir":"Concluir"}</button>
      <button class="secondary" data-del="${esc(g.id)}">Excluir</button>
    </div>
  `).join("");

  document.querySelectorAll("[data-toggle]").forEach(b=>b.onclick=()=>{
    const g=S.goals.find(x=>x.id===b.dataset.toggle);
    if(!g)return;
    g.done=!g.done;
    save();
    render();
  });

  document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{
    S.goals=S.goals.filter(x=>x.id!==b.dataset.del);
    save();
    render();
  });

  $("reviewHistory").innerHTML=S.reviews.slice().reverse().map(r=>`
    <div class="history">
      <small>REVISÃO · ${dateLabel(r.date)}</small>
      <p><b>Compromissos:</b> ${esc(r.a)}</p>
      <p><b>Prioridades:</b> ${esc(r.f)}</p>
    </div>
  `).join("");
}

document.querySelectorAll("[data-go]").forEach(b=>{
  b.onclick=()=>go(b.dataset.go);
});

$("accountBtn").onclick=()=>go("account");

function go(id){
  document.querySelectorAll(".view").forEach(v=>{
    v.classList.toggle("active",v.id===id);
  });

  document.querySelectorAll(".nav").forEach(v=>{
    v.classList.toggle("active",v.dataset.go===id);
  });

  render();
  syncAccountUI();
}

$("todayLabel").textContent=new Date().toLocaleDateString("pt-BR",{
  weekday:"long",
  day:"numeric",
  month:"long"
}).toUpperCase();

$("addHabit").onsubmit=e=>{
  e.preventDefault();

  const name=$("habitName").value.trim();
  if(!name)return;

  S.habits.push({
    id:crypto.randomUUID(),
    name,
    custom:true
  });

  e.target.reset();
  save();
  render();
  toast("Compromisso adicionado.");
};

$("journalForm").onsubmit=e=>{
  e.preventDefault();

  const j={
    id:crypto.randomUUID(),
    date:today(),
    v:$("victory").value,
    o:$("obstacle").value,
    l:$("learning").value
  };

  if(!j.v&&!j.o&&!j.l)return toast("Escreva uma reflexão.");

  S.journal.push(j);
  e.target.reset();
  save();
  render();
  toast("Reflexão salva.");
};

$("goalForm").onsubmit=e=>{
  e.preventDefault();

  S.goals.push({
    id:crypto.randomUUID(),
    title:$("goalTitle").value.trim(),
    next:$("goalNext").value.trim(),
    done:false
  });

  e.target.reset();
  save();
  render();
  toast("Meta adicionada.");
};

$("reviewForm").onsubmit=e=>{
  e.preventDefault();

  const vals=[1,2,3,4,5,6].map(i=>$("r"+i).value.trim());

  if(!vals.some(Boolean))return toast("Preencha ao menos uma resposta.");

  S.reviews.push({
    id:crypto.randomUUID(),
    date:today(),
    a:vals[0],
    b:vals[1],
    c:vals[2],
    d:vals[3],
    e:vals[4],
    f:vals[5]
  });

  e.target.reset();
  save();
  render();
  toast("Revisão salva.");
};

$("export").onclick=()=>{
  const blob=new Blob([
    JSON.stringify({
      exportedAt:new Date().toISOString(),
      habits:S.habits,
      checks:S.checks,
      journal:S.journal,
      goals:S.goals,
      reviews:S.reviews
    },null,2)
  ],{type:"application/json"});

  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="dojo-backup-"+today()+".json";
  a.click();
  URL.revokeObjectURL(a.href);
};

function config(){
  try{
    const saved=JSON.parse(localStorage.getItem(cfgkey)||"null");
    if(saved?.url&&saved?.key)return saved;
  }catch{}

  return {
    url:SUPABASE_URL,
    key:SUPABASE_KEY
  };
}

function status(t){
  $("cloudStatus").textContent="● "+t;
}

let timer=null;

async function cloudSave(){
  if(!S.sb||!S.user)return;

  clearTimeout(timer);

  const client=S.sb;
  const userId=S.user.id;
  const snapshot=JSON.parse(JSON.stringify(getData()));

  timer=setTimeout(async()=>{
    if(!S.user||S.user.id!==userId||S.sb!==client)return;

    try{
      const payload={
        user_id:userId,
        ...snapshot,
        updated_at:new Date().toISOString()
      };

      const {error}=await client
        .from("dojo_profiles")
        .upsert(payload,{onConflict:"user_id"});

      if(!S.user||S.user.id!==userId||S.sb!==client)return;

      status(error
        ?"Erro de sincronização: "+error.message
        :"Conta conectada · dados sincronizados"
      );
    }catch(e){
      if(S.user?.id===userId){
        status("Falha na sincronização: "+e.message);
      }
    }
  },600);
}

async function loadCloud(){
  const client=S.sb;
  const userId=S.user?.id;

  if(!client||!userId)return;

  status("Sincronizando...");

  try{
    const {data,error}=await client
      .from("dojo_profiles")
      .select("*")
      .eq("user_id",userId)
      .maybeSingle();

    if(!S.user||S.user.id!==userId||S.sb!==client)return;

    if(error){
      status("Erro: "+error.message);
      return;
    }

    if(data){
      S.habits=Array.isArray(data.habits)
        ?data.habits
        :defaults.map((name,i)=>({id:"h"+i,name,custom:false}));

      S.checks=data.checks||{};
      S.journal=data.journal||[];
      S.goals=data.goals||[];
      S.reviews=data.reviews||[];

      localStorage.setItem(dataKey(),JSON.stringify(getData()));

      render();
      status("Conta conectada · dados sincronizados");
    }else{
      // Uma conta nova recebe apenas seus próprios dados locais ou os padrões.
      load();
      localStorage.setItem(dataKey(),JSON.stringify(getData()));

      render();
      status("Conta conectada · preparando sincronização");

      cloudSave();
    }
  }catch(e){
    if(S.user?.id===userId){
      status("Falha na conexão: "+e.message);
    }
  }
}

function handleSignedOut(){
  clearTimeout(timer);

  S.user=null;
  load();

  syncAccountUI();
  render();
  status("Sessão encerrada · modo offline");
}

function handleSignedIn(user){
  if(!user)return;

  const previousUserId=S.user?.id||null;
  if(previousUserId===user.id)return;

  clearTimeout(timer);

  S.user=user;
  load();

  syncAccountUI();
  render();

  setTimeout(()=>loadCloud(),0);
}

async function initCloud(){
  status("Conectando à nuvem...");

  try{
    const c=config();
    S.sb=createClient(c.url,c.key);

    const {data,error}=await S.sb.auth.getSession();
    if(error)throw error;

    S.user=data.session?.user||null;

    S.sb.auth.onAuthStateChange((event,session)=>{
      if(event==="SIGNED_OUT"){
        handleSignedOut();
        return;
      }

      if(session?.user){
        handleSignedIn(session.user);
      }
    });

    syncAccountUI();
    load();
    render();

    if(S.user){
      await loadCloud();
    }else{
      status("Nuvem pronta · entre ou crie sua conta");
    }
  }catch(e){
    S.user=null;
    S.sb=null;

    syncAccountUI();
    load();
    render();

    status("Falha na conexão: "+e.message);
  }
}

$("configForm").onsubmit=e=>{
  e.preventDefault();

  if(!isAdmin()){
    toast("Acesso restrito ao administrador.");
    return;
  }

  const url=$("sbUrl").value.trim();
  const key=$("sbKey").value.trim();

  if(!url||!key){
    $("configMsg").textContent="Preencha URL e chave pública.";
    return;
  }

  localStorage.setItem(cfgkey,JSON.stringify({url,key}));
  $("configMsg").textContent="Configuração salva. Reconectando...";
  location.reload();
};

$("authForm").onsubmit=async e=>{
  e.preventDefault();

  if(!S.sb)return toast("Não foi possível conectar à nuvem.");

  const {error}=await S.sb.auth.signInWithPassword({
    email:$("email").value.trim(),
    password:$("password").value
  });

  if(error){
    toast(error.message);
  }else{
    toast("Login realizado.");
  }
};

$("signup").onclick=async()=>{
  if(!S.sb)return toast("Não foi possível conectar à nuvem.");

  const email=$("email").value.trim();
  const password=$("password").value;

  if(!email||!password){
    toast("Preencha e-mail e senha.");
    return;
  }

  const {data,error}=await S.sb.auth.signUp({
    email,
    password
  });

  if(error){
    toast(error.message);
  }else if(data.session){
    toast("Conta criada com sucesso!");
  }else{
    toast("Conta criada! Verifique seu e-mail para confirmar.");
  }
};

$("logout").onclick=async()=>{
  if(!S.sb)return;

  const {error}=await S.sb.auth.signOut();

  if(error){
    toast("Erro ao sair: "+error.message);
    return;
  }

  handleSignedOut();
  toast("Você saiu da sua conta.");
};

initCloud();

if("serviceWorker"in navigator){
  addEventListener("load",()=>{
    navigator.serviceWorker.register("./sw.js");
  });
                                                             }
      
