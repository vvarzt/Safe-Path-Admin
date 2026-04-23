// Mock data services for UI development
// Replace with Firebase services later

// Mock Users Data
const mockUsers = [
  {
    id: "1",
    email: "john.doe@example.com",
    name: "John Doe",
    phone: "+66 81 234 5678",
    status: "active",
    trips: 25,
    address: "123 Main St, Bangkok",
    role: "user",
    createdAt: "2024-01-15T10:30:00Z"
  },
  {
    id: "2",
    email: "jane.smith@example.com",
    name: "Jane Smith",
    phone: "+66 82 345 6789",
    status: "active",
    trips: 18,
    address: "456 Oak Ave, Bangkok",
    role: "user",
    createdAt: "2024-02-20T14:15:00Z"
  },
  {
    id: "3",
    email: "bob.wilson@example.com",
    name: "Bob Wilson",
    phone: "+66 83 456 7890",
    status: "suspended",
    trips: 5,
    address: "789 Pine Rd, Bangkok",
    role: "user",
    createdAt: "2024-03-10T09:45:00Z"
  }
];

// Mock caregivers Data
const mockcaregivers = [
  {
    id: "1",
    name: "Mike Johnson",
    email: "mike.johnson@example.com",
    phone: "+66 84 567 8901",
    vehicle: "Toyota Camry",
    license: "DL123456789",
    status: "active",
    verified: true,
    locationLat: 13.7563,
    locationLng: 100.5018,
    currentTrip: null,
    createdAt: "2024-01-10T08:00:00Z"
  },
  {
    id: "2",
    name: "Sarah Davis",
    email: "sarah.davis@example.com",
    phone: "+66 85 678 9012",
    vehicle: "Honda Civic",
    license: "DL987654321",
    status: "active",
    verified: true,
    locationLat: 13.7456,
    locationLng: 100.5234,
    currentTrip: "trip_123",
    createdAt: "2024-02-05T11:30:00Z"
  },
  {
    id: "3",
    name: "Tom Brown",
    email: "tom.brown@example.com",
    phone: "+66 86 789 0123",
    vehicle: "Nissan Altima",
    license: "DL456789123",
    status: "pending",
    verified: false,
    locationLat: null,
    locationLng: null,
    currentTrip: null,
    createdAt: "2024-03-15T16:20:00Z"
  }
];

// Mock Trips Data
const mockTrips = [
  {
    id: "1",
    riderId: "1",
    caregiverId: "1",
    fromAddress: "Central World, Bangkok",
    toAddress: "Suvarnabhumi Airport",
    status: "completed",
    amountCents: 25000,
    startTime: new Date("2024-04-15T10:00:00Z"),
    endTime: new Date("2024-04-15T11:30:00Z"),
    createdAt: new Date("2024-04-15T09:45:00Z")
  },
  {
    id: "2",
    riderId: "2",
    caregiverId: "2",
    fromAddress: "Siam Paragon, Bangkok",
    toAddress: "Chatuchak Weekend Market",
    status: "in_progress",
    amountCents: 15000,
    startTime: new Date("2024-04-15T14:00:00Z"),
    endTime: null,
    createdAt: new Date("2024-04-15T13:30:00Z")
  },
  {
    id: "3",
    riderId: "3",
    caregiverId: null,
    fromAddress: "MBK Center, Bangkok",
    toAddress: "Victory Monument",
    status: "requested",
    amountCents: 12000,
    startTime: null,
    endTime: null,
    createdAt: new Date("2024-04-15T15:00:00Z")
  }
];

// Mock Payments Data
const mockPayments = [
  {
    id: "1",
    tripId: "1",
    payerName: "John Doe",
    amountCents: 25000,
    method: "credit_card",
    status: "success",
    reference: "PAY_001",
    proofUrl: null,
    createdAt: new Date("2024-04-15T11:35:00Z")
  },
  {
    id: "2",
    tripId: "2",
    payerName: "Jane Smith",
    amountCents: 15000,
    method: "cash",
    status: "pending",
    reference: "PAY_002",
    proofUrl: null,
    createdAt: new Date("2024-04-15T14:15:00Z")
  }
];

// Mock Admins Data
const mockAdmins = [
  {
    id: "1",
    email: "admin@safe-path.com",
    name: "System Admin",
    phone: "+66 80 000 0000",
    status: "active",
    address: "Admin Office, Bangkok",
    role: "admin",
    createdAt: "2024-01-01T00:00:00Z"
  }
];

