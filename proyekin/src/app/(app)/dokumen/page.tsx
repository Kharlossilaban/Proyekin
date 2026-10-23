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

      <Card>
        <CardHeader>
          <CardTitle>Semua Dokumen</CardTitle>
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
                  <TableRow key={d.id}>
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
