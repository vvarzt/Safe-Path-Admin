import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Edit, Trash2, Ban, Eye } from "lucide-react";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";


type ApiUser = {
  id: string;
  email: string;
  fullName: string | null;
  createdAt: string;

  phone?: string | null;
  status?: string | null;
  trips?: number | null;
  address?: string | null;
  role?: string | null;

  // ✅ เพิ่ม
  birthDate?: string | null;
  gender?: string | null;
  idCard?: string | null;
  occupation?: string | null;
};
type AnyUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "suspended";
  trips: number;
  address?: string;
  role?: "user" | "caregiver" | "admin";
  createdAt?: string;

  // ✅ เพิ่มตรงนี้
  birthDate?: string;
  gender?: string;
  idCard?: string;
  occupation?: string;
};

export default function Users() {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<AnyUser | null>(null);
  const [edit, setEdit] = useState<AnyUser | null>(null);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const { toast } = useToast();
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"suspend" | "delete" | null>(null);
  const [pendingUser, setPendingUser] = useState<AnyUser | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newfullName, setNewfullName] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<ApiUser[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "users"));

      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data();

        return {
          id: docSnap.id,
          email: data.email ?? "",
          fullName: data.fullName ?? null,
          phone: data.phone ?? null,
          status: data.status ?? "active",
          trips: data.trips ?? 0,
          address: data.address ?? null,
          role: data.role ?? "user",
          createdAt: data.createdAt ?? null,

          // ✅ เพิ่มตรงนี้
          birthDate: data.birthDate ?? null,
          gender: data.gender ?? null,
          idCard: data.idCard ?? null,
          occupation: data.occupation ?? null,

        } as ApiUser;
      });
    },
  });

  const users: AnyUser[] = (data ?? []).map((u: any) => ({
    id: u.id,
    name: u.fullName ?? "-",        // ✅ ใช้ fullName
    email: u.email ?? "-",
    phone: u.phone ?? "-",
    status: u.status ?? "active",
    trips: u.trips ?? 0,                   // ถ้ายังไม่มี
    role: "user",
    address: u.address ?? "-",
    createdAt: u.createdAt,

    // เพิ่มข้อมูลพิเศษ
    birthDate: u.birthDate,
    gender: u.gender,
    idCard: u.idCard,
    occupation: u.occupation,
  }));

  const createUser = useMutation({
    mutationFn: async (payload: { email: string; fullName?: string }) => {
      const ref = doc(collection(db, "users"));
      const newUser = {
        email: payload.email,
        fullName: payload.fullName ?? null,
        phone: null,
        status: "active",
        trips: 0,
        role: "user",
        address: null,
        createdAt: new Date().toISOString(),
      };
      await setDoc(ref, newUser);
      return { id: ref.id, ...newUser } as ApiUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setNewEmail("");
      setNewfullName("");
      toast({ title: t("pages.users.toasts.created") });
    },
    onError: (e: any) => {
      toast({ title: t("pages.users.toasts.createFailed"), description: e?.response?.data?.error ?? String(e), variant: "destructive" });
    },
  });

  const filteredUsers = users.filter((user) => {
    const keyword = searchTerm.toLowerCase();

    return (
      user.name?.toLowerCase().includes(keyword) ||
      user.email?.toLowerCase().includes(keyword) ||
      user.phone?.toLowerCase().includes(keyword) ||
      user.address?.toLowerCase().includes(keyword) ||
      user.idCard?.toLowerCase().includes(keyword) ||
      user.occupation?.toLowerCase().includes(keyword)
    );
  });

  const updateUser = useMutation({
    mutationFn: async (user: AnyUser) => {
      const ref = doc(db, "users", user.id);

      await updateDoc(ref, {
        fullName: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address ?? "",
        birthDate: user.birthDate ?? "",
        gender: user.gender ?? "",
        idCard: user.idCard ?? "",
        occupation: user.occupation ?? "",
        status: user.status,
        role: user.role,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "อัปเดตข้อมูลสำเร็จ" });
    },
    onError: (e: any) => {
      toast({
        title: "อัปเดตล้มเหลว",
        description: String(e),
        variant: "destructive",
      });
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">{t("pages.users.title")}</h2>
          <p className="text-muted-foreground">{t("pages.users.subtitle")}</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("pages.users.allUsers")}</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("pages.users.searchPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && <div className="text-sm text-muted-foreground">{t("pages.users.loading")}</div>}
            {isError && <div className="text-sm text-destructive">{t("pages.users.loadError")}</div>}

            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-2">
              {/* <Input placeholder={t("pages.users.form.namePlaceholder")} value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Input type="email" placeholder={t("pages.users.form.emailPlaceholder")} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              <Button
                onClick={() => createUser.mutate({ email: newEmail, name: newName || undefined })}
                disabled={!newEmail || createUser.isPending}
              >
                {createUser.isPending ? t("pages.users.form.creating") : t("pages.users.form.addUser")}
              </Button> */}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("pages.users.table.name")}</TableHead>
                  <TableHead>{t("pages.users.table.email")}</TableHead>
                  <TableHead>{t("pages.users.table.phone")}</TableHead>
                  <TableHead>{t("pages.users.table.trips")}</TableHead>
                  <TableHead>{t("pages.users.table.status")}</TableHead>
                  <TableHead className="text-right">{t("pages.users.table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>{user.trips}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === "active" ? "success" : "destructive"}>
                        {t(`pages.users.status.${user.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelected(user);
                            setEdit(null);
                            setMode("view");
                            setOpen(true);
                          }}
                          aria-label={t("pages.users.actions.view")}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelected(user);
                            setEdit({ ...user });
                            setMode("edit");
                            setOpen(true);
                          }}
                          aria-label={t("pages.users.actions.edit")}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setPendingUser(user);
                            setConfirmAction("suspend");
                            setConfirmOpen(true);
                          }}
                          aria-label={t("pages.users.actions.suspend")}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setPendingUser(user);
                            setConfirmAction("delete");
                            setConfirmOpen(true);
                          }}
                          aria-label={t("pages.users.actions.delete")}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setSelected(null); setEdit(null); setMode("view"); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{mode === "edit" ? t("pages.users.dialog.editTitle") : t("pages.users.dialog.viewTitle")}</DialogTitle>
              <DialogDescription>{selected?.email}</DialogDescription>
            </DialogHeader>
            {mode === "edit" && edit && (
              <div className="grid gap-4 text-sm">
                <div className="grid gap-2">
                  <div className="text-muted-foreground">{t("pages.users.dialog.fields.name")}</div>
                  <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <div className="text-muted-foreground">{t("pages.users.dialog.fields.email")}</div>
                  <Input type="email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <div className="text-muted-foreground">{t("pages.users.dialog.fields.phone")}</div>
                  <Input value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <div className="text-muted-foreground">{t("pages.users.dialog.fields.status")}</div>
                    <Select value={edit.status} onValueChange={(v) => setEdit({ ...edit, status: v as AnyUser["status"] })}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("pages.users.dialog.fields.status")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">{t("pages.users.status.active")}</SelectItem>
                        <SelectItem value="suspended">{t("pages.users.status.suspended")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <div className="text-muted-foreground">{t("pages.users.dialog.fields.role")}</div>
                    <Select value={edit.role ?? "user"} onValueChange={(v) => setEdit({ ...edit, role: v as AnyUser["role"] })}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("pages.users.dialog.fields.role")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">{t("pages.users.roles.user")}</SelectItem>
                        <SelectItem value="caregiver">{t("pages.users.roles.caregiver")}</SelectItem>
                        <SelectItem value="admin">{t("pages.users.roles.admin")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <div className="text-muted-foreground">{t("pages.users.dialog.fields.address")}</div>
                  <Input value={edit.address ?? ""} onChange={(e) => setEdit({ ...edit, address: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <div className="text-muted-foreground">{t("pages.users.dialog.fields.trips")}</div>
                  <Input type="number" value={String(edit.trips)} onChange={(e) => setEdit({ ...edit, trips: Number(e.target.value || 0) })} />
                </div>
              </div>
            )}
            {mode === "view" && selected && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">

                <div>
                  <div className="text-muted-foreground">{t("pages.users.dialog.fields.name")}</div>
                  <div className="font-medium">{selected.name}</div>
                </div>

                <div>
                  <div className="text-muted-foreground">{t("pages.users.dialog.fields.email")}</div>
                  <div className="font-medium">{selected.email}</div>
                </div>

                <div>
                  <div className="text-muted-foreground">{t("pages.users.dialog.fields.phone")}</div>
                  <div className="font-medium">{selected.phone}</div>
                </div>

                <div>
                  <div className="text-muted-foreground">{t("pages.users.dialog.fields.idCard")}</div>
                  <div className="font-medium">{selected.idCard || "-"}</div>
                </div>

                <div>
                  <div className="text-muted-foreground">{t("pages.users.dialog.fields.gender")}</div>
                  <div className="font-medium">{selected.gender || "-"}</div>
                </div>

                <div>
                  <div className="text-muted-foreground">{t("pages.users.dialog.fields.birthDate")}</div>
                  <div className="font-medium">{selected.birthDate || "-"}</div>
                </div>

                <div>
                  <div className="text-muted-foreground">{t("pages.users.dialog.fields.occupation")}</div>
                  <div className="font-medium">{selected.occupation || "-"}</div>
                </div>

                <div>
                  <div className="text-muted-foreground">{t("pages.users.dialog.fields.address")}</div>
                  <div className="font-medium">{selected.address || "-"}</div>
                </div>

                <div className="md:col-span-2">
                  <div className="text-muted-foreground">{t("pages.users.dialog.fields.createdAt")}</div>
                  <div className="font-medium">
                    {selected.createdAt
                      ? new Date(selected.createdAt).toLocaleString()
                      : "-"}
                  </div>
                </div>

              </div>
            )}
            <DialogFooter>
              <div className="flex w-full justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>{t("pages.users.dialog.close")}</Button>
                {mode === "edit" && (
                  <Button
                    onClick={() => {
                      if (!edit) return;
                      updateUser.mutate(edit);   // 🔥 ยิงไป Firestore
                      setSelected(edit);
                      setOpen(false);
                    }}
                  >
                    {t("pages.users.dialog.save")}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={confirmOpen} onOpenChange={(o) => { setConfirmOpen(o); if (!o) { setPendingUser(null); setConfirmAction(null); } }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmAction === "delete" ? t("pages.users.confirm.deleteTitle") : t("pages.users.confirm.suspendTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {pendingUser
                  ? confirmAction === "delete"
                    ? t("pages.users.confirm.deleteDesc", { name: pendingUser.name })
                    : t("pages.users.confirm.suspendDesc", { name: pendingUser.name })
                  : null}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmOpen(false)}>{t("pages.users.confirm.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (!pendingUser || !confirmAction) return;
                  try {
                    if (confirmAction === "suspend") {
                      const next = pendingUser.status === "active" ? "suspended" : "active";
                      await updateDoc(doc(db, "users", pendingUser.id), { status: next });
                      toast({ title: t("pages.users.dialog.suspendToast"), description: `${pendingUser.name}` });
                    } else if (confirmAction === "delete") {
                      await deleteDoc(doc(db, "users", pendingUser.id));
                      toast({ title: t("pages.users.dialog.deleteToast"), description: `${pendingUser.name}`, variant: "destructive" });
                    }
                    queryClient.invalidateQueries({ queryKey: ["users"] });
                  } catch (e: any) {
                    toast({ title: t("pages.users.toasts.actionFailed"), description: e?.response?.data?.error ?? String(e), variant: "destructive" });
                  } finally {
                    setConfirmOpen(false);
                    setPendingUser(null);
                    setConfirmAction(null);
                  }
                }}
              >
                {t("pages.users.confirm.confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
