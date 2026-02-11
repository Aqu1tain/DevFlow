import { useEffect, useState } from "react";
import { snapshotsApi, type Snapshot, type Snippet } from "../services/api";

export default function useSnapshots(snippetId: string | undefined) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!snippetId) return;
    snapshotsApi
      .getAll(snippetId)
      .then(setSnapshots)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [snippetId]);

  const createSnapshot = async (name: string) => {
    if (!snippetId) return;
    const snapshot = await snapshotsApi.create(snippetId, name);
    setSnapshots((prev) => [snapshot, ...prev]);
  };

  const deleteSnapshot = async (snapshotId: string) => {
    if (!snippetId) return;
    await snapshotsApi.delete(snippetId, snapshotId);
    setSnapshots((prev) => prev.filter((s) => s._id !== snapshotId));
  };

  const restoreSnapshot = async (snapshotId: string): Promise<Snippet | undefined> => {
    if (!snippetId) return;
    return snapshotsApi.restore(snippetId, snapshotId);
  };

  return { snapshots, loading, createSnapshot, deleteSnapshot, restoreSnapshot };
}
