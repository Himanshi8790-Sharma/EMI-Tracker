import { runReminderCheck } from "../../cron/reminderJob.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const cronSecret = process.env.CRON_SECRET;
  const authorization = req.headers.authorization;

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const result = await runReminderCheck();
    return res.status(200).json({
      message: "Reminder check completed",
      ...result,
    });
  } catch (error) {
    console.error("Reminder job failed:", error);
    return res.status(500).json({ message: "Reminder check failed" });
  }
}
