import express, { Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
