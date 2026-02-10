import * as Y from "yjs";
import type { Socket } from "socket.io-client";
import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
} from "y-protocols/awareness";

export class YSocketProvider {
  doc: Y.Doc;
  awareness: Awareness;
  private socket: Socket;
  private updateHandler: (update: Uint8Array, origin: unknown) => void;
  private awarenessHandler: (changes: { added: number[]; updated: number[]; removed: number[] }) => void;

  constructor(doc: Y.Doc, socket: Socket, initialState: number[]) {
    this.doc = doc;
    this.socket = socket;
    this.awareness = new Awareness(doc);

    Y.applyUpdate(doc, new Uint8Array(initialState));

    this.updateHandler = (update, origin) => {
      if (origin === "remote") return;
      socket.emit("yjs-update", Array.from(update));
    };
    doc.on("update", this.updateHandler);

    socket.on("yjs-update", (update: number[]) => {
      Y.applyUpdate(doc, new Uint8Array(update), "remote");
    });

    this.awarenessHandler = ({ added, updated, removed }) => {
      const changed = added.concat(updated).concat(removed);
      const encoded = encodeAwarenessUpdate(this.awareness, changed);
      socket.emit("awareness-update", Array.from(encoded));
    };
    this.awareness.on("update", this.awarenessHandler);

    socket.on("awareness-update", (update: number[]) => {
      applyAwarenessUpdate(this.awareness, new Uint8Array(update), "remote");
    });
  }

  destroy() {
    this.doc.off("update", this.updateHandler);
    this.awareness.off("update", this.awarenessHandler);
    this.awareness.destroy();
  }
}
