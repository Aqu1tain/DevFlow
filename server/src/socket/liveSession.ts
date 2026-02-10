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

const rooms = new Map<string, Room>();

async function getOrCreateRoom(snippetId: string, socket: Socket): Promise<Room | null> {
  const existing = rooms.get(snippetId);
  if (existing) return existing;

  const snippet = await snippetService.findById(snippetId);
  if (!snippet) return null;

  const doc = new Y.Doc();
  doc.getText("code").insert(0, snippet.code);

  const room: Room = {
    doc,
    hostSocketId: socket.id,
    mode: "public",
    users: new Map(),
  };
  rooms.set(snippetId, room);
  return room;
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

export function registerLiveSession(io: Server) {
  io.on("connection", (socket) => {
    let currentSnippetId: string | null = null;

    socket.on("join-snippet", async (snippetId: string, clientID: number) => {
      const room = await getOrCreateRoom(snippetId, socket);
      if (!room) return socket.emit("error", "Snippet not found");

      currentSnippetId = snippetId;
      socket.join(snippetId);

      room.users.set(socket.id, {
        socketId: socket.id,
        userId: socket.data.userId,
        username: socket.data.username,
        clientID,
      });

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
      const room = rooms.get(currentSnippetId);
      if (!room) return;

      if (room.mode === "visible" && socket.id !== room.hostSocketId) return;

      const buf = new Uint8Array(update);
      Y.applyUpdate(room.doc, buf);
      socket.to(currentSnippetId).emit("yjs-update", update);
    });

    socket.on("awareness-update", (update: number[]) => {
      if (!currentSnippetId) return;
      socket.to(currentSnippetId).emit("awareness-update", update);
    });

    socket.on("set-mode", (mode: Mode) => {
      if (!currentSnippetId) return;
      const room = rooms.get(currentSnippetId);
      if (!room || socket.id !== room.hostSocketId) return;

      room.mode = mode;
      io.to(currentSnippetId).emit("mode-changed", mode);
    });

    socket.on("disconnect", async () => {
      if (!currentSnippetId) return;
      const room = rooms.get(currentSnippetId);
      if (!room) return;

      const leaving = room.users.get(socket.id);
      room.users.delete(socket.id);

      if (room.users.size === 0) {
        await saveAndDestroy(currentSnippetId, room);
      } else {
        if (socket.id === room.hostSocketId) {
          const newHost = room.users.values().next().value!;
          room.hostSocketId = newHost.socketId;
        }
        io.to(currentSnippetId).emit("user-left", {
          users: roomUsers(room),
          hostSocketId: room.hostSocketId,
          leftClientID: leaving?.clientID,
        });
      }
    });
  });
}
