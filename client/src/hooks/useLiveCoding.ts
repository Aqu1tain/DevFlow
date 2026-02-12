import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { encodeAwarenessUpdate, removeAwarenessStates } from "y-protocols/awareness";
import { getSocket, disconnectSocket } from "../services/socket";
import { YSocketProvider } from "../lib/YSocketProvider";
import { useAuth } from "../context/AuthContext";

type Mode = "public" | "visible";

interface RoomUser {
  socketId: string;
  userId: string;
  username: string;
}

interface RoomState {
  state: number[];
  mode: Mode;
  users: RoomUser[];
  hostSocketId: string;
}

export function useLiveCoding(snippetId: string | undefined) {
  const { user } = useAuth();
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [mode, setModeState] = useState<Mode>("public");
  const [hostSocketId, setHostSocketId] = useState<string | null>(null);
  const [isSynced, setIsSynced] = useState(false);

  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<YSocketProvider | null>(null);

  const socketId = useRef<string | null>(null);
  const isHost = hostSocketId !== null && socketId.current === hostSocketId;

  useEffect(() => {
    if (!snippetId) return;

    const doc = new Y.Doc();
    docRef.current = doc;
    const socket = getSocket();
    socketId.current = socket.id ?? null;

    const onConnect = () => {
      socketId.current = socket.id ?? null;
      if (providerRef.current) socket.emit("join-snippet", snippetId, doc.clientID);
    };

    const onSyncAwareness = () => {
      if (!providerRef.current) return;
      const update = encodeAwarenessUpdate(providerRef.current.awareness, [doc.clientID]);
      socket.emit("awareness-update", Array.from(update));
    };

    const onRoomState = (roomState: RoomState) => {
      if (!providerRef.current) {
        const provider = new YSocketProvider(doc, socket, roomState.state);
        providerRef.current = provider;
        if (user) {
          provider.awareness.setLocalStateField("user", {
            name: user.username,
            color: stringToColor(user.id),
          });
        }
      } else {
        Y.applyUpdate(doc, new Uint8Array(roomState.state));
      }
      setModeState(roomState.mode);
      setUsers(roomState.users);
      setHostSocketId(roomState.hostSocketId);
      setIsSynced(true);
    };

    const onUserJoined = ({ users }: { users: RoomUser[] }) => setUsers(users);

    const onUserLeft = ({ users, hostSocketId, leftClientID }: { users: RoomUser[]; hostSocketId: string; leftClientID?: number }) => {
      setUsers(users);
      setHostSocketId(hostSocketId);
      if (leftClientID != null && providerRef.current) {
        removeAwarenessStates(providerRef.current.awareness, [leftClientID], "peer left");
      }
    };

    const onModeChanged = (mode: Mode) => setModeState(mode);

    socket.on("connect", onConnect);
    socket.on("room-state", onRoomState);
    socket.on("user-joined", onUserJoined);
    socket.on("user-left", onUserLeft);
    socket.on("mode-changed", onModeChanged);
    socket.on("sync-awareness", onSyncAwareness);

    socket.emit("join-snippet", snippetId, doc.clientID);

    const leave = () => socket.emit("leave-snippet");
    window.addEventListener("beforeunload", leave);

    return () => {
      socket.off("connect", onConnect);
      socket.off("room-state", onRoomState);
      socket.off("user-joined", onUserJoined);
      socket.off("user-left", onUserLeft);
      socket.off("mode-changed", onModeChanged);
      socket.off("sync-awareness", onSyncAwareness);
      window.removeEventListener("beforeunload", leave);
      leave();
      providerRef.current?.destroy();
      providerRef.current = null;
      doc.destroy();
      docRef.current = null;
      disconnectSocket();
    };
  }, [snippetId, user]);

  const setMode = (mode: Mode) => {
    const socket = getSocket();
    socket.emit("set-mode", mode);
  };

  return { doc: docRef.current, provider: providerRef.current, users, mode, isHost, setMode, isSynced };
}

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  const s = 0.7, l = 0.6;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
