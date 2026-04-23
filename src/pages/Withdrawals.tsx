import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebase"; // ✅ ปรับ path ตาม project
import { useAuth } from "@/services/authStore"; // ✅ ปรับตาม project

export default function Withdrawals() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();

  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // ✅ Real-time listener
  useEffect(() => {
    const q = query(
      collection(db, "withdrawals"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setWithdrawals(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ✅ Filter
  const filtered = withdrawals.filter((w) => {
    const keyword = search.toLowerCase();
    return (
      w.caregiverName?.toLowerCase().includes(keyword) ||
      w.accountNumber?.includes(keyword) ||
      w.withdrawId?.toLowerCase().includes(keyword)
    );
  });

  // ✅ Stats
  const pendingCount = withdrawals.filter((w) => w.status === "pending").length;
  const approvedCount = withdrawals.filter((w) => w.status === "approved").length;
  const totalAmount = withdrawals
    .filter((w) => w.status === "approved")
    .reduce((sum, w) => sum + (w.amount || 0), 0);

  // ✅ อนุมัติ
  const handleApprove = async (w: any) => {
    setProcessing(true);
    try {
      const now = new Date().toISOString();

      // 1. อัปเดต withdrawal
      await updateDoc(doc(db, "withdrawals", w.id), {
        status: "approved",
        approvedAt: now,
        approvedBy: user?.uid || "admin",
      });

      // 2. ลด balance ใน caregivers
      const caregiverRef = doc(db, "caregivers", w.caregiverId);
      // ดึง balance ปัจจุบันแล้วลบออก
      await updateDoc(caregiverRef, {
        balance: (w.balanceAtRequest || 0) - w.amount,
        lastWithdrawAt: now,
        lastWithdrawAmount: w.amount,
      });

      toast({ title: t("pages.withdrawals.toast.approved") });
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast({
        title: t("pages.withdrawals.toast.failed"),
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  // ✅ ปฏิเสธ
  const handleReject = async (w: any) => {
    setProcessing(true);
    try {
      await updateDoc(doc(db, "withdrawals", w.id), {
        status: "rejected",
        approvedAt: new Date().toISOString(),
        approvedBy: user?.uid || "admin",
      });

      toast({ title: t("pages.withdrawals.toast.rejected") });
      setDialogOpen(false);
    } catch (err) {
      toast({
        title: t("pages.withdrawals.toast.failed"),
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (raw: any) => {
    if (!raw) return "-";
    const date = raw?.toDate ? raw.toDate() : new Date(raw);
    return date.toLocaleString("th-TH", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    const label: Record<string, string> = {
      pending: t("pages.withdrawals.status.pending"),
      approved: t("pages.withdrawals.status.approved"),
      rejected: t("pages.withdrawals.status.rejected"),
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[status] || "bg-gray-100 text-gray-600"}`}>
        {label[status] || status}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* HEADER */}
        <div>
          <h2 className="text-3xl font-bold">{t("pages.withdrawals.title")}</h2>
          <p className="text-muted-foreground">{t("pages.withdrawals.subtitle")}</p>
        </div>

        {/* STATS CARDS */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{t("pages.withdrawals.cards.totalPending")}</p>
              <p className="text-3xl font-bold text-yellow-500">{pendingCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{t("pages.withdrawals.cards.totalApproved")}</p>
              <p className="text-3xl font-bold text-green-500">{approvedCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{t("pages.withdrawals.cards.totalAmount")}</p>
              <p className="text-3xl font-bold">฿{totalAmount.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* TABLE */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("pages.withdrawals.cardTitle")}</CardTitle>
              <Input
                placeholder={t("pages.withdrawals.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">{t("pages.withdrawals.loading")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-left">
                      <th className="pb-3 pr-4">{t("pages.withdrawals.table.withdrawId")}</th>
                      <th className="pb-3 pr-4">{t("pages.withdrawals.table.caregiver")}</th>
                      <th className="pb-3 pr-4">{t("pages.withdrawals.table.amount")}</th>
                      <th className="pb-3 pr-4">{t("pages.withdrawals.table.bank")}</th>
                      <th className="pb-3 pr-4">{t("pages.withdrawals.table.requestedAt")}</th>
                      <th className="pb-3 pr-4">{t("pages.withdrawals.table.status")}</th>
                      <th className="pb-3">{t("pages.withdrawals.table.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((w) => (
                      <tr key={w.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                          {w.withdrawId || w.id.slice(0, 8)}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="font-medium">{w.caregiverName}</div>
                          <div className="text-xs text-muted-foreground">{w.caregiverId?.slice(0, 8)}...</div>
                        </td>
                        <td className="py-3 pr-4 font-bold text-green-600">
                          ฿{(w.amount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 pr-4">
                          <div>{w.bank}</div>
                          <div className="text-xs text-muted-foreground">{w.accountNumber}</div>
                        </td>
                        <td className="py-3 pr-4 text-xs text-muted-foreground">
                          {formatDate(w.createdAt)}
                        </td>
                        <td className="py-3 pr-4">
                          {statusBadge(w.status)}
                        </td>
                        <td className="py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelected(w);
                              setDialogOpen(true);
                            }}
                          >
                            {t("pages.withdrawals.actions.viewDetail")}
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          ไม่พบรายการ
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* DETAIL DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("pages.withdrawals.dialog.detailTitle")}</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 text-sm">

              {/* รหัส + สถานะ */}
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs text-muted-foreground">
                  {selected.withdrawId}
                </span>
                {statusBadge(selected.status)}
              </div>

              {/* ข้อมูล caregiver */}
              <div className="bg-muted/40 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-base">{selected.caregiverName}</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>
                    <p className="text-foreground font-medium">{t("pages.withdrawals.dialog.bank")}</p>
                    <p>{selected.bank}</p>
                  </div>
                  <div>
                    <p className="text-foreground font-medium">{t("pages.withdrawals.dialog.accountNumber")}</p>
                    <p>{selected.accountNumber}</p>
                  </div>
                  <div>
                    <p className="text-foreground font-medium">{t("pages.withdrawals.dialog.accountName")}</p>
                    <p>{selected.accountName}</p>
                  </div>
                  <div>
                    <p className="text-foreground font-medium">{t("pages.withdrawals.dialog.requestedAt")}</p>
                    <p>{formatDate(selected.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* ยอดเงิน */}
              <div className="bg-green-50 rounded-lg p-4 flex justify-between items-center">
                <span className="text-green-700 font-medium">{t("pages.withdrawals.dialog.amount")}</span>
                <span className="text-2xl font-bold text-green-600">
                  ฿{(selected.amount || 0).toLocaleString()}
                </span>
              </div>

              {/* รายการงาน */}
              <div>
                <p className="font-semibold mb-2">
                  {t("pages.withdrawals.dialog.bookingSummaries")} ({selected.bookingCount} งาน)
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(selected.bookingSummaries || []).map((b: any, i: number) => (
                    <div key={i} className="bg-muted/40 rounded p-3 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="font-mono text-muted-foreground">{b.bookingId?.slice(0, 10)}...</span>
                        <span className="font-semibold text-green-600">฿{b.income} (60%)</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>ค่าบริการเต็ม: ฿{b.fare}</span>
                        <span>{b.paymentMethod}</span>
                      </div>
                      <div className="text-muted-foreground">{formatDate(b.completedAt)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ปุ่ม approve/reject (เฉพาะ pending) */}
              {selected.status === "pending" && (
                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(selected)}
                    disabled={processing}
                  >
                    {processing ? "กำลังดำเนินการ..." : t("pages.withdrawals.dialog.approve")}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleReject(selected)}
                    disabled={processing}
                  >
                    {t("pages.withdrawals.dialog.reject")}
                  </Button>
                </div>
              )}

              {/* approved info */}
              {selected.status !== "pending" && selected.approvedAt && (
                <div className="text-xs text-muted-foreground text-center pt-2">
                  ดำเนินการเมื่อ {formatDate(selected.approvedAt)}
                </div>
              )}

              <Button variant="outline" className="w-full" onClick={() => setDialogOpen(false)}>
                {t("pages.withdrawals.dialog.close")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}