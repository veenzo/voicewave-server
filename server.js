const { WebSocketServer } = require("ws");
const http = require("http");
const server = http.createServer((req, res) => { res.writeHead(200); res.end("VoiceWave OK"); });
const wss = new WebSocketServer({ server });
server.listen(process.env.PORT || 8080, () => {
  console.log("VoiceWave Server avviato su :" + (process.env.PORT || 8080));
});




// ─── DATABASE IN MEMORIA ───────────────────────────────────────────────────
const users = new Map();        // userId -> { id, username, name, emoji, colorIdx, online, ws }
const friendships = new Map();  // userId -> Set di userId amici
const requests = new Map();     // userId -> Set di userId richieste in arrivo
const blocked = new Map();      // userId -> Set di userId bloccati
const rooms = new Map([         // roomId -> { name, peers: Set di userId }
  ["room1", { name: "Stanza 1", peers: new Set() }],
  ["room2", { name: "Stanza 2", peers: new Set() }],
  ["room3", { name: "Stanza 3", peers: new Set() }],
  ["room4", { name: "Stanza 4", peers: new Set() }],
]);
const callSessions = new Map(); // roomId -> { offer, peers }

function send(ws, obj) {
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify(obj));
  }
}

function sendToUser(userId, obj) {
  const user = users.get(userId);
  if (user && user.ws) send(user.ws, obj);
}

function broadcastOnlineStatus(userId) {
  const user = users.get(userId);
  if (!user) return;
  const friends = friendships.get(userId) || new Set();
  friends.forEach(friendId => {
    sendToUser(friendId, {
      type: "friend_status",
      userId,
      online: user.online,
    });
  });
}

function getUserPublic(userId) {
  const u = users.get(userId);
  if (!u) return null;
  return { id: u.id, username: u.username, name: u.name, emoji: u.emoji, colorIdx: u.colorIdx, online: u.online };
}

function getFriendList(userId) {
  const friends = friendships.get(userId) || new Set();
  return [...friends].map(id => getUserPublic(id)).filter(Boolean);
}

function getPendingRequests(userId) {
  const reqs = requests.get(userId) || new Set();
  return [...reqs].map(id => getUserPublic(id)).filter(Boolean);
}

