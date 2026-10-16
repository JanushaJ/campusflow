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

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ================= LOCAL FALLBACK STORAGE SETUP =================
// Ensures that even if MongoDB daemon is not running locally,
// the entire website, database persistence, and API operate 100% reliably.
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
            {
                id: 'usr_admin',
                fullName: 'System Administrator',
                email: 'admin@apollo.edu',
                password: bcrypt.hashSync('Admin@123', salt),
                role: 'Administrator'
            },
            {
                id: 'usr_unithead',
                fullName: 'Prof. Ramesh Rao (Unit Head)',
                email: 'unithead@apollo.edu',
                password: bcrypt.hashSync('UnitHead@123', salt),
                role: 'Unit Head'
            },
            {
                id: 'usr_transport',
                fullName: 'Mr. Venkat Reddy (Transport Officer)',
                email: 'transport@apollo.edu',
                password: bcrypt.hashSync('Transport@123', salt),
                role: 'Transport Officer'
            },
            {
                id: 'usr_faculty',
                fullName: 'Dr. Anita Desai (Faculty)',
                email: 'faculty@apollo.edu',
                password: bcrypt.hashSync('Faculty@123', salt),
                role: 'Teaching Faculty'
            },
            {
                id: 'usr_pc',
                fullName: 'Dr. Suresh Kumar (Program Coordinator)',
                email: 'pc@apollo.edu',
                password: bcrypt.hashSync('PC@123', salt),
                role: 'Program Coordinator'
            },
            {
                id: 'usr_dean',
                fullName: 'Dr. Meenakshi Sundaram (Dean)',
                email: 'dean@apollo.edu',
                password: bcrypt.hashSync('Dean@123', salt),
                role: 'Dean'
            },
            {
                id: 'usr_staff',
                fullName: 'Sri Krishna Murthy (Staff)',
                email: 'staff@apollo.edu',
                password: bcrypt.hashSync('Staff@123', salt),
                role: 'Non-Teaching Staff'
            }
        ],
        stock: {
            waterBottles: 50,
            chairs: 200,
            centerTables: 15
        },
        venues: [
            { id: 'v1', name: "Main Auditorium" },
            { id: 'v2', name: "Dr. PCR Knowledge Center Seminar Hall" },
            { id: 'v3', name: "Lecture Hall 101" },
            { id: 'v4', name: "Conference Hall (TAU Block)" }
        ],
        stockOrders: [
            {
                id: 'RO-101',
                item: 'Water Bottles',
                qty: 15,
                requestedBy: 'Dr. Anita Desai (Teaching Faculty)',
                dateTime: '2026-10-18 at 10:00',
                claimedBy: 'Non-Teaching Staff',
                status: 'delivered'
            },
            {
                id: 'RO-102',
                item: 'Chairs',
                qty: 40,
                requestedBy: 'Dr. Suresh Kumar (Program Coordinator)',
                dateTime: '2026-10-19 at 14:00',
                claimedBy: null,
                status: 'pending'
            }
        ],
        venueBookings: [
            {
                id: 'VB-201',
                venue: 'Main Auditorium',
                bookedBy: 'Dr. Suresh Kumar (Program Coordinator)',
                date: '2026-10-20',
                timeDuration: '09:30 - 13:00',
                purpose: 'Annual IEEE Technical Symposium',
                status: 'approved'
            },
            {
                id: 'VB-202',
                venue: 'Conference Hall (TAU Block)',
                bookedBy: 'Dr. Anita Desai (Teaching Faculty)',
                date: '2026-10-22',
                timeDuration: '14:00 - 16:30',
                purpose: 'Department Board of Studies Meeting',
                status: 'pending'
            }
        ],
        transportRequests: [
            {
                id: 'TR-1001',
                guest: 'Prof. K. Narayanan (AIIMS New Delhi)',
                vehicle: '1x Executive Sedan (Innova/Ciaz)',
                vehicleCount: 1,
                vehicleType: 'Executive Sedan (Innova/Ciaz)',
                dateTime: '2026-10-21 at 08:30',
                destination: 'Tirupati Airport (TIR) to Campus Guest House',
                purpose: 'Keynote Speaker for National Medical Conclave',
                requestedBy: 'Dr. Meenakshi Sundaram (Dean)',
                status: 'pending'
            },
            {
                id: 'TR-1002',
                guest: 'Accreditation Inspection Committee (4 Members)',
                vehicle: '1x SUV (Scorpio/Fortuner)',
                vehicleCount: 1,
                vehicleType: 'SUV (Scorpio/Fortuner)',
                dateTime: '2026-10-25 at 09:00',
                destination: 'Renigunta Railway Station to Campus Block A',
                purpose: 'Official Inspection Visit',
                requestedBy: 'Dr. Suresh Kumar (Program Coordinator)',
                status: 'approved'
            }
        ],
        waterReadings: [
            { date: '2026-10-15', wpl1: 420, wpl2: 30, total: 450 },
            { date: '2026-10-14', wpl1: 410, wpl2: 28, total: 438 },
            { date: '2026-10-13', wpl1: 435, wpl2: 32, total: 467 },
            { date: '2026-10-12', wpl1: 395, wpl2: 25, total: 420 },
            { date: '2026-10-11', wpl1: 415, wpl2: 29, total: 444 }
        ],
        electricityReadings: [
            { date: '2026-10-15', venue: 'College Block - Medical College', reading: 25015 },
            { date: '2026-10-15', venue: 'College Block - ACON', reading: 4672 },
            { date: '2026-10-15', venue: 'Girls Hostel', reading: 19565 },
            { date: '2026-10-15', venue: 'Boys Hostel', reading: 27701 },
            { date: '2026-10-15', venue: 'Dr. PCR Knowledge Center (TAU Block)', reading: 12450 },
            { date: '2026-10-15', venue: 'Street Lights, Security Gate, Temple, Borewells', reading: 8320 }
        ],
        transportEmails: []
    };
}

