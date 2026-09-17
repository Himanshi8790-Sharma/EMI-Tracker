import prisma from "../config/prisma.js";

// ADD PAYMENT
export const addPayment = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const {
      loan_id,
      amount_paid,
      emi_number,
      paid_by,
      payment_date,
      notes,
    } = req.body;

    const loanId = Number(loan_id);

    const formattedDate = payment_date
      ? new Date(payment_date)
      : new Date();

    // Loan check
    const loan = await prisma.loan.findFirst({
      where: {
        id: loanId,
        userId,
      },
    });

    if (!loan) {
      return res.status(403).json({
        message: "Unauthorized ❌",
      });
    }

    // Create payment
    await prisma.payment.create({
      data: {
        loanId,
        amountPaid: amount_paid,
        emiNumber: emi_number ? Number(emi_number) : null,
        paidBy: paid_by || null,
        paymentDate: formattedDate,
        notes: notes || null,
        status: "paid",
      },
    });

    // Update next due date
    let nextDueDate = loan.nextDueDate;

    if (nextDueDate) {
      nextDueDate = new Date(nextDueDate);
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    }

    await prisma.loan.update({
      where: {
        id: loanId,
      },
      data: {
        nextDueDate,
      },
    });

    res.status(201).json({
      message: "Payment added ✅",
    });
  } catch (err) {
    console.error("PAYMENT ERROR:", err);

    res.status(500).json({
      message: err.message,
    });
  }
};

// GET SINGLE LOAN PAYMENT HISTORY
export const getLoanPayments = async (req, res) => {
  try {
    const loanId = Number(req.params.loanId);

    const payments = await prisma.payment.findMany({
      where: {
        loanId,
      },
      orderBy: {
        paymentDate: "desc",
      },
    });

    res.json({
      count: payments.length,
      payments,
    });
  } catch (err) {
    console.error("GET LOAN PAYMENTS ERROR:", err);

    res.status(500).json({
      message: "Error fetching payments",
    });
  }
};

// GET ALL PAYMENTS
export const getAllPayments = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const payments = await prisma.payment.findMany({
      where: {
        loan: {
          userId,
        },
      },
      include: {
        loan: {
          select: {
            loanName: true,
            color: true,
            payerType: true,
          },
        },
      },
      orderBy: {
        paymentDate: "desc",
      },
    });

    const formattedPayments = payments.map((payment) => ({
      id: payment.id,
      loanId: payment.loanId,
      amountPaid: payment.amountPaid,
      emiNumber: payment.emiNumber,
      paidBy: payment.paidBy,
      paymentDate: payment.paymentDate,
      notes: payment.notes,
      status: payment.status,

      // Same names as old MySQL aliases
      loanName: payment.loan?.loanName,
      loanColor: payment.loan?.color,
      payerType: payment.loan?.payerType,
    }));

    res.json({
      count: formattedPayments.length,
      payments: formattedPayments,
    });
  } catch (err) {
    console.error("GET ALL PAYMENTS ERROR:", err);

    res.status(500).json({
      message: "Error fetching payments",
    });
  }
};