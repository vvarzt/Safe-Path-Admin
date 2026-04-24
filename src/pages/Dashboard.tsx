import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Car, Route, DollarSign, Timer, Star, AlertTriangle, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/firebase";


const BASE_STATS = [
  { key: "stats.totalUsers", value: "-", icon: Users, change: "" },
  { key: "stats.activecaregivers", value: "-", icon: Car, change: "" },
  { key: "stats.totalTrips", value: "-", icon: Route, change: "" },
  { key: "stats.revenue", value: "-", icon: DollarSign, change: "" },
  { key: "stats.avgTripTime", value: "-", icon: Timer, change: "" },
  { key: "stats.cancellationRate", value: "-", icon: AlertTriangle, change: "" },
  { key: "stats.caregiverUtilization", value: "-", icon: Activity, change: "" },
  { key: "stats.avgRating", value: "4.8", icon: Star, },
];

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--success))",
];

type Metrics = {
  totalUsers: number;
  activecaregivers: number;
  totalTrips: number;
  revenueCents: number;
  avgTripTime: number;
  cancellationRate: number; // percent
  caregiverUtilization: number; // percent
  weeklyTrips: { name: string; trips: number }[];
  revenueByDay?: { name: string; revenueCents: number }[];
  tripStatusDistribution?: { status: string; count: number }[];
  recentActivity?: { type: string; title: string; createdAt: string; amountCents?: number | null }[];
};

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: metrics } = useQuery<Metrics>({
    queryKey: ["metrics"],
    queryFn: async () => {
      const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

      const emptyWeekly = () => ORDER.map((name) => ({ name, trips: 0 }));
      const emptyRevenue = () => ORDER.map((name) => ({ name, revenueCents: 0 }));

      try {
        const [usersSnapshot, caregiversSnapshot, bookingsSnapshot] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "caregivers")),
          getDocs(query(collection(db, "bookings"), orderBy("createdAt", "desc"))),
        ]);

        const totalUsers = usersSnapshot.size;
        const activecaregivers = caregiversSnapshot.size;

        // last 7 days window
        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const weeklyMap: Record<string, number> = Object.fromEntries(ORDER.map((d) => [d, 0]));
        const revenueMap: Record<string, number> = Object.fromEntries(ORDER.map((d) => [d, 0]));
        const statusCount: Record<string, number> = {};

        let totalTrips = 0;
        let totalRevenue = 0;
        let totalTripMinutes = 0;
        let tripsWithTime = 0;
        let cancelledCount = 0;
        const recentActivity: Metrics["recentActivity"] = [];

        bookingsSnapshot.forEach((doc) => {
          const d = doc.data();
          totalTrips++;

          // status distribution
          const st: string = d.status || "pending";
          statusCount[st] = (statusCount[st] ?? 0) + 1;
          if (st === "cancelled") cancelledCount++;

          // revenue — fare is already in THB
          if (st === "completed" && typeof d.fare === "number") {
            totalRevenue += d.fare;
          }

          // avg trip time: startedAt → completedAt
          if (d.startedAt && d.completedAt) {
            const start = new Date(d.startedAt).getTime();
            const end = new Date(d.completedAt).getTime();
            if (!isNaN(start) && !isNaN(end) && end > start) {
              totalTripMinutes += (end - start) / 60000;
              tripsWithTime++;
            }
          }

          // weekly bucketing
          if (d.createdAt) {
            const created = new Date(d.createdAt);
            if (created >= sevenDaysAgo) {
              const dayKey = DAY_NAMES[created.getDay()];
              weeklyMap[dayKey] = (weeklyMap[dayKey] ?? 0) + 1;
              if (st === "completed" && typeof d.fare === "number") {
                revenueMap[dayKey] = (revenueMap[dayKey] ?? 0) + d.fare;
              }
            }
          }

          // recent activity — latest 10
          if (recentActivity.length < 10) {
            recentActivity.push({
              type: st,
              title: `${d.fromLocation?.address ?? "?"} → ${d.toLocation?.address ?? "?"}`,
              createdAt: d.createdAt || new Date().toISOString(),
              amountCents: typeof d.fare === "number" ? d.fare : null,
            });
          }
        });

        const weeklyTrips = ORDER.map((name) => ({ name, trips: weeklyMap[name] ?? 0 }));
        const revenueByDay = ORDER.map((name) => ({ name, revenueCents: revenueMap[name] ?? 0 }));
        const tripStatusDistribution = Object.entries(statusCount).map(([status, count]) => ({ status, count }));

        const avgTripTime = tripsWithTime > 0 ? Math.round(totalTripMinutes / tripsWithTime) : 0;
        const cancellationRate = totalTrips > 0 ? parseFloat(((cancelledCount / totalTrips) * 100).toFixed(1)) : 0;
        const caregiverUtilization = 78.5; // TODO: calculate from caregiver schedule

        return {
          totalUsers,
          activecaregivers,
          totalTrips,
          revenueCents: totalRevenue,
          avgTripTime,
          cancellationRate,
          caregiverUtilization,
          weeklyTrips,
          revenueByDay,
          tripStatusDistribution,
          recentActivity,
        };
      } catch (error) {
        console.error("Error fetching metrics:", error);
        return {
          totalUsers: 0,
          activecaregivers: 0,
          totalTrips: 0,
          revenueCents: 0,
          avgTripTime: 0,
          cancellationRate: 0,
          caregiverUtilization: 0,
          weeklyTrips: emptyWeekly(),
          revenueByDay: emptyRevenue(),
          tripStatusDistribution: [
            { status: "completed", count: 0 },
            { status: "cancelled", count: 0 },
            { status: "in_progress", count: 0 },
            { status: "pending", count: 0 },
          ],
          recentActivity: [],
        };
      }
    }
  });
  const fmt = (n?: number) => (typeof n === "number" ? n.toLocaleString() : "-");
  const money = (amount?: number) =>
    (typeof amount === "number" ? `฿ ${amount.toLocaleString()}` : "-");

  const stats = BASE_STATS.map((s) => {
    const m = metrics;
    let value = s.value;
    if (m) {
      switch (s.key) {
        case "stats.totalUsers": value = fmt(m.totalUsers); break;
        case "stats.activecaregivers": value = fmt(m.activecaregivers); break;
        case "stats.totalTrips": value = fmt(m.totalTrips); break;
        case "stats.revenue": value = money(m.revenueCents); break;
        case "stats.avgTripTime": value = m.avgTripTime ? `${m.avgTripTime}m` : "0m"; break;
        case "stats.cancellationRate": value = `${m.cancellationRate}%`; break;
        case "stats.caregiverUtilization": value = `${m.caregiverUtilization}%`; break;
      }
    }
    return { ...s, title: t(s.key), value };
  });

  const weeklyData = metrics?.weeklyTrips ?? [
    { name: "Mon", trips: 0 },
    { name: "Tue", trips: 0 },
    { name: "Wed", trips: 0 },
    { name: "Thu", trips: 0 },
    { name: "Fri", trips: 0 },
    { name: "Sat", trips: 0 },
    { name: "Sun", trips: 0 },
  ];

  const revenueData = (metrics?.revenueByDay ?? weeklyData.map(d => ({ name: d.name, revenueCents: 0 })))
    .map(d => ({
      name: d.name,
      revenue: d.revenueCents || 0 // ✅ เอา /100 ออก
    }));
  const tripTypeData = (metrics?.tripStatusDistribution ?? [])
    .map((it) => ({ name: it.status, value: it.count }));

  const recentActivity = metrics?.recentActivity ?? [];
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="animate-fade-up">
          <h2 className="text-3xl font-bold">{t("pages.dashboard.title")}</h2>
          <p className="text-muted-foreground">{t("pages.dashboard.subtitle")}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="card-elevated animate-fade-up" style={{ animationDelay: `${idx * 60}ms` }}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-success">{stat.change} {t("stats.changeSuffix")}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="card-elevated animate-fade-up" style={{ animationDelay: `80ms` }}>
            <CardHeader>
              <CardTitle>{t("pages.dashboard.charts.weeklyTrips")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="trips" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="card-elevated animate-fade-up" style={{ animationDelay: `140ms` }}>
            <CardHeader>
              <CardTitle>{t("pages.dashboard.charts.revenueTrend")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(v) => v.toLocaleString()} />
                  <Tooltip formatter={(v: number) => `฿ ${v.toLocaleString()}`} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="card-elevated animate-fade-up" style={{ animationDelay: `200ms` }}>
            <CardHeader>
              <CardTitle>{t("pages.dashboard.charts.tripTypesDistribution")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={tripTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {tripTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="card-elevated animate-fade-up" style={{ animationDelay: `260ms` }}>
            <CardHeader>
              <CardTitle>{t("pages.dashboard.charts.recentActivity")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 && (
                  <div className="text-sm text-muted-foreground">No recent activity</div>
                )}
                {recentActivity.map((a, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{typeof a.amountCents === 'number' ? money(a.amountCents) : ''}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

