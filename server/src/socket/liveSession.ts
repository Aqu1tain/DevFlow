import type { Server, Socket } from "socket.io";
import * as Y from "yjs";
import * as snippetService from "../services/snippetService";

type Mode = "public" | "visible";

interface RoomUser {
  socketId: string;
  userId: string;
  username: string;
  clientID: number;
}

interface Room {
  doc: Y.Doc;
  hostSocketId: string;
  mode: Mode;
  users: Map<string, RoomUser>;
}

const MAX_YJS_UPDATE = 512 * 1024;
const MAX_AWARENESS_UPDATE = 64 * 1024;

const rooms = new Map<string, Room>();
const roomCreating = new Map<string, Promise<Room | null>>();

async function getOrCreateRoom(snippetId: string, socket: Socket): Promise<Room | null> {
  const existing = rooms.get(snippetId);
  if (existing) return existing;

  const inflight = roomCreating.get(snippetId);
  if (inflight) return inflight;

  const promise = (async () => {
    const snippet = await snippetService.findById(snippetId);
    if (!snippet) return null;

    const race = rooms.get(snippetId);
    if (race) return race;

    const doc = new Y.Doc();
    doc.getText("code").insert(0, snippet.code);
    const room: Room = { doc, hostSocketId: socket.id, mode: "public", users: new Map() };
    rooms.set(snippetId, room);
    return room;
  })();

  roomCreating.set(snippetId, promise);
  promise.finally(() => roomCreating.delete(snippetId));
  return promise;
}

function roomUsers(room: Room): RoomUser[] {
  return Array.from(room.users.values());
}

async function saveAndDestroy(snippetId: string, room: Room) {
  const code = room.doc.getText("code").toString();
  await snippetService.update(snippetId, { code });
  room.doc.destroy();
  rooms.delete(snippetId);
}

function evictStaleUser(room: Room, userId: string, snippetId: string, io: Server) {
  for (const [sid, u] of room.users) {
    if (u.userId !== userId) continue;
    room.users.delete(sid);
    if (sid === room.hostSocketId && room.users.size > 0) {
      room.hostSocketId = room.users.values().next().value!.socketId;
    }
    io.to(snippetId).emit("user-left", {
      users: roomUsers(room),
      hostSocketId: room.hostSocketId,
      leftClientID: u.clientID,
    });
    break;
  }
}

export function registerLiveSession(io: Server) {
  io.on("connection", (socket) => {
    let currentSnippetId: string | null = null;

    socket.on("join-snippet", async (snippetId: string, clientID: number) => {
      const room = await getOrCreateRoom(snippetId, socket);
      if (!room) return socket.emit("error", "Snippet not found");

      evictStaleUser(room, socket.data.userId, snippetId, io);

      currentSnippetId = snippetId;
      socket.join(snippetId);

      room.users.set(socket.id, {
        socketId: socket.id,
        userId: socket.data.userId,
        username: socket.data.username,
        clientID,
      });

      if (!room.users.has(room.hostSocketId)) {
        room.hostSocketId = socket.id;
      }

      socket.emit("room-state", {
        state: Buffer.from(Y.encodeStateAsUpdate(room.doc)).toJSON().data,
        mode: room.mode,
        users: roomUsers(room),
        hostSocketId: room.hostSocketId,
      });

      socket.to(snippetId).emit("user-joined", {
        users: roomUsers(room),
      });

      socket.to(snippetId).emit("sync-awareness");
    });

    socket.on("yjs-update", (update: number[]) => {
      if (!currentSnippetId) return;
      if (!Array.isArray(update) || update.length > MAX_YJS_UPDATE) return;
      const room = rooms.get(currentSnippetId);
      if (!room || !room.users.has(socket.id)) return;

      if (room.mode === "visible" && socket.id !== room.hostSocketId) return;

      const buf = new Uint8Array(update);
      Y.applyUpdate(room.doc, buf);
      socket.to(currentSnippetId).emit("yjs-update", update);
    });

    socket.on("awareness-update", (update: number[]) => {
      if (!currentSnippetId) return;
      if (!Array.isArray(update) || update.length > MAX_AWARENESS_UPDATE) return;
      const room = rooms.get(currentSnippetId);
      if (!room || !room.users.has(socket.id)) return;
      socket.to(currentSnippetId).emit("awareness-update", update);
    });

    socket.on("set-mode", (mode: Mode) => {
      if (!currentSnippetId) return;
      const room = rooms.get(currentSnippetId);
      if (!room || socket.id !== room.hostSocketId) return;

      room.mode = mode;
      io.to(currentSnippetId).emit("mode-changed", mode);
    });

    function leaveRoom() {
      if (!currentSnippetId) return;
      const room = rooms.get(currentSnippetId);
      if (!room || !room.users.has(socket.id)) return;

      const leaving = room.users.get(socket.id)!;
      room.users.delete(socket.id);
      const snippetId = currentSnippetId;
      currentSnippetId = null;

      if (room.users.size === 0) {
        saveAndDestroy(snippetId, room);
      } else {
        if (socket.id === room.hostSocketId) {
          const newHost = room.users.values().next().value!;
          room.hostSocketId = newHost.socketId;
        }
        io.to(snippetId).emit("user-left", {
          users: roomUsers(room),
          hostSocketId: room.hostSocketId,
          leftClientID: leaving.clientID,
        });
      }
    }

    socket.on("leave-snippet", leaveRoom);
    socket.on("disconnect", leaveRoom);
  });
}
