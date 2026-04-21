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
  { key: "stats.activeDrivers", value: "-", icon: Car, change: "" },
  { key: "stats.totalTrips", value: "-", icon: Route, change: "" },
  { key: "stats.revenue", value: "-", icon: DollarSign, change: "" },
  { key: "stats.avgTripTime", value: "-", icon: Timer, change: "" },
  { key: "stats.cancellationRate", value: "-", icon: AlertTriangle, change: "" },
  { key: "stats.driverUtilization", value: "-", icon: Activity, change: "" },
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
  activeDrivers: number;
  totalTrips: number;
  revenueCents: number;
  avgTripTime: number;
  cancellationRate: number; // percent
  driverUtilization: number; // percent
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
      try {
        // Fetch data from multiple collections in parallel
        const [
          usersSnapshot,
          driversSnapshot,
          bookingsSnapshot,
          paymentsSnapshot,
          notificationsSnapshot
        ] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'drivers')),
          getDocs(collection(db, 'bookings')),
          getDocs(collection(db, 'payments')),
          getDocs(query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(10)))
        ]);

        // Calculate metrics
        const totalUsers = usersSnapshot.size;
        console.log("Total users:", totalUsers);
        const activeDrivers = driversSnapshot.size; // Assume all drivers are active
        const totalTrips = bookingsSnapshot.size;

        // Calculate total revenue from completed payments
        let revenueCents = 0;
        paymentsSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.status === "completed") {
            const amount = data.amount;
            if (amount != null) {
              const numAmount = Number(amount);
              console.log(`Payment ${doc.id}: ${numAmount}`);
              revenueCents += numAmount;
            }
          }
        });
        console.log("Total revenue:", revenueCents);

        // Get recent activity from notifications
        const recentActivity = notificationsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            type: data.type || 'activity',
            title: data.title || 'Activity',
            createdAt: data.createdAt || new Date().toISOString(),
            amountCents: data.amountCents || null
          };
        });

        // Default values for complex calculations (can be improved later)
        const avgTripTime = 25; // TODO: calculate from actual trip data
        const cancellationRate = 3.2; // TODO: calculate from cancelled trips
        const driverUtilization = 78.5; // TODO: calculate from driver activity

        // Default weekly data (can be improved with date queries)
        const weeklyTrips = [
          { name: "Mon", trips: 0 },
          { name: "Tue", trips: 0 },
          { name: "Wed", trips: 0 },
          { name: "Thu", trips: 0 },
          { name: "Fri", trips: 0 },
          { name: "Sat", trips: 0 },
          { name: "Sun", trips: 0 },
        ];

        const revenueByDay = weeklyTrips.map(d => ({ name: d.name, revenueCents: 0 }));

        // Default trip status distribution (can be improved with aggregation)
        const tripStatusDistribution = [
          { status: "completed", count: totalTrips },
          { status: "cancelled", count: 0 },
          { status: "in_progress", count: 0 },
          { status: "pending", count: 0 },
        ];

        return {
          totalUsers,
          activeDrivers,
          totalTrips,
          revenueCents,
          avgTripTime,
          cancellationRate,
          driverUtilization,
          weeklyTrips,
          revenueByDay,
          tripStatusDistribution,
          recentActivity
        };
      } catch (error) {
        console.error("Error fetching metrics:", error);
        // Return default values if Firebase fails
        return {
          totalUsers: 0,
          activeDrivers: 0,
          totalTrips: 0,
          revenueCents: 0,
          avgTripTime: 0,
          cancellationRate: 0,
          driverUtilization: 0,
          weeklyTrips: [
            { name: "Mon", trips: 0 },
            { name: "Tue", trips: 0 },
            { name: "Wed", trips: 0 },
            { name: "Thu", trips: 0 },
            { name: "Fri", trips: 0 },
            { name: "Sat", trips: 0 },
            { name: "Sun", trips: 0 },
          ],
          revenueByDay: [
            { name: "Mon", revenueCents: 0 },
            { name: "Tue", revenueCents: 0 },
            { name: "Wed", revenueCents: 0 },
            { name: "Thu", revenueCents: 0 },
            { name: "Fri", revenueCents: 0 },
            { name: "Sat", revenueCents: 0 },
            { name: "Sun", revenueCents: 0 },
          ],
          tripStatusDistribution: [
            { status: "completed", count: 0 },
            { status: "cancelled", count: 0 },
            { status: "in_progress", count: 0 },
            { status: "pending", count: 0 },
          ],
          recentActivity: []
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
        case "stats.activeDrivers": value = fmt(m.activeDrivers); break;
        case "stats.totalTrips": value = fmt(m.totalTrips); break;
        case "stats.revenue": value = money(m.revenueCents); break;
        case "stats.avgTripTime": value = m.avgTripTime ? `${m.avgTripTime}m` : "0m"; break;
        case "stats.cancellationRate": value = `${m.cancellationRate}%`; break;
        case "stats.driverUtilization": value = `${m.driverUtilization}%`; break;
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
    .map(d => ({ name: d.name, revenue: Math.round((d.revenueCents || 0) / 100) }));

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
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--accent))" strokeWidth={2} />
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

