import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Hotel, User, Alert } from './models.ts';
import dotenv from 'dotenv';

dotenv.config();

async function seed() {
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/crisislink";
  await mongoose.connect(MONGODB_URI);

  const passwordHash = await bcrypt.hash('demo2024', 10);

  // 1. Hotel
  let hotel = await Hotel.findOne({ hotelCode: 'GRAND1' });
  if (!hotel) {
    hotel = await Hotel.create({
      name: 'Hotel Grand Chennai',
      email: 'admin@hotelgrand.com',
      passwordHash,
      hotelCode: 'GRAND1',
      address: '42 Anna Salai Chennai 600002',
      phone: '+91 44 2345 6789',
      lat: 13.0827,
      lng: 80.2707,
      totalFloors: 10,
      settings: { autoSms: true, safetyConfirmTimeout: 60 }
    });
  }

  // 2. Staff
  const staff = [
    { name: 'Anil Kumar', email: 'duty@hotelgrand.com', phone: '9000000001', staffRole: 'duty_manager' },
    { name: 'Deepa Rajan', email: 'security@hotelgrand.com', phone: '9000000002', staffRole: 'security' }
  ];
  for (const s of staff) {
    const existing = await User.findOne({ email: s.email });
    if (!existing) {
      await User.create({ ...s, role: 'hotel_staff', hotelId: hotel._id, passwordHash });
    } else {
      existing.passwordHash = passwordHash;
      if (!existing.phone) existing.phone = s.phone;
      await existing.save();
    }
  }

  // 3. Guests Floor 6
  const guests = [
    { name: 'Priya Sharma', room: '604', phone: '9876543210' },
    { name: 'Arjun Mehta', room: '601', phone: '9876543211' },
    { name: 'Riya Patel', room: '608', phone: '9876543212' },
    { name: 'Vikram Nair', room: '612', phone: '9876543213' }
  ];
  for (const g of guests) {
    if (!await User.findOne({ phone: g.phone })) {
      await User.create({ ...g, role: 'guest', hotelId: hotel._id, floor: 6 });
    }
  }

  // 4. Responders
  const responders = [
    { 
      name: 'Rajan Pillai', email: 'rajan@chn-fire.gov.in', phone: '9000000003',
      agency: 'Chennai Fire Station 4', responderType: 'fire',
      coverageZones: ['600001', '600002', '600003'],
      lat: 13.0910, lng: 80.2820, available: true, reliabilityScore: 0.97
    },
    { 
      name: 'Dr Kavitha S', email: 'kavitha@chn-ems.gov.in', phone: '9000000004',
      agency: 'Chennai EMS Unit 2', responderType: 'medical',
      coverageZones: ['600001', '600002', '600003'],
      lat: 13.0740, lng: 80.2660, available: true, reliabilityScore: 0.94
    }
  ];
  for (const r of responders) {
    const existing = await User.findOne({ email: r.email });
    if (!existing) {
      await User.create({ ...r, role: 'responder', passwordHash });
    } else {
      existing.passwordHash = passwordHash;
      if (!existing.phone) existing.phone = r.phone;
      await existing.save();
    }
  }

  // 5. Past Alerts
  if (await Alert.countDocuments() === 0) {
    const priya = await User.findOne({ name: 'Priya Sharma' });
    await Alert.create({
      type: 'medical', severity: 'high', floor: 6, room: '604',
      description: 'Breathing difficulty',
      raisedBy: priya?._id, raisedByRole: 'guest',
      hotelId: hotel._id, status: 'resolved',
      raisedAt: new Date(Date.now() - 86400000),
      resolvedAt: new Date(Date.now() - 86200000)
    });
  }

  console.log('Seeding complete!');
  process.exit();
}

seed();
