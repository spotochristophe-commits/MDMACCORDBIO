import { useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────
const ADMIN_PWD   = "biontruffe2026";
const KEY_PROSPECTS = "bnt:prospects";
const KEY_CLIENTS   = "bnt:clients";
const KEY_COMMANDES = "bnt:commandes";

const PROFILS = [
  { value: "Tarif Général MBS",    label: "Tarif Général MBS",         remise: 0  },
  { value: "Revendeur Premium",    label: "Revendeur Premium (−10%)",  remise: 10 },
  { value: "Distributeur Exclusif",label: "Distributeur Exclusif (−15%)", remise: 15 },
];

const PAIEMENTS = ["À réception de facture","30 jours fin de mois","60 jours","Comptant"];

const fmtDate = (d) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("fr-FR"); } catch { return d; }
};
const fmtEur = (n) => `${Number(n || 0).toFixed(2)} €`;
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// ─────────────────────────────────────────────
// STORAGE HELPERS
// ─────────────────────────────────────────────
async function dbGet(key) {
  try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : []; }
  catch { return []; }
}
async function dbSet(key, val) {
  try { await window.storage.set(key, JSON.stringify(val)); } catch {}
}

// ─────────────────────────────────────────────
// COMPOSANTS UI
// ─────────────────────────────────────────────
const Badge = ({ type }) => {
  const s = type === "client"
    ? { background:"#e8f5e9", color:"#2d7a3a", border:"1px solid #a5d6a7" }
    : { background:"#fff3e0", color:"#c47a00", border:"1px solid #ffcc80" };
  return <span style={{ ...s, borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:700 }}>
    {type === "client" ? "✅ Client" : "🔍 Prospect"}
  </span>;
};

const Btn = ({ children, onClick, variant="vert", size="md", disabled, style={} }) => {
  const base = { cursor:disabled?"not-allowed":"pointer", fontFamily:"inherit", fontWeight:700,
    borderRadius:5, border:"none", display:"inline-flex", alignItems:"center", gap:4,
    fontSize: size==="sm" ? 12 : 14, padding: size==="sm" ? "4px 10px" : "8px 18px",
    transition:"opacity .15s", opacity: disabled ? 0.5 : 1 };
  const variants = {
    vert:    { background:"#2d4a2d", color:"#fff" },
    orange:  { background:"rgba(196,122,0,.12)", color:"#c47a00", border:"1px solid rgba(196,122,0,.3)" },
    outline: { background:"transparent", border:"1.5px solid #ddd5c5", color:"#5a4e3a" },
    danger:  { background:"transparent", border:"1px solid rgba(192,57,43,.35)", color:"#c0392b" },
    beige:   { background:"#f5f0e8", color:"#2a2218", border:"1px solid #ddd5c5" },
  };
  return <button disabled={disabled} onClick={onClick} style={{...base,...variants[variant],...style}}>{children}</button>;
};

const Input = ({ id, label, value, onChange, type="text", placeholder="", full=false, required=false }) => (
  <div style={{ display:"flex", flexDirection:"column", gap:3, gridColumn: full?"1/-1":"auto" }}>
    {label && <label htmlFor={id} style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", color:"#5a4e3a", fontWeight:700 }}>
      {label}{required && <span style={{color:"#c0392b"}}> *</span>}
    </label>}
    <input id={id} type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{ background:"#f5f0e8", border:"1px solid #ddd5c5", borderRadius:4, color:"#2a2218",
        fontFamily:"inherit", fontSize:13, padding:"7px 10px", width:"100%", boxSizing:"border-box" }} />
  </div>
);

const Sel = ({ label, value, onChange, options, full=false }) => (
  <div style={{ display:"flex", flexDirection:"column", gap:3, gridColumn: full?"1/-1":"auto" }}>
    {label && <label style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", color:"#5a4e3a", fontWeight:700 }}>{label}</label>}
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{ background:"#f5f0e8", border:"1px solid #ddd5c5", borderRadius:4, color:"#2a2218",
        fontFamily:"inherit", fontSize:13, padding:"7px 10px" }}>
      {options.map(o => typeof o === "string"
        ? <option key={o} value={o}>{o}</option>
        : <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Card = ({ children, style={} }) => (
  <div style={{ background:"#fdfcf9", border:"1px solid #ddd5c5", borderRadius:6,
    padding:"1.25rem 1.5rem", boxShadow:"0 1px 6px rgba(45,74,45,.06)", ...style }}>{children}</div>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:15, fontWeight:700, color:"#1e3320",
    borderBottom:"2px solid #ddd5c5", paddingBottom:8, marginBottom:14 }}>{children}</div>
);

const Stat = ({ label, value, sub }) => (
  <div style={{ background:"#fdfcf9", border:"1px solid #ddd5c5", borderRadius:6, padding:"14px 16px",
    borderTop:"3px solid #3d6140", flex:1, minWidth:120 }}>
    <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.1em", color:"#5a4e3a", marginBottom:4 }}>{label}</div>
    <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:26, color:"#1e3320" }}>{value}</div>
    {sub && <div style={{ fontSize:10, color:"#8b7355", marginTop:2 }}>{sub}</div>}
  </div>
);

const Toast = ({ msg }) => (
  <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, background:"#1e3320", color:"#e8dcc8",
    padding:"10px 18px", borderRadius:6, fontSize:13, fontWeight:700, borderLeft:"3px solid #c4a882",
    boxShadow:"0 4px 20px rgba(0,0,0,.3)", animation:"fadeIn .3s ease" }}>
    {msg}
  </div>
);