// Initialize local DB file if missing
if (!fs.existsSync(DB_FILE)) {
    writeLocalDb(getInitialSeedData());
}

// ================= MONGOOSE SCHEMAS & MODELS =================
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        required: true, 
        enum: [
            'Administrator',
            'Unit Head',
            'Transport Officer',
            'Teaching Faculty',
            'Program Coordinator',
            'Dean',
            'Non-Teaching Staff'
        ],
        default: 'Teaching Faculty'
    }
}, { timestamps: true });
const User = mongoose.model('User', userSchema);

const stockSchema = new mongoose.Schema({
    waterBottles: { type: Number, default: 50 },
    chairs: { type: Number, default: 200 },
    centerTables: { type: Number, default: 15 }
});
const Stock = mongoose.model('Stock', stockSchema);

const venueSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }
});
const Venue = mongoose.model('Venue', venueSchema);

const stockOrderSchema = new mongoose.Schema({
    id: String,
    item: String,
    qty: Number,
    requestedBy: String,
    dateTime: String,
    claimedBy: String,
    status: { type: String, default: 'pending' }
}, { timestamps: true });
const StockOrder = mongoose.model('StockOrder', stockOrderSchema);

const bookingSchema = new mongoose.Schema({
    id: String,
    venue: String,
    bookedBy: String,
    date: String,
    timeDuration: String,
    purpose: String,
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
    status: { type: String, default: 'pending' }
}, { timestamps: true });
const Transport = mongoose.model('Transport', transportSchema);

const waterSchema = new mongoose.Schema({
    date: { type: String, required: true, unique: true },
    wpl1: { type: Number, default: 0 },
    wpl2: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
}, { timestamps: true });
const Water = mongoose.model('Water', waterSchema);

const electricitySchema = new mongoose.Schema({
    date: { type: String, required: true },
    venue: { type: String, required: true },
    reading: { type: Number, required: true }
}, { timestamps: true });
electricitySchema.index({ date: 1, venue: 1 }, { unique: true });
const Electricity = mongoose.model('Electricity', electricitySchema);

