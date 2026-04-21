// คำนวณระยะทางระหว่างสองจุดโดยใช้ Haversine formula
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // รัศมีของโลกเป็นกิโลเมตร
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // ระยะทางเป็นกิโลเมตร
  
  return Math.round(distance * 10) / 10; // ปัดเป็นทศนิยม 1 ตำแหน่ง
};

// แปลงองศาเป็น radian
const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// คำนวณค่าโดยสาร (50 บาท/กิโลเมตร)
export const calculateFare = (distance: number): number => {
  const RATE_PER_KM = 50;
  const fare = distance * RATE_PER_KM;
  return Math.ceil(fare); // ปัดขึ้น
};

// คำนวณทั้งระยะทางและค่าโดยสาร
export const calculateDistanceAndFare = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { distance: number; fare: number } => {
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  const fare = calculateFare(distance);
  
  return { distance, fare };
};
