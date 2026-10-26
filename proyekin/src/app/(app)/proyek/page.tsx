import { ProjectList } from "@/components/projects/project-list";

export const metadata = { title: "Proyek — Proyekin" };

// Daftar dihitung di klien dari store mock + sesi demo (lingkup per role lewat getVisibleProjects, access.ts).
export default function ProyekPage() {
  return <ProjectList />;
}
