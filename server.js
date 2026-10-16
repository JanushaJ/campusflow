require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusflow_db';
const JWT_SECRET = process.env.JWT_SECRET || 'campusflow_super_secret_jwt_key_2026';
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
const TRANSPORT_OFFICER_EMAIL = process.env.TRANSPORT_OFFICER_EMAIL || 'transport.officer@apollo-uni.edu';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@apollo.edu';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ================= LOCAL FALLBACK STORAGE SETUP =================
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'campusflow_db.json');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

let useMongo = false;

function readLocalDb() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Error reading local JSON database:', e.message);
    }
    return getInitialSeedData();
}

function writeLocalDb(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
        console.error('Error writing local JSON database:', e.message);
    }
}

function getInitialSeedData() {
    const salt = bcrypt.genSaltSync(10);
    return {
        users: [
            { id: 'usr_admin', fullName: 'System Administrator', email: 'admin@apollo.edu', password: bcrypt.hashSync('Admin@123', salt), role: 'Administrator' },
            { id: 'usr_unithead', fullName: 'Prof. Ramesh Rao (Unit Head)', email: 'unithead@apollo.edu', password: bcrypt.hashSync('UnitHead@123', salt), role: 'Unit Head' },
            { id: 'usr_transport', fullName: 'Mr. Venkat Reddy (Transport Officer)', email: 'transport@apollo.edu', password: bcrypt.hashSync('Transport@123', salt), role: 'Transport Officer' },
            { id: 'usr_faculty', fullName: 'Dr. Anita Desai (Faculty)', email: 'faculty@apollo.edu', password: bcrypt.hashSync('Faculty@123', salt), role: 'Teaching Faculty' },
            { id: 'usr_pc', fullName: 'Dr. Suresh Kumar (Program Coordinator)', email: 'pc@apollo.edu', password: bcrypt.hashSync('PC@123', salt), role: 'Program Coordinator' },
            { id: 'usr_dean', fullName: 'Dr. Meenakshi Sundaram (Dean)', email: 'dean@apollo.edu', password: bcrypt.hashSync('Dean@123', salt), role: 'Dean' },
            { id: 'usr_staff', fullName: 'Sri Krishna Murthy (Staff)', email: 'staff@apollo.edu', password: bcrypt.hashSync('Staff@123', salt), role: 'Non-Teaching Staff' }
        ],
        // DYNAMIC STOCK: User can add, edit, or delete any resource asset
        stockItems: [
            { id: 'res_1', name: 'Water Bottles', quantity: 50, unit: 'Crates', category: 'Beverages' },
            { id: 'res_2', name: 'Chairs', quantity: 200, unit: 'Units', category: 'Furniture' },
            { id: 'res_3', name: 'Center Tables', quantity: 15, unit: 'Units', category: 'Furniture' }
        ],
        // DYNAMIC VENUES: User can add new venues or edit existing
        venues: [
            { id: 'v_1', name: "Main Auditorium", capacity: 800, location: "Campus Ground Floor" },
            { id: 'v_2', name: "Dr. PCR Knowledge Center Seminar Hall", capacity: 250, location: "TAU Block 2nd Floor" },
            { id: 'v_3', name: "Lecture Hall 101", capacity: 120, location: "Medical Block" },
            { id: 'v_4', name: "Conference Hall (TAU Block)", capacity: 60, location: "TAU Block 1st Floor" }
        ],
        // DYNAMIC ELECTRICITY VENUES / ZONES: Fully editable
        electricityLocations: [
            { id: 'el_1', name: 'College Block - Medical College', category: 'Academic' },
            { id: 'el_2', name: 'College Block - ACON', category: 'Academic' },
            { id: 'el_3', name: 'College Block - ACOP', category: 'Academic' },
            { id: 'el_4', name: 'College Block - TAU, ATC, Telecom, Cafeteria, Ooty House, Axis Bank', category: 'Academic' },
            { id: 'el_5', name: 'Dr. PCR Knowledge Center (TAU Block)', category: 'Academic' },
            { id: 'el_6', name: 'Girls Hostel', category: 'Residential' },
            { id: 'el_7', name: 'Boys Hostel', category: 'Residential' },
            { id: 'el_8', name: 'Resident Hostel', category: 'Residential' },
            { id: 'el_9', name: 'Deluxe Girls Hostel', category: 'Residential' },
            { id: 'el_10', name: 'Deluxe Boys Hostel', category: 'Residential' },
            { id: 'el_11', name: 'Teaching Quarters', category: 'Residential' },
            { id: 'el_12', name: 'Non-Teaching Quarters', category: 'Residential' },
            { id: 'el_13', name: 'Kitchen Block', category: 'Utilities' },
            { id: 'el_14', name: 'Guest House', category: 'Utilities' },
            { id: 'el_15', name: 'Maintenance Block (STP, WTP, Fire Pumps)', category: 'Utilities' },
            { id: 'el_16', name: 'Street Lights, Security Gate, Temple, Borewells', category: 'Utilities' },
            { id: 'el_17', name: 'Others (Vendors, DBS, ICCO, Hari Narayana)', category: 'Utilities' }
        ],
        stockOrders: [],
        venueBookings: [],
        transportRequests: [],
        waterReadings: [],
        electricityReadings: [],
        notifications: []
    };
}