// ─────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────
const Modal = ({ open, onClose, title, children, footer, maxWidth=680 }) => {
  if (!open) return null;
  return (
    <div onClick={e => e.target===e.currentTarget && onClose()}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:500,
        display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#fdfcf9", borderRadius:8, width:"100%", maxWidth, maxHeight:"90vh",
        overflow:"auto", boxShadow:"0 20px 60px rgba(0,0,0,.3)", display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"16px 24px", borderBottom:"2px solid #ddd5c5", position:"sticky", top:0,
          background:"#fdfcf9", zIndex:1 }}>
          <span style={{ fontFamily:"'Libre Baskerville',serif", fontSize:16, fontWeight:700, color:"#1e3320" }}>{title}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#5a4e3a" }}>✕</button>
        </div>
        <div style={{ padding:"20px 24px", flex:1, overflowY:"auto" }}>{children}</div>
        {footer && <div style={{ padding:"14px 24px", borderTop:"1px solid #ddd5c5", display:"flex",
          justifyContent:"flex-end", gap:10, flexWrap:"wrap" }}>{footer}</div>}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// FICHE HTML
// ─────────────────────────────────────────────
const FicheRow = ({ label, value }) => value ? (
  <div style={{ display:"flex", gap:8, marginBottom:4, fontSize:13 }}>
    <span style={{ color:"#5a4e3a", minWidth:130, fontSize:12, flexShrink:0 }}>{label}</span>
    <span style={{ color:"#2a2218", fontWeight:700 }}>{value}</span>
  </div>
) : null;

const FicheBlock = ({ title, children, full=false }) => (
  <div style={{ background:"#f5f0e8", border:"1px solid #ddd5c5", borderRadius:5, padding:"12px 14px",
    gridColumn: full ? "1/-1" : "auto" }}>
    <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.12em", color:"#5a4e3a",
      marginBottom:8, fontWeight:700 }}>{title}</div>
    {children}
  </div>
);

const Fiche = ({ e, type }) => {
  const addr = [e.rue, e.complement, e.cp, e.ville].filter(Boolean).join(", ");
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
      <FicheBlock title="🏪 Magasin">
        <FicheRow label="Raison sociale" value={e.raisonSociale} />
        <FicheRow label="Adresse" value={addr} />
        <FicheRow label="Téléphone" value={e.telMagasin} />
        <FicheRow label="Email" value={e.emailMagasin} />
        <FicheRow label="Surface" value={e.surface ? e.surface+" m²" : null} />
        <FicheRow label="SIRET" value={e.siret} />
        <FicheRow label="TVA intra" value={e.tvaIntra ? "FR "+e.tvaIntra : null} />
        <FicheRow label="Capital" value={e.capital} />
        <FicheRow label="Code NAF" value={e.naf} />
      </FicheBlock>
      <FicheBlock title="👤 Contacts">
        <FicheRow label="Contact principal" value={e.contact1} />
        <FicheRow label="Fonction" value={e.fonction} />
        <FicheRow label="Tél / Portable" value={[e.tel1,e.portable1].filter(Boolean).join(" / ")||null} />
        <FicheRow label="Email" value={e.email1} />
        <FicheRow label="Contact 2" value={e.contact2} />
        <FicheRow label="Facturation" value={e.contactFactu} />
        <FicheRow label="Email factu." value={e.emailFactu} />
      </FicheBlock>
      <FicheBlock title="🚚 Livraisons">
        <FicheRow label="Jours" value={e.joursLivraison?.join(", ")||null} />
        <FicheRow label="Horaires" value={e.heureDebut&&e.heureFin ? e.heureDebut+" → "+e.heureFin : null} />
        <FicheRow label="Infos" value={e.infoLivraison} />
      </FicheBlock>
      <FicheBlock title="📊 Commercial">
        {type==="client" && <FicheRow label="N° client" value={e.numClient} />}
        <FicheRow label="Profil" value={e.profil} />
        <FicheRow label="Potentiel" value={e.potentiel ? e.potentiel+" €/mois" : null} />
        {type==="client" && <FicheRow label="Activation" value={fmtDate(e.convertedAt)} />}
        {type==="client" && <FicheRow label="Paiement" value={e.conditionsPaiement} />}
        <FicheRow label="Notes" value={e.notesInternes||e.commentaire} />
      </FicheBlock>
    </div>
  );
};

