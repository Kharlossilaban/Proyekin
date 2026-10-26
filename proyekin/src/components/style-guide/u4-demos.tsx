"use client";

// Demonstrasi komponen bersama U4-2 di /style-guide. Semua data adalah contoh/seed; tidak ada alur bisnis,
// tidak ada penyimpanan, dan tidak ada pemanggilan access.ts atau routing.

import * as React from "react";
import { FolderKanban, ListChecks, Timer, Users } from "lucide-react";

import { TaskCard } from "@/components/tasks/task-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DeadlineBadge } from "@/components/ui/deadline-badge";
import { DemoDataNotice } from "@/components/ui/demo-data-notice";
import { Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { RadioCardGroup } from "@/components/ui/radio-card-group";
import { RecordCard, RecordCardList } from "@/components/ui/record-card";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { MOCK_PROJECTS, MOCK_TASKS } from "@/data/mock";
import { DEMO_REFERENCE_DATE } from "@/lib/demo-date";
import { TASK_STATUS_LABELS } from "@/lib/labels";
import { TYPOGRAPHY } from "@/lib/tokens";
import type { TaskStatus } from "@/types";

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

function DemoColumn({ title, children, ...props }: { title: string; children: React.ReactNode } & React.ComponentProps<"div">) {
  return (
    <div className="flex min-w-0 flex-col gap-4" {...props}>
      <h3 className={TYPOGRAPHY.h3}>{title}</h3>
      {children}
    </div>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

/** Kontrol ukuran default (U1, tidak berubah) berdampingan dengan ukuran `touch` (44px, font 16px). */
export function TouchControlsDemo() {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <DemoColumn title="Default (ukuran U1, tidak berubah)" data-demo="default">
        <Field id="tc-d-input" label="Input">
          <Input id="tc-d-input" placeholder="Teks contoh" />
        </Field>
        <Field id="tc-d-select" label="Select">
          <Select id="tc-d-select" defaultValue="b">
            <option value="a">Pilihan A</option>
            <option value="b">Pilihan B</option>
            <option value="c">Pilihan C</option>
          </Select>
        </Field>
        <Field id="tc-d-textarea" label="Textarea">
          <Textarea id="tc-d-textarea" placeholder="Catatan contoh" />
        </Field>
        <div>
          <Button>Tombol md</Button>
        </div>
      </DemoColumn>

      <DemoColumn title="Touch (alur mobile)" data-demo="touch">
        <Field id="tc-t-input" label="Input touch">
          <Input id="tc-t-input" size="touch" placeholder="Teks contoh" />
        </Field>
        <Field id="tc-t-select" label="Select touch">
          <Select id="tc-t-select" size="touch" defaultValue="b">
            <option value="a">Pilihan A</option>
            <option value="b">Pilihan B</option>
            <option value="c">Pilihan C</option>
          </Select>
        </Field>
        <Field id="tc-t-textarea" label="Textarea touch">
          <Textarea id="tc-t-textarea" size="touch" placeholder="Catatan contoh" />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button size="touch">Tombol touch</Button>
          <Button size="touch" variant="outline">
            Sekunder
          </Button>
        </div>
      </DemoColumn>
    </div>
  );
}

const TAB_ITEMS = [
  ["ringkasan", "Ringkasan"],
  ["tugas", "Tugas"],
  ["tim", "Tim"],
  ["contoh-4", "Contoh tab keempat"],
  ["contoh-5", "Contoh tab kelima"],
  ["contoh-6", "Contoh tab keenam"],
] as const;

export function TabsDemo() {
  return (
    <Tabs defaultValue="ringkasan" data-demo="tabs">
      <TabsList aria-label="Contoh tab">
        {TAB_ITEMS.map(([value, label]) => (
          <TabsTab key={value} value={value}>
            {label}
          </TabsTab>
        ))}
      </TabsList>
      {TAB_ITEMS.map(([value, label]) => (
        <TabsPanel key={value} value={value}>
          <p className={TYPOGRAPHY.body}>Isi panel &quot;{label}&quot; (contoh).</p>
        </TabsPanel>
      ))}
    </Tabs>
  );
}

export function ProgressDemo() {
  return (
    <div className="flex max-w-md flex-col gap-4">
      <ProgressBar value={0} label="Progres contoh 0 persen" />
      <ProgressBar value={45} label="Progres contoh 45 persen" />
      <ProgressBar value={100} label="Progres contoh 100 persen" />
      <ProgressBar value={60} label="Progres contoh tanpa angka" showValue={false} />
      <p className={TYPOGRAPHY.caption}>Display-only: tidak interaktif dan tidak menghitung apa pun. Nilai dibatasi 0–100.</p>
    </div>
  );
}

export function ConfirmDemo() {
  const [result, setResult] = React.useState("Belum ada aksi.");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <ConfirmDialog
          trigger={<Button variant="destructive" size="touch" data-demo="confirm-destructive">Hapus item contoh</Button>}
          title="Hapus item contoh?"
          description="Ini hanya contoh tampilan. Tidak ada data yang dihapus. Aksi destruktif harus menjelaskan dampaknya sebelum dikonfirmasi."
          confirmLabel="Ya, hapus item contoh"
          onConfirm={async () => {
            await sleep(1200);
            setResult("Penghapusan contoh dikonfirmasi (simulasi). Tidak ada data yang berubah.");
          }}
        >
          <ul role="list" className="list-disc pl-5 text-sm text-graphite">
            <li>Contoh dampak pertama.</li>
            <li>Contoh dampak kedua.</li>
          </ul>
        </ConfirmDialog>

        <ConfirmDialog
          trigger={<Button variant="outline" size="touch" data-demo="confirm-neutral">Kirim contoh</Button>}
          title="Kirim contoh sekarang?"
          description="Ini hanya contoh tampilan. Tidak ada yang dikirim."
          confirmLabel="Ya, kirim contoh"
          destructive={false}
          onConfirm={async () => {
            await sleep(600);
            setResult("Pengiriman contoh dikonfirmasi (simulasi). Tidak ada data yang berubah.");
          }}
        />
      </div>
      <p role="status" data-demo="confirm-result" className="text-sm text-graphite">
        {result}
      </p>
    </div>
  );
}

const DEADLINE_SAMPLES = [
  { label: "Terlambat", task: { status: "IN_PROGRESS" as const, dueDate: "2026-02-28" } },
  { label: "Jatuh tempo hari ini", task: { status: "TODO" as const, dueDate: DEMO_REFERENCE_DATE } },
  { label: "Mendatang", task: { status: "TODO" as const, dueDate: "2026-04-10" } },
  { label: "Selesai", task: { status: "DONE" as const, dueDate: "2026-02-15" } },
  { label: "Tanpa tenggat", task: { status: "TODO" as const, dueDate: undefined } },
];

export function PagePatternsDemo() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        as="h3"
        eyebrow="PRJ-000"
        title="Judul halaman contoh"
        description="Deskripsi singkat halaman. Bertumpuk di mobile, sejajar di desktop."
        actions={
          <>
            <Button variant="outline">Aksi sekunder</Button>
            <Button>Aksi utama</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<FolderKanban />} label="Proyek Aktif" value={3} description="dari 5 proyek" />
        <StatCard icon={<ListChecks />} label="Tugas Tertunda" value={5} />
        <StatCard icon={<Timer />} label="Tugas Terlambat" value={2} tone="danger" description="terhadap tanggal acuan demo" />
        <StatCard icon={<Users />} label="Anggota Tim" value={5} />
      </div>

      <DemoDataNotice showDeadlineReference />

      <div className="flex flex-col gap-3">
        <h3 className={TYPOGRAPHY.h3}>Lencana tenggat (acuan demo)</h3>
        <ul role="list" className="flex flex-col gap-2" data-demo="deadline-samples">
          {DEADLINE_SAMPLES.map((sample) => (
            <li key={sample.label} className="flex flex-wrap items-center gap-3 text-sm text-graphite">
              <span className="w-44 shrink-0">{sample.label}</span>
              <DeadlineBadge task={sample.task} showDate showAll />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Dokumentasi RecordCard (kartu data label-nilai, presentasi saja) dan RecordCardList.
 * Dipakai di Laporan, Dokumen, dan Anggota di bawah `lg`; tabel tampil mulai `lg`.
 */
export function RecordCardDemo() {
  return (
    <div className="flex flex-col gap-6" data-demo="record-cards">
      <dl className="grid max-w-3xl gap-x-4 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
        <dt className="font-medium text-foreground">Kapan dipakai</dt>
        <dd className="text-graphite">Daftar data yang di desktop berupa tabel. Di bawah breakpoint <code className="font-mono text-xs">lg</code> setiap baris menjadi satu kartu, sehingga tidak ada kolom yang tersembunyi.</dd>
        <dt className="font-medium text-foreground">Props</dt>
        <dd className="text-graphite">
          <code className="font-mono text-xs">title</code>, <code className="font-mono text-xs">fields</code> (label + nilai, label sama dengan header tabel),{" "}
          <code className="font-mono text-xs">titleAs</code> (default h3), <code className="font-mono text-xs">eyebrow</code> dan <code className="font-mono text-xs">leading</code> (opsional).
        </dd>
        <dt className="font-medium text-foreground">State</dt>
        <dd className="text-graphite">Satu state: tampilan. Tidak interaktif (tanpa tautan, aksi, atau hover). Bila nanti perlu tautan, pakai pola tautan teregang seperti kartu proyek atau TaskCard.</dd>
        <dt className="font-medium text-foreground">Aksesibilitas</dt>
        <dd className="text-graphite">Daftar berupa <code className="font-mono text-xs">ul[role=list]</code> bernama; setiap kartu satu <code className="font-mono text-xs">li</code> dengan judul dan <code className="font-mono text-xs">dl</code> semantik. Status tidak hanya warna (Badge memuat teks).</dd>
      </dl>

      {/* `lg:grid` menimpa `lg:hidden` bawaan RecordCardList agar contoh tetap terlihat di desktop. */}
      <RecordCardList label="Contoh kartu data" className="lg:grid lg:grid-cols-3">
        <RecordCard
          title="20 Februari 2026"
          fields={[
            { label: "Proyek", value: "PRJ-001" },
            { label: "Mandor", value: "Ahmad Rizal" },
            { label: "Pekerja", value: 12 },
            { label: "Status", value: <Badge variant="warning" dot>Terkirim</Badge> },
          ]}
        />
        <RecordCard
          title="Gambar Arsitektur Lantai 1-3"
          fields={[
            { label: "Kategori", value: <Badge variant="neutral">Gambar Teknis</Badge> },
            { label: "Diunggah", value: "20 Januari 2026" },
            { label: "Ukuran", value: "15.0 MB" },
          ]}
        />
        <RecordCard
          title="Budi Santoso"
          leading={
            <div aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              B
            </div>
          }
          fields={[
            { label: "Email", value: "budi@proyekin.id" },
            { label: "Role", value: <Badge variant="brand">Owner</Badge> },
          ]}
        />
      </RecordCardList>
    </div>
  );
}

const STATUS_OPTIONS = (["TODO", "IN_PROGRESS", "DONE"] as const).map((value) => ({ value, label: TASK_STATUS_LABELS[value] }));
const SAMPLE_TASK_IDS = ["t-002", "t-005", "t-006"];

export function MobilePatternsDemo() {
  const [status, setStatus] = React.useState<TaskStatus>("IN_PROGRESS");
  const tasks = MOCK_TASKS.filter((task) => SAMPLE_TASK_IDS.includes(task.id));

  return (
    <div className="grid gap-8 md:grid-cols-2" data-demo="mobile-patterns">
      <DemoColumn title="Grup radio status tugas" data-demo="radio-pattern">
        <RadioCardGroup legend="Status tugas (contoh)" name="demo-status-tugas" options={STATUS_OPTIONS} value={status} onValueChange={setStatus} />
        <p role="status" data-demo="radio-result" className="text-sm text-graphite">
          Status terpilih (contoh): {TASK_STATUS_LABELS[status]}. Tidak ada data yang disimpan.
        </p>
      </DemoColumn>

      <DemoColumn title="Kartu tugas satu kolom" data-demo="task-cards">
        <ul role="list" className="flex flex-col gap-3" data-demo="task-card-list">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskCard
                task={task}
                titleAs="h4"
                href="#pola-mobile"
                projectLabel={(() => {
                  const project = MOCK_PROJECTS.find((p) => p.id === task.projectId);
                  return project ? `${project.code} · ${project.name}` : undefined;
                })()}
                assigneeName={task.assigneeName}
              />
            </li>
          ))}
        </ul>
        <DemoDataNotice showDeadlineReference />
      </DemoColumn>
    </div>
  );
}
