import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
// import api from "@/lib/api";
import { useTranslation } from "react-i18next";
import { onSnapshot, collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { Button } from "@/components/ui/button";


type TripApi = {
  id: number;
  rider?: { id: number; name: string | null } | null;
  caregiver?: { id: number; name: string | null } | null;
  fromAddress: string;
  toAddress: string;
  status: string;
  amountCents?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  dateBooking: string;
};

export default function Trips() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const handleReset = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  };
  const { t } = useTranslation();


  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let unsubscribe: any;

    const load = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));

        const userMap: Record<string, string> = {};
        usersSnapshot.forEach(doc => {
          const u = doc.data();
          userMap[doc.id] = u.fullName || "Unknown";
        });

        unsubscribe = onSnapshot(
          collection(db, "bookings"),
          (snapshot) => {
            const data = snapshot.docs.map(docSnap => {
              const d = docSnap.data();

              const bookingDate = parseThaiDateTime(
                d.dateBooking,
                d.timeBooking
              );

              return {
                id: docSnap.id,
                user: userMap[d.userId] || "Unknown",
                caregiver: d.caregiverName || "wait caregiver",
                from: d.fromLocation?.address || "-",
                to: d.toLocation?.address || "-",
                rawDate: bookingDate,
                date: bookingDate
                  ? formatThaiDateTime(bookingDate)
                  : "-",
                status: d.status || "pending",
                amount: `฿ ${(d.fare || 0).toLocaleString()}`,
              };
            });

            setRows(data);
            setIsLoading(false);
          },
          () => {
            setIsError(true);
            setIsLoading(false);
          }
        );
      } catch (err) {
        setIsError(true);
        setIsLoading(false);
      }
    };

    load();

    return () => unsubscribe && unsubscribe();
  }, []);

  const fmtAmount = (cents?: number | null) =>
    typeof cents === "number" ? `฿${(cents / 100).toFixed(0)}` : "฿0";


  const filteredTrips = rows.filter((trip) => {
    const keyword = searchTerm.toLowerCase();

    const searchString = [
      trip.id,
      trip.user,
      trip.caregiver,
      trip.from,
      trip.to,
      trip.date,
      trip.amount,
      trip.status,
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchString.includes(keyword);

    const matchesStatus =
      statusFilter === "all" || trip.status === statusFilter;

    // 🔥 filter วันที่
    let matchesDate = true;

    if (trip.rawDate) {
      const tripDate = new Date(trip.rawDate);

      if (dateFrom) {
        const from = new Date(dateFrom);
        if (tripDate < from) matchesDate = false;
      }

      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999); // ให้รวมทั้งวัน
        if (tripDate > to) matchesDate = false;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });
  const totalTrips = filteredTrips.length;


  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed": return "success";
      case "pending": return "secondary";
      case "accepted": return "default"; // 
      case "cancelled": return "destructive";
      default: return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed": return t("pages.trips.status.completed");
      case "pending": return t("pages.trips.status.pending");
      case "cancelled": return t("pages.trips.status.cancelled");
      case "accepted": return "Accepted";
      default: return status;
    }
  };
  const formatThaiDateTime = (date: Date) => {
    if (!date || isNaN(date.getTime())) return "-";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };
  const parseThaiDateTime = (dateStr: string, timeStr: string) => {
    if (!dateStr) return null;

    const months: Record<string, number> = {
      มกราคม: 0,
      กุมภาพันธ์: 1,
      มีนาคม: 2,
      เมษายน: 3,
      พฤษภาคม: 4,
      มิถุนายน: 5,
      กรกฎาคม: 6,
      สิงหาคม: 7,
      กันยายน: 8,
      ตุลาคม: 9,
      พฤศจิกายน: 10,
      ธันวาคม: 11,
    };

    try {
      const parts = dateStr.split(" ");
      const day = parseInt(parts[0]);
      const month = months[parts[1]];
      const year = parseInt(parts[2]) - 543; // แปลง พ.ศ. → ค.ศ.

      let hours = 0;
      let minutes = 0;

      if (timeStr) {
        const t = timeStr.split(":");
        hours = parseInt(t[0]);
        minutes = parseInt(t[1]);
      }

      return new Date(year, month, day, hours, minutes);
    } catch {
      return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">{t("pages.trips.title")}</h2>
          <p className="text-muted-foreground">{t("pages.trips.subtitle")}</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>
                {t("pages.trips.cardTitle")} ({totalTrips})
              </CardTitle>

              <div className="flex items-center gap-2">

                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-40"
                />

                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-40"
                />

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={t("pages.trips.filters.status") as string} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("pages.trips.filters.allStatus")}</SelectItem>
                    <SelectItem value="completed">{t("pages.trips.status.completed")}</SelectItem>
                    <SelectItem value="pending">{t("pages.trips.status.pending")}</SelectItem>
                    <SelectItem value="cancelled">{t("pages.trips.status.cancelled")}</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("pages.trips.searchPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>

                {/* ✅ ปุ่ม Reset */}
                <Button variant="outline" onClick={handleReset}>
                  รีเซ็ต
                </Button>

              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && <div className="text-sm text-muted-foreground">{t("pages.trips.loading")}</div>}
            {isError && <div className="text-sm text-destructive">{t("pages.trips.loadError")}</div>}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("pages.trips.table.tripId")}</TableHead>
                  <TableHead>{t("pages.trips.table.user")}</TableHead>
                  <TableHead>{t("pages.trips.table.caregiver")}</TableHead>
                  <TableHead>{t("pages.trips.table.route")}</TableHead>
                  <TableHead>{t("pages.trips.table.datetime")}</TableHead>
                  <TableHead>{t("pages.trips.table.amount")}</TableHead>
                  <TableHead>{t("pages.trips.table.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell className="font-medium">{trip.id}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="whitespace-nowrap">{trip.user}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {trip.caregiver === "wait caregiver" ? (
                        <Badge className="bg-yellow-400 text-black px-3 py-1 whitespace-nowrap">
                          wait caregiver
                        </Badge>
                      ) : (
                        <span className="whitespace-nowrap">{trip.caregiver}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{trip.from}</div>
                        <div className="text-muted-foreground">→ {trip.to}</div>
                      </div>
                    </TableCell>
                    <TableCell>{trip.date}</TableCell>
                    <TableCell className="font-medium">{trip.amount}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusVariant(trip.status)}
                        className={
                          trip.status === "pending"
                            ? "bg-orange-500 text-white border-orange-500 px-3 py-1 text-sm font-medium whitespace-nowrap"
                            : "px-3 py-1 text-sm whitespace-nowrap"
                        }
                      >
                        {getStatusLabel(trip.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

