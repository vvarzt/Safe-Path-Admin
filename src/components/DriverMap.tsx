import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Phone, Car, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
// import api from "@/lib/api";

interface Driver {
  id: number;
  name: string;
  phone: string;
  vehicle: string;
  license: string;
  status: "active" | "busy" | string;
  location: {
    lat: number;
    lng: number;
  };
  currentTrip?: string;
}

type DriverApi = {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  vehicle: string;
  license: string;
  status: string;
  verified: boolean;
  locationLat?: number | null;
  locationLng?: number | null;
  currentTrip?: string | null;
};

export default function DriverMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const markers = useRef<MapLibreMarker[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const movementTimer = useRef<number | null>(null);
  const [incidents, setIncidents] = useState<{ id: string; lat: number; lng: number; time: number }[]>([]);
  const [notifiedDriverIds, setNotifiedDriverIds] = useState<number[]>([]);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [nearbyForAssign, setNearbyForAssign] = useState<Driver[]>([]);
  const { toast } = useToast();

  const { data, isLoading, isError, refetch } = useQuery<DriverApi[]>({
    queryKey: ["drivers-map"],
    queryFn: async () => (await api.get("/drivers")).data,
    // poll more frequently for near real-time updates
    refetchInterval: 3000,
  });

  const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  // Create a polygon circle (approx) around [lng,lat] with radiusKm
  const polygonCircle = (lng: number, lat: number, radiusKm: number, steps = 64) => {
    const coords: [number, number][] = [];
    const R = 6371; // km
    const d = radiusKm / R;
    const latRad = (lat * Math.PI) / 180;
    const lonRad = (lng * Math.PI) / 180;
    for (let i = 0; i <= steps; i++) {
      const brng = (2 * Math.PI * i) / steps;
      const lat2 = Math.asin(
        Math.sin(latRad) * Math.cos(d) + Math.cos(latRad) * Math.sin(d) * Math.cos(brng)
      );
      const lon2 =
        lonRad +
        Math.atan2(
          Math.sin(brng) * Math.sin(d) * Math.cos(latRad),
          Math.cos(d) - Math.sin(latRad) * Math.sin(lat2)
        );
      coords.push([(lon2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
    }
    return {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          properties: {},
          geometry: {
            type: "Polygon" as const,
            coordinates: [coords],
          },
        },
      ],
    };
  };

  const initializeMap = () => {
    if (!mapContainer.current || map.current) return;

    const key = import.meta.env.VITE_MAPTILER_KEY as string | undefined;
    const style = key
      ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${key}`
      : "https://demotiles.maplibre.org/style.json"; // fallback if no key

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style,
      center: [100.5018, 13.7563], // Bangkok
      zoom: 12,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      setIsMapReady(true);
      addDriverMarkers();
    });

    map.current.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      const id = `${Date.now()}`;
      const markerEl = document.createElement("div");
      markerEl.style.width = "22px";
      markerEl.style.height = "22px";
      markerEl.style.borderRadius = "50%";
      markerEl.style.background = "#ef4444";
      markerEl.style.border = "3px solid white";
      markerEl.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
      new maplibregl.Marker(markerEl).setLngLat([lng, lat]).addTo(map.current!);

      setIncidents((prev) => [{ id, lat, lng, time: Date.now() }, ...prev].slice(0, 5));

      const nearby = drivers.filter((d) => haversineKm(d.location, { lat, lng }) <= 2);
      setNotifiedDriverIds(nearby.map((d) => d.id));

      // Draw 2km area
      const circleData = polygonCircle(lng, lat, 2);
      if (map.current!.getSource("incident-area")) {
        (map.current!.getSource("incident-area") as any).setData(circleData as any);
      } else {
        map.current!.addSource("incident-area", { type: "geojson", data: circleData as any });
        map.current!.addLayer({
          id: "incident-area-fill",
          type: "fill",
          source: "incident-area",
          paint: { "fill-color": "#ef4444", "fill-opacity": 0.12 },
        });
        map.current!.addLayer({
          id: "incident-area-line",
          type: "line",
          source: "incident-area",
          paint: { "line-color": "#ef4444", "line-width": 2, "line-dasharray": [2, 2] },
        });
      }

      toast({
        title: "Incident reported",
        description: `${nearby.length} drivers notified within 2 km`,
      });

      // Play alert sound via Web Audio API
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = 880;
        o.connect(g);
        g.connect(ctx.destination);
        g.gain.setValueAtTime(0.001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
        o.start();
        o.stop(ctx.currentTime + 0.4);
      } catch {}

      // Open assign dialog
      setNearbyForAssign(nearby);
      setIsAssignOpen(true);
    });
  };

  const addDriverMarkers = () => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    drivers.forEach((driver) => {
      const el = document.createElement("div");
      el.className = "driver-marker";
      el.style.width = "40px";
      el.style.height = "40px";
      el.style.borderRadius = "50%";
      el.style.cursor = "pointer";
      el.style.border = "3px solid white";
      el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.fontSize = "20px";
      el.style.backgroundColor =
        driver.status === "active" ? "hsl(var(--success))" : "hsl(var(--warning))";
      el.innerHTML = "🚗";

      el.addEventListener("click", () => {
        setSelectedDriver(driver);
        map.current?.flyTo({
          center: [driver.location.lng, driver.location.lat],
          zoom: 15,
        });
      });

      const marker = new maplibregl.Marker(el)
        .setLngLat([driver.location.lng, driver.location.lat])
        .addTo(map.current!);

      markers.current.push(marker);
    });
  };

  useEffect(() => {
    if (!map.current) {
      initializeMap();
    }
  }, []);

  // Map API data -> local state
  useEffect(() => {
    if (!data) return;
    const mapped: Driver[] = data.map((d) => ({
      id: d.id,
      name: d.name,
      phone: d.phone,
      vehicle: d.vehicle,
      license: d.license,
      status: (d.status as any) ?? "active",
      location: {
        lat: typeof d.locationLat === "number" ? d.locationLat : 13.7563,
        lng: typeof d.locationLng === "number" ? d.locationLng : 100.5018,
      },
      currentTrip: d.currentTrip ?? undefined,
    }));
    setDrivers(mapped);
  }, [data]);

  useEffect(() => {
    if (isMapReady) {
      addDriverMarkers();
    }
  }, [drivers, isMapReady]);

  // Real-time movement now depends on backend updates; no local simulation

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="p-0">
            <div ref={mapContainer} className="h-[600px] rounded-lg" />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {incidents[0] && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                ล่าสุด: เหตุการณ์บนแผนที่
              </h3>
              <div className="text-sm text-muted-foreground">
                พิกัด {incidents[0].lat.toFixed(4)}, {incidents[0].lng.toFixed(4)} • {new Date(incidents[0].time).toLocaleTimeString()}
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              คนขับทั้งหมด ({drivers.length})
            </h3>
            <div className="space-y-3">
              {drivers.map((driver) => (
                <div
                  key={driver.id}
                  onClick={() => {
                    setSelectedDriver(driver);
                    map.current?.flyTo({
                      center: [driver.location.lng, driver.location.lat],
                      zoom: 15,
                    });
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    selectedDriver?.id === driver.id
                      ? "bg-primary/10 border-primary"
                      : "bg-card border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium">{driver.name}</div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={driver.status === "active" ? "success" : "secondary"}
                      >
                        {driver.status === "active" ? "ว่าง" : "ให้บริการ"}
                      </Badge>
                      {notifiedDriverIds.includes(driver.id) && (
                        <Badge variant="destructive">แจ้งเหตุใกล้คุณ</Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Car className="h-3 w-3" />
                      {driver.vehicle}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {driver.phone}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedDriver && (
          <Card className="border-primary">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">รายละเอียดคนขับ</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">ชื่อ</div>
                  <div className="font-medium">{selectedDriver.name}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">เบอร์โทร</div>
                  <div className="font-medium">{selectedDriver.phone}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">ยานพาหนะ</div>
                  <div className="font-medium">{selectedDriver.vehicle}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">ทะเบียน</div>
                  <div className="font-medium">{selectedDriver.license}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">สถานะ</div>
                  <Badge
                    variant={
                      selectedDriver.status === "active" ? "success" : "secondary"
                    }
                  >
                    {selectedDriver.status === "active" ? "พร้อมให้บริการ" : "กำลังให้บริการ"}
                  </Badge>
                </div>
                {selectedDriver.currentTrip && (
                  <div>
                    <div className="text-sm text-muted-foreground">งานปัจจุบัน</div>
                    <div className="font-medium text-sm">
                      {selectedDriver.currentTrip}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>แจ้งเหตุและมอบหมายงาน</DialogTitle>
              <DialogDescription>
                พบคนขับใกล้เคียง {nearbyForAssign.length} คน ในรัศมี 2 กม. เลือกเพื่อมอบหมายไปยังจุดเกิดเหตุ
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {nearbyForAssign.length === 0 && (
                <div className="text-sm text-muted-foreground">ไม่พบบุคลากรใกล้เคียง</div>
              )}
              {nearbyForAssign.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-2 rounded-md border">
                  <div>
                    <div className="font-medium">{d.name}</div>
                    <div className="text-xs text-muted-foreground">{d.vehicle} • {d.phone}</div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      toast({ title: "Assigned", description: `มอบหมาย ${d.name} ไปยังจุดเกิดเหตุแล้ว` });
                      setIsAssignOpen(false);
                    }}
                  >
                    มอบหมาย
                  </Button>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignOpen(false)}>ปิด</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
