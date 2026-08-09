import { WorkspaceApp } from "@/components/WorkspaceApp";
import { queryNotes } from "@/lib/duck";
import { storageBackend } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function Home() {
  let notes: Record<string, unknown>[] = [];
  let backend = storageBackend();
  let initialError: string | null = null;

  try {
    notes = await queryNotes();
    backend = storageBackend();
  } catch (err) {
    initialError = err instanceof Error ? err.message : "Failed to load";
  }

  return (
    <WorkspaceApp
      initialNotes={notes}
      initialBackend={backend}
      initialError={initialError}
    />
  );
}