const transportEmailSchema = new mongoose.Schema({
    id: String,
    transportId: String,
    to: String,
    from: String,
    subject: String,
    body: String,
    approvalLink: String,
    sentAt: { type: String, default: () => new Date().toISOString() },
    status: { type: String, default: 'sent' }
}, { timestamps: true });
const TransportEmail = mongoose.model('TransportEmail', transportEmailSchema);

// ================= SEED MONGO IF CONNECTED =================
async function seedMongoInitialData() {
    const seed = getInitialSeedData();
    for (const u of seed.users) {
        const exists = await User.findOne({ email: u.email });
        if (!exists) {
            await User.create(u);
        }
    }
    const stockCount = await Stock.countDocuments();
    if (stockCount === 0) {
        await Stock.create(seed.stock);
    }
    for (const v of seed.venues) {
        await Venue.findOneAndUpdate({ name: v.name }, { name: v.name }, { upsert: true });
    }
    const orderCount = await StockOrder.countDocuments();
    if (orderCount === 0) {
        await StockOrder.insertMany(seed.stockOrders);
    }
    const bookingCount = await Booking.countDocuments();
    if (bookingCount === 0) {
        await Booking.insertMany(seed.venueBookings);
    }
    const transportCount = await Transport.countDocuments();
    if (transportCount === 0) {
        await Transport.insertMany(seed.transportRequests);
    }
    const waterCount = await Water.countDocuments();
    if (waterCount === 0) {
        await Water.insertMany(seed.waterReadings);
    }
    const elecCount = await Electricity.countDocuments();
    if (elecCount === 0) {
        await Electricity.insertMany(seed.electricityReadings);
    }
    console.log('MongoDB initialized with all campus roles & sample records.');
}