wss.on("connection", (ws) => {
  let currentUserId = null;

  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    const { type } = msg;

    // ─── REGISTRAZIONE ───────────────────────────────────────────────────
    if (type === "register") {
      const { username, name, emoji, colorIdx } = msg;
      if (!username || !name) return send(ws, { type: "error", message: "Username e nome richiesti" });

      // Controlla username univoco
      const existing = [...users.values()].find(u => u.username.toLowerCase() === username.toLowerCase());
      if (existing) {
        return send(ws, { type: "error_register", message: "Username già in uso" });
      }

      const userId = `u_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const user = { id: userId, username, name, emoji: emoji || "😎", colorIdx: colorIdx || 0, online: true, ws };
      users.set(userId, user);
      friendships.set(userId, new Set());
      requests.set(userId, new Set());
      blocked.set(userId, new Set());

      currentUserId = userId;
      ws._userId = userId;

      send(ws, { type: "registered", user: getUserPublic(userId), friends: [], requests: [] });
      return;
    }

    // ─── LOGIN (riconnessione) ────────────────────────────────────────────
    if (type === "login") {
      const { userId } = msg;
      const user = users.get(userId);
      if (!user) return send(ws, { type: "error_login", message: "Utente non trovato, registrati di nuovo" });

      user.ws = ws;
      user.online = true;
      currentUserId = userId;
      ws._userId = userId;

      broadcastOnlineStatus(userId);

      send(ws, {
        type: "logged_in",
        user: getUserPublic(userId),
        friends: getFriendList(userId),
        requests: getPendingRequests(userId),
        rooms: [...rooms.entries()].map(([id, r]) => ({ id, name: r.name, count: r.peers.size })),
      });
      return;
    }

    // ─── AGGIORNA PROFILO ─────────────────────────────────────────────────
    if (type === "update_profile") {
      const user = users.get(currentUserId);
      if (!user) return;
      if (msg.name) user.name = msg.name;
      if (msg.emoji) user.emoji = msg.emoji;
      if (msg.colorIdx !== undefined) user.colorIdx = msg.colorIdx;
      send(ws, { type: "profile_updated", user: getUserPublic(currentUserId) });
      broadcastOnlineStatus(currentUserId);
      return;
    }

    // ─── CERCA UTENTE ─────────────────────────────────────────────────────
    if (type === "search_user") {
      const { query } = msg;
      if (!query || query.length < 2) return send(ws, { type: "search_results", results: [] });

      const blockedByMe = blocked.get(currentUserId) || new Set();
      const myFriends = friendships.get(currentUserId) || new Set();

      const results = [...users.values()]
        .filter(u =>
          u.id !== currentUserId &&
          !blockedByMe.has(u.id) &&
          (u.username.toLowerCase().includes(query.toLowerCase()) ||
           u.name.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, 10)
        .map(u => ({
          ...getUserPublic(u.id),
          isFriend: myFriends.has(u.id),
          requestSent: (requests.get(u.id) || new Set()).has(currentUserId),
        }));

      send(ws, { type: "search_results", results });
      return;
    }

    // ─── INVIA RICHIESTA AMICIZIA ─────────────────────────────────────────
    if (type === "send_friend_request") {
      const { targetId } = msg;
      if (!targetId || targetId === currentUserId) return;

      const myFriends = friendships.get(currentUserId) || new Set();
      if (myFriends.has(targetId)) return send(ws, { type: "error", message: "Siete già amici" });

      const targetRequests = requests.get(targetId) || new Set();
      targetRequests.add(currentUserId);
      requests.set(targetId, targetRequests);

      sendToUser(targetId, {
        type: "friend_request",
        from: getUserPublic(currentUserId),
      });

      send(ws, { type: "friend_request_sent", targetId });
      return;
    }

    // ─── ACCETTA RICHIESTA ────────────────────────────────────────────────
    if (type === "accept_friend") {
      const { fromId } = msg;
      const myRequests = requests.get(currentUserId) || new Set();
      if (!myRequests.has(fromId)) return;

      myRequests.delete(fromId);
      friendships.get(currentUserId).add(fromId);
      friendships.get(fromId).add(currentUserId);

      send(ws, { type: "friend_accepted", friend: getUserPublic(fromId), friends: getFriendList(currentUserId) });
      sendToUser(fromId, { type: "friend_accepted", friend: getUserPublic(currentUserId), friends: getFriendList(fromId) });
      return;
    }

    // ─── RIFIUTA RICHIESTA ────────────────────────────────────────────────
    if (type === "reject_friend") {
      const { fromId } = msg;
      const myRequests = requests.get(currentUserId) || new Set();
      myRequests.delete(fromId);
      send(ws, { type: "friend_rejected", fromId });
      return;
    }

    // ─── RIMUOVI AMICO ────────────────────────────────────────────────────
    if (type === "remove_friend") {
      const { friendId } = msg;
      friendships.get(currentUserId)?.delete(friendId);
      friendships.get(friendId)?.delete(currentUserId);
      send(ws, { type: "friend_removed", friendId });
      sendToUser(friendId, { type: "friend_removed", friendId: currentUserId });
      return;
    }

    // ─── BLOCCA UTENTE ────────────────────────────────────────────────────
    if (type === "block_user") {
      const { targetId } = msg;
      blocked.get(currentUserId)?.add(targetId);
      friendships.get(currentUserId)?.delete(targetId);
      friendships.get(targetId)?.delete(currentUserId);
      send(ws, { type: "user_blocked", targetId });
      return;
    }

    // ─── CHIAMATA 1 A 1 ───────────────────────────────────────────────────
    if (type === "call_user") {
      const { targetId } = msg;
      const myFriends = friendships.get(currentUserId) || new Set();
      if (!myFriends.has(targetId)) return send(ws, { type: "error", message: "Non sei amico di questo utente" });

      sendToUser(targetId, {
        type: "incoming_call",
        from: getUserPublic(currentUserId),
        roomId: msg.roomId,
      });
      return;
    }

    if (type === "call_accepted") {
      sendToUser(msg.callerId, { type: "call_accepted", by: getUserPublic(currentUserId), roomId: msg.roomId });
      return;
    }

    if (type === "call_declined") {
      sendToUser(msg.callerId, { type: "call_declined", by: getUserPublic(currentUserId) });
      return;
    }

    // ─── SIGNALING WebRTC ─────────────────────────────────────────────────
    if (type === "join_call") {
      const { roomId } = msg;
      if (!callSessions.has(roomId)) callSessions.set(roomId, { peers: new Set() });
      const session = callSessions.get(roomId);
      session.peers.add(currentUserId);
      ws._callRoom = roomId;

      session.peers.forEach(peerId => {
        if (peerId !== currentUserId) {
          sendToUser(peerId, { type: "peer_joined_call", userId: currentUserId, user: getUserPublic(currentUserId) });
          send(ws, { type: "peer_joined_call", userId: peerId, user: getUserPublic(peerId) });
        }
      });
      return;
    }

    if (type === "offer" || type === "answer" || type === "ice") {
      const { targetId } = msg;
      sendToUser(targetId, { ...msg, fromId: currentUserId });
      return;
    }

    if (type === "leave_call") {
      const { roomId } = msg;
      const session = callSessions.get(roomId);
      if (session) {
        session.peers.delete(currentUserId);
        session.peers.forEach(peerId => {
          sendToUser(peerId, { type: "peer_left_call", userId: currentUserId });
        });
        if (session.peers.size === 0) callSessions.delete(roomId);
      }
      return;
    }

    // ─── STANZE DI GRUPPO ─────────────────────────────────────────────────
    if (type === "join_room") {
      const { roomId } = msg;
      const room = rooms.get(roomId);
      if (!room) return send(ws, { type: "error", message: "Stanza non trovata" });

      room.peers.add(currentUserId);
      ws._groupRoom = roomId;

      const members = [...room.peers].map(id => getUserPublic(id)).filter(Boolean);

      room.peers.forEach(peerId => {
        if (peerId !== currentUserId) {
          sendToUser(peerId, { type: "room_peer_joined", userId: currentUserId, user: getUserPublic(currentUserId), roomId });
        }
      });

      send(ws, { type: "room_joined", roomId, name: room.name, members });
      return;
    }

    if (type === "leave_room") {
      const { roomId } = msg;
      const room = rooms.get(roomId);
      if (room) {
        room.peers.delete(currentUserId);
        room.peers.forEach(peerId => {
          sendToUser(peerId, { type: "room_peer_left", userId: currentUserId, roomId });
        });
      }
      ws._groupRoom = null;
      return;
    }

    if (type === "rename_room") {
      const { roomId, name } = msg;
      const room = rooms.get(roomId);
      if (!room || !name) return;
      room.name = name.trim().slice(0, 30);
      rooms.get(roomId).peers.forEach(peerId => {
        sendToUser(peerId, { type: "room_renamed", roomId, name: room.name });
      });
      send(ws, { type: "room_renamed", roomId, name: room.name });
      return;
    }

    if (type === "room_offer" || type === "room_answer" || type === "room_ice") {
      const { roomId, targetId } = msg;
      sendToUser(targetId, { ...msg, fromId: currentUserId });
      return;
    }
  });

  ws.on("close", () => {
    if (!currentUserId) return;
    const user = users.get(currentUserId);
    if (user) { user.online = false; user.ws = null; }
    broadcastOnlineStatus(currentUserId);

    if (ws._callRoom) {
      const session = callSessions.get(ws._callRoom);
      if (session) {
        session.peers.delete(currentUserId);
        session.peers.forEach(peerId => {
          sendToUser(peerId, { type: "peer_left_call", userId: currentUserId });
        });
      }
    }

    if (ws._groupRoom) {
      const room = rooms.get(ws._groupRoom);
      if (room) {
        room.peers.delete(currentUserId);
        room.peers.forEach(peerId => {
          sendToUser(peerId, { type: "room_peer_left", userId: currentUserId, roomId: ws._groupRoom });
        });
      }
    }
  });
});


