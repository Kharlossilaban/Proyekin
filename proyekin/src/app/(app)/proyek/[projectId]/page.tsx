import { ProjectProbe } from "@/components/spike/entity-probe";
import { MOCK_PROJECTS } from "@/data/mock";

export const metadata = { title: "Detail Proyek — Proyekin" };

// ID seed diprerender saat build. ID lain (mis. dibuat saat runtime di memori klien) dirender saat diminta;
// `dynamicParams` tidak tersedia bersama cacheComponents, jadi ID tidak dikenal ditangani di komponen klien.
export function generateStaticParams() {
  return MOCK_PROJECTS.map((project) => ({ projectId: project.id }));
}

export default async function ProyekDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <ProjectProbe projectId={projectId} />;
}
