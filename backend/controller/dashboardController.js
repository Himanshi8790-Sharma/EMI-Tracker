import prisma from "../config/prisma.js";

export const getDashboard = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const loans = await prisma.loan.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        nextDueDate: "asc",
      },
    });

    const now = new Date();

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    let totalEmiThisMonth = 0;
    let totalPending = 0;
    let upcomingLoansCount = 0;
    let urgentLoansCount = 0;

    const upcomingLoans = [];

    for (const loan of loans) {
      // Total pending
      if (loan.emiAmount && loan.totalEmis) {
        totalPending +=
          Number(loan.emiAmount) * Number(loan.totalEmis);
      }

      if (loan.nextDueDate) {
        const dueDate = new Date(loan.nextDueDate);

        const dueDateOnly = new Date(
          dueDate.getFullYear(),
          dueDate.getMonth(),
          dueDate.getDate()
        );

        // EMI due this month
        if (
          dueDateOnly >= startOfMonth &&
          dueDateOnly <= endOfMonth
        ) {
          totalEmiThisMonth += Number(loan.emiAmount || 0);
        }

        // Days left
        const daysLeft = Math.ceil(
          (dueDateOnly - today) /
            (1000 * 60 * 60 * 24)
        );

        // Upcoming loans: 0 to 7 days
        if (daysLeft >= 0 && daysLeft <= 7) {
          upcomingLoansCount++;
        }

        // Urgent loans: <= 3 days
        if (daysLeft <= 3) {
          urgentLoansCount++;
        }

        // Upcoming loans list
        upcomingLoans.push({
          id: loan.id,
          loan_name: loan.loanName,
          emi_amount: loan.emiAmount,
          next_due_date: loan.nextDueDate,
          payer_name: loan.payerName,
          payer_type: loan.payerType,
          total_emis: loan.totalEmis,
          total_amount: loan.totalAmount,
          interest_rate: loan.interestRate,
          daysLeft,
        });
      } else {
        upcomingLoans.push({
          id: loan.id,
          loan_name: loan.loanName,
          emi_amount: loan.emiAmount,
          next_due_date: loan.nextDueDate,
          payer_name: loan.payerName,
          payer_type: loan.payerType,
          total_emis: loan.totalEmis,
          total_amount: loan.totalAmount,
          interest_rate: loan.interestRate,
          daysLeft: null,
        });
      }
    }

    // Same LIMIT 5 as old MySQL query
    upcomingLoans.splice(5);

    res.json({
      totalLoans: loans.length,
      totalEmiThisMonth,
      totalPending,
      upcomingLoansCount,
      urgentLoansCount,
      upcomingLoans,
    });
  } catch (err) {
    console.error("DASHBOARD ERROR:", err);

    res.status(500).json({
      message: "Error fetching dashboard",
    });
  }
};

// PATCH - Mark EMI as Paid
export const markAsPaid = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const loanId = Number(req.params.id);

    const loan = await prisma.loan.findUnique({
      where: {
        id: loanId,
        userId,
      },
    });

    if (!loan || !loan.remainingEmis || loan.remainingEmis <= 0) {
      return res.status(404).json({
        message: "Loan not found",
      });
    }

    const newRemainingEmis = loan.remainingEmis - 1;

    let newNextDueDate = loan.nextDueDate;

    if (loan.nextDueDate) {
      newNextDueDate = new Date(loan.nextDueDate);

      newNextDueDate.setMonth(
        newNextDueDate.getMonth() + 1
      );
    }

    await prisma.loan.update({
      where: {
        id: loanId,
      },
      data: {
        remainingEmis: newRemainingEmis,
        nextDueDate: newNextDueDate,
        isActive: newRemainingEmis > 0,
      },
    });

    res.json({
      message: "EMI marked as paid ✅",
    });
  } catch (err) {
    console.error("MARK AS PAID ERROR:", err);

    res.status(500).json({
      message: "Error updating loan",
    });
  }
};