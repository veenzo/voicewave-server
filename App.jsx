import { useState, useEffect, useRef, useCallback } from “react”;

const SERVER = “wss://voicewave-server-production.up.railway.app”;
const STORAGE_KEY = “voicewave_profile”;

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = `
@import url(‘https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap’);

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }

:root {
–bg: #06060f;
–surface: #0d0d1c;
–surface2: #13132a;
–border: #1c1c38;
–border2: #252545;
–v: #7c3aed;
–v2: #a855f7;
–v3: #c084fc;
–vd: rgba(124,58,237,0.12);
–vg: rgba(124,58,237,0.25);
–text: #eeeeff;
–muted: #6b6b9a;
–dim: #2e2e55;
–green: #10b981;
–red: #ef4444;
–yellow: #f59e0b;
}

html, body, #root { height: 100%; overflow: hidden; }

body {
background: var(–bg);
color: var(–text);
font-family: “DM Sans”, sans-serif;
-webkit-font-smoothing: antialiased;
user-select: none;
-webkit-user-select: none;
}

.app {
height: 100vh;
max-width: 430px;
margin: 0 auto;
display: flex;
flex-direction: column;
position: relative;
overflow: hidden;
}

/* glows */
.glow {
position: fixed;
border-radius: 50%;
pointer-events: none;
z-index: 0;
filter: blur(120px);
}
.glow-a { width: 350px; height: 350px; background: rgba(124,58,237,0.07); top: -80px; right: -80px; }
.glow-b { width: 250px; height: 250px; background: rgba(168,85,247,0.05); bottom: 80px; left: -60px; }

/* ─── TOPBAR ─── */
.topbar {
display: flex;
align-items: center;
padding: 14px 18px;
border-bottom: 1px solid var(–border);
background: rgba(6,6,15,0.85);
backdrop-filter: blur(24px);
z-index: 20;
flex-shrink: 0;
gap: 10px;
}

.topbar-logo { display: flex; align-items: center; gap: 8px; flex: 1; }
.topbar-title { font-family: “DM Mono”, monospace; font-size: 15px; font-weight: 500; letter-spacing: -0.3px; }
.topbar-title span { color: var(–v2); }

.topbar-actions { display: flex; align-items: center; gap: 8px; }

.avatar-sm {
width: 32px; height: 32px;
border-radius: 50%;
display: flex; align-items: center; justify-content: center;
font-size: 14px; font-weight: 700;
flex-shrink: 0;
cursor: pointer;
}

.icon-pill {
display: flex; align-items: center; justify-content: center;
width: 34px; height: 34px;
border-radius: 50%;
border: 1px solid var(–border);
background: var(–surface);
color: var(–muted);
font-size: 15px;
cursor: pointer;
transition: all 0.2s;
flex-shrink: 0;
}
.icon-pill:hover, .icon-pill.active { border-color: var(–v); color: var(–v2); background: var(–vd); }

/* badge */
.badge-wrap { position: relative; }
.badge {
position: absolute;
top: -3px; right: -3px;
width: 16px; height: 16px;
border-radius: 50%;
background: var(–red);
color: #fff;
font-size: 9px;
font-weight: 700;
display: flex; align-items: center; justify-content: center;
border: 2px solid var(–bg);
}

/* ─── SCREEN ─── */
.screen {
flex: 1;
overflow-y: auto;
overflow-x: hidden;
-webkit-overflow-scrolling: touch;
z-index: 1;
scrollbar-width: none;
}
.screen::-webkit-scrollbar { display: none; }

/* ─── BOTTOM NAV ─── */
.bottom-nav {
display: flex;
background: rgba(6,6,15,0.92);
backdrop-filter: blur(24px);
border-top: 1px solid var(–border);
padding: 6px 0 max(16px, env(safe-area-inset-bottom));
z-index: 20;
flex-shrink: 0;
}

.nav-tab {
flex: 1;
display: flex;
flex-direction: column;
align-items: center;
gap: 3px;
padding: 6px 4px;
background: none;
border: none;
cursor: pointer;
position: relative;
}

.nav-tab-icon { font-size: 19px; color: var(–dim); transition: all 0.2s; }
.nav-tab-label { font-size: 9px; color: var(–dim); font-family: “DM Mono”, monospace; letter-spacing: 0.5px; text-transform: uppercase; transition: all 0.2s; }
.nav-tab.on .nav-tab-icon { color: var(–v2); }
.nav-tab.on .nav-tab-label { color: var(–v2); }
.nav-tab.on::after { content: “”; position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 4px; height: 4px; border-radius: 50%; background: var(–v2); }

/* ─── SECTION TITLE ─── */
.sec { font-size: 10px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(–dim); font-family: “DM Mono”, monospace; padding: 0 18px; margin-bottom: 10px; }

/* ─── CONTACT CARD ─── */
.contact-list { padding: 0 14px; display: flex; flex-direction: column; gap: 7px; }

.ccard {
background: var(–surface);
border: 1px solid var(–border);
border-radius: 16px;
padding: 13px 14px;
display: flex;
align-items: center;
gap: 12px;
cursor: pointer;
transition: all 0.18s;
position: relative;
overflow: hidden;
}
.ccard::before { content: “”; position: absolute; inset: 0; background: linear-gradient(135deg, var(–vd), transparent); opacity: 0; transition: opacity 0.18s; }
.ccard:hover::before, .ccard:active::before { opacity: 1; }
.ccard:hover { border-color: var(–v); }

.cinfo { flex: 1; min-width: 0; }
.cname { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cstatus { font-size: 11px; color: var(–muted); font-family: “DM Mono”, monospace; margin-top: 1px; }
.cstatus.on { color: var(–green); }

.caction {
width: 36px; height: 36px;
border-radius: 50%;
border: 1px solid var(–v);
background: var(–vd);
color: var(–v2);
font-size: 15px;
display: flex; align-items: center; justify-content: center;
cursor: pointer;
transition: all 0.18s;
flex-shrink: 0;
}
.caction:hover { background: var(–v); color: #fff; box-shadow: 0 0 14px var(–vg); }

/* ─── AVATAR ─── */
.av {
border-radius: 50%;
display: flex; align-items: center; justify-content: center;
font-weight: 700;
flex-shrink: 0;
position: relative;
}
.av0 { background: linear-gradient(135deg,#7c3aed,#4c1d95); }
.av1 { background: linear-gradient(135deg,#2563eb,#1e3a8a); }
.av2 { background: linear-gradient(135deg,#059669,#064e3b); }
.av3 { background: linear-gradient(135deg,#dc2626,#7f1d1d); }
.av4 { background: linear-gradient(135deg,#d97706,#78350f); }
.av5 { background: linear-gradient(135deg,#db2777,#831843); }

.dot-status {
position: absolute;
bottom: 1px; right: 1px;
width: 9px; height: 9px;
border-radius: 50%;
border: 2px solid var(–bg);
}

/* ─── EMPTY ─── */
.empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 56px 24px; text-align: center; }
.empty-ico { font-size: 44px; margin-bottom: 14px; opacity: 0.35; }
.empty-t { font-size: 15px; font-weight: 600; color: var(–muted); margin-bottom: 6px; }
.empty-d { font-size: 12px; color: var(–dim); font-family: “DM Mono”, monospace; line-height: 1.7; }

/* ─── ADD CONTACT BTN ─── */
.add-row {
margin: 8px 14px 20px;
padding: 13px;
border-radius: 14px;
border: 1px dashed var(–border2);
background: transparent;
color: var(–muted);
font-family: “DM Sans”, sans-serif;
font-size: 13px;
cursor: pointer;
display: flex; align-items: center; justify-content: center;
gap: 8px;
transition: all 0.2s;
width: calc(100% - 28px);
}
.add-row:hover { border-color: var(–v); color: var(–v2); background: var(–vd); }

/* ─── ROOMS ─── */
.room-list { padding: 0 14px; display: flex; flex-direction: column; gap: 7px; }

.room-card {
background: var(–surface);
border: 1px solid var(–border);
border-radius: 16px;
padding: 14px 16px;
display: flex;
align-items: center;
gap: 12px;
cursor: pointer;
transition: all 0.18s;
}
.room-card:hover { border-color: var(–v); background: var(–vd); }
.room-card.active-room { border-color: var(–v2); background: var(–vd); box-shadow: 0 0 16px var(–vg); }

.room-ico {
width: 42px; height: 42px;
border-radius: 12px;
background: var(–vd);
border: 1px solid var(–v);
display: flex; align-items: center; justify-content: center;
font-size: 18px;
flex-shrink: 0;
}

.room-info { flex: 1; min-width: 0; }
.room-name { font-size: 14px; font-weight: 600; }
.room-count { font-size: 11px; color: var(–muted); font-family: “DM Mono”, monospace; margin-top: 2px; }

.room-edit {
width: 30px; height: 30px;
border-radius: 50%;
border: 1px solid var(–border);
background: transparent;
color: var(–dim);
font-size: 13px;
display: flex; align-items: center; justify-content: center;
cursor: pointer;
transition: all 0.18s;
}
.room-edit:hover { border-color: var(–v); color: var(–v2); }

/* ─── SEARCH ─── */
.search-wrap {
display: flex; align-items: center; gap: 10px;
background: var(–surface);
border: 1px solid var(–border);
border-radius: 14px;
padding: 12px 14px;
margin: 0 14px 16px;
transition: border-color 0.2s;
}
.search-wrap:focus-within { border-color: var(–v); }
.search-wrap input { flex: 1; background: none; border: none; outline: none; color: var(–text); font-family: “DM Sans”, sans-serif; font-size: 14px; }
.search-wrap input::placeholder { color: var(–muted); }
.search-ico { color: var(–muted); font-size: 15px; }

.result-card {
background: var(–surface);
border: 1px solid var(–border);
border-radius: 14px;
padding: 12px 14px;
display: flex; align-items: center; gap: 12px;
margin: 0 14px 8px;
transition: border-color 0.2s;
}
.result-card:hover { border-color: var(–border2); }

.pill-btn {
padding: 7px 14px;
border-radius: 100px;
font-family: “DM Sans”, sans-serif;
font-size: 12px;
font-weight: 600;
cursor: pointer;
border: none;
transition: all 0.18s;
flex-shrink: 0;
margin-left: auto;
}
.pill-v { background: var(–v); color: #fff; }
.pill-v:hover { background: var(–v2); box-shadow: 0 0 14px var(–vg); }
.pill-gray { background: var(–surface2); color: var(–muted); cursor: default; }
.pill-red { background: rgba(239,68,68,0.1); color: var(–red); border: 1px solid rgba(239,68,68,0.2); }
.pill-red:hover { background: var(–red); color: #fff; }

/* ─── CALL SCREEN ─── */
.call-wrap {
display: flex; flex-direction: column; align-items: center;
padding: 32px 24px 24px;
height: 100%;
}

.call-av-wrap { position: relative; margin-bottom: 18px; }

.pulse-ring {
position: absolute;
border-radius: 50%;
border: 2px solid var(–v);
animation: pulse-ring 2s infinite;
}
.pr1 { inset: -10px; opacity: 0.35; }
.pr2 { inset: -20px; opacity: 0.15; animation-delay: 0.4s; }
@keyframes pulse-ring { 0%,100% { transform: scale(1); } 50% { transform: scale(1.04); } }

.call-name { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 5px; }
.call-sub { font-size: 12px; color: var(–muted); font-family: “DM Mono”, monospace; margin-bottom: 6px; }
.call-timer-txt { font-size: 13px; color: var(–v2); font-family: “DM Mono”, monospace; letter-spacing: 2px; margin-bottom: 40px; }

/* PTT */
.ptt-wrap { display: flex; flex-direction: column; align-items: center; gap: 14px; margin-bottom: 36px; }
.ptt-hint { font-size: 11px; color: var(–muted); font-family: “DM Mono”, monospace; letter-spacing: 1px; text-transform: uppercase; }

.ptt {
width: 116px; height: 116px;
border-radius: 50%;
border: 3px solid var(–v);
background: var(–vd);
color: var(–v2);
font-size: 34px;
cursor: pointer;
display: flex; align-items: center; justify-content: center;
transition: all 0.12s;
position: relative;
-webkit-user-select: none;
user-select: none;
box-shadow: 0 0 28px var(–vg), inset 0 0 28px rgba(124,58,237,0.08);
touch-action: none;
}
.ptt.pressing {
background: var(–v);
color: #fff;
transform: scale(0.94);
box-shadow: 0 0 56px var(–vg);
border-color: var(–v2);
}
.ptt-ripple {
position: absolute;
inset: -18px;
border-radius: 50%;
border: 2px solid var(–v);
opacity: 0;
animation: ptt-rip 1s infinite;
}
@keyframes ptt-rip { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.5); opacity: 0; } }

.call-ctrls { display: flex; gap: 18px; }

.ctrl {
width: 50px; height: 50px;
border-radius: 50%;
border: 1px solid var(–border);
background: var(–surface);
color: var(–muted);
font-size: 17px;
cursor: pointer;
display: flex; align-items: center; justify-content: center;
transition: all 0.18s;
}
.ctrl:hover { border-color: var(–v); color: var(–v2); }
.ctrl.muted-on { background: rgba(239,68,68,0.1); border-color: var(–red); color: var(–red); }

.end-btn {
width: 50px; height: 50px;
border-radius: 50%;
background: var(–red);
border: none;
color: #fff;
font-size: 18px;
cursor: pointer;
display: flex; align-items: center; justify-content: center;
box-shadow: 0 0 18px rgba(239,68,68,0.3);
transition: all 0.18s;
}
.end-btn:hover { transform: scale(1.08); }

/* ─── SETTINGS ─── */
.settings-wrap { padding: 18px 14px; }

.prof-card {
display: flex; flex-direction: column; align-items: center;
background: var(–surface);
border: 1px solid var(–border);
border-radius: 20px;
padding: 24px 16px 20px;
margin-bottom: 20px;
}

.prof-av {
position: relative;
cursor: pointer;
margin-bottom: 12px;
}
.prof-av-edit {
position: absolute; inset: 0;
border-radius: 50%;
background: rgba(0,0,0,0.55);
display: flex; align-items: center; justify-content: center;
opacity: 0;
transition: opacity 0.18s;
font-size: 18px;
}
.prof-av:hover .prof-av-edit { opacity: 1; }
.prof-name { font-size: 17px; font-weight: 700; margin-bottom: 3px; }
.prof-un { font-size: 12px; color: var(–muted); font-family: “DM Mono”, monospace; }

.sgroup { margin-bottom: 18px; }

.sitem {
background: var(–surface);
border: 1px solid var(–border);
border-radius: 13px;
padding: 14px;
display: flex; align-items: center; gap: 12px;
margin-bottom: 7px;
cursor: pointer;
transition: all 0.18s;
}
.sitem:hover { border-color: var(–v); background: var(–vd); }

.sico {
width: 34px; height: 34px;
border-radius: 9px;
background: var(–vd);
border: 1px solid var(–v);
display: flex; align-items: center; justify-content: center;
font-size: 15px;
flex-shrink: 0;
}

.slabel { flex: 1; font-size: 14px; font-weight: 500; }
.svalue { font-size: 12px; color: var(–muted); font-family: “DM Mono”, monospace; }
.sarrow { color: var(–dim); font-size: 12px; }

.toggle {
width: 42px; height: 23px;
border-radius: 100px;
background: var(–border2);
position: relative;
cursor: pointer;
transition: background 0.2s;
flex-shrink: 0;
}
.toggle.on { background: var(–v); }
.toggle::after {
content: “”;
position: absolute;
width: 17px; height: 17px;
border-radius: 50%;
background: #fff;
top: 3px; left: 3px;
transition: transform 0.2s;
box-shadow: 0 1px 4px rgba(0,0,0,0.3);
}
.toggle.on::after { transform: translateX(19px); }

/* ─── INPUT & BUTTON ─── */
.inp {
width: 100%;
background: var(–surface);
border: 1px solid var(–border);
border-radius: 12px;
padding: 13px 14px;
color: var(–text);
font-family: “DM Sans”, sans-serif;
font-size: 14px;
outline: none;
transition: border-color 0.2s;
margin-bottom: 10px;
}
.inp:focus { border-color: var(–v); }
.inp::placeholder { color: var(–muted); }

.lbl {
font-size: 10px; font-weight: 600;
letter-spacing: 1.5px; text-transform: uppercase;
color: var(–muted); font-family: “DM Mono”, monospace;
margin-bottom: 7px; display: block;
}

.btn {
width: 100%; padding: 14px;
border-radius: 100px;
border: none;
font-family: “DM Sans”, sans-serif;
font-size: 14px; font-weight: 600;
cursor: pointer;
transition: all 0.18s;
margin-bottom: 8px;
}
.btn-v { background: var(–v); color: #fff; box-shadow: 0 0 18px var(–vg); }
.btn-v:hover { background: var(–v2); transform: translateY(-1px); }
.btn-out { background: transparent; color: var(–muted); border: 1px solid var(–border); }
.btn-out:hover { border-color: var(–v); color: var(–v2); }

/* ─── MODAL ─── */
.modal-bg {
position: fixed; inset: 0;
background: rgba(0,0,0,0.72);
z-index: 50;
display: flex; align-items: flex-end;
backdrop-filter: blur(12px);
}
.modal {
background: var(–surface);
border: 1px solid var(–border);
border-radius: 22px 22px 0 0;
padding: 22px 18px max(32px, env(safe-area-inset-bottom));
width: 100%;
animation: sup 0.28s ease;
}
@keyframes sup { from { transform: translateY(100%); } to { transform: translateY(0); } }
.modal-t { font-size: 17px; font-weight: 700; text-align: center; margin-bottom: 18px; }

/* emoji picker */
.emoji-grid { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-bottom: 18px; }
.emoji-opt {
width: 46px; height: 46px;
border-radius: 50%;
display: flex; align-items: center; justify-content: center;
font-size: 22px;
cursor: pointer;
border: 2px solid transparent;
transition: all 0.18s;
background: var(–surface2);
}
.emoji-opt.sel { border-color: var(–v2); box-shadow: 0 0 10px var(–vg); transform: scale(1.12); }

/* ─── TOAST ─── */
.toast {
position: fixed; top: 74px; left: 50%;
transform: translateX(-50%);
background: var(–surface2);
border: 1px solid var(–v);
border-radius: 100px;
padding: 9px 18px;
font-size: 12px;
color: var(–text);
z-index: 60;
white-space: nowrap;
box-shadow: 0 0 18px var(–vg);
animation: toast-in 0.25s ease;
font-family: “DM Mono”, monospace;
}
@keyframes toast-in { from { opacity: 0; transform: translateX(-50%) translateY(-8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

/* ─── INCOMING CALL ─── */
.incoming {
position: fixed; inset: 0;
background: rgba(6,6,15,0.96);
z-index: 40;
display: flex; flex-direction: column; align-items: center; justify-content: center;
gap: 20px;
backdrop-filter: blur(20px);
}
.incoming-lbl { font-size: 11px; color: var(–muted); font-family: “DM Mono”, monospace; letter-spacing: 2px; text-transform: uppercase; }
.incoming-name { font-size: 22px; font-weight: 700; }
.incoming-acts { display: flex; gap: 40px; margin-top: 12px; }
.inc-btn {
width: 62px; height: 62px;
border-radius: 50%; border: none; color: #fff; font-size: 22px;
cursor: pointer; display: flex; align-items: center; justify-content: center;
transition: all 0.18s;
}
.inc-btn:hover { transform: scale(1.1); }
.inc-ans { background: var(–green); box-shadow: 0 0 18px rgba(16,185,129,0.4); }
.inc-dec { background: var(–red); box-shadow: 0 0 18px rgba(239,68,68,0.4); }

/* ─── REQUESTS ─── */
.req-card {
background: var(–surface);
border: 1px solid var(–border2);
border-radius: 14px;
padding: 12px 14px;
display: flex; align-items: center; gap: 12px;
margin: 0 14px 8px;
}
.req-acts { display: flex; gap: 8px; margin-left: auto; }

/* ─── ONBOARDING ─── */
.onboard {
height: 100vh;
display: flex; flex-direction: column;
justify-content: center;
padding: 40px 22px;
overflow-y: auto;
}
.onboard-logo { text-align: center; margin-bottom: 36px; }
.onboard-title { font-size: 26px; font-weight: 800; letter-spacing: -1px; margin-top: 14px; }
.onboard-sub { font-size: 13px; color: var(–muted); font-family: “DM Mono”, monospace; margin-top: 6px; }

/* connecting */
.conn-screen {
height: 100vh;
display: flex; flex-direction: column;
align-items: center; justify-content: center; gap: 16px;
}
.spinner {
width: 40px; height: 40px;
border: 2px solid var(–border2);
border-top-color: var(–v2);
border-radius: 50%;
animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.conn-txt { font-size: 13px; color: var(–muted); font-family: “DM Mono”, monospace; }

/* home header */
.home-hdr { padding: 20px 18px 14px; }
.home-hi { font-size: 20px; font-weight: 700; letter-spacing: -0.4px; margin-bottom: 3px; }
.home-sub { font-size: 12px; color: var(–muted); font-family: “DM Mono”, monospace; }

/* confirm dialog */
.confirm-btns { display: flex; gap: 10px; }
.confirm-btns .btn { flex: 1; }
`;