// Mock Requirements Data
const mockRequirements = [
  {
    id: "1",
    role: "user",
    name: "ID Card",
    kind: "file",
    description: "Upload your ID card photo",
    required: true,
    createdAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "2",
    role: "caregiver",
    name: "caregiver License",
    kind: "file",
    description: "Upload your caregiver license",
    required: true,
    createdAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "3",
    role: "caregiver",
    name: "Vehicle Registration",
    kind: "file",
    description: "Upload vehicle registration document",
    required: true,
    createdAt: "2024-01-01T00:00:00Z"
  }
];

// Mock Metrics Data
const mockMetrics = {
  totalUsers: 1250,
  activecaregivers: 85,
  totalTrips: 3420,
  revenueCents: 1250000,
  avgTripTime: 25,
  cancellationRate: 3.2,
  caregiverUtilization: 78.5,
  weeklyTrips: [
    { name: "Mon", trips: 520 },
    { name: "Tue", trips: 480 },
    { name: "Wed", trips: 550 },
    { name: "Thu", trips: 490 },
    { name: "Fri", trips: 620 },
    { name: "Sat", trips: 380 },
    { name: "Sun", trips: 380 },
  ],
  revenueByDay: [
    { name: "Mon", revenueCents: 185000 },
    { name: "Tue", revenueCents: 172000 },
    { name: "Wed", revenueCents: 198000 },
    { name: "Thu", revenueCents: 176000 },
    { name: "Fri", revenueCents: 224000 },
    { name: "Sat", revenueCents: 136000 },
    { name: "Sun", revenueCents: 136000 },
  ],
  tripStatusDistribution: [
    { status: "completed", count: 3200 },
    { status: "cancelled", count: 110 },
    { status: "in_progress", count: 85 },
    { status: "pending", count: 25 },
  ],
  recentActivity: [
    { type: "trip_completed", title: "Trip #1234 completed", createdAt: new Date().toISOString(), amountCents: 25000 },
    { type: "new_caregiver", title: "caregiver John Doe registered", createdAt: new Date().toISOString() },
    { type: "payment", title: "Payment received", createdAt: new Date().toISOString(), amountCents: 15000 },
  ]
};

// Mock Services
export const userService = {
  async getAll() {
    return new Promise(resolve => setTimeout(() => resolve(mockUsers), 500));
  },

  async getById(id: string) {
    return new Promise(resolve => setTimeout(() => {
      const user = mockUsers.find(u => u.id === id);
      resolve(user || null);
    }, 300));
  },

  async create(data: any) {
    return new Promise(resolve => setTimeout(() => {
      const newId = (mockUsers.length + 1).toString();
      mockUsers.push({ ...data, id: newId, createdAt: new Date().toISOString() });
      resolve(newId);
    }, 500));
  },

  async update(id: string, data: any) {
    return new Promise(resolve => setTimeout(() => {
      const index = mockUsers.findIndex(u => u.id === id);
      if (index !== -1) {
        mockUsers[index] = { ...mockUsers[index], ...data };
      }
    }, 300));
  },

  async delete(id: string) {
    return new Promise(resolve => setTimeout(() => {
      const index = mockUsers.findIndex(u => u.id === id);
      if (index !== -1) {
        mockUsers.splice(index, 1);
      }
    }, 300));
  }
};

export const caregiverService = {
  async getAll() {
    return new Promise(resolve => setTimeout(() => resolve(mockcaregivers), 500));
  },

  async getById(id: string) {
    return new Promise(resolve => setTimeout(() => {
      const caregiver = mockcaregivers.find(d => d.id === id);
      resolve(caregiver || null);
    }, 300));
  },

  async create(data: any) {
    return new Promise(resolve => setTimeout(() => {
      const newId = (mockcaregivers.length + 1).toString();
      mockcaregivers.push({ ...data, id: newId, createdAt: new Date().toISOString() });
      resolve(newId);
    }, 500));
  },

  async update(id: string, data: any) {
    return new Promise(resolve => setTimeout(() => {
      const index = mockcaregivers.findIndex(d => d.id === id);
      if (index !== -1) {
        mockcaregivers[index] = { ...mockcaregivers[index], ...data };
      }
    }, 300));
  },

  async delete(id: string) {
    return new Promise(resolve => setTimeout(() => {
      const index = mockcaregivers.findIndex(d => d.id === id);
      if (index !== -1) {
        mockcaregivers.splice(index, 1);
      }
    }, 300));
  }
};

