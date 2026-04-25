import mongoose, { Schema, Document } from 'mongoose';

export interface IHotel extends Document {
  name: string;
  email: string;
  passwordHash: string;
  hotelCode: string; // 6 char auto-gen
  address: string;
  phone: string;
  lat: number;
  lng: number;
  floorPlans: Array<{ floor: number; imagePath: string }>;
  totalFloors: number;
  settings: {
    autoSms: boolean;
    safetyConfirmTimeout: number;
  };
}

const HotelSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  hotelCode: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  phone: { type: String, default: "555-0000" },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  floorPlans: [{ floor: Number, imagePath: String }],
  totalFloors: { type: Number, default: 1 },
  settings: {
    autoSms: { type: Boolean, default: true },
    safetyConfirmTimeout: { type: Number, default: 60 }
  }
});

export const Hotel = mongoose.model<IHotel>('Hotel', HotelSchema);

export interface IUser extends Document {
  name: string;
  email?: string;
  phone: string;
  passwordHash?: string;
  role: 'guest' | 'hotel_staff' | 'responder';
  
  // Guest fields
  hotelId?: mongoose.Types.ObjectId;
  floor?: number;
  room?: string;
  checkInTime?: Date;
  safetyBriefing?: string;

  // Staff fields
  staffRole?: string;

  // Responder fields
  agency?: string;
  responderType?: 'fire' | 'medical' | 'security' | 'general';
  coverageZones?: string[];
  available?: boolean;
  reliabilityScore?: number;
  lat?: number;
  lng?: number;
  totalResponses?: number;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, required: true },
  passwordHash: { type: String },
  role: { type: String, enum: ['guest', 'hotel_staff', 'responder'], required: true },
  
  hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel' },
  floor: { type: Number },
  room: { type: String },
  checkInTime: { type: Date },
  safetyBriefing: { type: String },

  staffRole: { type: String },

  agency: { type: String },
  responderType: { type: String, enum: ['fire', 'medical', 'security', 'general'] },
  coverageZones: [String],
  available: { type: Boolean, default: false },
  reliabilityScore: { type: Number, default: 0.8 },
  lat: { type: Number },
  lng: { type: Number },
  totalResponses: { type: Number, default: 0 }
});

export const User = mongoose.model<IUser>('User', UserSchema);

export interface IAlert extends Document {
  type: 'fire' | 'medical' | 'security' | 'general';
  severity: 'critical' | 'high' | 'low';
  floor: number;
  room: string;
  description: string;
  raisedBy: mongoose.Types.ObjectId;
  raisedByRole: string;
  hotelId: mongoose.Types.ObjectId;
  responderId?: mongoose.Types.ObjectId;
  status: 'open' | 'dispatched' | 'accepted' | 'on_scene' | 'resolved' | 'awaiting_safety_confirmation';
  aiClassification?: {
    type: string;
    severity: string;
    confidence: number;
    guestAction: string;
    staffAction: string;
    responderBriefing: string;
    summary: string;
    translations: Record<string, string>;
  };
  messages: mongoose.Types.ObjectId[];
  events: Array<{ time: Date; actor: string; action: string }>;
  safetyConfirmations: Array<{ userId: mongoose.Types.ObjectId; confirmed: boolean; time: Date }>;
  smsConfirmationCount?: number;
  incidentReport?: string;
  raisedAt: Date;
  resolvedAt?: Date;
}

const AlertSchema: Schema = new Schema({
  type: { type: String, enum: ['fire', 'medical', 'security', 'general'], required: true },
  severity: { type: String, enum: ['critical', 'high', 'low'], required: true },
  floor: { type: Number, required: true },
  room: { type: String, required: true },
  description: { type: String },
  raisedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  raisedByRole: { type: String, required: true },
  hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
  responderId: { type: Schema.Types.ObjectId, ref: 'User' },
  status: { 
    type: String, 
    enum: ['open', 'dispatched', 'accepted', 'on_scene', 'resolved', 'awaiting_safety_confirmation'],
    default: 'open'
  },
  aiClassification: {
    type: String,
    severity: String,
    confidence: Number,
    guestAction: String,
    staffAction: String,
    responderBriefing: String,
    summary: String,
    translations: { type: Map, of: String }
  },
  messages: [{ type: Schema.Types.ObjectId, ref: 'Message' }],
  events: [{ time: { type: Date, default: Date.now }, actor: String, action: String }],
  safetyConfirmations: [{ userId: { type: Schema.Types.ObjectId, ref: 'User' }, confirmed: Boolean, time: Date }],
  smsConfirmationCount: { type: Number, default: 0 },
  incidentReport: { type: String },
  raisedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date }
});

export const Alert = mongoose.model<IAlert>('Alert', AlertSchema);

export interface IMessage extends Document {
  alertId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderRole: string;
  senderName: string;
  rawText: string;
  formattedText?: string;
  timestamp: Date;
}

const MessageSchema: Schema = new Schema({
  alertId: { type: Schema.Types.ObjectId, ref: 'Alert', required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, required: true },
  senderName: { type: String, required: true },
  rawText: { type: String, required: true },
  formattedText: { type: String },
  timestamp: { type: Date, default: Date.now }
});

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
