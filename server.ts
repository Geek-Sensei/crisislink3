import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import dotenv from "dotenv";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Hotel, User, Alert, Message } from "./models.ts";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "crisislink_secret";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  // DB Connection (using a dummy URI if not provided, for demo stability)
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/crisislink";
  await mongoose.connect(MONGODB_URI).catch(err => console.error("DB Error:", err));

  // Auto-seed if empty or missing critical demo users
  const hotelCount = await Hotel.countDocuments();
  const demoStaff = await User.findOne({ email: 'duty@hotelgrand.com' });
  const demoResponder = await User.findOne({ email: 'rajan@chn-fire.gov.in' });
  
  if (hotelCount === 0 || !demoStaff || !demoResponder) {
    console.log("Seeding demo data (missing data detected)...");
    const { spawnSync } = await import("child_process");
    spawnSync("npx", ["tsx", "seed.ts"], { stdio: "inherit" });
  }

  app.use(express.json());
  app.use(helmet({
    contentSecurityPolicy: false, // For development/iframe compatibility
  }));

  // Socket.io Rooms & Logic
  io.on("connection", (socket) => {
    socket.on("join_hotel", ({ hotelCode, userId, floor }) => {
      socket.join(`hotel-${hotelCode}`);
      if (floor) socket.join(`hotel-${hotelCode}-floor-${floor}`);
      console.log(`User ${userId} joined hotel ${hotelCode}`);
    });

    socket.on("join_responder", ({ responderId }) => {
      socket.join(`responder-${responderId}`);
    });

    socket.on("join_alert_room", ({ alertId }) => {
      socket.join(`alert-${alertId}`);
    });

    socket.on("send_message", async ({ alertId, text, senderId, senderRole, senderName, formattedText: clientFormattedText }) => {
      const alert = await Alert.findById(alertId);
      if (!alert) return;

      const msg = await Message.create({
        alertId, senderId, senderRole, senderName,
        rawText: text, formattedText: clientFormattedText || text,
        timestamp: new Date()
      });

      io.to(`alert-${alertId}`).emit("new_message", msg);
    });

    socket.on("responder_location", ({ responderId, lat, lng, alertId, hotelCode }) => {
      io.to(`hotel-${hotelCode}`).emit("location_update", { responderId, lat, lng });
    });

    socket.on("start_conference", ({ alertId, initiatorRole, initiatorName }) => {
      io.to(`alert-${alertId}`).emit("conference_started", { alertId, initiatorRole, initiatorName });
    });

    socket.on("end_conference", ({ alertId }) => {
      io.to(`alert-${alertId}`).emit("conference_ended", { alertId });
    });

    socket.on("mark_available", async ({ responderId, available }) => {
      await User.findByIdAndUpdate(responderId, { available });
    });
  });

  // API Routes
  app.post("/api/auth/guest-checkin", async (req, res) => {
    const { name, phone, room, hotelCode } = req.body;
    const hotel = await Hotel.findOne({ hotelCode });
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });

    // Derive floor from room (e.g., 604 -> 6)
    const floor = parseInt(room.substring(0, room.length - 2)) || 1;
    
    // Check if guest profile exists or create new
    let user = await User.findOne({ phone, role: 'guest', hotelId: hotel._id });
    if (!user) {
      user = await User.create({
        name, phone, role: 'guest', hotelId: hotel._id, floor, room,
        checkInTime: new Date()
      });
    }

    const token = jwt.sign({ id: user._id, role: user.role, hotelId: hotel._id }, JWT_SECRET);
    res.json({ token, user });
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const email = req.body.email?.trim().toLowerCase();
      const password = req.body.password;
      
      console.log(`Login attempt for: ${email}`);
      const user = await User.findOne({ email });
      
      if (!user) {
        console.log(`User not found: "${email}"`);
        return res.status(401).json({ error: "Email not registered" });
      }
      
      if (user.role === 'guest') {
        console.log(`Guest tried to login via staff portal: ${email}`);
        return res.status(401).json({ error: "Access denied" });
      }
      
      const isMatch = await bcrypt.compare(password, user.passwordHash!);
      if (!isMatch) {
        console.log(`Password mismatch for: ${email}. Provided: ${password}, Target Hash exists: ${!!user.passwordHash}`);
        return res.status(401).json({ error: "Password mismatch" });
      }

      console.log(`Login successful: ${email} (${user.role})`);
      const token = jwt.sign({ id: user._id, role: user.role, hotelId: user.hotelId }, JWT_SECRET);
      res.json({ token, user, hotelId: user.hotelId });
    } catch (err) {
      console.error("Login Error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/hotels/:id", async (req, res) => {
    const hotel = await Hotel.findById(req.params.id);
    res.json(hotel);
  });

  app.patch("/api/hotels/:id/floor-plans", async (req, res) => {
    const { floorPlans } = req.body;
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, {
      floorPlans
    }, { new: true });
    res.json(hotel);
  });

  app.post("/api/hotels/register", async (req, res) => {
    const { name, email, password, address } = req.body;
    
    // Check if hotel or user with this email exists
    const existingHotel = await Hotel.findOne({ email });
    const existingUser = await User.findOne({ email });
    if (existingHotel || existingUser) return res.status(400).json({ error: "Email already exists" });

    // Generate 6-char hotel code
    const hotelCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    const hotel = await Hotel.create({
      name, email, passwordHash, hotelCode, address,
      lat: 12.9716, lng: 77.5946, // Default demo location (Bangalore)
      totalFloors: 10
    });

    // Create a default hotel staff user for this hotel
    const staff = await User.create({
      name: `${name} Admin`,
      email,
      phone: "0000000000",
      passwordHash,
      role: 'hotel_staff',
      hotelId: hotel._id,
      staffRole: "Owner"
    });

    res.json({ hotel, staff });
  });

  app.get("/api/auth/me", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).populate('hotelId');
      res.json(user);
    } catch {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  app.post("/api/alerts/raise", async (req, res) => {
    try {
      const { type, severity, floor, room, description, raisedBy, raisedByRole, hotelId } = req.body;
      
      if (!hotelId || hotelId === 'undefined') {
        return res.status(400).json({ error: "hotelId is required" });
      }

      const alert = await Alert.create({
        type: type || 'general',
        severity: severity || 'high',
        floor: parseInt(floor) || 1,
        room: room || 'N/A',
        description: description || "",
        raisedBy,
        raisedByRole: raisedByRole || 'unknown',
        hotelId,
        status: 'open',
        raisedAt: new Date(),
        events: [{ time: new Date(), action: "Alert raised", actor: raisedByRole || 'unknown' }]
      });

      const hotel = await Hotel.findById(hotelId);
    if (hotel) {
      io.to(`hotel-${hotel.hotelCode}`).emit("alert_created", alert);
      io.to(`hotel-${hotel.hotelCode}-floor-${floor}`).emit("alert_created", alert);

      // Simulate SMS notification for critical alerts
      if (severity === 'critical') {
        const guestsOnFloor = await User.countDocuments({ hotelId, floor, role: 'guest' });
        if (guestsOnFloor > 0) {
          console.log(`[SMS] Sending notifications to ${guestsOnFloor} guests on Floor ${floor} at ${hotel.name}`);
          alert.smsConfirmationCount = guestsOnFloor;
          alert.events.push({
            time: new Date(),
            action: `Crisis alert broadcasted via SMS to ${guestsOnFloor} guests on Floor ${floor}`,
            actor: "system"
          });
          await alert.save();
          io.to(`hotel-${hotel.hotelCode}`).emit("alert_updated", alert);
        }
      }
    }

    res.json(alert);
    } catch (err) {
      console.error("Error raising alert:", err);
      res.status(500).json({ error: "Failed to raise alert" });
    }
  });

  app.get("/api/alerts/active", async (req, res) => {
    try {
      const alerts = await Alert.find({ 
        status: { $in: ['open', 'accepted', 'on_scene'] } 
      })
      .populate('hotelId')
      .populate('raisedBy')
      .populate('responderId')
      .sort({ raisedAt: -1 });
      res.json(alerts);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch active alerts" });
    }
  });

  app.get("/api/alerts/:id", async (req, res) => {
    const alert = await Alert.findById(req.params.id)
      .populate('hotelId')
      .populate('raisedBy')
      .populate('responderId');
    res.json(alert);
  });

  app.post("/api/broadcast", async (req, res) => {
    try {
      const { hotelId, message, floors, severity } = req.body;
      const hotel = await Hotel.findById(hotelId);
      if (!hotel) return res.status(404).json({ error: "Hotel not found" });

      if (floors === 'all') {
        io.to(`hotel-${hotel.hotelCode}`).emit("broadcast_alert", { message, severity });
      } else if (Array.isArray(floors)) {
        floors.forEach(floor => {
          io.to(`hotel-${hotel.hotelCode}-floor-${floor}`).emit("broadcast_alert", { message, severity });
        });
      }

      res.json({ success: true, smsDispatched: severity === 'critical' });
    } catch (err) {
      res.status(500).json({ error: "Broadcast failed" });
    }
  });

  app.patch("/api/alerts/:id/accept", async (req, res) => {
    const { responderId } = req.body;
    const alert = await Alert.findByIdAndUpdate(req.params.id, {
      responderId,
      status: 'accepted',
      $push: { events: { time: new Date(), action: "Responder accepted", actor: "responder" } }
    }, { new: true });
    
    const hotel = await Hotel.findById(alert?.hotelId);
    if (alert && hotel) {
      io.to(`hotel-${hotel.hotelCode}`).emit("alert_updated", alert);
      // Start GPS Sim
      const { startGpsSimulation } = await import("./responderService.ts");
      startGpsSimulation(responderId, hotel, io);
    }
    res.json(alert);
  });

  app.patch("/api/alerts/:id/on-scene", async (req, res) => {
    const alert = await Alert.findByIdAndUpdate(req.params.id, {
      status: 'on_scene',
      $push: { events: { time: new Date(), action: "Responder on scene", actor: "responder" } }
    }, { new: true });
    res.json(alert);
  });

  app.patch("/api/alerts/:id/resolve", async (req, res) => {
    const alert = await Alert.findByIdAndUpdate(req.params.id, {
      status: 'awaiting_safety_confirmation',
      $push: { events: { time: new Date(), action: "Issue resolved, awaiting guest safety confirmation", actor: "responder" } }
    }, { new: true });
    
    const hotel = await Hotel.findById(alert?.hotelId);
    if (hotel) {
      io.to(`hotel-${hotel.hotelCode}-floor-${alert?.floor}`).emit("safety_ping", { alertId: alert?._id });
    }
    res.json(alert);
  });

  app.patch("/api/alerts/:id/confirm-safe", async (req, res) => {
    const { userId } = req.body;
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ error: "Alert not found" });

    alert.safetyConfirmations.push({ userId, confirmed: true, time: new Date() });
    
    // Check if all on floor confirmed (simplified for demo: if the raiser confirmed)
    if (alert.raisedBy.toString() === userId) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date();
      alert.events.push({ time: new Date(), action: "Safety confirmed by guest", actor: "guest" });
    }
    
    await alert.save();
    const hotel = await Hotel.findById(alert.hotelId);
    if (hotel) io.to(`hotel-${hotel.hotelCode}`).emit("alert_updated", alert);
    
    res.json(alert);
  });

  app.post("/api/alerts/:id/report", async (req, res) => {
    const { reportText } = req.body;
    const alert = await Alert.findByIdAndUpdate(req.params.id, {
      incidentReport: reportText
    }, { new: true });
    res.json({ report: reportText });
  });

  app.patch("/api/alerts/:id", async (req, res) => {
    const alert = await Alert.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (alert) {
      const hotel = await Hotel.findById(alert.hotelId);
      if (hotel) io.to(`hotel-${hotel.hotelCode}`).emit("alert_updated", alert);
      io.to(`alert-${alert._id}`).emit("alert_updated", alert);
    }
    res.json(alert);
  });

  app.patch("/api/users/:id", async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(user);
  });

  app.get("/api/hotels/:hotelId/alerts", async (req, res) => {
    try {
      const { hotelId } = req.params;
      if (!hotelId || hotelId === 'undefined') {
        return res.status(400).json({ error: "Invalid hotelId" });
      }
      const alerts = await Alert.find({ hotelId })
        .populate('raisedBy')
        .populate('responderId')
        .sort({ raisedAt: -1 });
      res.json(alerts);
    } catch (err) {
      console.error("Error fetching alerts:", err);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.get("/api/messages", async (req, res) => {
    const { alertId } = req.query;
    const messages = await Message.find({ alertId: alertId as string }).sort({ timestamp: 1 });
    res.json(messages);
  });

  app.get("/api/responders", async (req, res) => {
    const responders = await User.find({ role: 'responder' });
    res.json(responders);
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
