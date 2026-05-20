import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './config/db.js';
import authRoutes from "./routes/authRoutes.js";
import loanRoutes from "./routes/loanRoutes.js";
import paymentRoutes from "./routes/paymentRoute.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import reminderRoutes from "./routes/reminderRoutes.js"
import "./cron/reminderJob.js";

dotenv.config();

const app = express();


app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);  //http://localhost:5000/api/auth/register
app.use("/api/loans", loanRoutes); // http://localhost:5000/api/loans
app.use("/api/payments", paymentRoutes); // http://localhost:5000/api/payments/add
app.use("/api/dashboard", dashboardRoutes); // http://localhost:5000/api/dashboard
app.use("/api/reminders", reminderRoutes); // http://localhost:5000/api/reminders/whatsapp


app.get("/",(req,res)=>{
res.send("API is working");
});

app.listen(5000, () => {
  console.log("Server is running on http://localhost:5000");
});

// export default server;