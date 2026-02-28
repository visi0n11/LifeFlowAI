import express, { Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";

dotenv.config();

const DB_FILE = path.join(process.cwd(), "db.json");

async function readDb() {
  try {
    const data = await fs.readFile(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    const initialDb = {
      donors: [
        { id: 1, name: "Vaghu", age: 24, bloodType: "O+", contact: "9870000101", email: "vaghu@example.com", lastDonation: "2024-02-15" },
        { id: 2, name: "Aayan", age: 22, bloodType: "B-", contact: "9870000102", email: "aayan@example.com", lastDonation: "2024-03-01" },
        { id: 3, name: "Akash", age: 25, bloodType: "AB+", contact: "9870000103", email: "akash@example.com", lastDonation: "2024-01-20" },
        { id: 4, name: "Shreyash", age: 23, bloodType: "O+", contact: "9870000104", email: "shreyash@example.com", lastDonation: "2024-03-10" },
        { id: 5, name: "Rahul Sharma", age: 28, bloodType: "A+", contact: "9870000105", email: "rahul@example.com", lastDonation: "2024-02-28" },
        { id: 6, name: "Sneha Gupta", age: 26, bloodType: "B+", contact: "9870000106", email: "sneha@example.com", lastDonation: "2024-03-05" },
        { id: 7, name: "Amit Verma", age: 31, bloodType: "O-", contact: "9870000107", email: "amit@example.com", lastDonation: "2024-01-15" },
        { id: 8, name: "Kavita Reddy", age: 29, bloodType: "A-", contact: "9870000108", email: "kavita@example.com", lastDonation: "2024-03-12" },
        { id: 9, name: "Vikram Singh", age: 35, bloodType: "B+", contact: "9870000109", email: "vikram@example.com", lastDonation: "2024-02-10" },
        { id: 10, name: "Anjali Nair", age: 24, bloodType: "AB-", contact: "9870000110", email: "anjali@example.com", lastDonation: "2024-03-18" },
      ],
      recipients: [
        { id: 1, name: "Sahil Mane", age: 29, bloodType: "O+", contact: "9988776655", condition: "Surgery Recovery" },
        { id: 2, name: "Priya Patil", age: 34, bloodType: "AB+", contact: "9988776644", condition: "Anemia Treatment" },
        { id: 3, name: "Rohan Deshmukh", age: 42, bloodType: "B+", contact: "9988776633", condition: "Accident Trauma" },
        { id: 4, name: "Meera Iyer", age: 27, bloodType: "A-", contact: "9988776622", condition: "Thalassemia" },
      ],
      bags: [
        { id: 1, type: "O+", volume: "450ml", donationDate: "2024-03-12", expiryDate: "2024-04-23" },
        { id: 2, type: "B-", volume: "450ml", donationDate: "2024-03-05", expiryDate: "2024-04-16" },
        { id: 3, type: "AB+", volume: "450ml", donationDate: "2024-01-25", expiryDate: "2024-03-08" },
        { id: 4, type: "A+", volume: "450ml", donationDate: "2024-03-20", expiryDate: "2024-05-01" },
        { id: 5, type: "O-", volume: "450ml", donationDate: "2024-03-15", expiryDate: "2024-04-26" },
      ],
      resources: [
        { id: 1, type: 'food', donorName: 'Akash', details: '10kg Rice', date: '2024-03-15' },
        { id: 2, type: 'money', donorName: 'Vaghu', details: '₹1500', date: '2024-03-14' },
        { id: 3, type: 'clothes', donorName: 'Aayan', details: '5 Pairs of Trousers', date: '2024-03-10' },
        { id: 4, type: 'food', donorName: 'Rahul Sharma', details: '5kg Wheat Flour', date: '2024-03-22' },
        { id: 5, type: 'money', donorName: 'Sneha Gupta', details: '₹2000', date: '2024-03-25' },
      ],
      notifications: [],
      users: []
    };
    await fs.writeFile(DB_FILE, JSON.stringify(initialDb, null, 2), "utf-8");
    return initialDb;
  }
}

async function writeDb(data: any) {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Database API Routes
  app.get("/api/db", async (req: Request, res: Response) => {
    const db = await readDb();
    res.json(db);
  });

  app.post("/api/db/:collection", async (req: Request, res: Response) => {
    const collection = req.params.collection as string;
    const item = req.body;
    const db = await readDb() as any;
    if (db[collection]) {
      db[collection] = [item, ...db[collection]];
      await writeDb(db);
      res.json(item);
    } else {
      res.status(404).json({ error: "Collection not found" });
    }
  });

  app.put("/api/db/:collection/:id", async (req: Request, res: Response) => {
    const collection = req.params.collection as string;
    const id = req.params.id as string;
    const updatedItem = req.body;
    const db = await readDb() as any;
    if (db[collection]) {
      db[collection] = db[collection].map((item: any) => 
        item.id.toString() === id.toString() ? updatedItem : item
      );
      await writeDb(db);
      res.json(updatedItem);
    } else {
      res.status(404).json({ error: "Collection not found" });
    }
  });

  app.delete("/api/db/:collection/:id", async (req: Request, res: Response) => {
    const collection = req.params.collection as string;
    const id = req.params.id as string;
    const db = await readDb() as any;
    if (db[collection]) {
      db[collection] = db[collection].filter((item: any) => 
        item.id.toString() !== id.toString()
      );
      await writeDb(db);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Collection not found" });
    }
  });

  app.post("/api/db/sync-all", async (req: Request, res: Response) => {
    const collection = req.body.collection as string;
    const data = req.body.data;
    const db = await readDb() as any;
    if (db[collection] !== undefined) {
      db[collection] = data;
      await writeDb(db);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Collection not found" });
    }
  });

  // Auth Endpoints
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const db = await readDb() as any;
    const user = db.users.find((u: any) => u.email === email && u.password === password);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    const userData = req.body;
    const db = await readDb() as any;
    if (db.users.some((u: any) => u.email === userData.email)) {
      return res.status(400).json({ error: "User already exists" });
    }
    db.users.push(userData);
    await writeDb(db);
    const { password, ...userWithoutPassword } = userData;
    res.json(userWithoutPassword);
  });

  app.post("/api/auth/forgot", async (req: Request, res: Response) => {
    const { email } = req.body;
    const db = await readDb() as any;
    const userExists = db.users.some((u: any) => u.email === email) || email === 'admin@lifeflow.ai';
    if (userExists) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });

  // API Route for sending urgent emails
  app.post("/api/send-urgent-email", async (req: Request, res: Response) => {
    const { to, donorName, bloodType } = req.body;

    if (!to || !donorName) {
      return res.status(400).json({ error: "Missing recipient info" });
    }

    // Check for SMTP credentials
    const { SMTP_USER, SMTP_PASS } = process.env;
    
    if (!SMTP_USER || !SMTP_PASS) {
      console.warn("SMTP credentials missing. Email not sent.");
      return res.status(400).json({ 
        error: "SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in environment variables.",
        details: "The system attempted to send an automatic email but lacks credentials."
      });
    }

    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      const mailOptions = {
        from: `"LifeFlow AI" <${SMTP_USER}>`,
        to: to,
        subject: "URGENT: Life-Saving Blood Donation Needed",
        text: `Hello ${donorName},

We urgently need blood for a patient in critical condition. Your donation could save a life today. If you are available and eligible to donate, please consider helping.

Your support would mean more than words can express.

Thank you,
LifeFlow AI Team
(Contact: blooddonationlifeflowai@gmail.com)`,
      };

      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: "Email sent automatically" });
    } catch (error: any) {
      console.error("Email sending failed:", error);
      res.status(500).json({ error: "Failed to send email", details: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
