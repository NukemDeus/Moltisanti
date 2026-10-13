(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const cfg = window.SITE_CONFIG || {};
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------- Utilidades UI ----------
  const toastEl = $("#toast");
  let toastT;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove("show"), 3200);
  }

  $("#year").textContent = new Date().getFullYear();
  ["discordHero", "discordMain"].forEach((id) => ($("#" + id).href = cfg.discordInvite || "#"));
  $("#discordRules").href = cfg.discordRules || cfg.discordInvite || "#";

  // Navegación
  const nav = $("#nav"), navLinks = $("#navLinks"), navToggle = $("#navToggle");
  addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 20), { passive: true });
  navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", open);
  });
  $$("#navLinks a").forEach((a) => a.addEventListener("click", () => { navLinks.classList.remove("open"); navToggle.setAttribute("aria-expanded", false); }));

  // Reveal al hacer scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  $$(".reveal").forEach((el) => io.observe(el));

  // Contadores
  function countTo(el, target) {
    const dur = 1200, t0 = performance.now();
    const step = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const statsObs = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { $$(".num", e.target).forEach((n) => countTo(n, +n.dataset.count || 0)); statsObs.unobserve(e.target); } });
  }, { threshold: 0.4 });
  statsObs.observe($(".stats"));

  // Pestañas del panel
  $$(".tab").forEach((t) => t.addEventListener("click", () => {
    $$(".tab").forEach((x) => x.classList.toggle("active", x === t));
    $$(".tab-pane").forEach((p) => p.classList.toggle("active", p.id === "tab-" + t.dataset.tab));
  }));

  // Partículas de fondo (polvo dorado)
  (function particles() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = $("#fx"), ctx = c.getContext("2d");
    let w, h, ps;
    const init = () => {
      w = c.width = innerWidth; h = c.height = innerHeight;
      ps = Array.from({ length: Math.min(70, Math.floor(w / 18)) }, () => ({
        x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.6 + .4,
        vy: -(Math.random() * .25 + .08), vx: (Math.random() - .5) * .15, a: Math.random() * .6 + .2
      }));
    };
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      ps.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fillStyle = `rgba(201,162,75,${p.a})`; ctx.fill();
      });
      requestAnimationFrame(tick);
    };
    addEventListener("resize", init); init(); tick();
  })();

  // ---------- Supabase ----------
  const configured = cfg.supabaseUrl && !cfg.supabaseUrl.includes("TU_PROYECTO") && cfg.supabaseAnonKey && !cfg.supabaseAnonKey.includes("TU_ANON");
  let sb = null, user = null, profile = null;
  if (configured && window.supabase) sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

  const loginBtns = [$("#btnLogin"), $("#btnLogin2")];
  const logoutBtn = $("#btnLogout");
  const modal = $("#authModal");
  let mode = "login";

  function openModal() {
    if (!sb) return toast("Falta configurar Supabase en config.js");
    modal.classList.remove("hidden"); $("#authEmail").focus();
  }
  const closeModal = () => modal.classList.add("hidden");
  loginBtns.forEach((b) => b.addEventListener("click", openModal));
  $("#authClose").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  $$(".auth-tab").forEach((t) => t.addEventListener("click", () => {
    mode = t.dataset.mode;
    $$(".auth-tab").forEach((x) => x.classList.toggle("active", x === t));
    $("#fieldUser").classList.toggle("hidden", mode !== "signup");
    $("#authSubmit").textContent = mode === "signup" ? "Crear cuenta" : "Entrar";
    $("#authPass").autocomplete = mode === "signup" ? "new-password" : "current-password";
    setMsg("");
  }));
  function setMsg(t, ok) { const m = $("#authMsg"); m.textContent = t; m.classList.toggle("ok", !!ok); }

  $("#authForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#authEmail").value.trim(), pass = $("#authPass").value, username = $("#authUser").value.trim();
    if (!email || pass.length < 6) return setMsg("Correo válido y contraseña de 6+ caracteres.");
    if (mode === "signup" && username.length < 3) return setMsg("El usuario necesita al menos 3 caracteres.");
    $("#authSubmit").disabled = true; setMsg("Procesando…", true);
    try {
      if (mode === "signup") {
        const { data, error } = await sb.auth.signUp({ email, password: pass, options: { data: { username } } });
        if (error) throw error;
        if (!data.session) { setMsg("Cuenta creada. Revisa tu correo para confirmarla.", true); }
        else { closeModal(); toast("Bienvenido a la familia"); }
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        closeModal(); toast("Sesión iniciada");
      }
    } catch (err) {
      setMsg(err.message === "Invalid login credentials" ? "Correo o contraseña incorrectos." : err.message);
    } finally { $("#authSubmit").disabled = false; }
  });

  logoutBtn.addEventListener("click", async () => { await sb.auth.signOut(); toast("Sesión cerrada"); });

  async function applySession(session) {
    user = session ? session.user : null;
    profile = null;
    loginBtns[0].classList.toggle("hidden", !!user);
    logoutBtn.classList.toggle("hidden", !user);
    $("#boardLocked").classList.toggle("hidden", !!user);
    $("#board").classList.toggle("hidden", !user);
    if (user) {
      const { data } = await sb.from("profiles").select("username,rank").eq("id", user.id).maybeSingle();
      profile = data;
      loginBtns[0].textContent = "Iniciar sesión";
      loadPosts();
    } else { $("#posts").innerHTML = ""; }
  }

  // Anuncios (públicos)
  async function loadAnnouncements() {
    const ul = $("#announcements");
    if (!sb) { ul.innerHTML = '<li class="muted">Conecta Supabase para ver los anuncios de la familia.</li>'; return; }
    const { data, error } = await sb.from("announcements").select("*").order("created_at", { ascending: false }).limit(10);
    if (error) { ul.innerHTML = '<li class="muted">No se pudieron cargar los anuncios.</li>'; return; }
    if (!data.length) { ul.innerHTML = '<li class="muted">Aún no hay anuncios.</li>'; return; }
    ul.innerHTML = data.map((a) => `<li class="ann"><span class="ann-date">${new Date(a.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}</span><h4>${esc(a.title)}</h4><span>${esc(a.body)}</span></li>`).join("");
  }

  async function loadStats() {
    if (!sb) return;
    const [m, p] = await Promise.all([
      sb.from("profiles").select("id", { count: "exact", head: true }),
      sb.from("posts").select("id", { count: "exact", head: true })
    ]);
    if (m.count != null) $("#statMembers").dataset.count = m.count;
    if (p.count != null) $("#statPosts").dataset.count = p.count;
  }

  // Tablón (solo miembros)
  async function loadPosts() {
    const ul = $("#posts");
    const { data, error } = await sb.from("posts").select("id,user_id,author,content,created_at").order("created_at", { ascending: false }).limit(50);
    if (error) { ul.innerHTML = '<li class="muted">No se pudo cargar el tablón.</li>'; return; }
    if (!data.length) { ul.innerHTML = '<li class="muted" style="text-align:center">Sé el primero en escribir.</li>'; return; }
    ul.innerHTML = data.map((p) => `
      <li class="post">
        <div class="post-head"><b>${esc(p.author)}</b><small>${new Date(p.created_at).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}</small></div>
        <p>${esc(p.content)}</p>
        ${user && p.user_id === user.id ? `<button class="post-del" data-id="${p.id}">Eliminar</button>` : ""}
      </li>`).join("");
  }

  const postText = $("#postText");
  postText.addEventListener("input", () => ($("#charCount").textContent = `${postText.value.length} / 400`));
  $("#postForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const content = postText.value.trim();
    if (!content || !user) return;
    const author = (profile && profile.username) || user.email.split("@")[0];
    const { error } = await sb.from("posts").insert({ user_id: user.id, author, content });
    if (error) return toast("No se pudo publicar");
    postText.value = ""; $("#charCount").textContent = "0 / 400";
    loadPosts(); loadStats();
  });
  $("#posts").addEventListener("click", async (e) => {
    const b = e.target.closest(".post-del"); if (!b) return;
    const { error } = await sb.from("posts").delete().eq("id", b.dataset.id);
    if (error) return toast("No se pudo eliminar");
    loadPosts(); loadStats();
  });

  // Arranque
  loadAnnouncements();
  if (sb) {
    loadStats().then(() => $$(".num").forEach((n) => { if (n.id) countTo(n, +n.dataset.count || 0); }));
    sb.auth.getSession().then(({ data }) => applySession(data.session));
    sb.auth.onAuthStateChange((_e, session) => applySession(session));
  }
})();