// ─── EMOJIS & COLORS ─────────────────────────────────────────────────────────
const EMOJIS = [“😎”,“🦁”,“🐺”,“🦊”,“🐬”,“🦋”,“🌊”,“⚡”,“🔥”,“🌙”,“🎯”,“🚀”,“🎸”,“🌺”,“🦅”];
const ROOMS_DEFAULT = [
{ id: “room1”, name: “Stanza 1”, icon: “🏠” },
{ id: “room2”, name: “Stanza 2”, icon: “🌟” },
{ id: “room3”, name: “Stanza 3”, icon: “🎵” },
{ id: “room4”, name: “Stanza 4”, icon: “🔮” },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function Avatar({ u, size = 44 }) {
const ci = (u?.colorIdx ?? 0) % 6;
return (
<div className={`av av${ci}`} style={{ width: size, height: size, fontSize: size * 0.38, borderRadius: “50%” }}>
{u?.emoji || u?.name?.[0]?.toUpperCase() || “?”}
</div>
);
}

function WaveLogo({ size = 30 }) {
return (
<svg width={size} height={size} viewBox="0 0 30 30" fill="none">
<rect width="30" height="30" rx="9" fill="#0d0d1c"/>
<path d="M4 17 Q7.5 10 11 17 Q14.5 24 18 17 Q21.5 10 26 17" stroke="#a855f7" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
<path d="M4 21 Q7.5 15 11 21 Q14.5 27 18 21 Q21.5 15 26 21" stroke="#7c3aed" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.5"/>
</svg>
);
}

function Toast({ msg, onDone }) {
useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t); }, [onDone]);
return <div className="toast">🌊 {msg}</div>;
}