// ─────────────────────────────────────────────
// LOCK SCREEN
// ─────────────────────────────────────────────
const LockScreen = ({ onUnlock }) => {
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const [shake, setShake] = useState(false);

  const check = () => {
    if (pwd === ADMIN_PWD) { onUnlock(); }
    else {
      setErr("Mot de passe incorrect."); setPwd("");
      setShake(true); setTimeout(() => setShake(false), 400);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"#1e3320", display:"flex",
      alignItems:"center", justifyContent:"center", zIndex:9999 }}>
      <div style={{ background:"#fdfcf9", borderRadius:8, padding:"2.5rem 2rem", width:320, textAlign:"center" }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🔒</div>
        <h2 style={{ fontFamily:"'Libre Baskerville',serif", fontSize:18, color:"#1e3320", marginBottom:4 }}>CRM BIO N TRUFFE</h2>
        <p style={{ fontSize:12, color:"#5a4e3a", marginBottom:20 }}>Accès réservé à l'équipe Eridan BNT</p>
        <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&check()} placeholder="••••••"
          style={{ width:"100%", padding:"10px 14px", border:`1.5px solid ${shake?"#c0392b":"#ddd5c5"}`,
            borderRadius:5, fontSize:16, textAlign:"center", letterSpacing:"0.3em",
            fontFamily:"inherit", background:"#f5f0e8", color:"#2a2218", marginBottom:14,
            boxSizing:"border-box", animation: shake?"shake .3s ease":"none" }} />
        <button onClick={check} style={{ width:"100%", background:"#2d4a2d", color:"#fff",
          border:"none", borderRadius:5, padding:"10px", fontFamily:"inherit",
          fontSize:13, fontWeight:700, cursor:"pointer", letterSpacing:"0.08em", textTransform:"uppercase" }}>
          Accéder
        </button>
        {err && <div style={{ fontSize:11, color:"#c0392b", marginTop:8 }}>{err}</div>}
      </div>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}`}</style>
    </div>
  );
};

// ─────────────────────────────────────────────
// APP PRINCIPALE
// ─────────────────────────────────────────────
export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [prospects, setProspectsState] = useState([]);
  const [clients, setClientsState]     = useState([]);
  const [commandes, setComandesState]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modals
  const [modalFiche, setModalFiche] = useState(null);       // { type, id }
  const [modalConv, setModalConv]   = useState(null);       // prospect id
  const [modalBDC, setModalBDC]     = useState(null);       // client id
  const [modalCmd, setModalCmd]     = useState(null);       // commande id

  // Recherche / filtre
  const [qPros, setQPros] = useState("");
  const [qCli,  setQCli]  = useState("");
  const [qCmd,  setQCmd]  = useState("");
  const [filtreProfil, setFiltreProfil] = useState("all");

  // Form conversion
  const [convData, setConvData] = useState({ profil:"Tarif Général MBS", paiement:"À réception de facture", notes:"", date: new Date().toISOString().slice(0,10) });

  // ── STORAGE ──
  const loadAll = useCallback(async () => {
    setLoading(true);
    const [p, c, o] = await Promise.all([
      dbGet(KEY_PROSPECTS), dbGet(KEY_CLIENTS), dbGet(KEY_COMMANDES)
    ]);
    setProspectsState(p); setClientsState(c); setComandesState(o);
    setLoading(false);
  }, []);

  useEffect(() => { if (unlocked) loadAll(); }, [unlocked, loadAll]);

  const setProspects = async (val) => { setProspectsState(val); await dbSet(KEY_PROSPECTS, val); };
  const setClients   = async (val) => { setClientsState(val);   await dbSet(KEY_CLIENTS, val); };
  const setCommandes = async (val) => { setComandesState(val);  await dbSet(KEY_COMMANDES, val); };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // ── HELPERS ──
  const getProspect = (id) => prospects.find(p => p.id === id);
  const getClient   = (id) => clients.find(c => c.id === id);
  const getCommande = (id) => commandes.find(o => o.id === id);
  const getClientCommandes = (id) => commandes.filter(o => o.clientId === id);
  const clientCA = (id) => getClientCommandes(id).reduce((s,o) => s+(o.totalHT||0), 0);

  // ── ACTIONS ──
  const deleteProspect = async (id) => {
    if (!confirm("Supprimer ce prospect ?")) return;
    await setProspects(prospects.filter(p => p.id !== id));
    setModalFiche(null); showToast("🗑️ Prospect supprimé");
  };

  const deleteClient = async (id) => {
    if (!confirm("Supprimer ce client et tout son historique ?")) return;
    await setClients(clients.filter(c => c.id !== id));
    await setCommandes(commandes.filter(o => o.clientId !== id));
    setModalFiche(null); showToast("🗑️ Client supprimé");
  };

  const deleteCommande = async (id) => {
    if (!confirm("Supprimer cette commande ?")) return;
    await setCommandes(commandes.filter(o => o.id !== id));
    showToast("🗑️ Commande supprimée");
  };

  const convertProspect = async () => {
    const p = getProspect(modalConv);
    if (!p) return;
    const num = "BNT-" + String(clients.length + 1).padStart(4, "0");
    const client = {
      ...p, id: "cli_"+uid(),
      numClient: num,
      profil: convData.profil,
      conditionsPaiement: convData.paiement,
      notesInternes: convData.notes,
      convertedAt: convData.date,
      type: "client"
    };
    await setClients([...clients, client]);
    await setProspects(prospects.filter(x => x.id !== modalConv));
    setModalConv(null);
    showToast(`✅ ${client.raisonSociale} converti → ${num}`);
    setTimeout(() => { setPage("clients"); setModalFiche({ type:"client", id: client.id }); }, 300);
  };

  // ── EXPORT ──
  const exportJSON = () => {
    const data = JSON.stringify({ prospects, clients, commandes, exportedAt: new Date().toISOString() }, null, 2);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([data], {type:"application/json"}));
    a.download = `BNT_CRM_${new Date().toISOString().slice(0,10)}.json`;
    a.click(); showToast("⬇️ Export téléchargé");
  };

  const importJSON = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = async (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        if (!d.prospects || !d.clients) throw new Error("Format invalide");
        if (!confirm(`Importer ${d.prospects.length} prospects, ${d.clients.length} clients, ${(d.commandes||[]).length} commandes ? Les données actuelles seront remplacées.`)) return;
        await setProspects(d.prospects||[]); await setClients(d.clients||[]); await setCommandes(d.commandes||[]);
        showToast("✅ Import réussi");
      } catch(err) { alert("Fichier invalide : "+err.message); }
    };
    r.readAsText(file);
  };

  // ─────────────────────
  // RENDER PAGES
  // ─────────────────────

  const navItems = [
    { key:"dashboard", ico:"📊", label:"Dashboard" },
    { key:"prospects", ico:"🔍", label:"Prospects",  count: prospects.length },
    { key:"clients",   ico:"✅", label:"Clients",    count: clients.length },
    { key:"commandes", ico:"📋", label:"Commandes",  count: commandes.length },
    { key:"export",    ico:"📤", label:"Export / Import" },
  ];

  const totalCA = commandes.reduce((s,o) => s+(o.totalHT||0), 0);

  // Filtres
  const filteredProspects = prospects.filter(p =>
    !qPros || (p.raisonSociale||"").toLowerCase().includes(qPros.toLowerCase()) ||
    (p.ville||"").toLowerCase().includes(qPros.toLowerCase()) ||
    (p.contact1||"").toLowerCase().includes(qPros.toLowerCase())
  );

  const filteredClients = clients.filter(c =>
    (filtreProfil === "all" || c.profil === filtreProfil) &&
    (!qCli || (c.raisonSociale||"").toLowerCase().includes(qCli.toLowerCase()) ||
     (c.numClient||"").toLowerCase().includes(qCli.toLowerCase()) ||
     (c.ville||"").toLowerCase().includes(qCli.toLowerCase()))
  );

  const filteredCommandes = [...commandes].sort((a,b)=>b.date?.localeCompare(a.date)).filter(o => {
    const c = getClient(o.clientId);
    return !qCmd || (c?.raisonSociale||"").toLowerCase().includes(qCmd.toLowerCase()) ||
      (o.ref||"").toLowerCase().includes(qCmd.toLowerCase());
  });

  if (!unlocked) return <LockScreen onUnlock={() => setUnlocked(true)} />;

  // ── FICHE MODALE ──
  const ficheEntity = modalFiche
    ? (modalFiche.type === "client" ? getClient(modalFiche.id) : getProspect(modalFiche.id))
    : null;

  const ficheCommandes = ficheEntity && modalFiche?.type === "client"
    ? getClientCommandes(ficheEntity.id)
    : [];

  const FicheModal = () => {
    const [openHisto, setOpenHisto] = useState(null);
    if (!ficheEntity) return null;
    const isClient = modalFiche.type === "client";
    const ca = isClient ? clientCA(ficheEntity.id) : 0;

    return (
      <Modal open={!!modalFiche} onClose={() => setModalFiche(null)}
        title={isClient
          ? `✅ ${ficheEntity.raisonSociale} · ${ficheEntity.numClient}`
          : `🔍 Prospect — ${ficheEntity.raisonSociale}`}
        maxWidth={720}
        footer={<>
          <Btn variant="danger" size="sm"
            onClick={() => isClient ? deleteClient(ficheEntity.id) : deleteProspect(ficheEntity.id)}>
            🗑️ Supprimer
          </Btn>
          <Btn variant="outline" onClick={() => setModalFiche(null)}>Fermer</Btn>
          {!isClient && <Btn variant="orange" onClick={() => { setModalFiche(null); setModalConv(ficheEntity.id); setConvData({ profil: ficheEntity.profil||"Tarif Général MBS", paiement:"À réception de facture", notes: ficheEntity.commentaire||"", date: new Date().toISOString().slice(0,10) }); }}>
            ✅ Convertir en client
          </Btn>}
          {isClient && <Btn variant="vert" onClick={() => { setModalFiche(null); setModalBDC(ficheEntity.id); }}>📋 Nouveau BDC</Btn>}
        </>}>

        <Fiche e={ficheEntity} type={isClient ? "client" : "prospect"} />

        {isClient && (
          <div style={{ marginTop:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <SectionTitle>📋 Historique des commandes</SectionTitle>
              <span style={{ fontSize:12, color:"#5a4e3a" }}>
                {ficheCommandes.length} commande(s) · CA : <strong style={{ color:"#1e3320" }}>{fmtEur(ca)}</strong> HT
              </span>
            </div>
            {ficheCommandes.length === 0
              ? <p style={{ fontSize:12, color:"#8b7355", fontStyle:"italic" }}>Aucune commande enregistrée</p>
              : ficheCommandes.sort((a,b)=>b.date?.localeCompare(a.date)).map(o => (
                <div key={o.id} onClick={() => setOpenHisto(openHisto===o.id?null:o.id)}
                  style={{ border:"1px solid #ddd5c5", borderRadius:5, padding:"10px 14px",
                    marginBottom:8, cursor:"pointer", background:"#fdfcf9",
                    transition:"border-color .15s", borderColor: openHisto===o.id?"#5a8a5a":"#ddd5c5" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:6 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:"#1e3320" }}>{o.ref}</span>
                    <span style={{ fontSize:11, color:"#5a4e3a" }}>{fmtDate(o.date)}</span>
                    <span style={{ fontFamily:"'Libre Baskerville',serif", fontSize:16, color:"#2d7a3a" }}>{fmtEur(o.totalHT)} HT</span>
                  </div>
                  {openHisto === o.id && (
                    <div style={{ marginTop:10, fontSize:12 }}>
                      {(o.lignes||[]).map((l,i) => (
                        <div key={i} style={{ display:"flex", justifyContent:"space-between",
                          padding:"4px 0", borderBottom:"1px solid #eee" }}>
                          <span style={{ color:"#2a2218" }}>{l.nom} {l.poids ? `(${l.poids})` : ""} × {l.qty}</span>
                          <span style={{ fontWeight:700, color:"#1e3320" }}>{fmtEur(l.ht)}</span>
                        </div>
                      ))}
                      <div style={{ fontSize:11, color:"#5a4e3a", marginTop:6, display:"flex", gap:12 }}>
                        <span>TVA 5,5% : {fmtEur((o.totalHT||0)*0.055)}</span>
                        <span style={{ fontWeight:700 }}>TTC : {fmtEur((o.totalHT||0)*1.055)}</span>
                      </div>
                      <div style={{ marginTop:8, textAlign:"right" }}>
                        <Btn variant="danger" size="sm" onClick={e => { e.stopPropagation(); deleteCommande(o.id); }}>🗑️ Supprimer</Btn>
                      </div>
                    </div>
                  )}
                </div>
              ))
            }
          </div>
        )}
      </Modal>
    );
  };

  // ── MODAL BDC ──
  const bdcClient = modalBDC ? getClient(modalBDC) : null;

  // ─────────────────────
  // LAYOUT
  // ─────────────────────
  const G = "https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700&family=Lato:wght@300;400;700&display=swap";

  return (
    <>
      <link rel="stylesheet" href={G} />
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'Lato',sans-serif; background:#f5f0e8; }
        input,select,textarea,button { font-family:inherit; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {toast && <Toast msg={toast} />}
      <FicheModal />

      {/* MODAL CONVERSION */}
      <Modal open={!!modalConv} onClose={() => setModalConv(null)}
        title="✅ Convertir en client" maxWidth={500}
        footer={<>
          <Btn variant="outline" onClick={() => setModalConv(null)}>Annuler</Btn>
          <Btn variant="vert" onClick={convertProspect}>✅ Confirmer la conversion</Btn>
        </>}>
        {modalConv && (() => {
          const p = getProspect(modalConv);
          return p ? (
            <>
              <div style={{ background:"rgba(45,74,45,.07)", border:"1px solid rgba(45,74,45,.2)",
                borderRadius:4, padding:"10px 14px", marginBottom:16, fontSize:12, color:"#1e3320" }}>
                ✅ Prospect : <strong>{p.raisonSociale}</strong> · {p.cp} {p.ville}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  <label style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", color:"#5a4e3a", fontWeight:700 }}>N° Client (auto)</label>
                  <input value={`BNT-${String(clients.length+1).padStart(4,"0")}`} readOnly
                    style={{ background:"#c8dcc8", border:"1px solid #ddd5c5", borderRadius:4,
                      padding:"7px 10px", fontWeight:700, color:"#1e3320", fontSize:13 }} />
                </div>
                <Sel label="Profil revendeur" value={convData.profil}
                  onChange={v => setConvData({...convData, profil:v})} options={PROFILS} />
                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  <label style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", color:"#5a4e3a", fontWeight:700 }}>Date d'activation</label>
                  <input type="date" value={convData.date} onChange={e => setConvData({...convData, date:e.target.value})}
                    style={{ background:"#f5f0e8", border:"1px solid #ddd5c5", borderRadius:4, padding:"7px 10px", fontSize:13, color:"#2a2218" }} />
                </div>
                <Sel label="Conditions paiement" value={convData.paiement}
                  onChange={v => setConvData({...convData, paiement:v})} options={PAIEMENTS} />
                <div style={{ gridColumn:"1/-1", display:"flex", flexDirection:"column", gap:4 }}>
                  <label style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", color:"#5a4e3a", fontWeight:700 }}>Notes internes</label>
                  <textarea value={convData.notes} onChange={e => setConvData({...convData, notes:e.target.value})}
                    rows={2} placeholder="Conditions négociées, contexte…"
                    style={{ background:"#f5f0e8", border:"1px solid #ddd5c5", borderRadius:4,
                      padding:"7px 10px", fontSize:13, color:"#2a2218", resize:"vertical" }} />
                </div>
              </div>
            </>
          ) : null;
        })()}
      </Modal>

      {/* MODAL BDC */}
      <Modal open={!!modalBDC} onClose={() => setModalBDC(null)}
        title="📋 Nouveau Bon de Commande" maxWidth={480}
        footer={<>
          <Btn variant="outline" onClick={() => setModalBDC(null)}>Annuler</Btn>
          <Btn variant="vert" onClick={() => {
            if (!bdcClient) return;
            sessionStorage.setItem("bnt_bdc_client", JSON.stringify({
              clientId: bdcClient.id, numClient: bdcClient.numClient,
              societe: bdcClient.raisonSociale, ville: bdcClient.ville,
              cp: bdcClient.cp, email: bdcClient.email1||bdcClient.emailMagasin,
              tel: bdcClient.tel1||bdcClient.telMagasin,
              profil: bdcClient.profil, nom: bdcClient.contact1
            }));
            setModalBDC(null);
            window.open("commande.html", "_blank");
          }}>📋 Ouvrir le bon de commande</Btn>
        </>}>
        {bdcClient && (
          <>
            <div style={{ background:"rgba(45,74,45,.07)", border:"1px solid rgba(45,74,45,.2)",
              borderRadius:5, padding:"12px 16px", marginBottom:14 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#1e3320", marginBottom:4 }}>
                {bdcClient.raisonSociale} · {bdcClient.numClient}
              </div>
              <div style={{ fontSize:12, color:"#5a4e3a" }}>
                {bdcClient.cp} {bdcClient.ville} · <Badge type="client" /> · {bdcClient.profil}
              </div>
            </div>
            <p style={{ fontSize:12, color:"#5a4e3a", lineHeight:1.6, marginBottom:12 }}>
              Le bon de commande s'ouvrira avec les informations de ce client pré-remplies.
              Une fois la commande envoyée, revenez ici pour saisir manuellement les lignes si besoin.
            </p>
            <div style={{ background:"#f5f0e8", borderRadius:4, padding:"8px 12px",
              fontSize:11, color:"#8b7355" }}>
              💡 CA actuel : <strong style={{ color:"#1e3320" }}>{fmtEur(clientCA(bdcClient.id))} HT</strong>
              · {getClientCommandes(bdcClient.id).length} commande(s)
            </div>
          </>
        )}
      </Modal>

      {/* APP LAYOUT */}
      <div style={{ display:"flex", minHeight:"100vh" }}>

        {/* SIDEBAR */}
        <aside style={{ width:210, flexShrink:0, background:"#1e3320", display:"flex",
          flexDirection:"column", position:"sticky", top:0, height:"100vh", overflowY:"auto" }}>
          <div style={{ padding:"16px 18px", borderBottom:"1px solid rgba(255,255,255,.08)" }}>
            <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:14, fontWeight:700, color:"#e8dcc8" }}>
              🌿 BIO N TRUFFE
            </div>
            <div style={{ fontSize:10, color:"rgba(200,220,200,.5)", letterSpacing:"0.12em", textTransform:"uppercase", marginTop:3 }}>
              CRM Clients
            </div>
          </div>

          <nav style={{ flex:1, padding:"8px 0" }}>
            {navItems.map(item => (
              <div key={item.key} onClick={() => setPage(item.key)}
                style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 16px",
                  cursor:"pointer", fontSize:13, borderLeft:"2px solid transparent",
                  color: page===item.key ? "#e8dcc8" : "rgba(200,220,200,.6)",
                  background: page===item.key ? "rgba(255,255,255,.07)" : "transparent",
                  borderLeftColor: page===item.key ? "#c4a882" : "transparent",
                  transition:"all .15s" }}>
                <span style={{ fontSize:14, width:16, textAlign:"center" }}>{item.ico}</span>
                <span style={{ flex:1 }}>{item.label}</span>
                {item.count !== undefined && (
                  <span style={{ background:"rgba(196,168,130,.25)", color:"#c4a882",
                    fontSize:11, fontWeight:700, padding:"1px 7px", borderRadius:10 }}>
                    {item.count}
                  </span>
                )}
              </div>
            ))}
          </nav>

          <div style={{ padding:"14px 16px", borderTop:"1px solid rgba(255,255,255,.07)", fontSize:12 }}>
            <a href="prospect.html" style={{ color:"#c4a882", textDecoration:"none", display:"block", marginBottom:4 }}>+ Nouveau prospect</a>
            <a href="commande.html" style={{ color:"rgba(200,220,200,.5)", textDecoration:"none", display:"block", marginBottom:4 }}>📋 Bon de commande</a>
            <a href="index.html" style={{ color:"rgba(200,220,200,.3)", textDecoration:"none", display:"block" }}>← Portail</a>
          </div>
        </aside>

        {/* MAIN */}
        <main style={{ flex:1, padding:"24px 28px", overflow:"auto" }}>
          {loading ? (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh", color:"#5a4e3a", fontSize:14, fontStyle:"italic" }}>
              Chargement des données…
            </div>
          ) : (

            <>
              {/* ── DASHBOARD ── */}
              {page === "dashboard" && (
                <div style={{ animation:"fadeIn .3s ease" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                    marginBottom:20, paddingBottom:12, borderBottom:"2px solid #ddd5c5" }}>
                    <div>
                      <h1 style={{ fontFamily:"'Libre Baskerville',serif", fontSize:22, color:"#1e3320" }}>📊 Dashboard</h1>
                      <p style={{ fontSize:12, color:"#5a4e3a", marginTop:2 }}>Vue d'ensemble BIO N TRUFFE</p>
                    </div>
                    <a href="prospect.html">
                      <Btn variant="vert">+ Nouveau prospect</Btn>
                    </a>
                  </div>

                  <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
                    <Stat label="Prospects" value={prospects.length} sub="en qualification" />
                    <Stat label="Clients actifs" value={clients.length} sub="comptes créés" />
                    <Stat label="Commandes" value={commandes.length} sub="enregistrées" />
                    <Stat label="CA Total HT" value={fmtEur(totalCA)} sub="tous clients" />
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                    <Card>
                      <SectionTitle>🔍 Derniers prospects</SectionTitle>
                      {prospects.length === 0
                        ? <p style={{ fontSize:12, color:"#8b7355", fontStyle:"italic" }}>Aucun prospect — <a href="prospect.html" style={{ color:"#2d4a2d" }}>en créer un</a></p>
                        : [...prospects].reverse().slice(0,5).map(p => (
                          <div key={p.id} onClick={() => setModalFiche({ type:"prospect", id:p.id })}
                            style={{ border:"1px solid #ddd5c5", borderRadius:4, padding:"8px 12px",
                              marginBottom:6, cursor:"pointer", background:"#fff",
                              transition:"border-color .15s" }}
                            onMouseOver={e=>e.currentTarget.style.borderColor="#5a8a5a"}
                            onMouseOut={e=>e.currentTarget.style.borderColor="#ddd5c5"}>
                            <div style={{ fontSize:13, fontWeight:700 }}>{p.raisonSociale}</div>
                            <div style={{ fontSize:11, color:"#5a4e3a" }}>{p.cp} {p.ville}</div>
                          </div>
                        ))
                      }
                    </Card>
                    <Card>
                      <SectionTitle>✅ Derniers clients</SectionTitle>
                      {clients.length === 0
                        ? <p style={{ fontSize:12, color:"#8b7355", fontStyle:"italic" }}>Aucun client converti</p>
                        : [...clients].reverse().slice(0,5).map(c => (
                          <div key={c.id} onClick={() => setModalFiche({ type:"client", id:c.id })}
                            style={{ border:"1px solid #ddd5c5", borderRadius:4, padding:"8px 12px",
                              marginBottom:6, cursor:"pointer", background:"#fff",
                              transition:"border-color .15s" }}
                            onMouseOver={e=>e.currentTarget.style.borderColor="#5a8a5a"}
                            onMouseOut={e=>e.currentTarget.style.borderColor="#ddd5c5"}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                              <div style={{ fontSize:13, fontWeight:700 }}>{c.raisonSociale}</div>
                              <span style={{ fontSize:11, fontWeight:700, color:"#2d4a2d" }}>{c.numClient}</span>
                            </div>
                            <div style={{ fontSize:11, color:"#5a4e3a", marginTop:2 }}>
                              CA : {fmtEur(clientCA(c.id))} · {getClientCommandes(c.id).length} cmd
                            </div>
                          </div>
                        ))
                      }
                    </Card>
                  </div>
                </div>
              )}

              {/* ── PROSPECTS ── */}
              {page === "prospects" && (
                <div style={{ animation:"fadeIn .3s ease" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                    marginBottom:20, paddingBottom:12, borderBottom:"2px solid #ddd5c5" }}>
                    <div>
                      <h1 style={{ fontFamily:"'Libre Baskerville',serif", fontSize:22, color:"#1e3320" }}>🔍 Prospects</h1>
                      <p style={{ fontSize:12, color:"#5a4e3a", marginTop:2 }}>Leads en cours de qualification</p>
                    </div>
                    <a href="prospect.html"><Btn variant="vert">+ Nouveau prospect</Btn></a>
                  </div>

                  <div style={{ position:"relative", marginBottom:14 }}>
                    <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:14 }}>🔍</span>
                    <input value={qPros} onChange={e=>setQPros(e.target.value)}
                      placeholder="Rechercher un prospect…"
                      style={{ width:"100%", padding:"8px 12px 8px 32px", border:"1.5px solid #ddd5c5",
                        borderRadius:5, fontSize:13, background:"#fdfcf9", color:"#2a2218", boxSizing:"border-box" }} />
                  </div>

                  <Card style={{ padding:0, overflow:"hidden" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                      <thead><tr style={{ background:"#f5f0e8" }}>
                        {["Raison sociale","Ville","Contact","Créé le","Potentiel","Actions"].map(h => (
                          <th key={h} style={{ textAlign:"left", padding:"8px 12px", fontSize:11,
                            letterSpacing:"0.1em", textTransform:"uppercase", color:"#5a4e3a",
                            fontWeight:700, borderBottom:"2px solid #ddd5c5" }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {filteredProspects.length === 0
                          ? <tr><td colSpan={6} style={{ textAlign:"center", padding:"2rem", color:"#8b7355", fontStyle:"italic" }}>
                              {qPros ? "Aucun résultat" : <span>Aucun prospect — <a href="prospect.html" style={{ color:"#2d4a2d" }}>en créer un</a></span>}
                            </td></tr>
                          : filteredProspects.map(p => (
                            <tr key={p.id} style={{ borderBottom:"1px solid #ddd5c5" }}
                              onMouseOver={e=>e.currentTarget.style.background="#faf8f3"}
                              onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                              <td style={{ padding:"8px 12px", fontWeight:700 }}>{p.raisonSociale}</td>
                              <td style={{ padding:"8px 12px", fontSize:12 }}>{p.cp} {p.ville}</td>
                              <td style={{ padding:"8px 12px", fontSize:12 }}>
                                {p.contact1||"—"}<br/>
                                <span style={{ color:"#8b7355" }}>{p.email1||""}</span>
                              </td>
                              <td style={{ padding:"8px 12px", fontSize:11, color:"#5a4e3a" }}>{fmtDate(p.createdAt)}</td>
                              <td style={{ padding:"8px 12px", fontSize:12 }}>{p.potentiel ? p.potentiel+" €/mois" : "—"}</td>
                              <td style={{ padding:"8px 12px", whiteSpace:"nowrap" }}>
                                <span style={{ display:"flex", gap:6 }}>
                                  <Btn size="sm" variant="outline" onClick={() => setModalFiche({ type:"prospect", id:p.id })}>👁 Fiche</Btn>
                                  <Btn size="sm" variant="orange" onClick={() => { setModalConv(p.id); setConvData({ profil: p.profil||"Tarif Général MBS", paiement:"À réception de facture", notes: p.commentaire||"", date: new Date().toISOString().slice(0,10) }); }}>✅ Convertir</Btn>
                                  <Btn size="sm" variant="danger" onClick={() => deleteProspect(p.id)}>🗑</Btn>
                                </span>
                              </td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </Card>
                </div>
              )}

              {/* ── CLIENTS ── */}
              {page === "clients" && (
                <div style={{ animation:"fadeIn .3s ease" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                    marginBottom:20, paddingBottom:12, borderBottom:"2px solid #ddd5c5" }}>
                    <div>
                      <h1 style={{ fontFamily:"'Libre Baskerville',serif", fontSize:22, color:"#1e3320" }}>✅ Clients</h1>
                      <p style={{ fontSize:12, color:"#5a4e3a", marginTop:2 }}>Comptes clients actifs</p>
                    </div>
                  </div>

                  <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
                    <div style={{ position:"relative", flex:1, minWidth:200 }}>
                      <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:14 }}>🔍</span>
                      <input value={qCli} onChange={e=>setQCli(e.target.value)}
                        placeholder="Rechercher un client…"
                        style={{ width:"100%", padding:"8px 12px 8px 32px", border:"1.5px solid #ddd5c5",
                          borderRadius:5, fontSize:13, background:"#fdfcf9", color:"#2a2218", boxSizing:"border-box" }} />
                    </div>
                    {["all","Tarif Général MBS","Revendeur Premium","Distributeur Exclusif"].map((f,i) => (
                      <button key={f} onClick={() => setFiltreProfil(f)}
                        style={{ padding:"7px 14px", borderRadius:5, fontSize:12, fontWeight:700, cursor:"pointer",
                          border: filtreProfil===f ? "none" : "1.5px solid #ddd5c5",
                          background: filtreProfil===f ? "#2d4a2d" : "#fdfcf9",
                          color: filtreProfil===f ? "#fff" : "#5a4e3a",
                          fontFamily:"inherit" }}>
                        {["Tous","Standard","Premium","Exclusif"][i]}
                      </button>
                    ))}
                  </div>

                  <Card style={{ padding:0, overflow:"hidden" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                      <thead><tr style={{ background:"#f5f0e8" }}>
                        {["N° Client","Raison sociale","Ville","Profil","Commandes","CA HT","Actions"].map(h => (
                          <th key={h} style={{ textAlign:"left", padding:"8px 12px", fontSize:11,
                            letterSpacing:"0.1em", textTransform:"uppercase", color:"#5a4e3a",
                            fontWeight:700, borderBottom:"2px solid #ddd5c5" }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {filteredClients.length === 0
                          ? <tr><td colSpan={7} style={{ textAlign:"center", padding:"2rem", color:"#8b7355", fontStyle:"italic" }}>
                              {qCli ? "Aucun résultat" : "Aucun client — convertissez un prospect pour commencer"}
                            </td></tr>
                          : filteredClients.map(c => {
                            const cmds = getClientCommandes(c.id);
                            const ca   = clientCA(c.id);
                            return (
                              <tr key={c.id} style={{ borderBottom:"1px solid #ddd5c5" }}
                                onMouseOver={e=>e.currentTarget.style.background="#faf8f3"}
                                onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                                <td style={{ padding:"8px 12px", fontFamily:"'Libre Baskerville',serif", fontWeight:700, color:"#1e3320" }}>{c.numClient}</td>
                                <td style={{ padding:"8px 12px", fontWeight:700 }}>{c.raisonSociale}</td>
                                <td style={{ padding:"8px 12px", fontSize:12 }}>{c.cp} {c.ville}</td>
                                <td style={{ padding:"8px 12px" }}><Badge type="client" /><br/><span style={{ fontSize:11, color:"#5a4e3a" }}>{c.profil}</span></td>
                                <td style={{ padding:"8px 12px", textAlign:"center", fontWeight:700 }}>{cmds.length}</td>
                                <td style={{ padding:"8px 12px", fontWeight:700, color:"#1e3320" }}>{fmtEur(ca)}</td>
                                <td style={{ padding:"8px 12px", whiteSpace:"nowrap" }}>
                                  <span style={{ display:"flex", gap:6 }}>
                                    <Btn size="sm" variant="outline" onClick={() => setModalFiche({ type:"client", id:c.id })}>👁 Fiche</Btn>
                                    <Btn size="sm" variant="vert" onClick={() => setModalBDC(c.id)}>📋 BDC</Btn>
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        }
                      </tbody>
                    </table>
                  </Card>
                </div>
              )}

              {/* ── COMMANDES ── */}
              {page === "commandes" && (
                <div style={{ animation:"fadeIn .3s ease" }}>
                  <div style={{ marginBottom:20, paddingBottom:12, borderBottom:"2px solid #ddd5c5" }}>
                    <h1 style={{ fontFamily:"'Libre Baskerville',serif", fontSize:22, color:"#1e3320" }}>📋 Commandes</h1>
                    <p style={{ fontSize:12, color:"#5a4e3a", marginTop:2 }}>Historique complet · CA total : <strong>{fmtEur(totalCA)} HT</strong></p>
                  </div>

                  <div style={{ position:"relative", marginBottom:14 }}>
                    <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:14 }}>🔍</span>
                    <input value={qCmd} onChange={e=>setQCmd(e.target.value)}
                      placeholder="Rechercher (client, référence…)"
                      style={{ width:"100%", padding:"8px 12px 8px 32px", border:"1.5px solid #ddd5c5",
                        borderRadius:5, fontSize:13, background:"#fdfcf9", color:"#2a2218", boxSizing:"border-box" }} />
                  </div>

                  <Card style={{ padding:0, overflow:"hidden" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                      <thead><tr style={{ background:"#f5f0e8" }}>
                        {["Réf.","Client","Date","Total HT","Profil","Lignes","Actions"].map(h => (
                          <th key={h} style={{ textAlign:"left", padding:"8px 12px", fontSize:11,
                            letterSpacing:"0.1em", textTransform:"uppercase", color:"#5a4e3a",
                            fontWeight:700, borderBottom:"2px solid #ddd5c5" }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {filteredCommandes.length === 0
                          ? <tr><td colSpan={7} style={{ textAlign:"center", padding:"2rem", color:"#8b7355", fontStyle:"italic" }}>Aucune commande</td></tr>
                          : filteredCommandes.map(o => {
                            const c = getClient(o.clientId);
                            return (
                              <tr key={o.id} style={{ borderBottom:"1px solid #ddd5c5" }}
                                onMouseOver={e=>e.currentTarget.style.background="#faf8f3"}
                                onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                                <td style={{ padding:"8px 12px", fontFamily:"'Libre Baskerville',serif", fontWeight:700, color:"#1e3320", fontSize:12 }}>{o.ref}</td>
                                <td style={{ padding:"8px 12px" }}>{c?.raisonSociale||"—"}<br/><span style={{ fontSize:11, color:"#5a4e3a" }}>{c?.numClient||""}</span></td>
                                <td style={{ padding:"8px 12px", fontSize:12, color:"#5a4e3a" }}>{fmtDate(o.date)}</td>
                                <td style={{ padding:"8px 12px", fontWeight:700, color:"#1e3320" }}>{fmtEur(o.totalHT)}</td>
                                <td style={{ padding:"8px 12px", fontSize:12, color:"#5a4e3a" }}>{o.profil||"—"}</td>
                                <td style={{ padding:"8px 12px", textAlign:"center" }}>{(o.lignes||[]).length}</td>
                                <td style={{ padding:"8px 12px" }}>
                                  <Btn size="sm" variant="danger" onClick={() => deleteCommande(o.id)}>🗑</Btn>
                                </td>
                              </tr>
                            );
                          })
                        }
                      </tbody>
                    </table>
                  </Card>
                </div>
              )}

              {/* ── EXPORT ── */}
              {page === "export" && (
                <div style={{ animation:"fadeIn .3s ease" }}>
                  <div style={{ marginBottom:20, paddingBottom:12, borderBottom:"2px solid #ddd5c5" }}>
                    <h1 style={{ fontFamily:"'Libre Baskerville',serif", fontSize:22, color:"#1e3320" }}>📤 Export / Import</h1>
                    <p style={{ fontSize:12, color:"#5a4e3a", marginTop:2 }}>Sauvegardez ou restaurez vos données CRM</p>
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
                    <Card>
                      <SectionTitle>⬇️ Exporter les données</SectionTitle>
                      <p style={{ fontSize:12, color:"#5a4e3a", lineHeight:1.6, marginBottom:14 }}>
                        Téléchargez l'intégralité des prospects, clients et commandes en JSON daté.
                      </p>
                      <Btn variant="vert" onClick={exportJSON}>⬇️ Télécharger CRM.json</Btn>
                    </Card>

                    <Card>
                      <SectionTitle>⬆️ Importer des données</SectionTitle>
                      <p style={{ fontSize:12, color:"#5a4e3a", lineHeight:1.6, marginBottom:14 }}>
                        Restaurez un fichier CRM.json. ⚠️ Les données actuelles seront remplacées.
                      </p>
                      <label style={{ display:"block", border:"2px dashed #c4a882", borderRadius:5,
                        padding:"1.5rem", textAlign:"center", cursor:"pointer",
                        background:"#f5f0e8", fontSize:12, color:"#5a4e3a" }}>
                        <input type="file" accept=".json" onChange={importJSON} style={{ display:"none" }} />
                        📂 Cliquez ou déposez votre CRM.json
                      </label>
                    </Card>
                  </div>

                  <Card style={{ borderTop:"3px solid #c0392b" }}>
                    <SectionTitle>🗑️ Zone de danger</SectionTitle>
                    <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                      <Btn variant="danger" onClick={async () => {
                        if (!confirm("⚠️ Supprimer TOUTES les données (prospects, clients, commandes) ?")) return;
                        await setProspects([]); await setClients([]); await setCommandes([]);
                        showToast("🗑️ Données supprimées");
                      }}>Supprimer toutes les données</Btn>
                    </div>
                  </Card>
                </div>
              )}

            </>
          )}
        </main>
      </div>
    </>
  );
}
