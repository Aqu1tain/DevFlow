import { useEffect, useState } from "react";
import { snapshotsApi, type Snapshot, type Snippet } from "../services/api";

export default function useSnapshots(snippetId: string | undefined) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!snippetId) return;
    snapshotsApi
      .getAll(snippetId)
      .then(setSnapshots)
      .catch(() => setError("Failed to load snapshots"))
      .finally(() => setLoading(false));
  }, [snippetId]);

  const createSnapshot = async (name: string) => {
    if (!snippetId) return;
    try {
      const snapshot = await snapshotsApi.create(snippetId, name);
      setSnapshots((prev) => [snapshot, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create snapshot");
      throw err;
    }
  };

  const deleteSnapshot = async (snapshotId: string) => {
    if (!snippetId) return;
    try {
      await snapshotsApi.delete(snippetId, snapshotId);
      setSnapshots((prev) => prev.filter((s) => s._id !== snapshotId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete snapshot");
      throw err;
    }
  };

  const restoreSnapshot = async (snapshotId: string): Promise<Snippet | undefined> => {
    if (!snippetId) return;
    try {
      return await snapshotsApi.restore(snippetId, snapshotId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore snapshot");
      throw err;
    }
  };

  return { snapshots, loading, error, createSnapshot, deleteSnapshot, restoreSnapshot };
}
