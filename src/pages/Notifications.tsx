import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function Notifications() {
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Notification settings have been updated successfully.",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">{t("pages.notifications.title")}</h2>
          <p className="text-muted-foreground">{t("pages.notifications.subtitle")}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("pages.notifications.tripStarted")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trip-started">{t("pages.notifications.messageTemplate")}</Label>
                <Textarea
                  id="trip-started"
                  placeholder="Enter notification message..."
                  defaultValue="รถกำลังเดินทางไปรับคุณ คาดว่าจะถึงใน {time} นาที"
                  rows={4}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="trip-started-toggle">{t("pages.notifications.enable")}</Label>
                <Switch id="trip-started-toggle" defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("pages.notifications.arrived")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trip-completed">{t("pages.notifications.messageTemplate")}</Label>
                <Textarea
                  id="trip-completed"
                  placeholder="Enter notification message..."
                  defaultValue="ผู้ป่วยถึงจุดหมายแล้ว ขอบคุณที่ใช้บริการ"
                  rows={4}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="trip-completed-toggle">{t("pages.notifications.enable")}</Label>
                <Switch id="trip-completed-toggle" defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("pages.notifications.emergency")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emergency">{t("pages.notifications.messageTemplate")}</Label>
                <Textarea
                  id="emergency"
                  placeholder="Enter notification message..."
                  defaultValue="⚠️ เกิดเหตุฉุกเฉิน กรุณาตรวจสอบสถานะการเดินทาง"
                  rows={4}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="emergency-toggle">{t("pages.notifications.enable")}</Label>
                <Switch id="emergency-toggle" defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("pages.notifications.payment")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payment">{t("pages.notifications.messageTemplate")}</Label>
                <Textarea
                  id="payment"
                  placeholder="Enter notification message..."
                  defaultValue="ชำระเงินสำเร็จ ยอดเงิน {amount} บาท"
                  rows={4}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="payment-toggle">{t("pages.notifications.enable")}</Label>
                <Switch id="payment-toggle" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave}>{t("pages.notifications.saveAll")}</Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
