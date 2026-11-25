/* CA Checklist - shared core: styles, profiles, first-open username, usage timer, device info.
   Add <script src="js/core.js"></script> at the end of <body> on EVERY page
   (so usage time is counted everywhere). A page shows the top bar (Home link,
   profile, "+ Profile") only if it contains <div id="cat-topbar"></div>. */
(function () {
  "use strict";

  var APP = { name: "CA Checklist", version: "1.0.0" }; // <- change version here
  var KEYS = { profiles: "cat_profiles", active: "cat_active_profile", firstOpen: "cat_first_open" };

  /* ---------- styles (match the app's dark ice-blue look) ---------- */
  var css = [
    ":root{--bg:#1A2029;--card:#232c38;--card2:#2b3644;--text:#e9f4fb;--muted:#9fb3c4;--ice:#7fd4ff;--good:#5fd3a0;--bad:#ff8a80;--line:rgba(127,212,255,.15)}",
    "*{box-sizing:border-box}",
    "body{margin:0;min-height:100vh;background:radial-gradient(circle at 50% -10%,#2a3646 0%,var(--bg) 55%);color:var(--text);font-family:system-ui,-apple-system,'Segoe UI',sans-serif;padding:0 18px max(24px,env(safe-area-inset-bottom))}",
    "button{font:inherit;color:inherit;cursor:pointer}",
    ":focus-visible{outline:3px solid var(--ice);outline-offset:2px}",
    ".wrap{max-width:560px;margin:0 auto;padding:6px 0 24px}",
    "h1{margin:6px 0 4px;font-size:26px;letter-spacing:.3px}",
    "h2{margin:24px 0 8px;font-size:16px}",
    ".sub{margin:0 0 16px;color:var(--muted);font-size:14px}",
    /* top bar */
    "#cat-topbar{max-width:560px;margin:0 auto;display:flex;align-items:center;gap:10px;padding:max(14px,env(safe-area-inset-top)) 0 10px}",
    "#cat-topbar .home{color:var(--ice);text-decoration:none;font-weight:600;margin-right:auto;padding:6px 0}",
    ".chip{display:flex;align-items:center;gap:8px;max-width:44vw;border:1px solid var(--line);background:var(--card);border-radius:999px;padding:4px 12px 4px 4px}",
    ".chip .name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px}",
    ".avatar{flex:none;width:28px;height:28px;border-radius:50%;background:var(--ice);color:#10202c;display:grid;place-items:center;font-weight:700;font-size:14px}",
    ".add-profile{border:1px solid var(--ice);color:var(--ice);background:transparent;border-radius:999px;padding:6px 12px;font-weight:600;font-size:14px}",
    /* lists */
    ".crumbs{display:flex;flex-wrap:wrap;gap:6px;color:var(--muted);font-size:13.5px;margin:4px 0 8px}",
    ".crumbs a{color:var(--ice);text-decoration:none}",
    ".list{display:grid;gap:12px}",
    ".row{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:16px;border-radius:16px;background:linear-gradient(160deg,var(--card2),var(--card));border:1px solid var(--line)}",
    ".row .grow{flex:1;min-width:0}",
    ".row .title{font-weight:600;font-size:16px}",
    ".row .meta{color:var(--muted);font-size:12.5px}",
    ".badge{border:1px solid var(--line);border-radius:999px;padding:2px 10px;font-size:12px;color:var(--muted);white-space:nowrap}",
    ".empty{padding:22px 16px;border-radius:16px;border:1px dashed rgba(127,212,255,.3);color:var(--muted);text-align:center}",
    ".empty code{background:var(--card);padding:2px 6px;border-radius:6px;color:var(--text)}",
    /* questions */
    ".q{padding:16px;border-radius:16px;background:linear-gradient(160deg,var(--card2),var(--card));border:1px solid var(--line)}",
    ".q+.q{margin-top:12px}",
    ".q .tag{font-size:12px;color:var(--muted);margin-bottom:6px}",
    ".q .qtext{margin:0 0 10px;font-weight:600;white-space:pre-wrap}",
    ".opt{display:block;width:100%;text-align:left;margin-top:8px;padding:10px 12px;border-radius:10px;background:var(--bg);border:1px solid var(--line)}",
    ".opt.correct{border-color:var(--good);background:rgba(95,211,160,.15)}",
    ".opt.wrong{border-color:var(--bad);background:rgba(255,138,128,.15)}",
    ".opt[disabled]{cursor:default}",
    ".reveal{margin-top:10px;background:transparent;border:1px solid var(--ice);color:var(--ice);border-radius:999px;padding:6px 14px;font-weight:600}",
    ".answer{margin-top:10px;padding:10px 12px;border-left:4px solid var(--ice);background:var(--bg);border-radius:6px;white-space:pre-wrap}",
    ".answer[hidden]{display:none}",
    /* settings */
    ".panel{padding:2px 16px;border-radius:16px;background:linear-gradient(160deg,var(--card2),var(--card));border:1px solid var(--line)}",
    ".kv{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:13px 0;border-bottom:1px solid var(--line)}",
    ".kv:last-child{border-bottom:0}",
    ".kv .k{color:var(--muted)}",
    ".kv .v{display:flex;align-items:center;gap:10px;font-weight:600;text-align:right;overflow-wrap:anywhere}",
    ".btn{border:0;border-radius:10px;padding:10px 16px;font-weight:600;background:#2f4a63;color:var(--text)}",
    ".btn.ghost{background:transparent;border:1px solid var(--ice);color:var(--ice)}",
    ".btn.small{padding:5px 12px;font-size:13px}",
    /* modal */
    ".overlay{position:fixed;inset:0;z-index:100000;display:grid;place-items:center;padding:16px;background:rgba(8,12,20,.7)}",
    ".modal{width:100%;max-width:380px;padding:20px;border-radius:18px;background:var(--card);border:1px solid var(--line)}",
    ".modal h3{margin:0 0 6px;font-size:20px}",
    ".modal p{margin:0 0 14px;color:var(--muted)}",
    ".modal input{width:100%;font:inherit;color:var(--text);background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:11px 12px}",
    ".modal .err{min-height:1.2em;margin:6px 0 0;color:var(--bad);font-size:13px}",
    ".modal .actions{display:flex;gap:10px;justify-content:flex-end;margin-top:14px}",
    ".switch-item{display:flex;align-items:center;gap:10px;width:100%;text-align:left;margin-top:8px;padding:10px;border-radius:10px;background:var(--bg);border:1px solid var(--line)}",
    ".switch-item.active{border-color:var(--ice)}"
  ].join("\n");
  var style = document.createElement("style");
  style.textContent = css;
  document.head.append(style);

  /* ---------- safe storage ---------- */
  function read(key, fallback) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }

  /* ---------- profiles ---------- */
  var listeners = [];
  var Profiles = {
    all: function () { return read(KEYS.profiles, []); },
    save: function (list) { write(KEYS.profiles, list); },
    active: function () {
      var list = this.all(), id = read(KEYS.active, null);
      return list.filter(function (p) { return p.id === id; })[0] || list[0] || null;
    },
    add: function (name) {
      var list = this.all();
      var profile = { id: "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: name.trim(), created: Date.now(), usageSec: 0 };
      list.push(profile);
      this.save(list);
      write(KEYS.active, profile.id);
      if (!read(KEYS.firstOpen, null)) write(KEYS.firstOpen, profile.created);
      notify();
      return profile;
    },
    rename: function (id, name) {
      var list = this.all();
      list.forEach(function (p) { if (p.id === id) p.name = name.trim(); });
      this.save(list); notify();
    },
    switchTo: function (id) { write(KEYS.active, id); notify(); },
    addUsage: function (sec) {
      var act = this.active(); if (!act) return;
      var list = this.all();
      list.forEach(function (p) { if (p.id === act.id) p.usageSec = (p.usageSec || 0) + sec; });
      this.save(list);
    }
  };
  function notify() {
    renderTopbar();
    listeners.forEach(function (fn) { try { fn(Profiles.active()); } catch (e) { console.error(e); } });
  }

  /* ---------- usage time (counts only while the app is on screen) ---------- */
  var TICK = 5;
  setInterval(function () {
    if (document.visibilityState === "visible" && Profiles.active()) Profiles.addUsage(TICK);
  }, TICK * 1000);

  function formatDuration(sec) {
    sec = Math.floor(sec || 0);
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    if (h > 0) return h + "h " + m + "m";
    if (m > 0) return m + "m " + s + "s";
    return s + "s";
  }

  /* ---------- device info ---------- */
  function deviceInfo() {
    var ua = navigator.userAgent || "", os = "Unknown OS", model = "", m;
    if ((m = ua.match(/Android ([\d.]+)/))) {
      os = "Android " + m[1];
      var mm = ua.match(/Android [\d.]+; ([^;)]+)/);
      if (mm && mm[1].trim() !== "K") model = mm[1].replace(/ Build.*/, "").trim();
    } else if (/iPhone|iPad|iPod/.test(ua)) { os = "iOS"; model = /iPad/.test(ua) ? "iPad" : "iPhone"; }
    else if (/Windows NT/.test(ua)) os = "Windows";
    else if (/Mac OS X/.test(ua)) os = "macOS";
    else if (/Linux/.test(ua)) os = "Linux";
    var browser = "Browser";
    if (/Edg\//.test(ua)) browser = "Edge";
    else if (/OPR\//.test(ua)) browser = "Opera";
    else if (/Firefox\//.test(ua)) browser = "Firefox";
    else if (/Chrome\//.test(ua)) browser = "Chrome";
    else if (/Safari\//.test(ua)) browser = "Safari";
    // Browsers cannot read a device's custom name (privacy), so we show model + OS.
    return { name: model ? model + " (" + os + ")" : os, browser: browser };
  }

  /* ---------- DOM helper ---------- */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k.indexOf("on") === 0) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    });
    (children || []).forEach(function (c) { node.append(c); });
    return node;
  }

  /* ---------- modals ---------- */
  function closeModal() { var o = document.getElementById("cat-overlay"); if (o) o.remove(); }

  function nameModal(o) {
    closeModal();
    var input = el("input", { type: "text", maxlength: "30", placeholder: "Your name", autocomplete: "off", value: o.value || "" });
    var err = el("p", { class: "err", "aria-live": "polite" });
    function save() {
      var v = input.value.trim();
      if (v.length < 2) { err.textContent = "Enter at least 2 characters."; return; }
      closeModal(); o.onSave(v);
    }
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") save(); });
    var actions = el("div", { class: "actions" });
    if (o.cancellable) actions.append(el("button", { class: "btn ghost", text: "Cancel", onclick: closeModal }));
    actions.append(el("button", { class: "btn", text: o.button, onclick: save }));
    document.body.append(el("div", { class: "overlay", id: "cat-overlay", role: "dialog", "aria-modal": "true" }, [
      el("div", { class: "modal" }, [el("h3", { text: o.title }), el("p", { text: o.text }), input, err, actions])
    ]));
    input.focus();
  }
  function addProfileModal() {
    nameModal({ title: "Add profile", text: "Each profile keeps its own username and usage time.", button: "Add profile", cancellable: true, onSave: function (v) { Profiles.add(v); } });
  }
  function switchModal() {
    closeModal();
    var act = Profiles.active();
    var items = Profiles.all().map(function (p) {
      return el("button", { class: "switch-item" + (act && p.id === act.id ? " active" : ""), onclick: function () { closeModal(); Profiles.switchTo(p.id); } },
        [el("span", { class: "avatar", text: p.name.charAt(0).toUpperCase() }), el("span", { text: p.name })]);
    });
    document.body.append(el("div", { class: "overlay", id: "cat-overlay", role: "dialog", "aria-modal": "true" }, [
      el("div", { class: "modal" }, [el("h3", { text: "Switch profile" })].concat(items, [
        el("div", { class: "actions" }, [
          el("button", { class: "btn ghost", text: "Close", onclick: closeModal }),
          el("button", { class: "btn", text: "Add profile", onclick: addProfileModal })
        ])
      ]))
    ]));
  }
  function renameActive() {
    var p = Profiles.active(); if (!p) return;
    nameModal({ title: "Change username", text: "This name shows at the top of the app.", value: p.name, button: "Save", cancellable: true, onSave: function (v) { Profiles.rename(p.id, v); } });
  }

  /* ---------- top bar (only on pages with <div id="cat-topbar">) ---------- */
  function renderTopbar() {
    var bar = document.getElementById("cat-topbar");
    if (!bar) return;
    bar.replaceChildren(el("a", { class: "home", href: "index.html", text: "\u2039 Home" }));
    var p = Profiles.active();
    if (p) {
      bar.append(el("button", { class: "chip", "aria-label": "Switch profile", onclick: switchModal }, [
        el("span", { class: "avatar", text: p.name.charAt(0).toUpperCase() }),
        el("span", { class: "name", text: p.name })
      ]));
    }
    bar.append(el("button", { class: "add-profile", text: "+ Profile", onclick: addProfileModal }));
  }

  /* ---------- boot ---------- */
  function boot() {
    renderTopbar();
    if (!Profiles.active()) {
      nameModal({ title: "Welcome to " + APP.name, text: "What should we call you?", button: "Start", cancellable: false, onSave: function (v) { Profiles.add(v); } });
    } else { notify(); }
  }

  window.CAT = {
    app: APP, profiles: Profiles, deviceInfo: deviceInfo, formatDuration: formatDuration,
    firstOpen: function () { return read(KEYS.firstOpen, null); },
    renameActive: renameActive, addProfile: addProfileModal, el: el,
    onChange: function (fn) { listeners.push(fn); fn(Profiles.active()); }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