if (!fs.existsSync(DB_FILE)) {
    writeLocalDb(getInitialSeedData());
}

// ================= MONGOOSE SCHEMAS =================
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, required: true }
}, { timestamps: true });
const User = mongoose.model('User', userSchema);

const stockItemSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    quantity: { type: Number, default: 0 },
    unit: { type: String, default: 'Units' },
    category: { type: String, default: 'General' }
}, { timestamps: true });
const StockItem = mongoose.model('StockItem', stockItemSchema);

const venueSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    capacity: { type: Number, default: 100 },
    location: { type: String, default: 'Campus' }
}, { timestamps: true });
const Venue = mongoose.model('Venue', venueSchema);

const elecLocationSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, default: 'General' }
}, { timestamps: true });
const ElecLocation = mongoose.model('ElecLocation', elecLocationSchema);

const bookingSchema = new mongoose.Schema({
    id: String,
    venue: String,
    bookedBy: String,
    requesterEmail: String,
    date: String,
    timeDuration: String,
    purpose: String,
    decisionNotes: String,
    decidedBy: String,
    status: { type: String, default: 'pending' }
}, { timestamps: true });
const Booking = mongoose.model('Booking', bookingSchema);

const transportSchema = new mongoose.Schema({
    id: String,
    guest: String,
    vehicle: String,
    vehicleCount: { type: Number, default: 1 },
    vehicleType: String,
    dateTime: String,
    destination: String,
    purpose: String,
    requestedBy: String,
    requesterEmail: String,
    decisionNotes: String,
    driverDetails: String,
    decidedBy: String,
    status: { type: String, default: 'pending' }
}, { timestamps: true });
const Transport = mongoose.model('Transport', transportSchema);

const stockOrderSchema = new mongoose.Schema({
    id: String,
    item: String,
    qty: Number,
    requestedBy: String,
    requesterEmail: String,
    dateTime: String,
    claimedBy: String,
    status: { type: String, default: 'pending' }
}, { timestamps: true });
const StockOrder = mongoose.model('StockOrder', stockOrderSchema);

const waterSchema = new mongoose.Schema({
    date: { type: String, required: true, unique: true },
    wpl1: { type: Number, default: 0 },
    wpl2: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
}, { timestamps: true });
const Water = mongoose.model('Water', waterSchema);

const electricitySchema = new mongoose.Schema({
    id: String,
    date: { type: String, required: true },
    venue: { type: String, required: true },
    reading: { type: Number, required: true }
}, { timestamps: true });
const Electricity = mongoose.model('Electricity', electricitySchema);

const notificationSchema = new mongoose.Schema({
    id: String,
    type: String, // 'transport_request', 'transport_decision', 'venue_request', 'venue_decision', 'stock_alert'
    to: String,
    from: String,
    subject: String,
    body: String,
    actionLink: String,
    relatedId: String,
    sentAt: { type: String, default: () => new Date().toISOString() },
    status: { type: String, default: 'sent' }
}, { timestamps: true });
const Notification = mongoose.model('Notification', notificationSchema);