export const tripService = {
  async getAll() {
    return new Promise(resolve => setTimeout(() => resolve(mockTrips), 500));
  },

  async getById(id: string) {
    return new Promise(resolve => setTimeout(() => {
      const trip = mockTrips.find(t => t.id === id);
      resolve(trip || null);
    }, 300));
  },

  async create(data: any) {
    return new Promise(resolve => setTimeout(() => {
      const newId = (mockTrips.length + 1).toString();
      mockTrips.push({ ...data, id: newId, createdAt: new Date() });
      resolve(newId);
    }, 500));
  },

  async update(id: string, data: any) {
    return new Promise(resolve => setTimeout(() => {
      const index = mockTrips.findIndex(t => t.id === id);
      if (index !== -1) {
        mockTrips[index] = { ...mockTrips[index], ...data };
      }
    }, 300));
  },

  async delete(id: string) {
    return new Promise(resolve => setTimeout(() => {
      const index = mockTrips.findIndex(t => t.id === id);
      if (index !== -1) {
        mockTrips.splice(index, 1);
      }
    }, 300));
  }
};

export const paymentService = {
  async getAll() {
    return new Promise(resolve => setTimeout(() => resolve(mockPayments), 500));
  },

  async getById(id: string) {
    return new Promise(resolve => setTimeout(() => {
      const payment = mockPayments.find(p => p.id === id);
      resolve(payment || null);
    }, 300));
  },

  async create(data: any) {
    return new Promise(resolve => setTimeout(() => {
      const newId = (mockPayments.length + 1).toString();
      mockPayments.push({ ...data, id: newId, createdAt: new Date() });
      resolve(newId);
    }, 500));
  },

  async update(id: string, data: any) {
    return new Promise(resolve => setTimeout(() => {
      const index = mockPayments.findIndex(p => p.id === id);
      if (index !== -1) {
        mockPayments[index] = { ...mockPayments[index], ...data };
      }
    }, 300));
  },

  async delete(id: string) {
    return new Promise(resolve => setTimeout(() => {
      const index = mockPayments.findIndex(p => p.id === id);
      if (index !== -1) {
        mockPayments.splice(index, 1);
      }
    }, 300));
  }
};

export const adminService = {
  async getAll() {
    return new Promise(resolve => setTimeout(() => resolve(mockAdmins), 500));
  },

  async getById(id: string) {
    return new Promise(resolve => setTimeout(() => {
      const admin = mockAdmins.find(a => a.id === id);
      resolve(admin || null);
    }, 300));
  },

  async create(data: any) {
    return new Promise(resolve => setTimeout(() => {
      const newId = (mockAdmins.length + 1).toString();
      mockAdmins.push({ ...data, id: newId, createdAt: new Date().toISOString() });
      resolve(newId);
    }, 500));
  },

  async update(id: string, data: any) {
    return new Promise(resolve => setTimeout(() => {
      const index = mockAdmins.findIndex(a => a.id === id);
      if (index !== -1) {
        mockAdmins[index] = { ...mockAdmins[index], ...data };
      }
    }, 300));
  },

  async delete(id: string) {
    return new Promise(resolve => setTimeout(() => {
      const index = mockAdmins.findIndex(a => a.id === id);
      if (index !== -1) {
        mockAdmins.splice(index, 1);
      }
    }, 300));
  }
};

export const requirementsService = {
  async getByRole(role: string) {
    return new Promise(resolve => setTimeout(() => {
      const requirements = mockRequirements.filter(r => r.role === role);
      resolve(requirements);
    }, 300));
  },

  async create(data: any) {
    return new Promise(resolve => setTimeout(() => {
      const newId = (mockRequirements.length + 1).toString();
      mockRequirements.push({ ...data, id: newId, createdAt: new Date().toISOString() });
      resolve(newId);
    }, 500));
  },

  async delete(id: string) {
    return new Promise(resolve => setTimeout(() => {
      const index = mockRequirements.findIndex(r => r.id === id);
      if (index !== -1) {
        mockRequirements.splice(index, 1);
      }
    }, 300));
  }
};

// Mock metrics function
export const getMockMetrics = () => {
  return new Promise(resolve => setTimeout(() => resolve(mockMetrics), 500));
};