// ─── CALL TIMER ───────────────────────────────────────────────────────────────
function CallTimer({ active }) {
const [s, setS] = useState(0);
useEffect(() => {
if (!active) { setS(0); return; }
const id = setInterval(() => setS(n => n + 1), 1000);
return () => clearInterval(id);
}, [active]);
const p = n => String(n).padStart(2, “0”);
return <div className="call-timer-txt">{p(Math.floor(s/60))}:{p(s%60)}</div>;
}

// ─── WEBRTC HOOK ──────────────────────────────────────────────────────────────
const ICE = [{ urls: “stun:stun.l.google.com:19302” }, { urls: “stun:stun1.l.google.com:19302” }];

function usePeerCall({ ws, myId, targetId, roomId, onEnd }) {
const pc = useRef(null);
const localStream = useRef(null);
const [status, setStatus] = useState(“connecting”);
const [muted, setMuted] = useState(false);

const sendSig = useCallback((type, data) => {
if (ws?.readyState === 1) ws.send(JSON.stringify({ type, targetId, …data }));
}, [ws, targetId]);

const setupPC = useCallback(async (initiator) => {
try {
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
localStream.current = stream;
const track = stream.getAudioTracks()[0];
if (track) track.enabled = false; // PTT default muted

```
  const p = new RTCPeerConnection({ iceServers: ICE });
  pc.current = p;
  stream.getTracks().forEach(t => p.addTrack(t, stream));

  p.ontrack = e => {
    const audio = new Audio();
    audio.srcObject = e.streams[0];
    audio.play().catch(() => {});
  };

  p.onicecandidate = e => {
    if (e.candidate) sendSig("ice", { candidate: e.candidate, roomId });
  };

  p.onconnectionstatechange = () => {
    if (p.connectionState === "connected") setStatus("connected");
    if (["disconnected","failed","closed"].includes(p.connectionState)) { setStatus("ended"); onEnd?.(); }
  };

  if (initiator) {
    const offer = await p.createOffer();
    await p.setLocalDescription(offer);
    sendSig("offer", { sdp: offer, roomId });
  }

  setStatus("waiting");
} catch { setStatus("error"); }
```

}, [sendSig, roomId, onEnd]);

const handleSignal = useCallback(async (msg) => {
if (!pc.current) return;
if (msg.type === “offer”) {
await pc.current.setRemoteDescription(msg.sdp);
const ans = await pc.current.createAnswer();
await pc.current.setLocalDescription(ans);
sendSig(“answer”, { sdp: ans, roomId });
setStatus(“connected”);
}
if (msg.type === “answer”) { await pc.current.setRemoteDescription(msg.sdp); setStatus(“connected”); }
if (msg.type === “ice”) await pc.current.addIceCandidate(msg.candidate).catch(() => {});
}, [sendSig, roomId]);

const startTalk = () => {
const t = localStream.current?.getAudioTracks()[0];
if (t) t.enabled = true;
};
const stopTalk = () => {
const t = localStream.current?.getAudioTracks()[0];
if (t) t.enabled = false;
};
const toggleMute = () => {
const t = localStream.current?.getAudioTracks()[0];
if (t) { t.enabled = !t.enabled; setMuted(m => !m); }
};
const hangup = () => {
localStream.current?.getTracks().forEach(t => t.stop());
pc.current?.close();
if (ws?.readyState === 1) ws.send(JSON.stringify({ type: “leave_call”, roomId }));
setStatus(“ended”);
onEnd?.();
};

return { status, muted, setupPC, handleSignal, startTalk, stopTalk, toggleMute, hangup };
}

// ─── SCREENS ──────────────────────────────────────────────────────────────────

function OnboardingScreen({ onDone }) {
const [step, setStep] = useState(0); // 0=name, 1=avatar
const [name, setName] = useState(””);
const [username, setUsername] = useState(””);
const [emoji, setEmoji] = useState(“😎”);
const [colorIdx] = useState(Math.floor(Math.random() * 6));
const [err, setErr] = useState(””);

const next = () => {
if (!name.trim()) { setErr(“Inserisci il tuo nome”); return; }
if (!username.trim() || username.includes(” “)) { setErr(“Username non valido (no spazi)”); return; }
setErr(””); setStep(1);
};

const done = () => onDone({ name: name.trim(), username: username.trim().toLowerCase(), emoji, colorIdx });

return (
<div className="onboard">
<div className="onboard-logo">
<WaveLogo size={60}/>
<div className="onboard-title">VoiceWave</div>
<div className="onboard-sub">// parla con chi vuoi, ovunque tu sia</div>
</div>

```
  {step === 0 && (
    <>
      <label className="lbl">Il tuo nome</label>
      <input className="inp" placeholder="es. Marco" value={name} onChange={e => setName(e.target.value)}/>
      <label className="lbl">Username univoco</label>
      <input className="inp" placeholder="es. marco99" value={username} onChange={e => setUsername(e.target.value.toLowerCase())}/>
      {err && <div style={{ color: "var(--red)", fontSize: 12, marginBottom: 10, fontFamily: "DM Mono, monospace" }}>{err}</div>}
      <button className="btn btn-v" onClick={next}>Continua →</button>
    </>
  )}

  {step === 1 && (
    <>
      <label className="lbl" style={{ textAlign: "center", display: "block", marginBottom: 14 }}>Scegli il tuo avatar</label>
      <div className="emoji-grid" style={{ marginBottom: 24 }}>
        {EMOJIS.map(e => (
          <div key={e} className={`emoji-opt ${emoji === e ? "sel" : ""}`} onClick={() => setEmoji(e)}>{e}</div>
        ))}
      </div>
      <button className="btn btn-v" onClick={done}>Inizia 🌊</button>
      <button className="btn btn-out" onClick={() => setStep(0)}>← Indietro</button>
    </>
  )}
</div>
```

);
}

function HomeTab({ profile, friends, requests, onCall, onGoAdd, onAccept, onReject, onRemove, onBlock }) {
const online = friends.filter(f => f.online);
const offline = friends.filter(f => !f.online);

return (
<div>
<div className="home-hdr">
<div className="home-hi">Ciao, {profile.name} 👋</div>
<div className="home-sub">// {online.length} amici online</div>
</div>

```
  {requests.length > 0 && (
    <>
      <div className="sec" style={{ marginTop: 4 }}>Richieste ({requests.length})</div>
      {requests.map(r => (
        <div className="req-card" key={r.id}>
          <Avatar u={r} size={40}/>
          <div className="cinfo">
            <div className="cname">{r.name}</div>
            <div className="cstatus">@{r.username}</div>
          </div>
          <div className="req-acts">
            <button className="pill-btn pill-v" onClick={() => onAccept(r.id)}>✓</button>
            <button className="pill-btn pill-red" onClick={() => onReject(r.id)}>✕</button>
          </div>
        </div>
      ))}
    </>
  )}

  {friends.length === 0 ? (
    <div className="empty">
      <div className="empty-ico">👥</div>
      <div className="empty-t">Nessun amico ancora</div>
      <div className="empty-d">Cerca persone tramite username<br/>e manda una richiesta</div>
    </div>
  ) : (
    <>
      {online.length > 0 && (
        <>
          <div className="sec">Online</div>
          <div className="contact-list">
            {online.map(f => (
              <ContactCard key={f.id} f={f} onCall={() => onCall(f)} onRemove={() => onRemove(f)} onBlock={() => onBlock(f)}/>
            ))}
          </div>
        </>
      )}
      {offline.length > 0 && (
        <>
          <div className="sec" style={{ marginTop: 12 }}>Offline</div>
          <div className="contact-list">
            {offline.map(f => (
              <ContactCard key={f.id} f={f} onCall={() => onCall(f)} onRemove={() => onRemove(f)} onBlock={() => onBlock(f)}/>
            ))}
          </div>
        </>
      )}
    </>
  )}

  <button className="add-row" onClick={onGoAdd}>＋ Aggiungi amico</button>
</div>
```

);
}

function ContactCard({ f, onCall, onRemove, onBlock }) {
const [menu, setMenu] = useState(false);

return (
<div className=“ccard” onClick={() => f.online && onCall()}>
<div style={{ position: “relative” }}>
<Avatar u={f} size={44}/>
<div className=“dot-status” style={{ background: f.online ? “var(–green)” : “var(–dim)” }}/>
</div>
<div className="cinfo">
<div className="cname">{f.name}</div>
<div className={`cstatus ${f.online ? "on" : ""}`}>{f.online ? “● online” : “○ offline”}</div>
</div>
<button className=“caction” onClick={e => { e.stopPropagation(); if (f.online) onCall(); }}>🎙️</button>
<button className=“caction” style={{ marginLeft: 4, fontSize: 13 }} onClick={e => { e.stopPropagation(); setMenu(true); }}>⋯</button>
{menu && (
<div className=“modal-bg” onClick={() => setMenu(false)}>
<div className=“modal” onClick={e => e.stopPropagation()}>
<div className="modal-t">{f.name}</div>
<button className=“btn btn-out” style={{ marginBottom: 8 }} onClick={() => { onRemove(); setMenu(false); }}>🗑️ Rimuovi amico</button>
<button className=“btn” style={{ background: “rgba(239,68,68,0.1)”, color: “var(–red)”, border: “1px solid rgba(239,68,68,0.2)” }} onClick={() => { onBlock(); setMenu(false); }}>🚫 Blocca</button>
<button className=“btn btn-out” onClick={() => setMenu(false)}>Annulla</button>
</div>
</div>
)}
</div>
);
}

function SearchTab({ ws, myId, friends, onAddFriend }) {
const [q, setQ] = useState(””);
const [results, setResults] = useState([]);
const [sent, setSent] = useState(new Set());

useEffect(() => {
if (!ws || q.length < 2) { setResults([]); return; }
ws.send(JSON.stringify({ type: “search_user”, query: q }));
}, [q, ws]);

const handleResults = useCallback((data) => setResults(data.results || []), []);

useEffect(() => {
if (!ws) return;
const orig = ws.onmessage;
ws.onmessage = (e) => {
const msg = JSON.parse(e.data);
if (msg.type === “search_results”) handleResults(msg);
else orig?.(e);
};
return () => { if (ws) ws.onmessage = orig; };
}, [ws, handleResults]);

const sendReq = (userId) => {
if (ws?.readyState === 1) ws.send(JSON.stringify({ type: “send_friend_request”, targetId: userId }));
setSent(s => new Set([…s, userId]));
onAddFriend?.();
};

const friendIds = new Set(friends.map(f => f.id));

return (
<div style={{ paddingTop: 16 }}>
<div className="sec">Cerca persone</div>
<div className="search-wrap">
<span className="search-ico">🔍</span>
<input placeholder=“Username o nome…” value={q} onChange={e => setQ(e.target.value)} autoComplete=“off”/>
</div>

```
  {q.length > 0 && results.length === 0 && (
    <div className="empty">
      <div className="empty-ico">🔍</div>
      <div className="empty-t">Nessun risultato</div>
      <div className="empty-d">Prova con un altro username</div>
    </div>
  )}

  {results.map(u => (
    <div className="result-card" key={u.id}>
      <Avatar u={u} size={42}/>
      <div className="cinfo">
        <div className="cname">{u.name}</div>
        <div className="cstatus">@{u.username}</div>
      </div>
      {friendIds.has(u.id) ? (
        <span className="pill-btn pill-gray">Amico</span>
      ) : sent.has(u.id) || u.requestSent ? (
        <span className="pill-btn pill-gray">Inviata</span>
      ) : (
        <button className="pill-btn pill-v" onClick={() => sendReq(u.id)}>Aggiungi</button>
      )}
    </div>
  ))}
</div>
```

);
}

function RoomsTab({ ws, myId, profile, roomNames, onRoomEnter }) {
const rooms = ROOMS_DEFAULT.map(r => ({ …r, name: roomNames[r.id] || r.name }));

return (
<div style={{ paddingTop: 16 }}>
<div className="sec">Stanze di gruppo</div>
<div className="room-list">
{rooms.map(r => (
<RoomCard key={r.id} room={r} ws={ws} myId={myId} profile={profile} onEnter={() => onRoomEnter(r)}/>
))}
</div>
</div>
);
}

function RoomCard({ room, ws, myId, profile, onEnter }) {
const [count, setCount] = useState(0);
const [renaming, setRenaming] = useState(false);
const [newName, setNewName] = useState(room.name);

const rename = () => {
if (ws?.readyState === 1 && newName.trim()) {
ws.send(JSON.stringify({ type: “rename_room”, roomId: room.id, name: newName.trim() }));
}
setRenaming(false);
};

return (
<>
<div className="room-card" onClick={onEnter}>
<div className="room-ico">{room.icon}</div>
<div className="room-info">
<div className="room-name">{room.name}</div>
<div className="room-count">{count > 0 ? `${count} persone dentro` : “Vuota”}</div>
</div>
<button className=“room-edit” onClick={e => { e.stopPropagation(); setRenaming(true); }}>✏️</button>
</div>

```
  {renaming && (
    <div className="modal-bg" onClick={() => setRenaming(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-t">Rinomina stanza</div>
        <label className="lbl">Nuovo nome</label>
        <input className="inp" value={newName} onChange={e => setNewName(e.target.value)} autoFocus maxLength={30}/>
        <button className="btn btn-v" onClick={rename}>Salva</button>
        <button className="btn btn-out" onClick={() => setRenaming(false)}>Annulla</button>
      </div>
    </div>
  )}
</>
```

);
}

function CallScreen({ contact, profile, ws, onEnd }) {
const roomId = `call_${[profile.id, contact.id].sort().join("_")}`;
const [pressing, setPressing] = useState(false);
const { status, muted, setupPC, handleSignal, startTalk, stopTalk, toggleMute, hangup } = usePeerCall({
ws, myId: profile.id, targetId: contact.id, roomId, onEnd,
});

useEffect(() => {
if (!ws) return;
ws.send(JSON.stringify({ type: “join_call”, roomId }));
setupPC(profile.id > contact.id);

```
const prev = ws.onmessage;
ws.onmessage = async (e) => {
  const msg = JSON.parse(e.data);
  if (["offer","answer","ice"].includes(msg.type) && msg.fromId === contact.id) {
    await handleSignal(msg);
  } else prev?.(e);
};
return () => { if (ws) ws.onmessage = prev; };
```

}, []);

const pttStart = () => { setPressing(true); startTalk(); };
const pttEnd = () => { setPressing(false); stopTalk(); };

return (
<div className="call-wrap">
<div className="call-av-wrap">
<Avatar u={contact} size={96}/>
{status === “connected” && (
<>
<div className="pulse-ring pr1"/>
<div className="pulse-ring pr2"/>
</>
)}
</div>

```
  <div className="call-name">{contact.name}</div>
  <div className="call-sub">
    {status === "connecting" ? "connessione..." : status === "waiting" ? "in attesa..." : status === "connected" ? "connesso" : "chiamata terminata"}
  </div>
  <CallTimer active={status === "connected"}/>

  <div className="ptt-wrap">
    <div className="ptt-hint">{pressing ? "🔴 stai parlando" : "tieni premuto per parlare"}</div>
    <button
      className={`ptt ${pressing ? "pressing" : ""}`}
      onMouseDown={pttStart} onMouseUp={pttEnd} onMouseLeave={pttEnd}
      onTouchStart={e => { e.preventDefault(); pttStart(); }}
      onTouchEnd={e => { e.preventDefault(); pttEnd(); }}
    >
      {pressing && <div className="ptt-ripple"/>}
      🎙️
    </button>
  </div>

  <div className="call-ctrls">
    <button className={`ctrl ${muted ? "muted-on" : ""}`} onClick={toggleMute}>{muted ? "🔇" : "🔊"}</button>
    <button className="end-btn" onClick={hangup}>📵</button>
    <button className="ctrl">🔈</button>
  </div>
</div>
```

);
}

function SettingsTab({ profile, ws, onUpdate }) {
const [editName, setEditName] = useState(false);
const [editAvatar, setEditAvatar] = useState(false);
const [name, setName] = useState(profile.name);
const [emoji, setEmoji] = useState(profile.emoji);
const [notif, setNotif] = useState(true);
const [hq, setHq] = useState(false);

const saveName = () => {
const updated = { …profile, name: name.trim() };
onUpdate(updated);
if (ws?.readyState === 1) ws.send(JSON.stringify({ type: “update_profile”, name: name.trim() }));
setEditName(false);
};

const saveEmoji = () => {
const updated = { …profile, emoji };
onUpdate(updated);
if (ws?.readyState === 1) ws.send(JSON.stringify({ type: “update_profile”, emoji }));
setEditAvatar(false);
};

return (
<div className="settings-wrap">
<div className="prof-card">
<div className=“prof-av” onClick={() => setEditAvatar(true)}>
<Avatar u={profile} size={76}/>
<div className="prof-av-edit">✏️</div>
</div>
<div className="prof-name">{profile.name}</div>
<div className="prof-un">@{profile.username}</div>
</div>

```
  <div className="sec">Profilo</div>
  <div className="sgroup">
    <div className="sitem" onClick={() => setEditName(true)}>
      <div className="sico">👤</div>
      <div className="slabel">Nome</div>
      <div className="svalue">{profile.name}</div>
      <div className="sarrow">›</div>
    </div>
    <div className="sitem" onClick={() => setEditAvatar(true)}>
      <div className="sico">🎨</div>
      <div className="slabel">Avatar</div>
      <div className="svalue">{profile.emoji}</div>
      <div className="sarrow">›</div>
    </div>
  </div>

  <div className="sec">Audio</div>
  <div className="sgroup">
    <div className="sitem">
      <div className="sico">🎙️</div>
      <div className="slabel">Alta qualità</div>
      <div className={`toggle ${hq ? "on" : ""}`} onClick={() => setHq(h => !h)}/>
    </div>
  </div>

  <div className="sec">Notifiche</div>
  <div className="sgroup">
    <div className="sitem">
      <div className="sico">🔔</div>
      <div className="slabel">Chiamate in arrivo</div>
      <div className={`toggle ${notif ? "on" : ""}`} onClick={() => setNotif(n => !n)}/>
    </div>
  </div>

  <div className="sec">Info</div>
  <div className="sgroup">
    <div className="sitem">
      <div className="sico">ℹ️</div>
      <div className="slabel">Versione</div>
      <div className="svalue">2.0.0</div>
    </div>
  </div>

  {editName && (
    <div className="modal-bg" onClick={() => setEditName(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-t">Modifica nome</div>
        <label className="lbl">Nome</label>
        <input className="inp" value={name} onChange={e => setName(e.target.value)} autoFocus/>
        <button className="btn btn-v" onClick={saveName}>Salva</button>
        <button className="btn btn-out" onClick={() => setEditName(false)}>Annulla</button>
      </div>
    </div>
  )}

  {editAvatar && (
    <div className="modal-bg" onClick={() => setEditAvatar(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-t">Scegli avatar</div>
        <div className="emoji-grid">
          {EMOJIS.map(e => (
            <div key={e} className={`emoji-opt ${emoji === e ? "sel" : ""}`} onClick={() => setEmoji(e)}>{e}</div>
          ))}
        </div>
        <button className="btn btn-v" onClick={saveEmoji}>Salva</button>
        <button className="btn btn-out" onClick={() => setEditAvatar(false)}>Annulla</button>
      </div>
    </div>
  )}
</div>
```

);
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
const wsRef = useRef(null);
const [wsReady, setWsReady] = useState(false);
const [profile, setProfile] = useState(null);
const [friends, setFriends] = useState([]);
const [friendRequests, setFriendRequests] = useState([]);
const [tab, setTab] = useState(“home”);
const [activeCall, setActiveCall] = useState(null);
const [incomingCall, setIncomingCall] = useState(null);
const [toast, setToast] = useState(null);
const [roomNames, setRoomNames] = useState({});
const [connecting, setConnecting] = useState(false);
const [regErr, setRegErr] = useState(””);

const showToast = (msg) => setToast(msg);

// ─── LOAD PROFILE FROM STORAGE ───────────────────────────────────────────
useEffect(() => {
const saved = localStorage.getItem(STORAGE_KEY);
if (saved) {
try { setProfile(JSON.parse(saved)); } catch {}
}
}, []);

// ─── CONNECT WEBSOCKET ────────────────────────────────────────────────────
useEffect(() => {
if (!profile) return;
setConnecting(true);

```
const ws = new WebSocket(SERVER);
wsRef.current = ws;

ws.onopen = () => {
  if (profile.serverId) {
    ws.send(JSON.stringify({ type: "login", userId: profile.serverId }));
  } else {
    ws.send(JSON.stringify({
      type: "register",
      username: profile.username,
      name: profile.name,
      emoji: profile.emoji,
      colorIdx: profile.colorIdx,
    }));
  }
};

ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);

  if (msg.type === "registered") {
    const updated = { ...profile, serverId: msg.user.id };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setProfile(updated);
    setFriends(msg.friends || []);
    setFriendRequests(msg.requests || []);
    setConnecting(false);
    setWsReady(true);
  }

  if (msg.type === "logged_in") {
    setFriends(msg.friends || []);
    setFriendRequests(msg.requests || []);
    const names = {};
    (msg.rooms || []).forEach(r => { names[r.id] = r.name; });
    setRoomNames(names);
    setConnecting(false);
    setWsReady(true);
  }

  if (msg.type === "error_register") {
    setRegErr(msg.message);
    setConnecting(false);
    // Reset serverId so user can try again
    const updated = { ...profile, serverId: null };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setProfile(updated);
  }

  if (msg.type === "friend_status") {
    setFriends(fs => fs.map(f => f.id === msg.userId ? { ...f, online: msg.online } : f));
  }

  if (msg.type === "friend_request") {
    setFriendRequests(rs => [...rs.filter(r => r.id !== msg.from.id), msg.from]);
    showToast(`Richiesta da ${msg.from.name}`);
  }

  if (msg.type === "friend_accepted") {
    setFriends(msg.friends || []);
    setFriendRequests(rs => rs.filter(r => r.id !== msg.friend.id));
    showToast(`${msg.friend.name} ha accettato!`);
  }

  if (msg.type === "friend_removed") {
    setFriends(fs => fs.filter(f => f.id !== msg.friendId));
  }

  if (msg.type === "user_blocked") {
    setFriends(fs => fs.filter(f => f.id !== msg.targetId));
  }

  if (msg.type === "room_renamed") {
    setRoomNames(n => ({ ...n, [msg.roomId]: msg.name }));
  }

  if (msg.type === "incoming_call") {
    setIncomingCall({ from: msg.from, roomId: msg.roomId });
  }

  if (msg.type === "call_accepted") {
    showToast(`${msg.by.name} ha risposto`);
    setActiveCall(msg.by);
  }

  if (msg.type === "call_declined") {
    showToast(`${msg.by.name} ha rifiutato`);
    setIncomingCall(null);
  }
};

ws.onerror = () => { setConnecting(false); showToast("Errore di connessione"); };
ws.onclose = () => { setWsReady(false); };

return () => ws.close();
```

}, [profile?.serverId]);

const handleCall = (friend) => {
if (!friend.online) { showToast(`${friend.name} è offline`); return; }
const roomId = `call_${[profile.serverId, friend.id].sort().join("_")}`;
wsRef.current?.send(JSON.stringify({ type: “call_user”, targetId: friend.id, roomId }));
setActiveCall(friend);
};

const answerCall = () => {
wsRef.current?.send(JSON.stringify({ type: “call_accepted”, callerId: incomingCall.from.id, roomId: incomingCall.roomId }));
setActiveCall(incomingCall.from);
setIncomingCall(null);
};

const declineCall = () => {
wsRef.current?.send(JSON.stringify({ type: “call_declined”, callerId: incomingCall.from.id }));
setIncomingCall(null);
};

const acceptFriend = (fromId) => {
wsRef.current?.send(JSON.stringify({ type: “accept_friend”, fromId }));
};

const rejectFriend = (fromId) => {
wsRef.current?.send(JSON.stringify({ type: “reject_friend”, fromId }));
setFriendRequests(rs => rs.filter(r => r.id !== fromId));
};

const removeFriend = (friend) => {
wsRef.current?.send(JSON.stringify({ type: “remove_friend”, friendId: friend.id }));
setFriends(fs => fs.filter(f => f.id !== friend.id));
showToast(`${friend.name} rimosso`);
};

const blockUser = (friend) => {
wsRef.current?.send(JSON.stringify({ type: “block_user”, targetId: friend.id }));
setFriends(fs => fs.filter(f => f.id !== friend.id));
showToast(`${friend.name} bloccato`);
};

const handleProfileUpdate = (updated) => {
localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
setProfile(updated);
};

// ─── ONBOARDING ───────────────────────────────────────────────────────────
if (!profile) {
return (
<>
<style>{styles}</style>
<div className="app">
<div className="glow glow-a"/><div className="glow glow-b"/>
<OnboardingScreen onDone={(p) => {
localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
setProfile(p);
}}/>
</div>
</>
);
}

// ─── CONNECTING ───────────────────────────────────────────────────────────
if (connecting) {
return (
<>
<style>{styles}</style>
<div className="app">
<div className="conn-screen">
<WaveLogo size={48}/>
<div className="spinner"/>
<div className="conn-txt">connessione in corso…</div>
</div>
</div>
</>
);
}

// ─── ACTIVE CALL ──────────────────────────────────────────────────────────
if (activeCall) {
return (
<>
<style>{styles}</style>
<div className="app">
<div className="glow glow-a"/><div className="glow glow-b"/>
<div className="topbar">
<button className=“back-btn” style={{ background: “none”, border: “none”, color: “var(–muted)”, cursor: “pointer”, fontSize: 14, display: “flex”, alignItems: “center”, gap: 6 }} onClick={() => setActiveCall(null)}>← Fine chiamata</button>
</div>
<div className="screen">
<CallScreen contact={activeCall} profile={{ …profile, id: profile.serverId }} ws={wsRef.current} onEnd={() => setActiveCall(null)}/>
</div>
</div>
</>
);
}

return (
<>
<style>{styles}</style>
<div className="app">
<div className="glow glow-a"/><div className="glow glow-b"/>

```
    {toast && <Toast msg={toast} onDone={() => setToast(null)}/>}

    {incomingCall && (
      <div className="incoming">
        <div className="incoming-lbl">Chiamata in arrivo</div>
        <Avatar u={incomingCall.from} size={96}/>
        <div className="incoming-name">{incomingCall.from.name}</div>
        <div className="incoming-acts">
          <button className="inc-btn inc-dec" onClick={declineCall}>📵</button>
          <button className="inc-btn inc-ans" onClick={answerCall}>📞</button>
        </div>
      </div>
    )}

    <div className="topbar">
      <div className="topbar-logo">
        <WaveLogo size={28}/>
        <span className="topbar-title">Voice<span>Wave</span></span>
      </div>
      <div className="topbar-actions">
        {friendRequests.length > 0 && (
          <div className="badge-wrap">
            <div className="icon-pill" onClick={() => setTab("home")}>🔔</div>
            <div className="badge">{friendRequests.length}</div>
          </div>
        )}
        <div className="icon-pill" onClick={() => setTab("search")}>🔍</div>
        <Avatar u={profile} size={32}/>
      </div>
    </div>

    <div className="screen">
      {tab === "home" && (
        <HomeTab
          profile={profile}
          friends={friends}
          requests={friendRequests}
          onCall={handleCall}
          onGoAdd={() => setTab("search")}
          onAccept={acceptFriend}
          onReject={rejectFriend}
          onRemove={removeFriend}
          onBlock={blockUser}
        />
      )}
      {tab === "search" && (
        <SearchTab ws={wsRef.current} myId={profile.serverId} friends={friends} onAddFriend={() => showToast("Richiesta inviata!")}/>
      )}
      {tab === "rooms" && (
        <RoomsTab ws={wsRef.current} myId={profile.serverId} profile={profile} roomNames={roomNames} onRoomEnter={(r) => showToast(`Entri in ${r.name}`)}/>
      )}
      {tab === "settings" && (
        <SettingsTab profile={profile} ws={wsRef.current} onUpdate={handleProfileUpdate}/>
      )}
    </div>

    <div className="bottom-nav">
      <button className={`nav-tab ${tab === "home" ? "on" : ""}`} onClick={() => setTab("home")}>
        <span className="nav-tab-icon">🏠</span>
        <span className="nav-tab-label">Home</span>
      </button>
      <button className={`nav-tab ${tab === "search" ? "on" : ""}`} onClick={() => setTab("search")}>
        <span className="nav-tab-icon">🔍</span>
        <span className="nav-tab-label">Cerca</span>
      </button>
      <button className={`nav-tab ${tab === "rooms" ? "on" : ""}`} onClick={() => setTab("rooms")}>
        <span className="nav-tab-icon">🎙️</span>
        <span className="nav-tab-label">Stanze</span>
      </button>
      <button className={`nav-tab ${tab === "settings" ? "on" : ""}`} onClick={() => setTab("settings")}>
        <span className="nav-tab-icon">⚙️</span>
        <span className="nav-tab-label">Profilo</span>
      </button>
    </div>
  </div>
</>
```

);
}