// Helper to record an automated email notification
async function dispatchNotification(notifData) {
    if (!notifData.id) notifData.id = 'EML-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    if (!notifData.sentAt) notifData.sentAt = new Date().toISOString();
    if (!notifData.from) notifData.from = 'campusflow-notifications@apollo-uni.edu';

    if (useMongo) {
        try {
            await Notification.create(notifData);
        } catch (e) {
            console.error('Mongo notification save failed:', e.message);
        }
    } else {
        const db = readLocalDb();
        if (!db.notifications) db.notifications = [];
        db.notifications.unshift(notifData);
        writeLocalDb(db);
    }
    return notifData;
}

// ================= AUTHENTICATION ENDPOINTS =================
app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;
        if (!fullName || !email || !password || !role) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        if (useMongo) {
            const exists = await User.findOne({ email: email.toLowerCase() });
            if (exists) return res.status(400).json({ success: false, message: 'Email already exists.' });
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await User.create({ fullName, email: email.toLowerCase(), password: hashedPassword, role });
            const token = jwt.sign({ id: user._id, email: user.email, role: user.role, fullName: user.fullName }, JWT_SECRET, { expiresIn: '7d' });
            return res.json({ success: true, token, user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role } });
        } else {
            const db = readLocalDb();
            const exists = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (exists) return res.status(400).json({ success: false, message: 'Email already exists.' });
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = { id: 'usr_' + Date.now(), fullName, email: email.toLowerCase(), password: hashedPassword, role };
            db.users.push(user);
            writeLocalDb(db);
            const token = jwt.sign({ id: user.id, email: user.email, role: user.role, fullName: user.fullName }, JWT_SECRET, { expiresIn: '7d' });
            return res.json({ success: true, token, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required.' });

        let user = null;
        if (useMongo) user = await User.findOne({ email: email.toLowerCase() });
        else {
            const db = readLocalDb();
            user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        }

        if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

        const token = jwt.sign({ id: user._id || user.id, email: user.email, role: user.role, fullName: user.fullName }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, token, user: { id: user._id || user.id, fullName: user.fullName, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ================= PRIMARY DATA LOAD ENDPOINT =================
app.get('/api/data', async (req, res) => {
    try {
        if (useMongo) {
            const stockItems = await StockItem.find().sort({ name: 1 });
            const venues = await Venue.find().sort({ name: 1 });
            const electricityLocations = await ElecLocation.find().sort({ name: 1 });
            const stockOrders = await StockOrder.find().sort({ createdAt: -1 });
            const venueBookings = await Booking.find().sort({ createdAt: -1 });
            const transportRequests = await Transport.find().sort({ createdAt: -1 });
            const waterReadings = await Water.find().sort({ date: -1 });
            const electricityReadings = await Electricity.find().sort({ date: -1 });
            const notifications = await Notification.find().sort({ createdAt: -1 }).limit(25);

            return res.json({
                database: 'mongodb',
                stockItems,
                venues,
                electricityLocations,
                stockOrders,
                venueBookings,
                transportRequests,
                waterReadings,
                electricityReadings,
                notifications
            });
        } else {
            const db = readLocalDb();
            return res.json({
                database: 'local_json_db',
                stockItems: db.stockItems || [],
                venues: db.venues || [],
                electricityLocations: db.electricityLocations || [],
                stockOrders: db.stockOrders || [],
                venueBookings: db.venueBookings || [],
                transportRequests: db.transportRequests || [],
                waterReadings: db.waterReadings || [],
                electricityReadings: db.electricityReadings || [],
                notifications: db.notifications || []
            });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= 1. DYNAMIC STOCK ITEMS API =================
app.get('/api/stock/items', async (req, res) => {
    try {
        if (useMongo) {
            const items = await StockItem.find().sort({ name: 1 });
            return res.json({ success: true, stockItems: items });
        } else {
            const db = readLocalDb();
            return res.json({ success: true, stockItems: db.stockItems || [] });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/stock/items', async (req, res) => {
    try {
        const { name, quantity, unit, category } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Resource name required' });
        const item = {
            id: 'res_' + Date.now(),
            name: name.trim(),
            quantity: Number(quantity) || 0,
            unit: unit || 'Units',
            category: category || 'General'
        };

        if (useMongo) {
            await StockItem.create(item);
            const items = await StockItem.find().sort({ name: 1 });
            return res.json({ success: true, stockItems: items });
        } else {
            const db = readLocalDb();
            if (!db.stockItems) db.stockItems = [];
            db.stockItems.push(item);
            writeLocalDb(db);
            return res.json({ success: true, stockItems: db.stockItems });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.patch('/api/stock/items/:id', async (req, res) => {
    try {
        const { name, quantity, unit, category } = req.body;
        if (useMongo) {
            const updated = await StockItem.findOneAndUpdate(
                { id: req.params.id },
                { $set: req.body },
                { new: true }
            );
            return res.json({ success: true, item: updated });
        } else {
            const db = readLocalDb();
            const item = (db.stockItems || []).find(i => i.id === req.params.id);
            if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
            if (name !== undefined) item.name = name;
            if (quantity !== undefined) item.quantity = Number(quantity);
            if (unit !== undefined) item.unit = unit;
            if (category !== undefined) item.category = category;
            writeLocalDb(db);
            return res.json({ success: true, item });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/stock/items/:id', async (req, res) => {
    try {
        if (useMongo) {
            await StockItem.findOneAndDelete({ id: req.params.id });
            const items = await StockItem.find().sort({ name: 1 });
            return res.json({ success: true, stockItems: items });
        } else {
            const db = readLocalDb();
            db.stockItems = (db.stockItems || []).filter(i => i.id !== req.params.id);
            writeLocalDb(db);
            return res.json({ success: true, stockItems: db.stockItems });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Stock Requisitions
app.post('/api/stock/orders', async (req, res) => {
    try {
        const orderData = req.body;
        if (!orderData.id) orderData.id = 'RO-' + Math.floor(500 + Math.random() * 500);

        // Deduct quantity from the corresponding stock item if available
        if (useMongo) {
            const stock = await StockItem.findOne({ name: orderData.item });
            if (stock && stock.quantity >= orderData.qty) {
                stock.quantity -= orderData.qty;
                await stock.save();
            }
            const order = await StockOrder.create(orderData);
            return res.json({ success: true, order });
        } else {
            const db = readLocalDb();
            const stock = (db.stockItems || []).find(i => i.name === orderData.item);
            if (stock && stock.quantity >= orderData.qty) {
                stock.quantity -= orderData.qty;
            }
            if (!db.stockOrders) db.stockOrders = [];
            db.stockOrders.unshift(orderData);
            writeLocalDb(db);
            return res.json({ success: true, order: orderData });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.patch('/api/stock/orders/:id', async (req, res) => {
    try {
        const { status, claimedBy } = req.body;
        if (useMongo) {
            const updated = await StockOrder.findOneAndUpdate(
                { id: req.params.id },
                { $set: req.body },
                { new: true }
            );
            return res.json({ success: true, order: updated });
        } else {
            const db = readLocalDb();
            const order = (db.stockOrders || []).find(o => o.id === req.params.id);
            if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
            if (status !== undefined) order.status = status;
            if (claimedBy !== undefined) order.claimedBy = claimedBy;
            writeLocalDb(db);
            return res.json({ success: true, order });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ================= 2. DYNAMIC VENUES API =================
app.get('/api/venues', async (req, res) => {
    try {
        if (useMongo) {
            const venues = await Venue.find().sort({ name: 1 });
            return res.json({ success: true, venues });
        } else {
            const db = readLocalDb();
            return res.json({ success: true, venues: db.venues || [] });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/venues', async (req, res) => {
    try {
        const { name, capacity, location } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Venue name required' });
        const newVenue = {
            id: 'v_' + Date.now(),
            name: name.trim(),
            capacity: Number(capacity) || 100,
            location: location || 'Campus Block'
        };

        if (useMongo) {
            await Venue.create(newVenue);
            const venues = await Venue.find().sort({ name: 1 });
            return res.json({ success: true, venues });
        } else {
            const db = readLocalDb();
            if (!db.venues) db.venues = [];
            db.venues.push(newVenue);
            writeLocalDb(db);
            return res.json({ success: true, venues: db.venues });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.patch('/api/venues/:id', async (req, res) => {
    try {
        if (useMongo) {
            const updated = await Venue.findOneAndUpdate({ id: req.params.id }, { $set: req.body }, { new: true });
            return res.json({ success: true, venue: updated });
        } else {
            const db = readLocalDb();
            const v = (db.venues || []).find(x => x.id === req.params.id);
            if (!v) return res.status(404).json({ success: false, message: 'Venue not found' });
            Object.assign(v, req.body);
            writeLocalDb(db);
            return res.json({ success: true, venue: v });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/venues/:id', async (req, res) => {
    try {
        if (useMongo) {
            await Venue.findOneAndDelete({ id: req.params.id });
            const venues = await Venue.find().sort({ name: 1 });
            return res.json({ success: true, venues });
        } else {
            const db = readLocalDb();
            db.venues = (db.venues || []).filter(v => v.id !== req.params.id);
            writeLocalDb(db);
            return res.json({ success: true, venues: db.venues });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Venue Bookings & Notification Dispatch
app.post('/api/bookings', async (req, res) => {
    try {
        const bookingData = req.body;
        if (!bookingData.id) bookingData.id = 'VB-' + Math.floor(200 + Math.random() * 800);

        // 1. Notify Admin/Approver via email
        const approverEmail = ADMIN_EMAIL;
        const approvalLink = `${APP_URL}/index.html?view=venueBookingView&bookingId=${bookingData.id}`;
        const notification = {
            type: 'venue_request',
            to: approverEmail,
            subject: `🏛️ Action Required: Venue Booking #${bookingData.id} for ${bookingData.venue}`,
            body: `Dear Administrator / Unit Head,

A new venue booking requisition has been submitted:
- Booking ID: #${bookingData.id}
- Venue: ${bookingData.venue}
- Requested By: ${bookingData.bookedBy} (${bookingData.requesterEmail || 'No email provided'})
- Date: ${bookingData.date}
- Time Duration: ${bookingData.timeDuration}
- Purpose: ${bookingData.purpose}

Click to review and decide:
${approvalLink}`,
            actionLink: approvalLink,
            relatedId: bookingData.id
        };

        await dispatchNotification(notification);

        if (useMongo) {
            const booking = await Booking.create(bookingData);
            return res.json({ success: true, booking, notification });
        } else {
            const db = readLocalDb();
            if (!db.venueBookings) db.venueBookings = [];
            db.venueBookings.unshift(bookingData);
            writeLocalDb(db);
            return res.json({ success: true, booking: bookingData, notification });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Update Venue Decision -> SENDS EMAIL NOTIFICATION TO REQUESTER!
app.patch('/api/bookings/:id', async (req, res) => {
    try {
        const { status, decisionNotes, decidedBy } = req.body;
        let booking = null;

        if (useMongo) {
            booking = await Booking.findOneAndUpdate(
                { id: req.params.id },
                { $set: { status, decisionNotes, decidedBy } },
                { new: true }
            );
        } else {
            const db = readLocalDb();
            booking = (db.venueBookings || []).find(b => b.id === req.params.id);
            if (booking) {
                booking.status = status;
                booking.decisionNotes = decisionNotes || '';
                booking.decidedBy = decidedBy || 'Administrator';
                writeLocalDb(db);
            }
        }

        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

        // 2. Dispatch email to the Requester about the approval/denial!
        const recipient = booking.requesterEmail || 'requester@apollo.edu';
        const isApproved = status === 'approved';
        const notification = {
            type: 'venue_decision',
            to: recipient,
            subject: `${isApproved ? '✅ APPROVED' : '❌ DENIED'}: Venue Reservation #${booking.id} (${booking.venue})`,
            body: `Dear ${booking.bookedBy},

Your reservation request for "${booking.venue}" has been ${status.toUpperCase()} by ${decidedBy || 'Campus Administration'}.

Details:
- Booking ID: #${booking.id}
- Venue: ${booking.venue}
- Date: ${booking.date}
- Time Duration: ${booking.timeDuration}
- Decision Notes: ${decisionNotes || (isApproved ? 'Approved for official university event.' : 'Declined due to scheduling or administrative reasons.')}

You can view the live status on the CampusFlow portal:
${APP_URL}/index.html?view=venueBookingView`,
            actionLink: `${APP_URL}/index.html?view=venueBookingView`,
            relatedId: booking.id
        };

        const sentNotif = await dispatchNotification(notification);

        return res.json({ success: true, booking, notification: sentNotif });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/bookings/:id', async (req, res) => {
    try {
        if (useMongo) {
            await Booking.findOneAndDelete({ id: req.params.id });
        } else {
            const db = readLocalDb();
            db.venueBookings = (db.venueBookings || []).filter(b => b.id !== req.params.id);
            writeLocalDb(db);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ================= 3. TRANSPORT REQUISITIONS & EMAIL DISPATCH =================
app.get('/api/transport', async (req, res) => {
    try {
        if (useMongo) {
            const requests = await Transport.find().sort({ createdAt: -1 });
            return res.json({ success: true, requests });
        } else {
            const db = readLocalDb();
            return res.json({ success: true, requests: db.transportRequests || [] });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/transport', async (req, res) => {
    try {
        const transportData = req.body;
        if (!transportData.id) transportData.id = 'TR-' + Math.floor(1000 + Math.random() * 9000);

        // Direct link for the Transport Officer to approve or deny
        const approvalLink = `${APP_URL}/index.html?view=transportReqView&reqId=${transportData.id}&role=Transport+Officer`;

        const officerNotification = {
            type: 'transport_request',
            to: TRANSPORT_OFFICER_EMAIL,
            subject: `🚌 Action Required: Transport Requisition #${transportData.id} for ${transportData.guest || 'Guest'}`,
            body: `Dear Transport Officer,

A new official vehicle requisition has been submitted:
- Request ID: #${transportData.id}
- Guest/Delegation: ${transportData.guest}
- Vehicle Details: ${transportData.vehicle}
- Date & Time: ${transportData.dateTime}
- Destination: ${transportData.destination}
- Requested By: ${transportData.requestedBy} (${transportData.requesterEmail || 'No email provided'})
- Purpose: ${transportData.purpose || 'Official Campus Travel'}

Click the link below to review, approve or reject this booking directly on the CampusFlow portal:
${approvalLink}`,
            actionLink: approvalLink,
            relatedId: transportData.id
        };

        const sentNotif = await dispatchNotification(officerNotification);

        if (useMongo) {
            const newTransport = await Transport.create(transportData);
            return res.json({ success: true, transport: newTransport, notification: sentNotif });
        } else {
            const db = readLocalDb();
            if (!db.transportRequests) db.transportRequests = [];
            db.transportRequests.unshift(transportData);
            writeLocalDb(db);
            return res.json({ success: true, transport: transportData, notification: sentNotif });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Update Transport Decision -> SENDS EMAIL NOTIFICATION TO REQUESTER!
app.patch('/api/transport/:id', async (req, res) => {
    try {
        const { status, decisionNotes, driverDetails, decidedBy } = req.body;
        let transport = null;

        if (useMongo) {
            transport = await Transport.findOneAndUpdate(
                { id: req.params.id },
                { $set: { status, decisionNotes, driverDetails, decidedBy } },
                { new: true }
            );
        } else {
            const db = readLocalDb();
            transport = (db.transportRequests || []).find(t => t.id === req.params.id);
            if (transport) {
                transport.status = status;
                transport.decisionNotes = decisionNotes || '';
                transport.driverDetails = driverDetails || '';
                transport.decidedBy = decidedBy || 'Transport Officer';
                writeLocalDb(db);
            }
        }

        if (!transport) return res.status(404).json({ success: false, message: 'Transport request not found' });

        // Dispatch Email to Requester about the decision!
        const recipient = transport.requesterEmail || 'requester@apollo.edu';
        const isApproved = status === 'approved';
        const requesterNotification = {
            type: 'transport_decision',
            to: recipient,
            subject: `${isApproved ? '✅ APPROVED' : '❌ DENIED'}: Transport Requisition #${transport.id}`,
            body: `Dear ${transport.requestedBy},

Your vehicle requisition for "${transport.guest}" has been ${status.toUpperCase()} by the Transport Officer.

Requisition Summary:
- Request ID: #${transport.id}
- Guest/Delegation: ${transport.guest}
- Destination: ${transport.destination}
- Date & Time: ${transport.dateTime}
- Assigned Vehicle: ${transport.vehicle}
${isApproved && driverDetails ? `- Driver / Vehicle Assignment: ${driverDetails}\n` : ''}- Officer Notes: ${decisionNotes || (isApproved ? 'Vehicle scheduled as requested.' : 'Vehicle not available for the requested slot.')}

View live status on the CampusFlow portal:
${APP_URL}/index.html?view=transportReqView`,
            actionLink: `${APP_URL}/index.html?view=transportReqView`,
            relatedId: transport.id
        };

        const sentNotif = await dispatchNotification(requesterNotification);

        return res.json({ success: true, transport, notification: sentNotif });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/transport/:id', async (req, res) => {
    try {
        if (useMongo) {
            await Transport.findOneAndDelete({ id: req.params.id });
        } else {
            const db = readLocalDb();
            db.transportRequests = (db.transportRequests || []).filter(t => t.id !== req.params.id);
            writeLocalDb(db);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ================= 4. DYNAMIC ELECTRICITY LOCATIONS & LOGGING =================
app.get('/api/electricity/venues', async (req, res) => {
    try {
        if (useMongo) {
            const locs = await ElecLocation.find().sort({ name: 1 });
            return res.json({ success: true, locations: locs });
        } else {
            const db = readLocalDb();
            return res.json({ success: true, locations: db.electricityLocations || [] });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/electricity/venues', async (req, res) => {
    try {
        const { name, category } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Location name required' });
        const newLoc = { id: 'el_' + Date.now(), name: name.trim(), category: category || 'General' };

        if (useMongo) {
            await ElecLocation.create(newLoc);
            const locs = await ElecLocation.find().sort({ name: 1 });
            return res.json({ success: true, locations: locs });
        } else {
            const db = readLocalDb();
            if (!db.electricityLocations) db.electricityLocations = [];
            db.electricityLocations.push(newLoc);
            writeLocalDb(db);
            return res.json({ success: true, locations: db.electricityLocations });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/electricity/venues/:id', async (req, res) => {
    try {
        if (useMongo) {
            await ElecLocation.findOneAndDelete({ id: req.params.id });
            const locs = await ElecLocation.find().sort({ name: 1 });
            return res.json({ success: true, locations: locs });
        } else {
            const db = readLocalDb();
            db.electricityLocations = (db.electricityLocations || []).filter(l => l.id !== req.params.id);
            writeLocalDb(db);
            return res.json({ success: true, locations: db.electricityLocations });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/electricity', async (req, res) => {
    try {
        const entries = req.body;
        if (!Array.isArray(entries) || entries.length === 0) {
            return res.status(400).json({ success: false, message: 'No entries provided.' });
        }

        if (useMongo) {
            for (const item of entries) {
                const recId = item.id || `elrec_${item.date}_${item.venue.replace(/[^a-zA-Z0-9]/g, '_')}`;
                await Electricity.findOneAndUpdate(
                    { date: item.date, venue: item.venue },
                    { $set: { id: recId, reading: Number(item.reading) || 0 } },
                    { upsert: true }
                );
            }
            const allElec = await Electricity.find().sort({ date: -1 });
            return res.json({ success: true, count: entries.length, allElec });
        } else {
            const db = readLocalDb();
            if (!db.electricityReadings) db.electricityReadings = [];
            for (const item of entries) {
                const idx = db.electricityReadings.findIndex(e => e.date === item.date && e.venue === item.venue);
                const recId = item.id || (idx !== -1 ? db.electricityReadings[idx].id : `elrec_${Date.now()}_${Math.random().toString(36).substring(7)}`);
                const rec = { id: recId, date: item.date, venue: item.venue, reading: Number(item.reading) || 0 };
                if (idx !== -1) db.electricityReadings[idx] = rec;
                else db.electricityReadings.unshift(rec);
            }
            writeLocalDb(db);
            return res.json({ success: true, count: entries.length, allElec: db.electricityReadings });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Edit specific electricity reading
app.patch('/api/electricity/:id', async (req, res) => {
    try {
        const { reading, venue, date } = req.body;
        if (useMongo) {
            const updated = await Electricity.findOneAndUpdate({ id: req.params.id }, { $set: req.body }, { new: true });
            return res.json({ success: true, record: updated });
        } else {
            const db = readLocalDb();
            const rec = (db.electricityReadings || []).find(e => e.id === req.params.id);
            if (!rec) return res.status(404).json({ success: false, message: 'Reading not found' });
            if (reading !== undefined) rec.reading = Number(reading);
            if (venue !== undefined) rec.venue = venue;
            if (date !== undefined) rec.date = date;
            writeLocalDb(db);
            return res.json({ success: true, record: rec });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Delete specific electricity reading
app.delete('/api/electricity/:id', async (req, res) => {
    try {
        if (useMongo) {
            await Electricity.findOneAndDelete({ id: req.params.id });
        } else {
            const db = readLocalDb();
            db.electricityReadings = (db.electricityReadings || []).filter(e => e.id !== req.params.id);
            writeLocalDb(db);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ================= 5. WATER READINGS (EDITABLE) =================
app.post('/api/water', async (req, res) => {
    try {
        const { date, wpl1, wpl2, total } = req.body;
        if (!date) return res.status(400).json({ success: false, message: 'Date required' });
        const record = {
            date,
            wpl1: Number(wpl1) || 0,
            wpl2: Number(wpl2) || 0,
            total: Number(total) || ((Number(wpl1) || 0) + (Number(wpl2) || 0))
        };

        if (useMongo) {
            const updated = await Water.findOneAndUpdate({ date: record.date }, { $set: record }, { new: true, upsert: true });
            const allWater = await Water.find().sort({ date: -1 });
            return res.json({ success: true, record: updated, allWater });
        } else {
            const db = readLocalDb();
            if (!db.waterReadings) db.waterReadings = [];
            const idx = db.waterReadings.findIndex(w => w.date === record.date);
            if (idx !== -1) db.waterReadings[idx] = record;
            else db.waterReadings.unshift(record);
            writeLocalDb(db);
            return res.json({ success: true, record, allWater: db.waterReadings });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/water/:date', async (req, res) => {
    try {
        if (useMongo) {
            await Water.findOneAndDelete({ date: req.params.date });
        } else {
            const db = readLocalDb();
            db.waterReadings = (db.waterReadings || []).filter(w => w.date !== req.params.date);
            writeLocalDb(db);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ================= 6. NOTIFICATION / MAILBOX HUB API =================
app.get('/api/notifications', async (req, res) => {
    try {
        if (useMongo) {
            const notifs = await Notification.find().sort({ createdAt: -1 }).limit(50);
            return res.json({ success: true, notifications: notifs });
        } else {
            const db = readLocalDb();
            return res.json({ success: true, notifications: db.notifications || [] });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/notifications/send', async (req, res) => {
    try {
        const notif = await dispatchNotification(req.body);
        res.json({ success: true, notification: notif });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ================= SERVER START =================
mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 })
    .then(async () => {
        useMongo = true;
        console.log('✅ Connected to MongoDB successfully at ' + MONGO_URI);
        app.listen(PORT, () => {
            console.log(`🚀 Apollo RMS / CampusFlow Server running at http://localhost:${PORT} (MongoDB mode)`);
        });
    })
    .catch((err) => {
        useMongo = false;
        console.log('📁 Running with built-in persistent local database at ' + DB_FILE);
        app.listen(PORT, () => {
            console.log(`🚀 Apollo RMS / CampusFlow Server running at http://localhost:${PORT} (Local DB fallback mode)`);
        });
    });
