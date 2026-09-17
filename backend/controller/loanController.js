import prisma from "../config/prisma.js";

// ADD LOAN = POST
export const addLoan = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      loan_name,
      total_amount,
      emi_amount,
      total_emis,
      remaining_emis,
      interest_rate,
      start_date,
      next_due_date,
      payer_type,
      payer_name,
      payer_phone,
      payer_email,
      color,
      notes,
    } = req.body;

    // Basic validation
    if (
      !loan_name ||
      !total_amount ||
      !emi_amount ||
      !total_emis ||
      !next_due_date
    ) {
      return res.status(400).json({
        message: "Required fields missing",
      });
    }

    const loan = await prisma.loan.create({
      data: {
        userId: Number(userId),
        loanName: loan_name,
        totalAmount: total_amount,
        emiAmount: emi_amount,
        totalEmis: Number(total_emis),
        remainingEmis: Number(remaining_emis || total_emis),
        interestRate: interest_rate || null,

        startDate: start_date ? new Date(start_date) : null,
        nextDueDate: new Date(next_due_date),

        payerType: payer_type || "self",
        payerName: payer_name || null,
        payerPhone: payer_phone || null,
        payerEmail: payer_email || null,

        color: color || "#7F77DD",
        notes: notes || null,

        isActive: true,
      },
    });

    res.status(201).json({
      message: "Loan added successfully ✅",
      loanId: loan.id,
    });
  } catch (err) {
    console.error("ADD LOAN ERROR:", err);

    res.status(500).json({
      message: err.message,
    });
  }
};

// GET ALL LOANS
export const getLoans = async (req, res) => {
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

    const today = new Date();

    const formattedLoans = loans.map((loan) => {
      const nextDueDate = loan.nextDueDate
        ? new Date(loan.nextDueDate)
        : null;

      let daysLeft = null;

      if (nextDueDate) {
        const todayDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );

        const dueDate = new Date(
          nextDueDate.getFullYear(),
          nextDueDate.getMonth(),
          nextDueDate.getDate()
        );

        daysLeft = Math.ceil(
          (dueDate - todayDate) / (1000 * 60 * 60 * 24)
        );
      }

      return {
        ...loan,
        daysLeft,
      };
    });

    res.json({
      count: formattedLoans.length,
      loans: formattedLoans,
    });
  } catch (err) {
    console.error("GET LOANS ERROR:", err);

    res.status(500).json({
      message: "Error fetching loans",
    });
  }
};

// GET SINGLE LOAN
export const getSingleLoan = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const loanId = Number(req.params.id);

    const loan = await prisma.loan.findFirst({
      where: {
        id: loanId,
        userId,
      },
    });

    if (!loan) {
      return res.status(404).json({
        message: "Loan not found",
      });
    }

    let daysLeft = null;

    if (loan.nextDueDate) {
      const today = new Date();

      const todayDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      const dueDate = new Date(
        loan.nextDueDate.getFullYear(),
        loan.nextDueDate.getMonth(),
        loan.nextDueDate.getDate()
      );

      daysLeft = Math.ceil(
        (dueDate - todayDate) / (1000 * 60 * 60 * 24)
      );
    }

    res.json({
      loan: {
        ...loan,
        daysLeft,
      },
    });
  } catch (err) {
    console.error("GET SINGLE LOAN ERROR:", err);

    res.status(500).json({
      message: "Error fetching loan",
    });
  }
};

// UPDATE LOAN = PUT
export const updateLoan = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("PARAMS:", req.params);

    const userId = Number(req.user.id);
    const loanId = Number(req.params.id);

    const {
      loan_name,
      total_amount,
      emi_amount,
      total_emis,
      interest_rate,
      start_date,
      next_due_date,
      payer_type,
      payer_name,
      payer_phone,
      payer_email,
      notes,
    } = req.body;

    const existingLoan = await prisma.loan.findFirst({
      where: {
        id: loanId,
        userId,
      },
    });

    if (!existingLoan) {
      return res.status(404).json({
        message: "Loan not found",
      });
    }

    await prisma.loan.update({
      where: {
        id: loanId,
      },
      data: {
        loanName: loan_name,
        totalAmount: total_amount,
        emiAmount: emi_amount,
        totalEmis: Number(total_emis),
        interestRate: interest_rate || null,

        startDate: start_date ? new Date(start_date) : null,
        nextDueDate: next_due_date
          ? new Date(next_due_date)
          : null,

        payerType: payer_type,
        payerName: payer_name || null,
        payerPhone: payer_phone || null,
        payerEmail: payer_email || null,

        notes: notes || null,
      },
    });

    res.json({
      message: "Loan updated successfully ✅",
    });
  } catch (err) {
    console.error("UPDATE LOAN ERROR:", err);

    res.status(500).json({
      message: err.message,
    });
  }
};

// DELETE LOAN
export const deleteLoan = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const loanId = Number(req.params.id);

    const existingLoan = await prisma.loan.findFirst({
      where: {
        id: loanId,
        userId,
      },
    });

    if (!existingLoan) {
      return res.status(404).json({
        message: "Loan not found",
      });
    }

    await prisma.loan.update({
      where: {
        id: loanId,
      },
      data: {
        isActive: false,
      },
    });

    res.json({
      message: "Loan deleted successfully 🗑️",
    });
  } catch (err) {
    console.error("DELETE LOAN ERROR:", err);

    res.status(500).json({
      message: "Error deleting loan",
    });
  }
};

// MARK EMI AS PAID
export const markAsPaid = async (req, res) => {
  try {
    const loanId = Number(req.params.id);

    const loan = await prisma.loan.findUnique({
      where: {
        id: loanId,
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
      newNextDueDate.setMonth(newNextDueDate.getMonth() + 1);
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