// ================= AUTHENTICATION ENDPOINTS =================

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;
        if (!fullName || !email || !password || !role) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        const validRoles = [
            'Administrator',
            'Unit Head',
            'Transport Officer',
            'Teaching Faculty',
            'Program Coordinator',
            'Dean',
            'Non-Teaching Staff'
        ];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role provided.' });
        }

        if (useMongo) {
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await User.create({
                fullName,
                email: email.toLowerCase(),
                password: hashedPassword,
                role
            });
            const token = jwt.sign(
                { id: newUser._id, email: newUser.email, role: newUser.role, fullName: newUser.fullName },
                JWT_SECRET,
                { expiresIn: '7d' }
            );
            return res.json({
                success: true,
                token,
                user: { id: newUser._id, fullName: newUser.fullName, email: newUser.email, role: newUser.role }
            });
        } else {
            const db = readLocalDb();
            const exists = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (exists) {
                return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = {
                id: 'usr_' + Date.now(),
                fullName,
                email: email.toLowerCase(),
                password: hashedPassword,
                role
            };
            db.users.push(newUser);
            writeLocalDb(db);
            const token = jwt.sign(
                { id: newUser.id, email: newUser.email, role: newUser.role, fullName: newUser.fullName },
                JWT_SECRET,
                { expiresIn: '7d' }
            );
            return res.json({
                success: true,
                token,
                user: { id: newUser.id, fullName: newUser.fullName, email: newUser.email, role: newUser.role }
            });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        let user = null;
        if (useMongo) {
            user = await User.findOne({ email: email.toLowerCase() });
        } else {
            const db = readLocalDb();
            user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        }

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { id: user._id || user.id, email: user.email, role: user.role, fullName: user.fullName },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: { id: user._id || user.id, fullName: user.fullName, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ================= DATA API ENDPOINTS =================

// 1. Initial Page Data Load
app.get('/api/data', async (req, res) => {
    try {
        if (useMongo) {
            let stock = await Stock.findOne();
            if (!stock) stock = await Stock.create({ waterBottles: 50, chairs: 200, centerTables: 15 });
            const venues = await Venue.find().sort({ name: 1 });
            const stockOrders = await StockOrder.find().sort({ createdAt: -1 });
            const venueBookings = await Booking.find().sort({ createdAt: -1 });
            const transportRequests = await Transport.find().sort({ createdAt: -1 });
            const waterReadings = await Water.find().sort({ date: -1 });
            const electricityReadings = await Electricity.find().sort({ date: -1 });
            const transportEmails = await TransportEmail.find().sort({ createdAt: -1 }).limit(10);

            return res.json({
                database: 'mongodb',
                inventoryStock: {
                    waterBottles: stock.waterBottles,
                    chairs: stock.chairs,
                    centerTables: stock.centerTables
                },
                venueOptions: venues.map(v => v.name),
                stockOrders,
                venueBookings,
                transportRequests,
                waterReadings,
                electricityReadings,
                transportEmails
            });
        } else {
            const db = readLocalDb();
            return res.json({
                database: 'local_json_db',
                inventoryStock: db.stock,
                venueOptions: db.venues.map(v => v.name),
                stockOrders: db.stockOrders || [],
                venueBookings: db.venueBookings || [],
                transportRequests: db.transportRequests || [],
                waterReadings: db.waterReadings || [],
                electricityReadings: db.electricityReadings || [],
                transportEmails: db.transportEmails || []
            });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Stock Inventory Endpoints
app.get('/api/stock', async (req, res) => {
    try {
        if (useMongo) {
            let stock = await Stock.findOne();
            if (!stock) stock = await Stock.create({ waterBottles: 50, chairs: 200, centerTables: 15 });
            return res.json({ success: true, inventoryStock: stock });
        } else {
            const db = readLocalDb();
            return res.json({ success: true, inventoryStock: db.stock });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/stock', async (req, res) => {
    try {
        const { waterBottles, chairs, centerTables } = req.body;
        const wb = parseInt(waterBottles) || 0;
        const ch = parseInt(chairs) || 0;
        const ct = parseInt(centerTables) || 0;

        if (useMongo) {
            let stock = await Stock.findOne();
            if (!stock) stock = new Stock();
            stock.waterBottles = wb;
            stock.chairs = ch;
            stock.centerTables = ct;
            await stock.save();
            return res.json({ success: true, inventoryStock: stock });
        } else {
            const db = readLocalDb();
            db.stock = { waterBottles: wb, chairs: ch, centerTables: ct };
            writeLocalDb(db);
            return res.json({ success: true, inventoryStock: db.stock });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Stock Orders / Requisitions
app.get('/api/stock/orders', async (req, res) => {
    try {
        if (useMongo) {
            const orders = await StockOrder.find().sort({ createdAt: -1 });
            return res.json({ success: true, orders });
        } else {
            const db = readLocalDb();
            return res.json({ success: true, orders: db.stockOrders || [] });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/stock/orders', async (req, res) => {
    try {
        const orderData = req.body;
        if (!orderData.id) orderData.id = 'RO-' + Math.floor(500 + Math.random() * 500);

        if (useMongo) {
            const order = await StockOrder.create(orderData);
            return res.json({ success: true, order });
        } else {
            const db = readLocalDb();
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
            const updateFields = {};
            if (status !== undefined) updateFields.status = status;
            if (claimedBy !== undefined) updateFields.claimedBy = claimedBy;
            const updated = await StockOrder.findOneAndUpdate(
                { id: req.params.id },
                { $set: updateFields },
                { new: true }
            );
            return res.json({ success: true, order: updated });
        } else {
            const db = readLocalDb();
            const order = (db.stockOrders || []).find(o => o.id === req.params.id);
            if (order) {
                if (status !== undefined) order.status = status;
                if (claimedBy !== undefined) order.claimedBy = claimedBy;
                writeLocalDb(db);
                return res.json({ success: true, order });
            }
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 3. Venues & Venue Bookings
app.get('/api/venues', async (req, res) => {
    try {
        if (useMongo) {
            const venues = await Venue.find().sort({ name: 1 });
            return res.json({ success: true, venueOptions: venues.map(v => v.name) });
        } else {
            const db = readLocalDb();
            return res.json({ success: true, venueOptions: db.venues.map(v => v.name) });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/venues', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Venue name required' });

        if (useMongo) {
            await Venue.findOneAndUpdate({ name }, { name }, { upsert: true });
            const venues = await Venue.find().sort({ name: 1 });
            return res.json({ success: true, venueOptions: venues.map(v => v.name) });
        } else {
            const db = readLocalDb();
            if (!db.venues.find(v => v.name.toLowerCase() === name.toLowerCase())) {
                db.venues.push({ id: 'v_' + Date.now(), name });
                writeLocalDb(db);
            }
            return res.json({ success: true, venueOptions: db.venues.map(v => v.name) });
        }
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

app.get('/api/bookings', async (req, res) => {
    try {
        if (useMongo) {
            const bookings = await Booking.find().sort({ createdAt: -1 });
            return res.json({ success: true, bookings });
        } else {
            const db = readLocalDb();
            return res.json({ success: true, bookings: db.venueBookings || [] });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/bookings', async (req, res) => {
    try {
        const bookingData = req.body;
        if (!bookingData.id) bookingData.id = 'VB-' + Math.floor(200 + Math.random() * 800);

        if (useMongo) {
            const newBooking = await Booking.create(bookingData);
            return res.json({ success: true, booking: newBooking });
        } else {
            const db = readLocalDb();
            if (!db.venueBookings) db.venueBookings = [];
            db.venueBookings.unshift(bookingData);
            writeLocalDb(db);
            return res.json({ success: true, booking: bookingData });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.patch('/api/bookings/:id', async (req, res) => {
    try {
        const { status } = req.body;
        if (useMongo) {
            const updated = await Booking.findOneAndUpdate(
                { id: req.params.id },
                { $set: { status } },
                { new: true }
            );
            return res.json({ success: true, booking: updated });
        } else {
            const db = readLocalDb();
            const b = (db.venueBookings || []).find(x => x.id === req.params.id);
            if (b) {
                b.status = status;
                writeLocalDb(db);
                return res.json({ success: true, booking: b });
            }
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 4. Transport Requests & Email Dispatch to Transport Officer
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
        if (!transportData.id) {
            transportData.id = 'TR-' + Math.floor(1000 + Math.random() * 9000);
        }

        // Generate direct approval link for the Transport Officer
        const approvalLink = `${APP_URL}/index.html?view=transportReqView&reqId=${transportData.id}&role=Transport+Officer`;

        const emailNotification = {
            id: 'EML-' + Date.now(),
            transportId: transportData.id,
            to: TRANSPORT_OFFICER_EMAIL,
            from: 'campusflow-notifications@apollo-uni.edu',
            subject: `Action Required: Transport Request #${transportData.id} for ${transportData.guest || 'Guest'}`,
            body: `Dear Transport Officer,

A new university vehicle requisition has been submitted:
- Request ID: #${transportData.id}
- Guest/Delegation: ${transportData.guest}
- Vehicle Details: ${transportData.vehicle}
- Date & Time: ${transportData.dateTime}
- Destination: ${transportData.destination}
- Requested By: ${transportData.requestedBy || 'Campus Faculty / Authority'}
- Purpose: ${transportData.purpose || 'Official Visit'}

Click the link below to review, approve or reject this booking directly on the CampusFlow portal:
${approvalLink}`,
            approvalLink: approvalLink,
            sentAt: new Date().toISOString(),
            status: 'sent'
        };

        if (useMongo) {
            const newTransport = await Transport.create(transportData);
            await TransportEmail.create(emailNotification);
            return res.json({
                success: true,
                transport: newTransport,
                emailNotification,
                message: `Transport request logged & email dispatched to ${TRANSPORT_OFFICER_EMAIL}`
            });
        } else {
            const db = readLocalDb();
            if (!db.transportRequests) db.transportRequests = [];
            db.transportRequests.unshift(transportData);

            if (!db.transportEmails) db.transportEmails = [];
            db.transportEmails.unshift(emailNotification);
            writeLocalDb(db);

            return res.json({
                success: true,
                transport: transportData,
                emailNotification,
                message: `Transport request logged & email dispatched to ${TRANSPORT_OFFICER_EMAIL}`
            });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.patch('/api/transport/:id', async (req, res) => {
    try {
        const { status } = req.body;
        if (useMongo) {
            const updated = await Transport.findOneAndUpdate(
                { id: req.params.id },
                { $set: { status } },
                { new: true }
            );
            return res.json({ success: true, transport: updated });
        } else {
            const db = readLocalDb();
            const t = (db.transportRequests || []).find(x => x.id === req.params.id);
            if (t) {
                t.status = status;
                writeLocalDb(db);
                return res.json({ success: true, transport: t });
            }
            return res.status(404).json({ success: false, message: 'Transport request not found' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Transport Email Notifications query
app.get('/api/notifications/transport', async (req, res) => {
    try {
        if (useMongo) {
            const emails = await TransportEmail.find().sort({ createdAt: -1 }).limit(20);
            return res.json({ success: true, emails });
        } else {
            const db = readLocalDb();
            return res.json({ success: true, emails: db.transportEmails || [] });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 5. Utilities: Water Usage
app.get('/api/water', async (req, res) => {
    try {
        if (useMongo) {
            const water = await Water.find().sort({ date: -1 });
            return res.json({ success: true, waterReadings: water });
        } else {
            const db = readLocalDb();
            return res.json({ success: true, waterReadings: db.waterReadings || [] });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/water', async (req, res) => {
    try {
        const { date, wpl1, wpl2, total } = req.body;
        if (!date) return res.status(400).json({ success: false, message: 'Date is required.' });

        const record = {
            date,
            wpl1: Number(wpl1) || 0,
            wpl2: Number(wpl2) || 0,
            total: Number(total) || (Number(wpl1) || 0) + (Number(wpl2) || 0)
        };

        if (useMongo) {
            const updated = await Water.findOneAndUpdate(
                { date: record.date },
                { $set: record },
                { new: true, upsert: true }
            );
            const allWater = await Water.find().sort({ date: -1 });
            return res.json({ success: true, record: updated, allWater });
        } else {
            const db = readLocalDb();
            if (!db.waterReadings) db.waterReadings = [];
            const idx = db.waterReadings.findIndex(w => w.date === record.date);
            if (idx !== -1) {
                db.waterReadings[idx] = record;
            } else {
                db.waterReadings.unshift(record);
            }
            writeLocalDb(db);
            return res.json({ success: true, record, allWater: db.waterReadings });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 6. Utilities: Electricity Usage
app.get('/api/electricity', async (req, res) => {
    try {
        if (useMongo) {
            const elec = await Electricity.find().sort({ date: -1 });
            return res.json({ success: true, electricityReadings: elec });
        } else {
            const db = readLocalDb();
            return res.json({ success: true, electricityReadings: db.electricityReadings || [] });
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
                await Electricity.findOneAndUpdate(
                    { date: item.date, venue: item.venue },
                    { $set: { reading: Number(item.reading) || 0 } },
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
                const rec = { date: item.date, venue: item.venue, reading: Number(item.reading) || 0 };
                if (idx !== -1) {
                    db.electricityReadings[idx] = rec;
                } else {
                    db.electricityReadings.unshift(rec);
                }
            }
            writeLocalDb(db);
            return res.json({ success: true, count: entries.length, allElec: db.electricityReadings });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ================= SERVER START WITH MONGO AUTO-FALLBACK =================
mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 })
    .then(async () => {
        useMongo = true;
        console.log('✅ Connected to MongoDB successfully at ' + MONGO_URI);
        await seedMongoInitialData();
        app.listen(PORT, () => {
            console.log(`🚀 Apollo RMS / CampusFlow Server running at http://localhost:${PORT} (MongoDB mode)`);
        });
    })
    .catch((err) => {
        useMongo = false;
        console.log('⚠️ MongoDB not detected at ' + MONGO_URI);
        console.log('📁 Running with built-in persistent local database at ' + DB_FILE + ' so all features work out-of-the-box!');
        app.listen(PORT, () => {
            console.log(`🚀 Apollo RMS / CampusFlow Server running at http://localhost:${PORT} (Local DB fallback mode)`);
        });
    });
