import { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useTranslation } from "react-i18next";

export default function Reports() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [reportType, setReportType] = useState("daily");
  const [dateRange, setDateRange] = useState("today");
  const pdfRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState<{ pdf: boolean; csv: boolean }>({ pdf: false, csv: false });
  const API = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";

  const [metrics, setMetrics] = useState<{
    totalUsers?: number;
    activeDrivers?: number;
    totalTrips?: number;
    revenueCents?: number;
    cancellationRate?: number;
  }>({});
  const [reports, setReports] = useState<Array<{ id: number; type: string; createdAt: string }>>([]);
  const [latestReportId, setLatestReportId] = useState<number | null>(null);

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${API}/metrics`);
      if (!res.ok) throw new Error("Failed to fetch metrics");
      const data = await res.json();
      setMetrics(data || {});
    } catch (e) {
      // leave blank if failed
      setMetrics({});
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API}/reports`);
      if (!res.ok) throw new Error("Failed to fetch reports");
      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
      setLatestReportId(Array.isArray(data) && data.length ? data[0].id : null);
    } catch (e) {
      setReports([]);
      setLatestReportId(null);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolveDateRange = (): { start?: string; end?: string } => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (dateRange === "today") {
      return { start: startOfDay.toISOString(), end: new Date(startOfDay.getTime() + 86399999).toISOString() };
    }
    if (dateRange === "yesterday") {
      const y = new Date(startOfDay.getTime() - 86400000);
      return { start: y.toISOString(), end: new Date(y.getTime() + 86399999).toISOString() };
    }
    if (dateRange === "last7days") {
      const s = new Date(startOfDay.getTime() - 6 * 86400000);
      return { start: s.toISOString(), end: new Date(startOfDay.getTime() + 86399999).toISOString() };
    }
    if (dateRange === "last30days") {
      const s = new Date(startOfDay.getTime() - 29 * 86400000);
      return { start: s.toISOString(), end: new Date(startOfDay.getTime() + 86399999).toISOString() };
    }
    return {};
  };

  const handleGenerateReport = async () => {
    try {
      const { start, end } = resolveDateRange();
      const body: any = {
        type: reportType === "custom" ? "custom" : `${reportType}-summary`,
        periodStart: start,
        periodEnd: end,
      };
      const res = await fetch(`${API}/reports/build`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to build report");
      await fetchReports();
      toast({ title: "Report generated", description: "Your report is ready." });
    } catch (err) {
      toast({ title: "Failed to generate report", variant: "destructive" });
    }
  };

  const handleDownloadCSV = () => {
    try {
      setDownloading((p) => ({ ...p, csv: true }));
      if (!latestReportId) {
        toast({ title: "No report to export", description: "Please generate a report first." });
        return;
      }
      const link = document.createElement("a");
      link.href = `${API}/reports/${latestReportId}/export`;
      link.download = `report_${latestReportId}.csv`;
      link.click();
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to download Excel", variant: "destructive" });
    } finally {
      setDownloading((p) => ({ ...p, csv: false }));
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading((p) => ({ ...p, pdf: true }));
      if (!pdfRef.current) throw new Error("PDF template not ready");
      const el = pdfRef.current;
      // wait a tick to ensure layout is ready
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth - 20;
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
      pdf.save(`report_${reportType}_${dateRange}.pdf`);
      toast({ title: "Downloaded PDF", description: `report_${reportType}_${dateRange}.pdf` });
    } catch (err: any) {
      console.error(err);
      // Fallback: simple PDF with text content so user still gets a file
      try {
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        pdf.setFontSize(16);
        pdf.text("รายงานสรุประบบ", 14, 20);
        pdf.setFontSize(11);
        pdf.text(`ประเภท: ${reportType}  ช่วงเวลา: ${dateRange}`, 14, 28);
        let y = 40;
        pdf.setFontSize(12);
        reportStats.forEach((s) => {
          pdf.text(`${s.label}: ${s.value}`, 14, y);
          y += 7;
        });
        pdf.save(`report_${reportType}_${dateRange}.pdf`);
        toast({ title: "Downloaded PDF (fallback)", description: "Canvas failed, used text fallback" });
      } catch (fallbackErr) {
        console.error(fallbackErr);
        toast({ title: "Failed to download PDF", description: String(err?.message || err), variant: "destructive" });
      }
    } finally {
      setDownloading((p) => ({ ...p, pdf: false }));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">{t("pages.reports.title")}</h2>
          <p className="text-muted-foreground">{t("pages.reports.subtitle")}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>{t("pages.reports.configTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="report-type">{t("pages.reports.reportType")}</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger id="report-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily Report</SelectItem>
                    <SelectItem value="weekly">Weekly Report</SelectItem>
                    <SelectItem value="monthly">Monthly Report</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-range">{t("pages.reports.dateRange")}</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger id="date-range">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="last7days">Last 7 Days</SelectItem>
                    <SelectItem value="last30days">Last 30 Days</SelectItem>
                    <SelectItem value="thismonth">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 space-y-2">
                <Button onClick={handleGenerateReport} className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  {t("pages.reports.generate")}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={handleDownloadPDF} disabled={downloading.pdf}>
                  <Download className="h-4 w-4 mr-2" />
                  {downloading.pdf ? "Generating PDF..." : t("pages.reports.downloadPdf")}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={handleDownloadCSV} disabled={downloading.csv}>
                  <Download className="h-4 w-4 mr-2" />
                  {downloading.csv ? "Preparing Excel..." : t("pages.reports.downloadExcel")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t("pages.reports.summary")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="p-4 rounded-lg bg-muted">
                  <div className="text-sm text-muted-foreground">Total Trips</div>
                  <div className="text-2xl font-bold mt-1">{metrics.totalTrips ?? ""}</div>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <div className="text-sm text-muted-foreground">Total Users</div>
                  <div className="text-2xl font-bold mt-1">{metrics.totalUsers ?? ""}</div>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <div className="text-sm text-muted-foreground">Active Drivers</div>
                  <div className="text-2xl font-bold mt-1">{metrics.activeDrivers ?? ""}</div>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                  <div className="text-2xl font-bold mt-1">
                    {typeof metrics.revenueCents === "number" ? `฿${(metrics.revenueCents / 100).toLocaleString()}` : ""}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <div className="text-sm text-muted-foreground">Cancellation Rate</div>
                  <div className="text-2xl font-bold mt-1">
                    {typeof metrics.cancellationRate === "number" ? `${metrics.cancellationRate}%` : ""}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 border border-border rounded-lg">
                <h3 className="font-semibold mb-4">Recent Report History</h3>
                <div className="space-y-3">
                  {reports.length === 0 && (
                    <div className="text-sm text-muted-foreground">No reports yet</div>
                  )}
                  {reports.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">{r.type}</div>
                        <div className="text-sm text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => {
                        const a = document.createElement("a");
                        a.href = `${API}/reports/${r.id}/export`;
                        a.download = `report_${r.id}.csv`;
                        a.click();
                      }}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
