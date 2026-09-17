import prisma from "../config/prisma.js";

export const runReminderCheck = async () => {
  try {
    console.log("Running Reminder Job...");

    const loans = await prisma.loan.findMany({
      where: {
        isActive: true,
      },
    });

    let remindersFound = 0;

    for (const loan of loans) {
      if (!loan.nextDueDate) {
        continue;
      }

      const today = new Date();

      const todayDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      const dueDate = new Date(loan.nextDueDate);

      const dueDateOnly = new Date(
        dueDate.getFullYear(),
        dueDate.getMonth(),
        dueDate.getDate()
      );

      const diffDays = Math.ceil(
        (dueDateOnly - todayDate) /
          (1000 * 60 * 60 * 24)
      );

      // Existing condition: 3 days or 1 day before EMI
      if (diffDays === 3 || diffDays === 1) {
        remindersFound += 1;

        console.log(
          `Reminder: ${loan.loanName} EMI due in ${diffDays} days`
        );
      }
    }

    return {
      loansChecked: loans.length,
      remindersFound,
    };
  } catch (err) {
    console.error("REMINDER JOB ERROR:", err);
    throw err;
  }
};