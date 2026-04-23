import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Eye, CheckCircle, XCircle, Trash } from "lucide-react";
import { db } from "@/firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";

export default function Caregivers() {
  const [list, setList] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [open, setOpen] = useState(false);

  function InfoRow({ label, value }: { label: string; value?: string | null }) {
    return (
      <div className="flex justify-between border-b py-2 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-right">{value || "-"}</span>
      </div>
    );
  }

  function DocumentImage({ label, src }: { label: string; src?: string }) {
    const [open, setOpen] = useState(false);
    const isValid = !!src;

    return (
      <>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{label}</p>

          <div
            className="h-32 border rounded-lg flex items-center justify-center cursor-pointer overflow-hidden"
            onClick={() => isValid && setOpen(true)}
          >
            {isValid ? (
              <img
                src={src}
                loading="lazy"
                className="w-full h-full object-cover transition-opacity duration-300"
                style={{ background: "#eee" }}
              />
            ) : (
              <span className="text-xs text-muted-foreground">ไม่มีรูป</span>
            )}
          </div>
        </div>

        {open && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
            onClick={() => setOpen(false)}
          >
            <img
              src={src}
              loading="lazy"
              className="w-full h-full object-cover transition-opacity duration-300"
              style={{ background: "#eee" }}
            />
          </div>
        )}
      </>
    );
  }

  const formatDate = (raw: any) => {
    if (!raw) return "-";
    const date = raw?.toDate ? raw.toDate() : new Date(raw);
    return date.toLocaleDateString("th-TH");
  };

  // ✅ โหลดข้อมูล realtime
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "caregivers"), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      console.log("DATA:", data); // 👈 เช็คตรงนี้

      setList(data);
    });

    return () => unsub();
  }, []);

  // ✅ filter
  const filtered = list.filter(c =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  // ✅ approve
  const handleApprove = async (c: any) => {
    await updateDoc(doc(db, "caregivers", c.id), {
      isApproved: true,
      approvedAt: new Date().toISOString()
    });
  };

  // ✅ ban
  const handleBan = async (c: any) => {
    await updateDoc(doc(db, "caregivers", c.id), {
      status: "banned"
    });
  };

  // ✅ delete
  const handleDelete = async (c: any) => {
    await deleteDoc(doc(db, "caregivers", c.id));
  };

  // ✅ badge status
  const statusBadge = (c: any) => {
    if (c.status === "banned")
      return <Badge variant="destructive">Banned</Badge>;

    if (!c.isApproved)
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;

    return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        <div>
          <h2 className="text-3xl font-bold">Caregivers</h2>
          <p className="text-muted-foreground">Manage all caregivers</p>
        </div>

        {/* SEARCH */}
        <Input
          placeholder="ค้นหา..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />

        {/* TABLE */}
        <Card>
          <CardHeader>
            <CardTitle>All Caregivers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>UID</TableHead>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>เบอร์</TableHead>
                  <TableHead>จังหวัด</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell
                      className="text-xs text-gray-500 cursor-pointer"
                      onClick={() => navigator.clipboard.writeText(c.uid || c.id)}
                    >
                      {c.uid || c.id}
                    </TableCell>
                    <TableCell>
                      {c.firstName} {c.lastName}
                    </TableCell>

                    <TableCell>{c.phone}</TableCell>
                    <TableCell>{c.province}</TableCell>

                    <TableCell>
                      {statusBadge(c)}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">

                        {/* VIEW */}
                        <Button size="icon" variant="ghost"
                          onClick={() => {
                            if (c.image) {
                              const img = new Image();
                              img.src = c.image;
                            }
                            setSelected(c);
                            setOpen(true);
                          }}>
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* APPROVE */}
                        {!c.isApproved && (
                          <Button size="icon"
                            onClick={() => handleApprove(c)}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}

                        {/* BAN */}
                        <Button size="icon" variant="destructive"
                          onClick={() => handleBan(c)}>
                          <XCircle className="h-4 w-4" />
                        </Button>

                        {/* DELETE */}
                        <Button size="icon" variant="outline"
                          onClick={() => handleDelete(c)}>
                          <Trash className="h-4 w-4" />
                        </Button>

                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* DETAIL DIALOG */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">

            <DialogHeader>
              <DialogTitle>Caregiver Detail</DialogTitle>
            </DialogHeader>

            {selected && (
              <div className="space-y-6">

                {/* HEADER */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-xl overflow-hidden">
                    {selected.image ? (
                      <img src={selected.image} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-lg font-bold">
                        {selected.firstName?.[0]}
                      </div>
                    )}
                  </div>

                  <div>
                    <h2 className="text-xl font-bold">
                      {selected.firstName} {selected.lastName}
                    </h2>
                    <p className="text-sm text-muted-foreground">{selected.email}</p>
                  </div>
                </div>

                {/* GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* LEFT */}
                  <div className="space-y-4">

                    <Card>
                      <CardHeader><CardTitle>ข้อมูลส่วนตัว</CardTitle></CardHeader>
                      <CardContent>
                        <InfoRow label="ชื่อ" value={`${selected.firstName} ${selected.lastName}`} />
                        <InfoRow label="เพศ" value={selected.gender} />
                        <InfoRow label="วันเกิด" value={formatDate(selected.birthDate)} />
                        <InfoRow label="เบอร์" value={selected.phone} />
                        <InfoRow label="อีเมล" value={selected.email} />
                        <InfoRow
                          label="ที่อยู่"
                          value={[
                            selected.address,
                            selected.subdistrict,
                            selected.district,
                            selected.province,
                            selected.zipcode,
                          ].join(" ")}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle>ผู้ติดต่อฉุกเฉิน</CardTitle></CardHeader>
                      <CardContent>
                        <InfoRow label="ชื่อ" value={selected.contactName} />
                        <InfoRow label="ความสัมพันธ์" value={selected.relation} />
                        <InfoRow label="เบอร์" value={selected.contactPhone} />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle>ธนาคาร</CardTitle></CardHeader>
                      <CardContent>
                        <InfoRow label="ธนาคาร" value={selected.bank} />
                        <InfoRow label="เลขบัญชี" value={selected.accountNumber} />
                      </CardContent>
                    </Card>

                  </div>

                  {/* RIGHT */}
                  <div className="space-y-4">

                    <Card>
                      <CardHeader><CardTitle>เอกสาร</CardTitle></CardHeader>
                      <CardContent className="grid grid-cols-2 gap-3">
                        <DocumentImage label="โปรไฟล์" src={selected.image} />
                        <DocumentImage label="บัตรประชาชน" src={selected.idCard} />
                        <DocumentImage label="สมุดบัญชี" src={selected.bookBank} />
                        <DocumentImage label="ใบรับรอง" src={selected.certificate} />
                        <DocumentImage label="บ้าน" src={selected.house} />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="text-xs text-muted-foreground">
                        UID: {selected.uid}
                      </CardContent>
                    </Card>

                  </div>
                </div>

              </div>
            )}

          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}