import { TaskProbe } from "@/components/spike/entity-probe";
import { MOCK_TASKS } from "@/data/mock";

export const metadata = { title: "Detail Tugas — Proyekin" };

// Lihat catatan di proyek/[projectId]/page.tsx.
export function generateStaticParams() {
  return MOCK_TASKS.map((task) => ({ taskId: task.id }));
}

export default async function TugasDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  return <TaskProbe taskId={taskId} />;
}
