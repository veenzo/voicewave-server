const { WebSocketServer } = require("ws");
const PORT = process.env.PORT || 3001;
const wss = new WebSocketServer({ port: PORT });
const rooms = new Map();

function getRoomPeers(r) { return rooms.get(r) || []; }
function addToRoom(r, ws, u) { if (!rooms.has(r)) rooms.set(r, []); rooms.get(r).push({ ws, username: u }); }
function removeFromRoom(ws) {
  for (const [r, peers] of rooms.entries()) {
    const i = peers.findIndex(p => p.ws === ws);
    if (i !== -1) { peers.splice(i, 1); if (!peers.length) rooms.delete(r); return r; }
  }
  return null;
}
function send(ws, obj) { if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj)); }

wss.on("connection", (ws) => {
  ws.on("message", (raw) => {
    let msg; try { msg = JSON.parse(raw); } catch { return; }
    const { type, room, username } = msg;
    if (type === "join") {
      const peers = getRoomPeers(room);
      if (peers.length >= 2) return send(ws, { type: "error", message: "Stanza piena" });
      const existing = peers[0];
      addToRoom(room, ws, username);
      ws._room = room; ws._username = username;
      if (existing) { send(ws, { type: "peer_joined", username: existing.username }); send(existing.ws, { type: "peer_joined", username }); }
      return;
    }
    if (["offer","answer","ice"].includes(type)) {
      getRoomPeers(room).forEach(p => { if (p.ws !== ws) send(p.ws, { ...msg, username: ws._username }); });
      return;
    }
    if (type === "leave") {
      const r = removeFromRoom(ws);
      if (r) getRoomPeers(r).forEach(p => send(p.ws, { type: "peer_left" }));
    }
  });
  ws.on("close", () => {
    const r = removeFromRoom(ws);
    if (r) getRoomPeers(r).forEach(p => send(p.ws, { type: "peer_left" }));
  });
});
console.log(`Server avviato su :${PORT}`);
