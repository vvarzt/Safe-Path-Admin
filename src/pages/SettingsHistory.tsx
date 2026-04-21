import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import api from "@/lib/api";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type Audit = {
  id: number;
  action: string;
  entity: string;
  entityId?: number | null;
  details?: any;
  adminId?: number | null;
  adminEmail?: string | null;
  createdAt: string;
};

export default function SettingsHistory() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery<Audit[]>({
    queryKey: ["settings-audit"],
    queryFn: async () => (await api.get("/settings/audit", { params: { limit: 200 } })).data,
  });

  const del = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/settings/audit/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings-audit"] }),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">{t("pages.settingsHistory.title")}</h2>
          <p className="text-muted-foreground">{t("pages.settingsHistory.subtitle")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("pages.settingsHistory.cardTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && <div className="text-sm text-muted-foreground">{t("pages.settingsHistory.loading")}</div>}
            {isError && <div className="text-sm text-destructive">{t("pages.settingsHistory.loadError")}</div>}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("pages.settingsHistory.table.action")}</TableHead>
                  <TableHead>{t("pages.settingsHistory.table.entity")}</TableHead>
                  <TableHead>{t("pages.settingsHistory.table.detail")}</TableHead>
                  <TableHead>{t("pages.settingsHistory.table.admin")}</TableHead>
                  <TableHead>{t("pages.settingsHistory.table.timestamp")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).map((a) => {
                  const dt = new Date(a.createdAt);
                  const formatted = `${dt.toLocaleDateString()} ${dt.toLocaleTimeString()}`;
                  const detail =
                    a.details?.name ? `${a.details.name}${a.details.role ? ` (${a.details.role})` : ""}` : a.entityId ?? "-";
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="capitalize">{a.action}</TableCell>
                      <TableCell className="capitalize">{a.entity}</TableCell>
                      <TableCell>{detail}</TableCell>
                      <TableCell>{a.adminEmail || a.adminId || t("pages.settingsHistory.unknown")}</TableCell>
                      <TableCell className="flex items-center justify-between gap-2">
                        <span>{formatted}</span>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">{t("pages.settings.riderDocs.delete")}</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t("pages.settings.riderDocs.confirmDelete")}</AlertDialogTitle>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t("pages.settings.riderDocs.cancel")}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => del.mutate(a.id)}>{t("pages.settings.riderDocs.delete")}</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
