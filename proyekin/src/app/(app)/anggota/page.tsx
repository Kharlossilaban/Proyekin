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
import { RecordCard, RecordCardList } from "@/components/ui/record-card";
import { MOCK_USERS } from "@/data/mock";
import { ROLE_LABELS, ROLE_TONES } from "@/lib/labels";

export const metadata = { title: "Anggota — Proyekin" };

export default function AnggotaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-charcoal">
          Anggota
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manajemen anggota tim.
          <span className="ml-1 text-xs text-warning">(Data demo)</span>
        </p>
      </div>

      {/* Di bawah lg: kartu (semua kolom tabel tampil sebagai pasangan label-nilai). */}
      <section aria-labelledby="anggota-kartu" data-slot="records-mobile" className="flex min-w-0 flex-col gap-4 lg:hidden">
        <div className="flex flex-col gap-1">
          <h2 id="anggota-kartu" className="text-base font-semibold text-foreground">
            Semua Anggota
          </h2>
          <p className="text-sm text-muted-foreground">{MOCK_USERS.length} anggota</p>
        </div>
        <RecordCardList label="Daftar anggota tim">
          {MOCK_USERS.map((u) => (
            <RecordCard
              key={u.id}
              data-record-id={u.id}
              title={u.name}
              leading={
                <div
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
                >
                  {u.name.charAt(0)}
                </div>
              }
              fields={[
                { label: "Email", value: u.email },
                { label: "Role", value: <Badge variant={ROLE_TONES[u.role]}>{ROLE_LABELS[u.role]}</Badge> },
              ]}
            />
          ))}
        </RecordCardList>
      </section>

      {/* Mulai lg: tabel. */}
      <Card data-slot="records-desktop" className="hidden lg:flex">
        <CardHeader>
          <CardTitle as="h2">Semua Anggota</CardTitle>
          <CardDescription>{MOCK_USERS.length} anggota</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table label="Daftar anggota tim">
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_USERS.map((u) => (
                <TableRow key={u.id} data-record-id={u.id}>
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                        {u.name.charAt(0)}
                      </div>
                      {u.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ROLE_TONES[u.role]}>
                      {ROLE_LABELS[u.role]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
