import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input as TextInput } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/mockService";
import { useTranslation } from "react-i18next";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { getAuth, updatePassword } from "firebase/auth";

type ApiUser = {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  status?: string | null;
  address?: string | null;
  role: string;
  createdAt?: string;
};

export default function Admins() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ApiUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const { t } = useTranslation();

  const { data, isLoading, isError } = useQuery<ApiUser[]>({
    queryKey: ["admins"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "admin"));

      const loginEmail = localStorage.getItem("auth_email") || "-";

      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data();

        return {
          id: docSnap.id,
          email: loginEmail, // ✅ ดึงจาก login
          name: data.name ?? "-",
          phone: data.phone ?? "-",
          status: "active", // fix ไปเลย
          address: data.address ?? "-",
          role: data.role ?? "admin",
        } as ApiUser;
      });
    },
  });

  const filtered = (data || []).filter(u =>
    (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.phone || "").toLowerCase().includes(search.toLowerCase())
  );

  const updatePasswordHandler = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        alert("Not logged in");
        return;
      }

      if (!newPassword || newPassword.length < 8) {
        alert("Password must be at least 8 characters");
        return;
      }

      await updatePassword(user, newPassword);

      alert("Password updated successfully");
      setNewPassword("");
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">{t("pages.admins.title")}</h2>
            <p className="text-muted-foreground">{t("pages.admins.subtitle")}</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("pages.admins.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("pages.admins.cardTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && <div className="text-sm text-muted-foreground">{t("pages.admins.loading")}</div>}
            {isError && <div className="text-sm text-destructive">{t("pages.admins.loadError")}</div>}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("pages.admins.table.id")}</TableHead>
                  <TableHead>{t("pages.admins.table.name")}</TableHead>
                  <TableHead>{t("pages.admins.table.email")}</TableHead>
                  <TableHead>{t("pages.admins.table.phone")}</TableHead>
                  <TableHead>{t("pages.admins.table.status")}</TableHead>
                  {/* <TableHead>{t("pages.admins.table.created")}</TableHead> */}
                  <TableHead className="text-right">{t("pages.admins.table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.id}</TableCell>
                    <TableCell>{u.name || "-"}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.phone || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={u.status === "active" ? "success" : "secondary"}>{u.status ? t(`pages.admins.status.${u.status}`) : "-"}</Badge>
                    </TableCell>
                    {/* <TableCell>{u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}</TableCell> */}
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setSelected(u); setOpen(true); }}
                        aria-label={t("pages.admins.actions.view")}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setSelected(null); setNewPassword(""); setShowPw(false); } }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("pages.admins.dialog.detailsTitle")}</DialogTitle>
              <DialogDescription>{t("pages.admins.dialog.idLabel")}: {selected?.id}</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">{t("pages.admins.dialog.fields.name")}</div>
                <div className="font-medium">{selected?.name || "-"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">{t("pages.admins.dialog.fields.email")}</div>
                <div className="font-medium">{selected?.email}</div>
              </div>
              <div>
                <div className="text-muted-foreground">{t("pages.admins.dialog.fields.phone")}</div>
                <div className="font-medium">{selected?.phone || "-"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">{t("pages.admins.dialog.fields.status")}</div>
                <div><Badge variant={selected?.status === "active" ? "success" : "secondary"}>{selected?.status ? t(`pages.admins.status.${selected?.status}`) : "-"}</Badge></div>
              </div>
              <div className="col-span-2">
                <div className="text-muted-foreground">{t("pages.admins.dialog.fields.address")}</div>
                <div className="font-medium">{selected?.address || "-"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">{t("pages.admins.dialog.fields.role")}</div>
                <div className="font-medium">{t(`${selected?.role ?? 'admin'}`)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">{t("pages.admins.dialog.fields.created")}</div>
                <div className="font-medium">{selected?.createdAt ? new Date(selected.createdAt).toLocaleString() : "-"}</div>
              </div>
              <div className="col-span-2 mt-2">
                <div className="mb-2 font-semibold">{t("pages.admins.dialog.passwordTitle")}</div>
                <div className="text-xs text-muted-foreground mb-2">{t("pages.admins.dialog.passwordHint")}</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Label htmlFor="newPassword">{t("pages.admins.dialog.newPasswordLabel")}</Label>
                    <TextInput
                      id="newPassword"
                      type={showPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <Button variant="outline" onClick={() => setShowPw(v => !v)}>{showPw ? t("pages.admins.dialog.hide") : t("pages.admins.dialog.show")}</Button>
                  <Button onClick={updatePasswordHandler}>{t("pages.admins.dialog.update")}</Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
