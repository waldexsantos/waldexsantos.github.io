import { useState, useEffect, useCallback } from "react";
import {
  Star, Search, Phone, Mail, Globe, MapPin, Plus, Edit2, Trash2,
  Check, X, LogOut, MessageSquare, Heart, Clock, Eye, EyeOff,
  Shield, ChevronLeft, Download, CheckCircle
} from "lucide-react";
import { api } from "../lib/api";

// ── Design tokens ─────────────────────────────────────────────
const C = {
  bg: "#F7F3EE", card: "#FFFFFF", border: "#E8DDD0",
  primary: "#B8621A", primaryLight: "#FDF0E6",
  secondary: "#2C1810", accent: "#E8963A",
  text: "#1C110A", textMid: "#5C4033", textLight: "#9E7E6B",
  success: "#1A7A4A", successBg: "#E6F7EE",
  danger: "#C0392B", dangerBg: "#FDEDED",
  warning: "#B8860B", warningBg: "#FEFBE6",
  star: "#F59E0B",
};

const EMOJI = (name) =>
  name === "Eletricista" ? "⚡" : name === "Encanador" ? "🔧" :
  name === "Pedreiro" ? "🏗️" : name === "Pintor" ? "🎨" :
  name === "Carpinteiro" ? "🪚" : name === "Serralheiro" ? "🔩" : "🛠️";

// ── Micro UI ─────────────────────────────────────────────────
function Stars({ rating = 0, size = 14, interactive, onRate }) {
  const [hov, setHov] = useState(0);
  const active = interactive ? (hov || rating) : rating;
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1,2,3,4,5].map((s) => (
        <Star key={s} size={size}
          fill={s <= active ? C.star : "none"}
          stroke={s <= active ? C.star : "#CBD5E1"}
          style={{ cursor: interactive ? "pointer" : "default" }}
          onMouseEnter={() => interactive && setHov(s)}
          onMouseLeave={() => interactive && setHov(0)}
          onClick={() => interactive && onRate?.(s)}
        />
      ))}
    </span>
  );
}

function Badge({ children, color = C.primaryLight, textColor = C.primary }) {
  return <span style={{ display:"inline-block", padding:"2px 10px", borderRadius:99, background:color, color:textColor, fontSize:11, fontWeight:700 }}>{children}</span>;
}

function Btn({ variant = "primary", icon, children, loading, ...p }) {
  const vs = {
    primary:   { background: C.primary,   color:"#fff", border:"none" },
    secondary: { background:"#F3F4F6",    color:C.textMid, border:`1px solid ${C.border}` },
    danger:    { background: C.danger,    color:"#fff", border:"none" },
    success:   { background: C.success,   color:"#fff", border:"none" },
    ghost:     { background:"transparent",color:C.primary, border:`1.5px solid ${C.primary}` },
    dark:      { background: C.secondary, color:"#fff", border:"none" },
  };
  return (
    <button {...p} disabled={loading || p.disabled}
      style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"9px 18px", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", opacity: loading ? .7 : 1, ...vs[variant], ...p.style }}>
      {icon}{loading ? "Aguarde..." : children}
    </button>
  );
}

function Inp({ label, ...p }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <label style={{ display:"block", fontSize:12, fontWeight:700, color:C.textMid, marginBottom:5, textTransform:"uppercase", letterSpacing:.5 }}>{label}</label>}
      <input {...p} style={{ width:"100%", padding:"10px 13px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, color:C.text, background:"#fff", outline:"none", boxSizing:"border-box", fontFamily:"inherit", ...p.style }} />
    </div>
  );
}

function Sel({ label, children, ...p }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <label style={{ display:"block", fontSize:12, fontWeight:700, color:C.textMid, marginBottom:5, textTransform:"uppercase", letterSpacing:.5 }}>{label}</label>}
      <select {...p} style={{ width:"100%", padding:"10px 13px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, color:C.text, background:"#fff", outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}>{children}</select>
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:C.card, borderRadius:16, width:"100%", maxWidth: wide ? 640 : 480, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 60px rgba(0,0,0,.35)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 24px", borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, background:C.card, zIndex:1 }}>
          <h3 style={{ margin:0, fontSize:17, fontWeight:800, color:C.secondary }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:C.textLight, display:"flex" }}><X size={18} /></button>
        </div>
        <div style={{ padding:24 }}>{children}</div>
      </div>
    </div>
  );
}

function Notif({ n }) {
  if (!n) return null;
  const bg = n.type === "error" ? C.dangerBg : C.successBg;
  const col = n.type === "error" ? C.danger : C.success;
  return (
    <div style={{ position:"fixed", top:20, right:20, zIndex:9999, background:bg, color:col, padding:"12px 20px", borderRadius:10, fontWeight:700, fontSize:14, boxShadow:"0 4px 20px rgba(0,0,0,.15)", maxWidth:320 }}>
      {n.msg}
    </div>
  );
}

