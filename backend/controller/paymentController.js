import db from "../config/db.js";

// payemnt mark krne ki POST
export const addPayment = (req, res) => {
  const userId = req.user.id;

  const { loan_id, amount_paid, emi_number, paid_by, payment_date, notes } = req.body;


const formattedDate = payment_date
  ? payment_date.split("T")[0]
  : new Date().toISOString().split("T")[0];

  // 🔐 Loan check
  const checkLoanQuery = "SELECT * FROM loans WHERE id = ? AND user_id = ?";

 db.query(checkLoanQuery, [loan_id, userId], (err, loanResult) => {
  if (err) {
    return res.status(500).json({ message: "DB error" });
  }

  if (loanResult.length === 0) {
    return res.status(403).json({ message: "Unauthorized ❌" });
  }

    const insertQuery = `
      INSERT INTO payments 
      (loan_id, amount_paid, emi_number, paid_by, payment_date, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
      insertQuery,
      [loan_id, amount_paid, emi_number, paid_by, formattedDate, notes],
      (err, result) => {
        if (err) {
          console.log("PAYMENT ERROR:", err);

return res.status(500).json({
  message: err.message,
});
          // return res.status(500).json({ message: "Error adding payment" });
        }

        const updateLoanQuery = `
          UPDATE loans 
          SET next_due_date = DATE_ADD(next_due_date, INTERVAL 1 MONTH)
          WHERE id = ? AND user_id = ?
        `;

        db.query(updateLoanQuery, [loan_id, userId]);

        res.status(201).json({
          message: "Payment added ✅",
        });
      }
    );
  });
};

// get single loan history

export const getLoanPayments = (req, res) => {
const loanId = req.params.loanId;

  const query = `
    SELECT * FROM payments
    WHERE loan_id = ?
    ORDER BY payment_date DESC
  `;

  db.query(query, [loanId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching payments" });
    }

    res.json({
      count: result.length,
      payments: result,
    });
  });
};


// GET All Payments (User level) 

export const getAllPayments  = (req,res)=>{
    const userId = req.user.id;
const query = `
  SELECT 
    p.*,
    l.loan_name AS loanName,
    l.color AS loanColor,
    l.payer_type AS payerType
  FROM payments p
  JOIN loans l ON p.loan_id = l.id
  WHERE l.user_id = ?
  ORDER BY p.payment_date DESC
`;
  db.query(query, [userId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching payments" });
    }

    res.json({
      count: result.length,
      payments: result,
    });
  });
}


















