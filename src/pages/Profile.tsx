import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: me, isLoading, isError, error } = useQuery({
    queryKey: ["auth","me"],
    queryFn: async () => {
      try {
        const uid = localStorage.getItem("auth_uid");
        if (!uid) throw new Error("Not authenticated");

        const adminDocRef = doc(db, 'admin', uid);
        const adminDocSnap = await getDoc(adminDocRef);

        const email = localStorage.getItem("auth_email") || "";

        if (adminDocSnap.exists()) {
          const data = adminDocSnap.data();
          return {
            id: uid,
            email: email,
            name: data.name || "",
            phone: data.phone || "",
            address: data.address || "",
            role: data.role || "admin"
          };
        } else {
          // Return empty values if no data exists
          return {
            id: uid,
            email: email,
            name: "",
            phone: "",
            address: "",
            role: "admin"
          };
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        throw err;
      }
    },
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (me) {
      setName(me.name);
      setEmail(me.email);
      setPhone(me.phone);
      setRole(me.role);
      setAddress(me.address);
    }
  }, [me]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const uid = localStorage.getItem("auth_uid");
      if (!uid) throw new Error("Not authenticated");

      const adminDocRef = doc(db, 'admin', uid);
      await setDoc(adminDocRef, {
        name: name || null,
        phone: phone || null,
        address: address || null,
        role: role || "admin"
      });

      return { success: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth","me"] });
      toast({ title: t("pages.profile.title"), description: t("actions.updateProfile") });
    },
    onError: (e: any) => {
      toast({ title: t("pages.profile.title"), description: String(e?.message ?? e), variant: "destructive" });
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-up">
        <div>
          <h2 className="text-3xl font-bold">{t("pages.profile.title")}</h2>
          <p className="text-muted-foreground">{t("pages.profile.subtitle")}</p>
        </div>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>{t("pages.profile.accountInfo")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && <div className="text-sm text-muted-foreground">Loading...</div>}
            {isError && <div className="text-sm text-destructive">Failed to load profile: {error?.message || "Unknown error"}</div>}
            {!isLoading && !isError && me && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t("profile.fields.name")}</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("profile.fields.email")}</Label>
                <Input id="email" type="email" value={email} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("profile.fields.phone")}</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">{t("profile.fields.role")}</Label>
                <Input id="role" value={role} disabled />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">{t("profile.fields.address")}</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
            </div>
            )}
            {!isLoading && !isError && me && (
            <div className="flex justify-end mt-6">
              <Button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending}>
                {t("actions.updateProfile")}
              </Button>
            </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