// ── Provider Form ──────────────────────────────────────────────
function ProviderForm({ initial = {}, categories, onSave, onCancel }) {
  const [f, setF] = useState({
    name: initial.name||"", nickname: initial.nickname||"", phone: initial.phone||"",
    email: initial.email||"", website: initial.website||"", address: initial.address||"",
    category_id: initial.category_id||"", emergency: initial.emergency||false,
    hours: initial.hours||"", newCatName: "",
  });
  const [loading, setLoading] = useState(false);
  const set = k => e => setF(p => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const submit = async () => {
    setLoading(true);
    try { await onSave(f, initial.id); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
        <div style={{ gridColumn:"1 / -1" }}><Inp label="Nome *" placeholder="Nome completo" value={f.name} onChange={set("name")} /></div>
        <Inp label="Apelido" placeholder="Como é conhecido" value={f.nickname} onChange={set("nickname")} />
        <Inp label="Telefone *" placeholder="(00) 00000-0000" value={f.phone} onChange={set("phone")} />
        <Inp label="E-mail" type="email" value={f.email} onChange={set("email")} />
        <Inp label="Site" placeholder="www.site.com" value={f.website} onChange={set("website")} />
        <div style={{ gridColumn:"1 / -1" }}><Inp label="Endereço" placeholder="Rua, número, bairro, cidade" value={f.address} onChange={set("address")} /></div>
        <div>
          <Sel label="Categoria *" value={f.category_id} onChange={set("category_id")}>
            <option value="">Selecione...</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            <option value="__new__">+ Criar nova categoria</option>
          </Sel>
        </div>
        <Inp label="Horário" placeholder="Seg-Sex 8h–17h" value={f.hours} onChange={set("hours")} />
      </div>
      {f.category_id === "__new__" && <Inp label="Nome da Nova Categoria *" value={f.newCatName} onChange={set("newCatName")} />}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20, padding:"12px 14px", background:"#FFFBEB", border:`1px solid #FDE68A`, borderRadius:8 }}>
        <input type="checkbox" id="emerg" checked={f.emergency} onChange={set("emergency")} style={{ width:16, height:16 }} />
        <label htmlFor="emerg" style={{ fontSize:14, fontWeight:600, color:C.warning, cursor:"pointer" }}>⚡ Atende emergências</label>
      </div>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <Btn variant="secondary" onClick={onCancel}>Cancelar</Btn>
        <Btn loading={loading} onClick={submit}>Salvar Prestador</Btn>
      </div>
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────
function Nav({ user, onLogout, view, setView }) {
  return (
    <nav style={{ background:C.secondary, color:"#fff", padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between", height:56, boxShadow:"0 2px 12px rgba(0,0,0,.25)", position:"sticky", top:0, zIndex:100 }}>
      <button onClick={() => setView("home")} style={{ background:"none", border:"none", color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontWeight:800, fontSize:17, fontFamily:"inherit" }}>
        🔧 <span style={{ color:C.accent }}>Serviços</span>Pro
      </button>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        {user?.role === "admin" && (
          <Btn variant={view === "admin" ? "secondary" : "dark"} icon={<Shield size={14} />} onClick={() => setView(view === "admin" ? "home" : "admin")} style={{ fontSize:12, padding:"6px 14px" }}>
            {view === "admin" ? "Ver Site" : "Painel Admin"}
          </Btn>
        )}
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,.08)", padding:"6px 14px", borderRadius:8 }}>
          <div style={{ width:28, height:28, background:C.primary, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800 }}>
            {user?.username?.[0].toUpperCase()}
          </div>
          <span style={{ fontSize:13, fontWeight:600 }}>{user?.username}</span>
          {user?.role === "admin" && <Badge color={C.primary} textColor="#fff">ADM</Badge>}
        </div>
        <button onClick={onLogout} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,.6)", display:"flex" }}><LogOut size={18} /></button>
      </div>
    </nav>
  );
}

// ── Auth View ─────────────────────────────────────────────────
function AuthView({ onLogin, onRegister }) {
  const [tab, setTab] = useState("login");
  const [lf, setLf] = useState({ username:"", password:"" });
  const [rf, setRf] = useState({ username:"", email:"", password:"", confirm:"" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const sl = k => e => setLf(p => ({ ...p, [k]: e.target.value }));
  const sr = k => e => setRf(p => ({ ...p, [k]: e.target.value }));

  const doLogin = async () => {
    setErr(""); setLoading(true);
    try { await onLogin(lf); }
    catch(e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  const doRegister = async () => {
    if (rf.password !== rf.confirm) { setErr("As senhas não conferem"); return; }
    if (rf.password.length < 6) { setErr("Senha mínima de 6 caracteres"); return; }
    setErr(""); setLoading(true);
    try { await onRegister(rf); }
    catch(e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(150deg, #1C110A 0%, #3D2010 45%, ${C.primary} 100%)`, display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"'Trebuchet MS', system-ui, sans-serif" }}>
      <div style={{ width:"100%", maxWidth:420 }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ fontSize:52, marginBottom:8 }}>🔧</div>
          <h1 style={{ color:"#fff", fontSize:30, fontWeight:900, margin:0 }}>ServiçosPro</h1>
          <p style={{ color:"rgba(255,255,255,.55)", fontSize:14, margin:"8px 0 0" }}>Plataforma de Prestadores de Serviço</p>
        </div>
        <div style={{ background:"rgba(255,255,255,.97)", borderRadius:20, padding:32, boxShadow:"0 28px 60px rgba(0,0,0,.45)" }}>
          <div style={{ display:"flex", background:"#F3F4F6", borderRadius:10, padding:4, marginBottom:28 }}>
            {["login","register"].map(t => (
              <button key={t} onClick={() => { setTab(t); setErr(""); }}
                style={{ flex:1, padding:"9px 0", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13, background: tab===t ? C.primary : "transparent", color: tab===t ? "#fff" : C.textLight, fontFamily:"inherit" }}>
                {t === "login" ? "🔑 Entrar" : "✨ Criar Conta"}
              </button>
            ))}
          </div>

          {err && <div style={{ background:C.dangerBg, color:C.danger, padding:"10px 14px", borderRadius:8, marginBottom:16, fontSize:13, fontWeight:600 }}>{err}</div>}

          {tab === "login" ? (
            <>
              <Inp label="Usuário" placeholder="Seu nome de usuário" value={lf.username} onChange={sl("username")} onKeyDown={e => e.key==="Enter" && doLogin()} />
              <div style={{ marginBottom:24 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:700, color:C.textMid, marginBottom:5, textTransform:"uppercase", letterSpacing:.5 }}>Senha</label>
                <div style={{ position:"relative" }}>
                  <input type={showPw?"text":"password"} placeholder="Sua senha" value={lf.password} onChange={sl("password")} onKeyDown={e => e.key==="Enter" && doLogin()}
                    style={{ width:"100%", padding:"10px 42px 10px 13px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, boxSizing:"border-box", fontFamily:"inherit", outline:"none" }} />
                  <button onClick={() => setShowPw(!showPw)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:C.textLight, display:"flex" }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <Btn loading={loading} onClick={doLogin} style={{ width:"100%" }}>Entrar na Plataforma</Btn>
            </>
          ) : (
            <>
              <Inp label="Usuário *" placeholder="Escolha um nome de usuário" value={rf.username} onChange={sr("username")} />
              <Inp label="E-mail *" type="email" placeholder="seu@email.com" value={rf.email} onChange={sr("email")} />
              <Inp label="Senha *" type="password" placeholder="Mínimo 6 caracteres" value={rf.password} onChange={sr("password")} />
              <Inp label="Confirmar Senha *" type="password" placeholder="Repita a senha" value={rf.confirm} onChange={sr("confirm")} />
              <Btn loading={loading} onClick={doRegister} style={{ width:"100%" }}>Criar Minha Conta</Btn>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Home View ─────────────────────────────────────────────────
function HomeView({ providers, categories, currentUser, isAdmin, favorites, onFav, onRate, onEdit, onDelete, onAdd, onSelectProvider }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [showFavs, setShowFavs] = useState(false);

  const filtered = providers
    .filter(p => {
      const catOk = !filterCat || p.category_id === filterCat;
      const searchOk = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.nickname||"").toLowerCase().includes(search.toLowerCase());
      const favOk = !showFavs || favorites.includes(p.id);
      return catOk && searchOk && favOk;
    })
    .sort((a,b) => sortBy === "rating" ? (b.rating_avg||0) - (a.rating_avg||0) : a.name.localeCompare(b.name));

  return (
    <div style={{ maxWidth:1200, margin:"0 auto", padding:"28px 20px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ margin:0, fontSize:24, fontWeight:900, color:C.text }}>Prestadores de Serviço</h1>
          <p style={{ margin:"4px 0 0", fontSize:14, color:C.textLight }}>{filtered.length} profissional{filtered.length!==1?"is":""} encontrado{filtered.length!==1?"s":""}</p>
        </div>
        {isAdmin && <Btn icon={<Plus size={15} />} onClick={onAdd}>Novo Prestador</Btn>}
      </div>

      {/* Filters */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 18px", marginBottom:24, display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ flex:1, minWidth:200, position:"relative" }}>
          <Search size={15} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:C.textLight }} />
          <input placeholder="Buscar por nome ou apelido..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width:"100%", padding:"9px 12px 9px 36px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          style={{ padding:"9px 13px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13, fontFamily:"inherit", background:"#fff", outline:"none", minWidth:160 }}>
          <option value="">Todas categorias</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ padding:"9px 13px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13, fontFamily:"inherit", background:"#fff", outline:"none", minWidth:160 }}>
          <option value="name">Ordenar: Nome A-Z</option>
          <option value="rating">Ordenar: Melhor avaliação</option>
        </select>
        <button onClick={() => setShowFavs(!showFavs)}
          style={{ padding:"9px 14px", border:`1.5px solid ${showFavs?"#EF4444":C.border}`, borderRadius:8, background: showFavs?"#FEF2F2":"#fff", cursor:"pointer", display:"flex", alignItems:"center", gap:6, fontSize:13, fontWeight:600, color: showFavs?"#EF4444":C.textMid }}>
          <Heart size={14} fill={showFavs?"#EF4444":"none"} stroke={showFavs?"#EF4444":C.textMid} /> Favoritos
        </button>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 0", color:C.textLight }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
          <p style={{ fontSize:16, margin:0, fontWeight:600 }}>Nenhum prestador encontrado</p>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:16 }}>
          {filtered.map(p => (
            <ProviderCard key={p.id} provider={p}
              category={categories.find(c => c.id === p.category_id)}
              isFav={favorites.includes(p.id)}
              isAdmin={isAdmin}
              onView={() => onSelectProvider(p.id)}
              onFav={() => onFav(p.id)}
              onEdit={() => onEdit(p)}
              onDelete={() => onDelete(p.id)}
              onRate={onRate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProviderCard({ provider, category, isFav, isAdmin, onView, onFav, onEdit, onDelete, onRate }) {
  const [rateOpen, setRateOpen] = useState(false);
  const [stars, setStars] = useState(0);

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 20px", boxShadow:"0 2px 8px rgba(0,0,0,.06)", transition:"box-shadow .2s" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow="0 6px 24px rgba(0,0,0,.12)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,.06)"}
    >
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:44, height:44, background:`linear-gradient(135deg, ${C.primary}, ${C.accent})`, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
            {EMOJI(category?.name)}
          </div>
          <div>
            <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:C.text, cursor:"pointer" }} onClick={onView}>{provider.name}</h3>
            {provider.nickname && <span style={{ fontSize:12, color:C.textLight }}>"{provider.nickname}"</span>}
          </div>
        </div>
        <div style={{ display:"flex", gap:4, alignItems:"center" }}>
          {provider.emergency && <span title="Emergências">⚡</span>}
          <button onClick={onFav} style={{ background:"none", border:"none", cursor:"pointer", display:"flex" }}>
            <Heart size={17} fill={isFav?"#EF4444":"none"} stroke={isFav?"#EF4444":"#CBD5E1"} />
          </button>
          {isAdmin && <>
            <button onClick={onEdit} style={{ background:"none", border:"none", cursor:"pointer", color:C.primary, display:"flex" }}><Edit2 size={15} /></button>
            <button onClick={onDelete} style={{ background:"none", border:"none", cursor:"pointer", color:C.danger, display:"flex" }}><Trash2 size={15} /></button>
          </>}
        </div>
      </div>

      <Badge>{category?.name||"Sem categoria"}</Badge>

      <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:5 }}>
        <span style={{ fontSize:13, color:C.textMid, display:"flex", alignItems:"center", gap:6 }}><Phone size={12} color={C.textLight} /> {provider.phone}</span>
        {provider.address && <span style={{ fontSize:13, color:C.textMid, display:"flex", alignItems:"center", gap:6 }}><MapPin size={12} color={C.textLight} /> {provider.address}</span>}
        {provider.hours && <span style={{ fontSize:13, color:C.textMid, display:"flex", alignItems:"center", gap:6 }}><Clock size={12} color={C.textLight} /> {provider.hours}</span>}
      </div>

      <div style={{ marginTop:14, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Stars rating={Number(provider.rating_avg)||0} size={14} />
          <span style={{ fontSize:12, color:C.textLight }}>
            {provider.rating_avg ? `${provider.rating_avg} (${provider.rating_count} av.)` : "Sem avaliações"}
          </span>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <button onClick={() => setRateOpen(true)} style={{ padding:"5px 12px", borderRadius:6, border:`1px solid ${C.border}`, background:"#fff", cursor:"pointer", fontSize:12, fontWeight:600, color:C.primary, display:"flex", alignItems:"center", gap:4 }}>
            <Star size={12} /> Avaliar
          </button>
          <button onClick={onView} style={{ padding:"5px 12px", borderRadius:6, border:"none", background:C.primary, cursor:"pointer", fontSize:12, fontWeight:600, color:"#fff", display:"flex", alignItems:"center", gap:4 }}>
            <MessageSquare size={12} /> Ver mais
          </button>
        </div>
      </div>

      {rateOpen && (
        <Modal title="⭐ Avaliar Prestador" onClose={() => setRateOpen(false)}>
          <p style={{ fontSize:14, color:C.textMid, marginTop:0 }}>Clique nas estrelas para dar sua nota:</p>
          <div style={{ display:"flex", justifyContent:"center", margin:"20px 0" }}>
            <Stars rating={stars} size={36} interactive onRate={setStars} />
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <Btn variant="secondary" onClick={() => setRateOpen(false)}>Cancelar</Btn>
            <Btn onClick={() => { if(stars>0){ onRate(provider.id, stars); setRateOpen(false); } }} style={{ opacity: stars===0?.5:1 }}>
              Confirmar {stars>0?`(${stars}★)`:""}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Detail View ───────────────────────────────────────────────
function DetailView({ providerId, categories, currentUser, isAdmin, onBack, onRate, onComment, onRefresh }) {
  const [data, setData] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [rateStars, setRateStars] = useState(0);
  const [showRate, setShowRate] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getProvider(providerId).then(setData).catch(console.error);
  }, [providerId]);

  if (!data) return <div style={{ textAlign:"center", padding:60, color:C.textLight }}>Carregando...</div>;

  const cat = categories.find(c => c.id === data.category_id);

  const doRate = async () => {
    if (!rateStars) return;
    await onRate(data.id, rateStars);
    const fresh = await api.getProvider(data.id);
    setData(fresh);
    setShowRate(false);
  };

  const doComment = async () => {
    if (!commentText.trim()) return;
    setLoading(true);
    try {
      await onComment(data.id, commentText);
      setCommentText(""); setShowComment(false);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth:760, margin:"0 auto", padding:"28px 20px" }}>
      <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", color:C.primary, fontWeight:700, fontSize:14, marginBottom:20, padding:0, fontFamily:"inherit" }}>
        <ChevronLeft size={18} /> Voltar à listagem
      </button>

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden", marginBottom:20 }}>
        <div style={{ background:`linear-gradient(135deg, ${C.secondary}, ${C.primary})`, padding:"28px 28px 20px", color:"#fff" }}>
          <div style={{ display:"flex", gap:18, alignItems:"flex-start" }}>
            <div style={{ width:72, height:72, background:"rgba(255,255,255,.15)", borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, flexShrink:0 }}>
              {EMOJI(cat?.name)}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                <h1 style={{ margin:0, fontSize:22, fontWeight:900 }}>{data.name}</h1>
                {data.emergency && <span style={{ background:"#FBBF24", color:"#1C110A", padding:"2px 10px", borderRadius:99, fontSize:11, fontWeight:800 }}>⚡ EMERGÊNCIA</span>}
              </div>
              {data.nickname && <p style={{ margin:"4px 0 8px", opacity:.7, fontSize:15 }}>"{data.nickname}"</p>}
              <Badge color="rgba(255,255,255,.2)" textColor="#fff">{cat?.name}</Badge>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:32, fontWeight:900 }}>{data.rating_avg || "—"}</div>
              <Stars rating={Number(data.rating_avg)||0} size={16} />
              <div style={{ fontSize:11, opacity:.6, marginTop:3 }}>{data.rating_count} avaliação{data.rating_count!==1?"ões":""}</div>
            </div>
          </div>
        </div>
        <div style={{ padding:"20px 28px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:14 }}>
            {[
              [<Phone size={16} color={C.primary} />, "Telefone", data.phone],
              data.email && [<Mail size={16} color={C.primary} />, "E-mail", data.email],
              data.website && [<Globe size={16} color={C.primary} />, "Site", data.website],
              data.address && [<MapPin size={16} color={C.primary} />, "Endereço", data.address],
              data.hours && [<Clock size={16} color={C.primary} />, "Horário", data.hours],
            ].filter(Boolean).map(([icon, label, val], i) => (
              <div key={i} style={{ display:"flex", gap:10, alignItems:"center" }}>
                {icon}
                <div><div style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", fontWeight:700 }}>{label}</div><div style={{ fontSize:14, color:C.text }}>{val}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:"flex", gap:10, marginBottom:20 }}>
        <button onClick={() => { setShowRate(!showRate); setShowComment(false); }}
          style={{ flex:1, padding:12, border:`2px solid ${C.star}`, borderRadius:10, background: showRate?"#FFFBEB":"#fff", cursor:"pointer", fontWeight:700, fontSize:14, color:"#92400E", display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontFamily:"inherit" }}>
          <Star size={18} fill={C.star} stroke={C.star} /> Avaliar com Estrelas
        </button>
        <button onClick={() => { setShowComment(!showComment); setShowRate(false); }}
          style={{ flex:1, padding:12, border:`2px solid ${C.border}`, borderRadius:10, background: showComment?C.primaryLight:"#fff", cursor:"pointer", fontWeight:700, fontSize:14, color:C.primary, display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontFamily:"inherit" }}>
          <MessageSquare size={18} /> Escrever Comentário
        </button>
      </div>

      {showRate && (
        <div style={{ background:"#FFFBEB", border:`1.5px solid #FDE68A`, borderRadius:12, padding:20, marginBottom:20 }}>
          <p style={{ margin:"0 0 12px", fontWeight:700, fontSize:15, color:"#92400E" }}>⭐ Selecione sua avaliação:</p>
          <Stars rating={rateStars} size={32} interactive onRate={setRateStars} />
          <div style={{ display:"flex", gap:10, marginTop:16 }}>
            <Btn variant="secondary" onClick={() => setShowRate(false)}>Cancelar</Btn>
            <Btn onClick={doRate} style={{ opacity: rateStars===0?.5:1 }}>Confirmar {rateStars>0?`(${rateStars}★)`:""}</Btn>
          </div>
        </div>
      )}

      {showComment && (
        <div style={{ background:C.primaryLight, border:`1.5px solid #F0C090`, borderRadius:12, padding:20, marginBottom:20 }}>
          <p style={{ margin:"0 0 10px", fontWeight:700, fontSize:15, color:C.primary }}>💬 Seu comentário:</p>
          <textarea value={commentText} onChange={e => setCommentText(e.target.value)} rows={4}
            placeholder="Conte sua experiência com este profissional..."
            style={{ width:"100%", padding:"10px 13px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, fontFamily:"inherit", resize:"vertical", boxSizing:"border-box", outline:"none" }} />
          <p style={{ fontSize:12, color:C.textLight, margin:"6px 0 12px" }}>⚠️ Comentários passam por moderação antes de aparecer publicamente.</p>
          <div style={{ display:"flex", gap:10 }}>
            <Btn variant="secondary" onClick={() => setShowComment(false)}>Cancelar</Btn>
            <Btn loading={loading} onClick={doComment}>Enviar para Moderação</Btn>
          </div>
        </div>
      )}

      {/* Comments */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"20px 24px" }}>
        <h2 style={{ margin:"0 0 16px", fontSize:17, fontWeight:800, color:C.text }}>
          💬 Comentários aprovados ({data.comments?.length||0})
        </h2>
        {!data.comments?.length ? (
          <p style={{ color:C.textLight, fontSize:14, textAlign:"center", padding:"20px 0" }}>Nenhum comentário aprovado ainda.</p>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {data.comments.map(c => (
              <div key={c.id} style={{ padding:"14px 16px", background:C.bg, borderRadius:10, border:`1px solid ${C.border}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:28, height:28, background:C.primary, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:"#fff" }}>
                      {c.username?.[0].toUpperCase()}
                    </div>
                    <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{c.username}</span>
                  </div>
                  <span style={{ fontSize:11, color:C.textLight }}>{new Date(c.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
                <p style={{ margin:0, fontSize:14, color:C.textMid, lineHeight:1.5 }}>{c.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Admin Panel ───────────────────────────────────────────────
function AdminPanel({ providers, categories, currentUser, setProviders, setCategories, onBack, notify }) {
  const [tab, setTab] = useState("providers");
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    api.getComments().then(setComments).catch(console.error);
    api.getUsers().then(setUsers).catch(console.error);
  }, []);

  const pending = comments.filter(c => c.status === "pending");

  const saveProvider = async (f, editId) => {
    if (!f.name || !f.phone || !f.category_id) throw new Error("Preencha os campos obrigatórios");
    let category_id = f.category_id;
    if (category_id === "__new__" && f.newCatName?.trim()) {
      const nc = await api.createCategory({ name: f.newCatName.trim() });
      setCategories(prev => [...prev, nc]);
      category_id = nc.id;
    }
    const body = { name:f.name, nickname:f.nickname, phone:f.phone, email:f.email, website:f.website, address:f.address, category_id, emergency:f.emergency, hours:f.hours };
    if (editId) {
      const updated = await api.updateProvider(editId, body);
      setProviders(prev => prev.map(p => p.id===editId ? { ...p, ...updated } : p));
      notify("Prestador atualizado!");
    } else {
      const created = await api.createProvider(body);
      setProviders(prev => [...prev, { ...created, rating_avg:null, rating_count:0, category_name: categories.find(c=>c.id===created.category_id)?.name }]);
      notify("Prestador cadastrado!");
    }
    setModal(null);
  };

  const deleteProvider = async (id) => {
    if (!confirm("Confirma a exclusão deste prestador?")) return;
    await api.deleteProvider(id);
    setProviders(prev => prev.filter(p => p.id !== id));
    notify("Prestador excluído!");
  };

  const saveCategory = async (name, editId) => {
    if (!name.trim()) throw new Error("Nome obrigatório");
    if (editId) {
      const updated = await api.updateCategory(editId, { name });
      setCategories(prev => prev.map(c => c.id===editId ? updated : c));
    } else {
      const created = await api.createCategory({ name });
      setCategories(prev => [...prev, created]);
    }
    notify("Categoria salva!"); setModal(null);
  };

  const deleteCategory = async (id) => {
    if (!confirm("Excluir esta categoria?")) return;
    try {
      await api.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      notify("Categoria excluída!");
    } catch(e) { notify(e.message, "error"); }
  };

  const moderate = async (id, status) => {
    await api.moderateComment(id, status);
    setComments(prev => prev.map(c => c.id===id ? { ...c, status } : c));
    notify(status==="approved" ? "Comentário aprovado!" : "Comentário rejeitado!");
  };

  const toggleRole = async (u) => {
    const newRole = u.role === "admin" ? "user" : "admin";
    await api.updateRole(u.id, newRole);
    setUsers(prev => prev.map(x => x.id===u.id ? { ...x, role:newRole } : x));
    notify(`${u.username} agora é ${newRole==="admin"?"administrador":"usuário comum"}!`);
  };

  const deleteUser = async (u) => {
    if (!confirm(`Excluir usuário "${u.username}"?`)) return;
    await api.deleteUser(u.id);
    setUsers(prev => prev.filter(x => x.id !== u.id));
    notify("Usuário excluído!");
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ providers, categories, users: users.map(u=>({...u,password:"***"})) }, null, 2)], { type:"application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `servicospro_${new Date().toISOString().slice(0,10)}.json`; a.click();
    notify("Dados exportados!");
  };

  const tabs = [
    { id:"providers", label:"🏗️ Prestadores", count:providers.length },
    { id:"categories", label:"🏷️ Categorias", count:categories.length },
    { id:"comments", label:"💬 Moderação", count:pending.length, alert:pending.length>0 },
    { id:"users", label:"👥 Usuários", count:users.length },
  ];

  return (
    <div style={{ minHeight:"calc(100vh - 56px)", background:"#F0EBE3" }}>
      <div style={{ background:C.secondary, color:"#fff", padding:"20px 28px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <h1 style={{ margin:0, fontSize:20, fontWeight:900 }}>🛡️ Painel Administrativo</h1>
              <p style={{ margin:"4px 0 0", opacity:.6, fontSize:13 }}>Gerencie prestadores, categorias, comentários e usuários</p>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <Btn variant="ghost" icon={<Download size={14} />} onClick={exportData} style={{ color:"#fff", borderColor:"rgba(255,255,255,.3)" }}>Exportar JSON</Btn>
            </div>
          </div>
          <div style={{ display:"flex", gap:16, marginTop:20, flexWrap:"wrap" }}>
            {[
              { label:"Prestadores", val:providers.length, icon:"🏗️" },
              { label:"Categorias", val:categories.length, icon:"🏷️" },
              { label:"Usuários", val:users.length, icon:"👥" },
              { label:"Pendentes", val:pending.length, icon:"⏳", alert:pending.length>0 },
            ].map(s => (
              <div key={s.label} style={{ background: s.alert?"#FEF3C7":"rgba(255,255,255,.08)", borderRadius:10, padding:"12px 18px", minWidth:100, border: s.alert?"1.5px solid #F59E0B":"1px solid rgba(255,255,255,.1)" }}>
                <div style={{ fontSize:22 }}>{s.icon}</div>
                <div style={{ fontSize:22, fontWeight:900, color: s.alert?"#92400E":"#fff", lineHeight:1.2 }}>{s.val}</div>
                <div style={{ fontSize:11, opacity: s.alert?1:.6, color: s.alert?"#92400E":"#fff", fontWeight:600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"24px 20px" }}>
        <div style={{ display:"flex", gap:6, marginBottom:24, flexWrap:"wrap" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding:"9px 18px", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:8, fontFamily:"inherit", background: tab===t.id?C.primary:"#fff", color: tab===t.id?"#fff":C.textMid, boxShadow: tab===t.id?"none":"0 1px 4px rgba(0,0,0,.08)" }}>
              {t.label}
              <span style={{ background: tab===t.id?"rgba(255,255,255,.25)":t.alert?C.danger:"#E5E7EB", color: tab===t.id?"#fff":t.alert?"#fff":C.textLight, borderRadius:99, padding:"0 7px", fontSize:11, fontWeight:900 }}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Providers */}
        {tab === "providers" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:C.text }}>Prestadores Cadastrados</h2>
              <Btn icon={<Plus size={14} />} onClick={() => setModal({ type:"provider", data:null })}>Novo Prestador</Btn>
            </div>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead><tr style={{ background:"#F9FAFB" }}>
                  {["Nome","Apelido","Categoria","Telefone","Emergência","Ações"].map(h => (
                    <th key={h} style={{ padding:"11px 16px", textAlign:"left", fontWeight:700, color:C.textMid, borderBottom:`1px solid ${C.border}`, fontSize:11, textTransform:"uppercase", letterSpacing:.4 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {providers.map((p,i) => (
                    <tr key={p.id} style={{ background: i%2===0?"#fff":"#FAFAFA" }}>
                      <td style={{ padding:"12px 16px", fontWeight:700, color:C.text }}>{p.name}</td>
                      <td style={{ padding:"12px 16px", color:C.textLight }}>{p.nickname||"—"}</td>
                      <td style={{ padding:"12px 16px" }}><Badge>{p.category_name||"—"}</Badge></td>
                      <td style={{ padding:"12px 16px", color:C.textMid }}>{p.phone}</td>
                      <td style={{ padding:"12px 16px" }}>{p.emergency ? <span style={{ color:C.warning, fontWeight:700 }}>⚡ Sim</span> : <span style={{ color:C.textLight }}>Não</span>}</td>
                      <td style={{ padding:"12px 16px" }}>
                        <div style={{ display:"flex", gap:6 }}>
                          <button onClick={() => setModal({ type:"provider", data:p })} style={{ background:C.primaryLight, border:"none", borderRadius:6, padding:"5px 10px", cursor:"pointer", color:C.primary, fontWeight:700, fontSize:12, display:"flex", alignItems:"center", gap:4 }}><Edit2 size={11} /> Editar</button>
                          <button onClick={() => deleteProvider(p.id)} style={{ background:C.dangerBg, border:"none", borderRadius:6, padding:"5px 10px", cursor:"pointer", color:C.danger, fontWeight:700, fontSize:12, display:"flex", alignItems:"center", gap:4 }}><Trash2 size={11} /> Excluir</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Categories */}
        {tab === "categories" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:C.text }}>Categorias</h2>
              <Btn icon={<Plus size={14} />} onClick={() => setModal({ type:"category", data:null })}>Nova Categoria</Btn>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:12 }}>
              {categories.map(cat => {
                const count = providers.filter(p => p.category_id === cat.id).length;
                return (
                  <div key={cat.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px 18px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div>
                      <div style={{ fontWeight:800, fontSize:15, color:C.text }}>{cat.name}</div>
                      <div style={{ fontSize:12, color:C.textLight, marginTop:2 }}>{count} prestador{count!==1?"es":""}</div>
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={() => setModal({ type:"category", data:cat })} style={{ background:"none", border:"none", cursor:"pointer", color:C.primary, display:"flex" }}><Edit2 size={15} /></button>
                      <button onClick={() => deleteCategory(cat.id)} style={{ background:"none", border:"none", cursor:"pointer", color:C.danger, display:"flex" }}><Trash2 size={15} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Moderation */}
        {tab === "comments" && (
          <div>
            <h2 style={{ margin:"0 0 16px", fontSize:17, fontWeight:800, color:C.text }}>
              Moderação de Comentários
              {pending.length>0 && <span style={{ marginLeft:10, background:C.danger, color:"#fff", borderRadius:99, padding:"2px 10px", fontSize:12 }}>{pending.length} pendente{pending.length!==1?"s":""}</span>}
            </h2>
            {["pending","approved","rejected"].map(status => {
              const group = comments.filter(c => c.status===status);
              if (!group.length) return null;
              const s = { pending:{bg:C.warningBg,border:"#FDE68A",label:"⏳ Aguardando Moderação",color:C.warning}, approved:{bg:C.successBg,border:"#6EE7B7",label:"✅ Aprovados",color:C.success}, rejected:{bg:C.dangerBg,border:"#FCA5A5",label:"❌ Rejeitados",color:C.danger} }[status];
              return (
                <div key={status} style={{ marginBottom:24 }}>
                  <h3 style={{ margin:"0 0 12px", fontSize:14, fontWeight:800, color:s.color }}>{s.label} ({group.length})</h3>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {group.map(c => (
                      <div key={c.id} style={{ background:s.bg, border:`1.5px solid ${s.border}`, borderRadius:10, padding:"14px 18px" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
                          <div>
                            <span style={{ fontWeight:700, fontSize:13, color:C.text }}>{c.username}</span>
                            <span style={{ fontSize:12, color:C.textLight, margin:"0 8px" }}>sobre</span>
                            <span style={{ fontWeight:700, fontSize:13, color:C.primary }}>{c.provider_name}</span>
                            <span style={{ fontSize:11, color:C.textLight, marginLeft:8 }}>• {new Date(c.created_at).toLocaleDateString("pt-BR")}</span>
                          </div>
                          {status==="pending" && (
                            <div style={{ display:"flex", gap:8 }}>
                              <button onClick={() => moderate(c.id,"approved")} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 14px", borderRadius:7, border:"none", background:C.success, color:"#fff", cursor:"pointer", fontWeight:700, fontSize:12, fontFamily:"inherit" }}><Check size={13} /> Aprovar</button>
                              <button onClick={() => moderate(c.id,"rejected")} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 14px", borderRadius:7, border:"none", background:C.danger, color:"#fff", cursor:"pointer", fontWeight:700, fontSize:12, fontFamily:"inherit" }}><X size={13} /> Rejeitar</button>
                            </div>
                          )}
                        </div>
                        <p style={{ margin:"10px 0 0", fontSize:14, color:C.textMid, lineHeight:1.5 }}>{c.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {!comments.length && <p style={{ color:C.textLight, textAlign:"center", padding:"30px 0" }}>Nenhum comentário ainda</p>}
          </div>
        )}

        {/* Users */}
        {tab === "users" && (
          <div>
            <h2 style={{ margin:"0 0 16px", fontSize:17, fontWeight:800, color:C.text }}>Gerenciamento de Usuários</h2>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead><tr style={{ background:"#F9FAFB" }}>
                  {["Usuário","E-mail","Perfil","Cadastro","Ações"].map(h => (
                    <th key={h} style={{ padding:"11px 16px", textAlign:"left", fontWeight:700, color:C.textMid, borderBottom:`1px solid ${C.border}`, fontSize:11, textTransform:"uppercase", letterSpacing:.4 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {users.map((u,i) => (
                    <tr key={u.id} style={{ background: i%2===0?"#fff":"#FAFAFA" }}>
                      <td style={{ padding:"12px 16px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:32, height:32, background: u.role==="admin"?C.primary:"#94A3B8", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"#fff" }}>
                            {u.username?.[0].toUpperCase()}
                          </div>
                          <span style={{ fontWeight:700, color:C.text }}>{u.username}</span>
                          {u.id===currentUser.id && <span style={{ fontSize:10, background:"#E0F2FE", color:"#0369A1", padding:"2px 7px", borderRadius:99, fontWeight:700 }}>Você</span>}
                        </div>
                      </td>
                      <td style={{ padding:"12px 16px", color:C.textMid }}>{u.email}</td>
                      <td style={{ padding:"12px 16px" }}><Badge color={u.role==="admin"?C.primaryLight:"#F1F5F9"} textColor={u.role==="admin"?C.primary:"#64748B"}>{u.role==="admin"?"🛡️ Admin":"👤 Usuário"}</Badge></td>
                      <td style={{ padding:"12px 16px", color:C.textLight }}>{new Date(u.created_at).toLocaleDateString("pt-BR")}</td>
                      <td style={{ padding:"12px 16px" }}>
                        {u.id !== currentUser.id && (
                          <div style={{ display:"flex", gap:6 }}>
                            <button onClick={() => toggleRole(u)} style={{ background: u.role==="admin"?"#FEF3C7":C.primaryLight, border:"none", borderRadius:6, padding:"5px 10px", cursor:"pointer", color: u.role==="admin"?"#92400E":C.primary, fontWeight:700, fontSize:11 }}>
                              {u.role==="admin"?"→ Usuário":"→ Admin"}
                            </button>
                            <button onClick={() => deleteUser(u)} style={{ background:C.dangerBg, border:"none", borderRadius:6, padding:"5px 10px", cursor:"pointer", color:C.danger, fontWeight:700, fontSize:11, display:"flex", alignItems:"center", gap:3 }}><Trash2 size={11} /> Excluir</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {modal?.type === "provider" && (
        <Modal title={modal.data ? "✏️ Editar Prestador" : "➕ Novo Prestador"} onClose={() => setModal(null)} wide>
          <ProviderForm initial={modal.data||{}} categories={categories} onSave={saveProvider} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === "category" && (
        <CategoryModal initial={modal.data} onSave={saveCategory} onClose={() => setModal(null)} />
      )}
    </div>
  );
}

function CategoryModal({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial?.name||"");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const submit = async () => {
    setErr(""); setLoading(true);
    try { await onSave(name, initial?.id); }
    catch(e) { setErr(e.message); }
    finally { setLoading(false); }
  };
  return (
    <Modal title={initial ? "✏️ Editar Categoria" : "➕ Nova Categoria"} onClose={onClose}>
      {err && <div style={{ background:C.dangerBg, color:C.danger, padding:"8px 12px", borderRadius:8, marginBottom:14, fontSize:13 }}>{err}</div>}
      <Inp label="Nome da Categoria *" placeholder="Ex: Jardineiro" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key==="Enter" && submit()} />
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        <Btn loading={loading} onClick={submit}>Salvar</Btn>
      </div>
    </Modal>
  );
}

// ── Root ──────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("auth");
  const [providers, setProviders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedPid, setSelectedPid] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [notif, setNotif] = useState(null);
  const [providerModal, setProviderModal] = useState(null);
  const [loading, setLoading] = useState(false);

  const notify = useCallback((msg, type="success") => {
    setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([api.getProviders(), api.getCategories()]);
      setProviders(p); setCategories(c);
    } catch(e) { notify("Erro ao carregar dados", "error"); }
    finally { setLoading(false); }
  }, [notify]);

  useEffect(() => {
    // Restaura sessão do localStorage
    try {
      const saved = localStorage.getItem("sp_user");
      const token = localStorage.getItem("sp_token");
      if (saved && token) { setUser(JSON.parse(saved)); setView("home"); }
    } catch {}
  }, []);

  useEffect(() => {
    if (view !== "auth") loadData();
  }, [view, loadData]);

  const login = async (creds) => {
    const { token, user } = await api.login(creds);
    localStorage.setItem("sp_token", token);
    localStorage.setItem("sp_user", JSON.stringify(user));
    setUser(user); setView("home");
    notify(`Bem-vindo, ${user.username}! ${user.role==="admin"?"🛡️":"👋"}`);
  };

  const register = async (creds) => {
    const { token, user } = await api.register(creds);
    localStorage.setItem("sp_token", token);
    localStorage.setItem("sp_user", JSON.stringify(user));
    setUser(user); setView("home");
    notify(`Conta criada! Bem-vindo, ${user.username}! 🎉`);
  };

  const logout = () => {
    localStorage.removeItem("sp_token"); localStorage.removeItem("sp_user");
    setUser(null); setView("auth");
  };

  const rateProvider = async (pid, stars) => {
    await api.rate({ provider_id: pid, stars });
    const fresh = await api.getProviders();
    setProviders(fresh);
    notify(`Avaliação ${stars}★ registrada!`);
  };

  const addComment = async (pid, text) => {
    await api.sendComment({ provider_id: pid, text });
    notify("Comentário enviado para moderação! ✉️");
  };

  const toggleFav = (pid) => {
    setFavorites(f => f.includes(pid) ? f.filter(x=>x!==pid) : [...f, pid]);
  };

  const deleteProvider = async (id) => {
    if (!confirm("Confirma a exclusão deste prestador?")) return;
    await api.deleteProvider(id);
    setProviders(prev => prev.filter(p => p.id !== id));
    if (selectedPid === id) { setView("home"); setSelectedPid(null); }
    notify("Prestador excluído!");
  };

  const saveProvider = async (f, editId) => {
    if (!f.name || !f.phone || !f.category_id) { notify("Preencha os campos obrigatórios", "error"); return; }
    let category_id = f.category_id;
    if (category_id === "__new__" && f.newCatName?.trim()) {
      const nc = await api.createCategory({ name: f.newCatName.trim() });
      setCategories(prev => [...prev, nc]);
      category_id = nc.id;
    }
    const body = { name:f.name, nickname:f.nickname, phone:f.phone, email:f.email, website:f.website, address:f.address, category_id, emergency:f.emergency, hours:f.hours };
    if (editId) {
      const updated = await api.updateProvider(editId, body);
      setProviders(prev => prev.map(p => p.id===editId?{...p,...updated,category_name:categories.find(c=>c.id===category_id)?.name}:p));
      notify("Prestador atualizado!");
    } else {
      await loadData();
      notify("Prestador cadastrado!");
    }
    setProviderModal(null);
  };

  const isAdmin = user?.role === "admin";

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Trebuchet MS','Segoe UI',system-ui,sans-serif" }}>
      <style>{`
        * { box-sizing:border-box; }
        input:focus,textarea:focus,select:focus { border-color:${C.primary}!important; box-shadow:0 0 0 3px ${C.primaryLight}; }
        button:hover { opacity:.85; }
        ::-webkit-scrollbar { width:6px; } ::-webkit-scrollbar-thumb { background:${C.border}; border-radius:3px; }
      `}</style>

      <Notif n={notif} />

      {view === "auth" && <AuthView onLogin={login} onRegister={register} />}

      {view !== "auth" && user && (
        <>
          <Nav user={user} onLogout={logout} view={view} setView={setView} />

          {view === "home" && (
            loading ? <div style={{ textAlign:"center", padding:80, color:C.textLight, fontSize:16 }}>Carregando prestadores...</div> :
            <HomeView providers={providers} categories={categories} currentUser={user} isAdmin={isAdmin}
              favorites={favorites} onFav={toggleFav}
              onRate={rateProvider}
              onEdit={p => setProviderModal(p)}
              onDelete={deleteProvider}
              onAdd={() => setProviderModal({})}
              onSelectProvider={pid => { setSelectedPid(pid); setView("detail"); }}
            />
          )}

          {view === "detail" && selectedPid && (
            <DetailView providerId={selectedPid} categories={categories} currentUser={user} isAdmin={isAdmin}
              onBack={() => setView("home")} onRate={rateProvider} onComment={addComment} />
          )}

          {view === "admin" && isAdmin && (
            <AdminPanel providers={providers} categories={categories} currentUser={user}
              setProviders={setProviders} setCategories={setCategories}
              onBack={() => setView("home")} notify={notify} />
          )}
        </>
      )}

      {providerModal !== null && (
        <Modal title={providerModal?.id ? "✏️ Editar Prestador" : "➕ Novo Prestador"} onClose={() => setProviderModal(null)} wide>
          <ProviderForm initial={providerModal} categories={categories} onSave={saveProvider} onCancel={() => setProviderModal(null)} />
        </Modal>
      )}
    </div>
  );
}
