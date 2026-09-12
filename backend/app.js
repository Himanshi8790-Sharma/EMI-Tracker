import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import loanRoutes from "./routes/loanRoutes.js";
import paymentRoutes from "./routes/paymentRoute.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import reminderRoutes from "./routes/reminderRoutes.js";

const app = express();

const corsOptions = process.env.FRONTEND_ORIGIN
  ? { origin: process.env.FRONTEND_ORIGIN }
  : undefined;

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reminders", reminderRoutes);

app.get("/", (req, res) => {
  res.send("API is working");
});

export default app;
