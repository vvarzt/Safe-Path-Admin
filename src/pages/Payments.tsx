import { useRef, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import api from "@/lib/api";
import { paymentService } from "@/services/mockService";
import { useTranslation } from "react-i18next";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";

type PaymentApi = {
  id: string;
  tripId?: string | null;
  payerName: string;
  amountCents: number;
  method: string;
  status: string;
  reference?: string | null;
  proofUrl?: string | null;
  createdAt: string;
};

export default function Payments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<{
    id: string;
    tripId?: string | null;
    user: string;
    amount: string;
    method: string;
    date: string;
    status: string;
    reference?: string;
    proofUrl?: string;
  } | null>(null);
  const { toast } = useToast();
  const pdfRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const { data, isLoading, isError } = useQuery<any[]>({
    queryKey: ["payments"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "payments"));
      const usersSnapshot = await getDocs(collection(db, "users"));

      const userMap: Record<string, string> = {};

      usersSnapshot.forEach(doc => {
        const u = doc.data();
        userMap[doc.id] = u.fullName || "Unknown";
      });

      return snapshot.docs.map(doc => {
        const d = doc.data();

        return {
          id: doc.id, // string
          tripId: String(d.bookingId || "-"),
          user: userMap[d.userId] || "Unknown",
          amount: d.amount || 0,
          method: d.method || "-",
          status: d.status || "pending",
          createdAt: d.createdAt?.toDate?.()
            ? d.createdAt.toDate().toISOString()
            : d.createdAt || null,
        };
      });
    },
  });

  const displayRows = (data ?? []).map(p => ({
    id: p.id,
    tripId: p.tripId,
    user: p.user,
    amount: `฿ ${p.amount.toLocaleString()}`,
    method: p.method,
    date: p.createdAt ? new Date(p.createdAt).toLocaleString("en-GB", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok",
    }) : "-",
    createdAt: p.createdAt ?? null,  // ✅ เพิ่มบรรทัดนี้
    status: p.status,
  }));

  const filteredPayments = displayRows.filter((payment) => {
    const matchSearch =
      payment.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(payment.tripId).includes(searchTerm);

    // ✅ ใช้ createdAt (ISO string) แทน date (formatted string)
    const paymentDate = payment.createdAt ? new Date(payment.createdAt) : null;

    const matchStart = startDate && paymentDate
      ? paymentDate >= new Date(startDate)
      : true;

    const matchEnd = endDate && paymentDate
      ? paymentDate <= new Date(endDate + "T23:59:59")
      : true;

    return matchSearch && matchStart && matchEnd;
  });


  const totalRevenue = (data ?? [])
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const filteredTotalRevenue = filteredPayments
    .filter(p => p.status === "completed")
    .reduce((sum, p) => {
      return sum + parseFloat(p.amount.replace("฿", "").replace(/,/g, ""));
    }, 0);

  const todaysRevenue = (data ?? [])
    .filter(p => p.status === "completed")
    .filter(p => {
      const d = new Date(p.createdAt);
      const now = new Date();

      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const approvePayment = useMutation({
    mutationFn: async (id: string) =>
      await paymentService.update(id, { status: "success" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments"] }),
    onError: (e: any) => toast({ title: t("pages.payments.updateFailed"), description: e?.response?.data?.error ?? String(e), variant: "destructive" }),
  });

  const rejectPayment = useMutation({
    mutationFn: async (id: string) => await paymentService.update(id, { status: "cancelled" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments"] }),
    onError: (e: any) => toast({ title: t("pages.payments.updateFailed"), description: e?.response?.data?.error ?? String(e), variant: "destructive" }),
  });

  const getPaymentPrefix = (method: string) => {
    const m = method.toLowerCase();
    if (m === "cash") return "CASH";
    if (m === "qr" || m === "promptpay") return "QR";
    if (m === "transfer" || m === "โอนเงิน") return "TRF";
    if (m === "card" || m === "credit" || m === "debit") return "CRD";
    return "PAY";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">{t("pages.payments.title")}</h2>
          <p className="text-muted-foreground">{t("pages.payments.subtitle")}</p>
        </div>

        {/* Revenue Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("pages.payments.cards.totalRevenue")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ฿ {totalRevenue.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <div className="fixed -left-[2000px] top-0 w-[1123px] bg-white text-black p-10" ref={exportRef}>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <img src="/brand/safe-path-logo.svg" alt="Safe Path" className="h-10 w-10 object-contain" />
                <div>
                  <div className="text-xl font-bold">รายงานการชำระเงิน (Payments Report)</div>
                  <div className="text-xs text-gray-500">สร้างโดยระบบ Safe Path</div>
                </div>ß
              </div>
              <div className="text-right text-gray-500 text-xs leading-5">
                <div>พิมพ์เมื่อ: {new Date().toLocaleString()}</div>
                <div>จำนวนรายการ: {filteredPayments.length}</div>
                <div>ยอดรวมสำเร็จ: ฿ {filteredTotalRevenue.toLocaleString()}</div>
              </div>
            </div>
            <div className="rounded-md border bg-white overflow-hidden">
              <div className="grid grid-cols-12 px-3 py-2 text-[11px] font-semibold border-b bg-gray-50">
                <div className="col-span-2">Payment ID</div>
                <div className="col-span-1">Trip</div>
                <div className="col-span-3">User</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-2">Method</div>
                <div className="col-span-2">Date</div>
              </div>
              <div>
                {filteredPayments.map((p, idx) => (
                  <div
                    className={`grid grid-cols-12 px-3 py-2 text-[11px] ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                    key={p.id}
                  >
                    <div className="col-span-2">{getPaymentPrefix(p.method)}-{p.id}</div>
                    <div className="col-span-1">{p.tripId}</div>
                    <div className="col-span-3 truncate">{p.user}</div>
                    <div className="col-span-2 font-medium">{p.amount}</div>
                    <div className="col-span-2 truncate">{p.method}</div>
                    <div className="col-span-2">{p.date}</div>
                  </div>
                ))}
              </div>
              <div className="px-3 py-3 text-[11px] border-t bg-gray-50 flex items-center justify-between">
                <div>รวม {filteredPayments.length} รายการ</div>
                <div className="font-semibold">ยอดรวมชำระสำเร็จ: ฿ {filteredTotalRevenue.toLocaleString()}</div>
              </div>
            </div>
            <div className="mt-4 text-[10px] text-gray-500">หมายเหตุ: เอกสารนี้สร้างจากระบบอัตโนมัติ ใช้สำหรับอ้างอิงการชำระเงินเท่านั้น</div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("pages.payments.cards.successCount")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayRows.filter(p => p.status === "completed").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("pages.payments.cards.todaysRevenue")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">฿ {todaysRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("pages.payments.cardTitle")}</CardTitle>
              <div className="flex gap-2">
                <div className="flex gap-2 items-center flex-wrap">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-40"
                  />

                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-40"
                  />

                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setStartDate("");
                      setEndDate("");
                    }}
                  >
                    Reset
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!exportRef.current) return;
                    const el = exportRef.current;
                    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
                    const imgData = canvas.toDataURL("image/png");
                    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
                    const pageWidth = 297; // landscape A4 width in mm
                    const pageHeight = 210; // landscape A4 height in mm
                    const imgWidth = pageWidth - 20; // 10mm margin each side
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                    if (imgHeight <= pageHeight - 20) {
                      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
                    } else {
                      let remaining = imgHeight;
                      const canvasRatio = imgWidth / canvas.width;
                      const sliceHeightPx = ((pageHeight - 20) / imgWidth) * canvas.width;
                      let position = 0;
                      while (remaining > 0) {
                        const slice = document.createElement("canvas");
                        slice.width = canvas.width;
                        slice.height = Math.min(sliceHeightPx, canvas.height - position);
                        const ctx = slice.getContext("2d");
                        if (ctx) {
                          ctx.drawImage(canvas, 0, position, canvas.width, slice.height, 0, 0, slice.width, slice.height);
                        }
                        const sliceImg = slice.toDataURL("image/png");
                        if (position > 0) pdf.addPage();
                        pdf.addImage(sliceImg, "PNG", 10, 10, imgWidth, (slice.height * canvasRatio));
                        position += slice.height;
                        remaining -= (slice.height * canvasRatio);
                      }
                    }
                    pdf.save(`payments_export.pdf`);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t("pages.payments.actions.export")}
                </Button>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("pages.payments.searchPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("pages.payments.table.paymentId")}</TableHead>
                  <TableHead>{t("pages.payments.table.tripId")}</TableHead>
                  <TableHead>{t("pages.payments.table.user")}</TableHead>
                  <TableHead>{t("pages.payments.table.amount")}</TableHead>
                  <TableHead>{t("pages.payments.table.method")}</TableHead>
                  <TableHead>{t("pages.payments.table.datetime")}</TableHead>
                  <TableHead>{t("pages.payments.table.status")}</TableHead>
                  <TableHead className="text-right">{t("pages.payments.table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{getPaymentPrefix(payment.method)}-{payment.id}</TableCell>
                    <TableCell>{payment.tripId}</TableCell>
                    <TableCell>{payment.user}</TableCell>
                    <TableCell className="font-medium">{payment.amount}</TableCell>
                    <TableCell>{payment.method}</TableCell>
                    <TableCell>{payment.date}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          payment.status === "completed"
                            ? "bg-green-500 text-white"
                            : payment.status === "pending"
                              ? "bg-yellow-300 text-black"
                              : "bg-red-500 text-white"
                        }
                      >
                        {payment.status === "completed"
                          ? t("pages.payments.status.success")
                          : payment.status === "pending"
                            ? t("pages.payments.status.pending")
                            : t("pages.payments.status.cancelled")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setSelected(payment); setOpen(true); }}
                        aria-label={t("pages.payments.aria.viewDetails")}
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

        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSelected(null); }}>
          <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>{t("pages.payments.dialog.title")}</DialogTitle>
              <DialogDescription>{t("pages.payments.dialog.subtitle", { id: selected?.id, tripId: selected?.tripId })}</DialogDescription>
            </DialogHeader>
            {selected && (
              <div className="overflow-y-auto max-h-[70vh] pr-1 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">{t("pages.payments.dialog.fields.user")}</div>
                    <div className="font-medium">{selected.user}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t("pages.payments.dialog.fields.amount")}</div>
                    <div className="font-medium">{selected.amount}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t("pages.payments.dialog.fields.method")}</div>
                    <div className="font-medium">{selected.method}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t("pages.payments.dialog.fields.datetime")}</div>
                    <div className="font-medium">{selected.date}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t("pages.payments.dialog.fields.reference")}</div>
                    <div className="font-medium">{selected.reference}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t("pages.payments.dialog.fields.status")}</div>
                    <Badge
                      className={
                        selected.status === "completed"
                          ? "bg-green-500 text-white"
                          : selected.status === "pending"
                            ? "bg-yellow-300 text-black"
                            : "bg-red-500 text-white"
                      }
                    >
                      {selected.status === "completed"
                        ? t("pages.payments.status.success")
                        : selected.status === "pending"
                          ? t("pages.payments.status.pending")
                          : t("pages.payments.status.cancelled")}
                    </Badge>
                  </div>
                </div>
                <div>
                  {selected.proofUrl && (
                    <>
                      <div className="text-sm text-muted-foreground mb-2">{t("pages.payments.dialog.proof")}</div>
                      <img
                        src={selected.proofUrl}
                        alt="payment-proof"
                        className="w-full rounded-md border max-h-[50vh] object-contain"
                        crossOrigin="anonymous"
                      />
                    </>
                  )}
                </div>
                {/* Hidden A4 template for PDF only */}
                <div className="fixed -left-[1200px] top-0 w-[794px] bg-white text-black p-10" ref={pdfRef}>
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center">
                      <img src="/brand/safe-path-logo.svg" alt="Safe Path" className="h-12 w-12 object-contain" />
                    </div>
                    <div className="text-right text-gray-500 text-xs leading-5">
                      <div>address</div>
                      <div>e-mail</div>
                      <div>phone number</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold mb-2">ใบเสร็จรับเงิน / หลักฐานการชำระเงิน</div>
                  <div className="text-xs text-gray-500 mb-6">สร้างโดยระบบ Safe Path</div>

                  {/* Summary Card */}
                  <div className="rounded-md border bg-white p-4 mb-6 text-sm">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-gray-500">หมายเลขใบเสร็จ</div>
                        <div className="font-medium">{getPaymentPrefix(selected.method)}-{selected.id}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-gray-500">หมายเลขทริป</div>
                        <div className="font-medium">{selected.tripId}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-gray-500">ยอดชำระ</div>
                        <div className="font-semibold">{selected.amount}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-gray-500">วิธีการชำระ</div>
                        <div>{selected.method}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-gray-500">วันเวลา</div>
                        <div>{selected.date}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-gray-500">อ้างอิง</div>
                        <div>{selected.reference}</div>
                      </div>
                    </div>
                  </div>

                  {/* Payer Section */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-4 w-1.5 bg-emerald-500 rounded" />
                      <div className="font-semibold">ข้อมูลผู้ชำระ</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="rounded-md border bg-white px-3 py-2">
                        <div className="text-gray-500 text-xs">ชื่อ-นามสกุล</div>
                        <div>{selected.user}</div>
                      </div>
                      <div className="rounded-md border bg-white px-3 py-2">
                        <div className="text-gray-500 text-xs">สถานะ</div>
                        <div>{selected.status}</div>
                      </div>
                      <div className="col-span-2 rounded-md border bg-white px-3 py-3">
                        <div className="text-gray-500 text-xs mb-1">หมายเหตุ</div>
                        <div className="min-h-[64px]" />
                      </div>
                    </div>
                  </div>

                  {/* Detail Section */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-4 w-1.5 bg-emerald-500 rounded" />
                      <div className="font-semibold">รายละเอียดรายการ</div>
                    </div>
                    <div className="rounded-md border bg-white divide-y">
                      <div className="grid grid-cols-3 gap-4 p-3 text-sm">
                        <div className="text-gray-500">กิจกรรม/ทริป</div>
                        <div className="col-span-2">Trip {selected.tripId}</div>
                      </div>
                      <div className="p-3 text-sm leading-6">
                        ชำระค่าบริการรับ-ส่งผู้ป่วย วิธีการชำระ: {selected.method} อ้างอิง: {selected.reference}
                      </div>
                      <div className="grid grid-cols-3 gap-4 p-3 text-sm">
                        <div className="text-gray-500">ยอดรวม</div>
                        <div className="col-span-2 font-semibold">{selected.amount}</div>
                      </div>
                    </div>
                  </div>

                  {/* Proof Section */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-4 w-1.5 bg-emerald-500 rounded" />
                      <div className="font-semibold">หลักฐานการชำระเงิน</div>
                    </div>
                    <div className="rounded-md border bg-white p-3">
                      {selected.proofUrl && (
                        <img
                          src={selected.proofUrl}
                          alt="payment-proof"
                          className="w-full rounded-md border"
                          crossOrigin="anonymous"
                        />
                      )}
                    </div>
                  </div>

                  {/* Footer Note */}
                  <div className="text-[11px] text-gray-500">เอกสารนี้สร้างจากระบบอัตโนมัติ ใช้สำหรับอ้างอิงการชำระเงินเท่านั้น</div>
                </div>
              </div>
            )}
            <DialogFooter>
              <div className="flex w-full justify-between items-center">
                <div className="flex gap-2">
                  {selected?.proofUrl && (
                    <a href={selected.proofUrl} download target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm">{t("pages.payments.actions.downloadProof")}</Button>
                    </a>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (!pdfRef.current) return;
                      const el = pdfRef.current;
                      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
                      const imgData = canvas.toDataURL("image/png");
                      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
                      const pageWidth = 210;
                      const pageHeight = 297;
                      const imgWidth = pageWidth - 20; // 10mm margin each side
                      const imgHeight = (canvas.height * imgWidth) / canvas.width;
                      let y = 10;
                      if (imgHeight <= pageHeight - 20) {
                        pdf.addImage(imgData, "PNG", 10, y, imgWidth, imgHeight);
                      } else {
                        // If content taller than one page, add multiple pages
                        let remaining = imgHeight;
                        const canvasRatio = imgWidth / canvas.width;
                        const sliceHeightPx = ((pageHeight - 20) / imgWidth) * canvas.width; // convert mm to px
                        let position = 0;
                        while (remaining > 0) {
                          const slice = document.createElement("canvas");
                          slice.width = canvas.width;
                          slice.height = Math.min(sliceHeightPx, canvas.height - position);
                          const ctx = slice.getContext("2d");
                          if (ctx) {
                            ctx.drawImage(canvas, 0, position, canvas.width, slice.height, 0, 0, slice.width, slice.height);
                          }
                          const sliceImg = slice.toDataURL("image/png");
                          if (position > 0) pdf.addPage();
                          pdf.addImage(sliceImg, "PNG", 10, 10, imgWidth, (slice.height * canvasRatio));
                          position += slice.height;
                          remaining -= (slice.height * canvasRatio);
                        }
                      }
                      pdf.save(`payment_${getPaymentPrefix(selected.method)}-${selected.id}.pdf`);
                    }}
                  >
                    {t("pages.payments.actions.downloadPdf")}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (!selected) return;
                      rejectPayment.mutate(selected.id);
                      toast({ title: t("pages.payments.toast.rejected"), description: `PAY-${selected.id}` });
                      setOpen(false);
                    }}
                  >
                    {t("pages.payments.actions.reject")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!selected) return;
                      approvePayment.mutate(selected.id);
                      rejectPayment.mutate(selected.id);

                      toast({ title: t("pages.payments.toast.approved"), description: `PAY-${selected.id}` });
                      setOpen(false);
                    }}
                  >
                    {t("pages.payments.actions.approve")}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
