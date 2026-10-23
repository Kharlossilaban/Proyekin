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
import { MOCK_USERS } from "@/data/mock";
import { ROLE_LABELS } from "@/lib/navigation";
import type { Role } from "@/types";

export const metadata = { title: "Anggota — Proyekin" };

const ROLE_VARIANT: Record<Role, "brand" | "neutral" | "info" | "success"> = {
  OWNER: "brand",
  ADMIN: "info",
  MANDOR: "success",
  ANGGOTA: "neutral",
  GUEST: "neutral",
};

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

      <Card>
        <CardHeader>
          <CardTitle>Semua Anggota</CardTitle>
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
                <TableRow key={u.id}>
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
                    <Badge variant={ROLE_VARIANT[u.role]}>
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
