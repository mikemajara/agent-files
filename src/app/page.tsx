import { WorkspaceApp } from "@/components/WorkspaceApp";
import { listNotes } from "@/lib/notes";
import { storageBackend } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function Home() {
  let notes: Awaited<ReturnType<typeof listNotes>> = [];
  let backend = storageBackend();
  let initialError: string | null = null;

  try {
    notes = await listNotes();
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
