import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import { requirementsService } from "@/services/mockService";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { History } from "lucide-react";

type Role = "admin" | "user" | "caregiver";
type RequirementKind = "input" | "file" | "heading";

interface Requirement {
  id: string;
  role: Role;
  name: string;
  kind: RequirementKind;
  description?: string | null;
  required: boolean;
  createdAt: string;
}

export default function Settings() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [role, setRole] = useState<Role>("user");
  const { data, isLoading, isError } = useQuery<Requirement[]>({
    queryKey: ["requirements", role],
    queryFn: async () => {
      // Mock data for UI development
      const mockRequirements = [
        {
          id: "1",
          role: "user" as Role,
          name: "ID Card",
          kind: "file" as RequirementKind,
          description: "Upload your ID card photo",
          required: true,
          createdAt: "2024-01-01T00:00:00Z"
        },
        {
          id: "2",
          role: "caregiver" as Role,
          name: "caregiver License",
          kind: "file" as RequirementKind,
          description: "Upload your caregiver license",
          required: true,
          createdAt: "2024-01-01T00:00:00Z"
        },
        {
          id: "3",
          role: "caregiver" as Role,
          name: "Vehicle Registration",
          kind: "file" as RequirementKind,
          description: "Upload vehicle registration document",
          required: true,
          createdAt: "2024-01-01T00:00:00Z"
        }
      ];
      return mockRequirements.filter(r => r.role === role);
    },
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [required, setRequired] = useState(true);
  const [kind, setKind] = useState<RequirementKind>("input");

  const createRequirement = useMutation({
    mutationFn: async () => {
      // Mock create - just return success
      return { id: Date.now().toString() };
    },
    onSuccess: () => {
      setName("");
      setDescription("");
      setRequired(true);
      setKind("input");
      queryClient.invalidateQueries({ queryKey: ["requirements", role] });
    },
  });

  const deleteRequirement = useMutation({
    mutationFn: async (id: string) => {
      // Mock delete - just return success
      return { success: true };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["requirements", role] }),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">{t("pages.settings.title")}</h2>
            <p className="text-muted-foreground">{t("pages.settings.subtitle")}</p>
          </div>
          <Link to="/settings/history">
            <Button variant="outline" size="sm" className="inline-flex items-center gap-2">
              <History className="h-4 w-4" />
              {t("pages.settingsHistory.viewAll")}
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("pages.settings.requirements.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
              <div className="md:col-span-2">
                <Label htmlFor="sel-role">{t("pages.settings.requirements.role")}</Label>
                <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                  <SelectTrigger id="sel-role">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{t("pages.createAccount.roles.admin")}</SelectItem>
                    <SelectItem value="user">{t("pages.createAccount.roles.user")}</SelectItem>
                    <SelectItem value="caregiver">{t("pages.createAccount.roles.caregiver")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="req-kind">{t("pages.settings.requirements.kind")}</Label>
                <Select value={kind} onValueChange={(v) => setKind(v as RequirementKind)}>
                  <SelectTrigger id="req-kind">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="input">{t("pages.settings.requirements.kindInput")}</SelectItem>
                    <SelectItem value="file">{t("pages.settings.requirements.kindFile")}</SelectItem>
                    <SelectItem value="heading">{t("pages.settings.requirements.kindHeading")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="req-name">{t("pages.settings.requirements.name")}</Label>
                <Input id="req-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. National ID / Full Name" />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="req-required" checked={required} onCheckedChange={(v) => setRequired(Boolean(v))} />
                <Label htmlFor="req-required">{t("pages.settings.requirements.required")}</Label>
              </div>
              <div>
                <Label htmlFor="req-desc">{t("pages.settings.requirements.description")}</Label>
                <Input id="req-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="" />
              </div>
              <div>
                <Button onClick={() => createRequirement.mutate()} disabled={!name.trim() || createRequirement.isPending}>{t("pages.settings.requirements.add")}</Button>
              </div>
            </div>

            <div>
              {isLoading && <div className="text-sm text-muted-foreground">{t("pages.settings.requirements.loading")}</div>}
              {isError && <div className="text-sm text-destructive">{t("pages.settings.requirements.loadError")}</div>}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("pages.settings.requirements.name")}</TableHead>
                    <TableHead>{t("pages.settings.requirements.kind")}</TableHead>
                    <TableHead>{t("pages.settings.requirements.required")}</TableHead>
                    <TableHead>{t("pages.settings.requirements.description")}</TableHead>
                    <TableHead className="text-right">{t("pages.settings.requirements.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data ?? []).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="capitalize">{r.kind}</TableCell>
                      <TableCell>{r.required ? t("pages.settings.requirements.yes") : t("pages.settings.requirements.no")}</TableCell>
                      <TableCell>{r.description}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">{t("pages.settings.requirements.delete")}</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t("pages.settings.requirements.confirmDelete")}</AlertDialogTitle>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t("pages.settings.requirements.cancel")}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteRequirement.mutate(r.id)}>{t("pages.settings.requirements.delete")}</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
