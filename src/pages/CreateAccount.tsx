import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
// import api from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { requirementsService, userService, adminService } from "@/services/mockService";


export default function CreateAccount() {
  const { t } = useTranslation();
  const [role, setRole] = useState<"user" | "driver" | "admin">("user");
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [isValid, setIsValid] = useState(false);
  const navigate = useNavigate();

  const { data: requirements } = useQuery<Array<{ id: string; name: string; kind: string; required: boolean }>>({
    queryKey: ["requirements", role],
    queryFn: async () => await requirementsService.getByRole(role),
  });

  

  const createUser = useMutation({
    mutationFn: async (payload: any) => await userService.create(payload),
    onSuccess: () => {
      toast({ title: t("pages.createAccount.title"), description: t("Created successfully.") as any });
      navigate("/users");
    },
    onError: (e: any) => {
      toast({ title: "Create failed", description: String(e), variant: "destructive" });
    },
  });

  const createAdmin = useMutation({
    mutationFn: async (payload: any) => await adminService.create(payload),
    onSuccess: () => {
      toast({ title: t("pages.createAccount.title"), description: t("Created successfully.") as any });
      navigate("/admins");
    },
    onError: (e: any) => {
      toast({ title: "Create failed", description: String(e), variant: "destructive" });
    },
  });

  const recomputeValidity = () => {
    if (!formRef.current) return;
    setIsValid(formRef.current.checkValidity());
  };

  useEffect(() => {
    // Recompute when role changes because required fields change
    recomputeValidity();
  }, [role]);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-up">
        <div>
          <h2 className="text-3xl font-bold">{t("pages.createAccount.title")}</h2>
          <p className="text-muted-foreground">{t("pages.createAccount.subtitle")}</p>
        </div>

        <form
          ref={formRef}
          onChange={recomputeValidity}
          onSubmit={(e) => {
            e.preventDefault();
            const form = formRef.current;
            if (!form) return;
            if (!form.checkValidity()) {
              form.reportValidity();
              toast({
                title: t("pages.createAccount.title"),
                description: t("ValidationError: Please fill all required fields.") as any,
                variant: "destructive",
              });
              return;
            }
            const base = {
              name: (form.querySelector("#name") as HTMLInputElement)?.value || undefined,
              email: (form.querySelector("#email") as HTMLInputElement)?.value || undefined,
              phone: (form.querySelector("#phone") as HTMLInputElement)?.value || "",
              status: "active",
            } as any;

            if (role === "admin") {
              const password = (form.querySelector("#password") as HTMLInputElement)?.value || "";
              const payload = { ...base, password };
              createAdmin.mutate(payload);
            } else {
              const payload = { ...base, role, trips: 0 };
              createUser.mutate(payload);
            }
          }}
          className="space-y-6"
        >
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>{t("pages.createAccount.selectRole")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-sm">
              <Select value={role} onValueChange={(v) => setRole(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("pages.createAccount.selectRole")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{t("pages.createAccount.roles.user")}</SelectItem>
                  <SelectItem value="driver">{t("pages.createAccount.roles.driver")}</SelectItem>
                  <SelectItem value="admin">{t("pages.createAccount.roles.admin")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Role requirements (from Settings) */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>{t("pages.settings.requirements.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {!requirements?.length && (
              <div className="text-sm text-muted-foreground">{t("pages.settings.requirements.loadError")}</div>
            )}
            {requirements?.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {requirements.map((r) => {
                  const key = r.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                  if (r.kind === "heading") {
                    return (
                      <div key={r.id} className="md:col-span-2">
                        <h3 className="text-base font-semibold">{r.name}</h3>
                        {r.required ? <span className="ml-2 text-xs text-muted-foreground">*</span> : null}
                      </div>
                    );
                  }
                  if (r.kind === "file") {
                    return (
                      <div key={r.id} className="space-y-2">
                        <Label htmlFor={`req-${key}`}>{r.name}</Label>
                        <Input id={`req-${key}`} type="file" />
                      </div>
                    );
                  }
                  return (
                    <div key={r.id} className="space-y-2">
                      <Label htmlFor={`req-${key}`}>{r.name}</Label>
                      <Input id={`req-${key}`} required={r.required} />
                    </div>
                  );
                })}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>{t("pages.createAccount.sections.accountInfo")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t("createAccount.fields.name")}</Label>
                <Input id="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("createAccount.fields.email")}</Label>
                <Input id="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("createAccount.fields.password")}</Label>
                <Input id="password" type="password" placeholder="••••••••" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("createAccount.fields.phone")}</Label>
                <Input id="phone" required />
              </div>
              
            </div>
          </CardContent>
        </Card>

        {role === "driver" && (
          <>
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>{t("pages.createAccount.sections.driverInfo")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleMake">{t("createAccount.fields.vehicleMake")}</Label>
                    <Input id="vehicleMake" required={role === "driver"} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleModel">{t("createAccount.fields.vehicleModel")}</Label>
                    <Input id="vehicleModel" required={role === "driver"} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleYear">{t("createAccount.fields.vehicleYear")}</Label>
                    <Input id="vehicleYear" type="number" required={role === "driver"} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleColor">{t("createAccount.fields.vehicleColor")}</Label>
                    <Input id="vehicleColor" required={role === "driver"} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plateNumber">{t("createAccount.fields.plateNumber")}</Label>
                    <Input id="plateNumber" required={role === "driver"} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleType">{t("createAccount.fields.vehicleType")}</Label>
                    <Input id="vehicleType" required={role === "driver"} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">{t("createAccount.fields.capacity")}</Label>
                    <Input id="capacity" type="number" required={role === "driver"} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insurancePolicy">{t("createAccount.fields.insurancePolicy")}</Label>
                    <Input id="insurancePolicy" required={role === "driver"} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insuranceExpiry">{t("createAccount.fields.insuranceExpiry")}</Label>
                    <Input id="insuranceExpiry" type="date" required={role === "driver"} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driverLicenseNumber">{t("createAccount.fields.driverLicenseNumber")}</Label>
                    <Input id="driverLicenseNumber" required={role === "driver"} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driverLicenseExpiry">{t("createAccount.fields.driverLicenseExpiry")}</Label>
                    <Input id="driverLicenseExpiry" type="date" required={role === "driver"} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experienceYears">{t("createAccount.fields.experienceYears")}</Label>
                    <Input id="experienceYears" type="number" required={role === "driver"} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactName">{t("createAccount.fields.emergencyContactName")}</Label>
                    <Input id="emergencyContactName" required={role === "driver"} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactPhone">{t("createAccount.fields.emergencyContactPhone")}</Label>
                    <Input id="emergencyContactPhone" required={role === "driver"} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="additionalNotes">{t("createAccount.fields.additionalNotes")}</Label>
                    <Input id="additionalNotes" required={role === "driver"} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>{t("createAccount.fields.documents")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="licenseScan">{t("createAccount.fields.licenseScan")}</Label>
                    <Input id="licenseScan" type="file" accept="image/*,application/pdf" required={role === "driver"} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registrationDoc">{t("createAccount.fields.registrationDoc")}</Label>
                    <Input id="registrationDoc" type="file" accept="image/*,application/pdf" required={role === "driver"} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insuranceDoc">{t("createAccount.fields.insuranceDoc")}</Label>
                    <Input id="insuranceDoc" type="file" accept="image/*,application/pdf" required={role === "driver"} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {role === "admin" && (
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>{t("pages.createAccount.sections.adminInfo")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="department">{t("createAccount.fields.department")}</Label>
                  <Input id="department" required={role === "admin"} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={!isValid || createUser.isPending || createAdmin.isPending}>
            {(createUser.isPending || createAdmin.isPending) ? t("Processing...") : t("pages.createAccount.submit")}
          </Button>
        </div>
      </form>
      </div>
    </DashboardLayout>
  );
}
