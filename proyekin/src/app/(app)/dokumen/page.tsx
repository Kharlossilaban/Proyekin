import { Files } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { RecordCard, RecordCardList } from "@/components/ui/record-card";
import { MOCK_DOCUMENTS } from "@/data/mock";
import { fileBytesToSize, formatDate } from "@/lib/utils";

export const metadata = { title: "Dokumen — Proyekin" };

const CATEGORY_LABEL: Record<string, string> = {
  GAMBAR_TEKNIS: "Gambar Teknis",
  RENCANA_KERJA: "Rencana Kerja",
  KONTRAK: "Kontrak",
  "SURAT menyurat": "Surat Menyurat",
  LAINNYA: "Lainnya",
};

export default function DokumenPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-charcoal">
          Dokumen
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Repositori dokumen proyek.
          <span className="ml-1 text-xs text-warning">(Data demo)</span>
        </p>
      </div>

      {/* Di bawah lg: kartu (semua kolom tabel tampil sebagai pasangan label-nilai). */}
      <section aria-labelledby="dokumen-kartu" data-slot="records-mobile" className="flex min-w-0 flex-col gap-4 lg:hidden">
        <div className="flex flex-col gap-1">
          <h2 id="dokumen-kartu" className="text-base font-semibold text-foreground">
            Semua Dokumen
          </h2>
          <p className="text-sm text-muted-foreground">{MOCK_DOCUMENTS.length} dokumen</p>
        </div>
        {MOCK_DOCUMENTS.length === 0 ? (
          <EmptyState
            icon={<Files />}
            title="Belum ada dokumen"
            description="Dokumen proyek akan muncul di sini."
          />
        ) : (
          <RecordCardList label="Daftar dokumen">
            {MOCK_DOCUMENTS.map((d) => (
              <RecordCard
                key={d.id}
                data-record-id={d.id}
                title={d.name}
                fields={[
                  { label: "Kategori", value: <Badge variant="neutral">{CATEGORY_LABEL[d.category] ?? d.category}</Badge> },
                  { label: "Diunggah", value: formatDate(d.uploadedAt) },
                  { label: "Ukuran", value: fileBytesToSize(d.size) },
                ]}
              />
            ))}
          </RecordCardList>
        )}
      </section>

      {/* Mulai lg: tabel. */}
      <Card data-slot="records-desktop" className="hidden lg:flex">
        <CardHeader>
          <CardTitle as="h2">Semua Dokumen</CardTitle>
          <CardDescription>{MOCK_DOCUMENTS.length} dokumen</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {MOCK_DOCUMENTS.length === 0 ? (
            <EmptyState
              icon={<Files />}
              title="Belum ada dokumen"
              description="Dokumen proyek akan muncul di sini."
            />
          ) : (
            <Table label="Daftar dokumen">
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Diunggah</TableHead>
                  <TableHead align="right">Ukuran</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_DOCUMENTS.map((d) => (
                  <TableRow key={d.id} data-record-id={d.id}>
                    <TableCell className="font-medium text-foreground">
                      {d.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">
                        {CATEGORY_LABEL[d.category] ?? d.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(d.uploadedAt)}
                    </TableCell>
                    <TableCell align="right" className="whitespace-nowrap">
                      {fileBytesToSize(d.size)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
