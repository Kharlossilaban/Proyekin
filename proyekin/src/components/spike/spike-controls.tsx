"use client";

// SPIKE U4-0 — kontrol uji: membuat entitas di memori klien lalu membukanya lewat navigasi klien.

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createProject, createTask } from "@/lib/mock-store";

// Data uji minimal untuk membuktikan ID runtime (bukan form/CRUD final).
const createSpikeProject = () =>
  createProject({
    name: "Proyek uji runtime",
    description: "Dibuat di memori klien untuk menguji route dinamis (spike U4-0).",
    status: "DRAFT",
    startDate: "2026-03-21",
    endDate: "2026-03-21",
    budget: 0,
    progress: 0,
    client: "(uji)",
    location: "(uji)",
  });

const createSpikeTask = () =>
  createTask({
    projectId: "p-001",
    title: "Tugas uji runtime",
    status: "TODO",
    priority: "LOW",
    progress: 0,
  });

const SEED_LINKS = [
  { href: "/proyek/p-001", label: "Proyek seed p-001" },
  { href: "/tugas/t-001", label: "Tugas seed t-001" },
  { href: "/proyek/p-999", label: "Proyek ID tidak dikenal p-999" },
  { href: "/tugas/t-999", label: "Tugas ID tidak dikenal t-999" },
  { href: "/proyek/abc", label: "Proyek ID tidak lazim abc" },
  { href: "/u4-spike/guard-gating", label: "Guard A (menahan), hanya Owner/Admin" },
  { href: "/u4-spike/guard-hidden", label: "Guard B (menyembunyikan), hanya Owner/Admin" },
];

function SpikeControls() {
  const router = useRouter();
  const [created, setCreated] = React.useState<string[]>([]);

  const open = (href: string, via: "router" | "link") => {
    setCreated((list) => [...list, href]);
    if (via === "router") router.push(href);
  };

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="spike-create" className="flex flex-col gap-3">
        <h2 id="spike-create" className="text-base font-semibold text-charcoal">
          Buat ID runtime (memori klien)
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button data-spike-action="create-project-push" onClick={() => open(`/proyek/${createSpikeProject().id}`, "router")}>
            Buat proyek uji dan buka (router.push)
          </Button>
          <Button data-spike-action="create-task-push" onClick={() => open(`/tugas/${createSpikeTask().id}`, "router")}>
            Buat tugas uji dan buka (router.push)
          </Button>
          <Button variant="outline" data-spike-action="create-project-link" onClick={() => open(`/proyek/${createSpikeProject().id}`, "link")}>
            Buat proyek uji (buka lewat tautan)
          </Button>
        </div>
        {created.length ? (
          <ul role="list" className="flex flex-col gap-1 text-sm">
            {created.map((href) => (
              <li key={href}>
                <Link data-spike-created href={href} className="underline underline-offset-4">
                  {href}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section aria-labelledby="spike-links" className="flex flex-col gap-3">
        <h2 id="spike-links" className="text-base font-semibold text-charcoal">
          Tautan uji
        </h2>
        <ul role="list" className="flex flex-col gap-1 text-sm">
          {SEED_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="underline underline-offset-4">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export { SpikeControls };
