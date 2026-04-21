import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, CheckCircle, XCircle, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DriverMap from "@/components/DriverMap";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { driverService } from "@/services/mockService";
import { useTranslation } from "react-i18next";

type DriverApi = {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  vehicle: string;
  license: string;
  status: string;
  verified: boolean;
};

export default function Drivers() {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data, isLoading, isError } = useQuery<DriverApi[]>({
    queryKey: ["drivers"],
    queryFn: async () => await driverService.getAll(),
  });

  const approveDriver = useMutation({
    mutationFn: async (id: string) => await driverService.update(id, { verified: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["drivers"] }),
  });
  const rejectDriver = useMutation({
    mutationFn: async (id: string) => await driverService.update(id, { status: "rejected" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["drivers"] }),
  });

  const filteredDrivers = (data ?? []).filter(
    (driver) =>
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.license.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">{t("pages.drivers.title")}</h2>
          <p className="text-muted-foreground">{t("pages.drivers.subtitle")}</p>
        </div>

        <Tabs defaultValue="map" className="space-y-4">
          <TabsList>
            <TabsTrigger value="map">{t("pages.drivers.tabs.map")}</TabsTrigger>
            <TabsTrigger value="active">{t("pages.drivers.tabs.active")}</TabsTrigger>
            <TabsTrigger value="pending">{t("pages.drivers.tabs.pending")}</TabsTrigger>
          </TabsList>

          <TabsContent value="map">
            <DriverMap />
          </TabsContent>

          <TabsContent value="active">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t("pages.drivers.active.title")}</CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t("pages.drivers.active.searchPlaceholder")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading && <div className="text-sm text-muted-foreground">{t("pages.drivers.loading")}</div>}
                {isError && <div className="text-sm text-destructive">{t("pages.drivers.loadError")}</div>}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("pages.drivers.table.name")}</TableHead>
                      <TableHead>{t("pages.drivers.table.contact")}</TableHead>
                      <TableHead>{t("pages.drivers.table.vehicle")}</TableHead>
                      <TableHead>{t("pages.drivers.table.license")}</TableHead>
                      <TableHead>{t("pages.drivers.table.status")}</TableHead>
                      <TableHead className="text-right">{t("pages.drivers.table.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDrivers.map((driver) => (
                      <TableRow key={driver.id}>
                        <TableCell className="font-medium">{driver.name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{driver.email}</div>
                            <div className="text-muted-foreground">{driver.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>{driver.vehicle}</TableCell>
                        <TableCell>{driver.license}</TableCell>
                        <TableCell>
                          <Badge variant={driver.status === "active" ? "success" : "secondary"}>
                            {t(`pages.drivers.status.${driver.status}`)}{driver.verified ? ` • ${t("pages.drivers.verified")}` : ""}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>{t("pages.drivers.pending.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("pages.drivers.table.name")}</TableHead>
                      <TableHead>{t("pages.drivers.table.contact")}</TableHead>
                      <TableHead>{t("pages.drivers.table.vehicle")}</TableHead>
                      <TableHead>{t("pages.drivers.table.license")}</TableHead>
                      <TableHead>{t("pages.drivers.pending.appliedDate")}</TableHead>
                      <TableHead className="text-right">{t("pages.drivers.table.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data ?? []).filter(d => !d.verified).map((driver) => (
                      <TableRow key={driver.id}>
                        <TableCell className="font-medium">{driver.name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{driver.email}</div>
                            <div className="text-muted-foreground">{driver.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>{driver.vehicle}</TableCell>
                        <TableCell>{driver.license}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="default" onClick={() => approveDriver.mutate(driver.id)} disabled={approveDriver.isPending}>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {t("pages.drivers.actions.approve")}
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => rejectDriver.mutate(driver.id)} disabled={rejectDriver.isPending}>
                              <XCircle className="h-4 w-4 mr-1" />
                              {t("pages.drivers.actions.reject")}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
