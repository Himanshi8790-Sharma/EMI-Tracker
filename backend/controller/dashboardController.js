import db from "../config/db.js";

export const getDashboard = (req, res) => {
  const userId = req.user.id;

  // 🔹 Summary Query
  const summaryQuery = `
    SELECT 
      COUNT(*) AS total_loans,

      SUM(
        CASE 
          WHEN MONTH(next_due_date) = MONTH(CURDATE()) 
          AND YEAR(next_due_date) = YEAR(CURDATE())
          THEN emi_amount
          ELSE 0
        END
      ) AS total_due_this_month,

      SUM(emi_amount * total_emis) AS total_pending,

      SUM(
        CASE 
          WHEN DATEDIFF(next_due_date, CURDATE()) BETWEEN 0 AND 7
          THEN 1
          ELSE 0
        END
      ) AS upcoming_loans,

      SUM(
        CASE 
          WHEN DATEDIFF(next_due_date, CURDATE()) <= 3
          THEN 1
          ELSE 0
        END
      ) AS urgent_loans

    FROM loans
    WHERE user_id = ? AND is_active = true
  `;

  // 🔹 Upcoming Loans List
  const loansQuery = `
    SELECT 
      id,
      loan_name,
      emi_amount,
      next_due_date,
      payer_name,
      payer_type,
      total_emis,
      total_amount,
      interest_rate,
      DATEDIFF(next_due_date, CURDATE()) AS daysLeft
    FROM loans
    WHERE user_id = ? AND is_active = true
    ORDER BY next_due_date ASC
    LIMIT 5
  `;

  db.query(summaryQuery, [userId], (err, summaryResult) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching summary" });
    }

    db.query(loansQuery, [userId], (err, loansResult) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching loans" });
      }

      res.json({
        totalLoans: summaryResult[0].total_loans,
        totalEmiThisMonth: summaryResult[0].total_due_this_month,
        totalPending: summaryResult[0].total_pending,
        upcomingLoansCount: summaryResult[0].upcoming_loans,
        urgentLoansCount: summaryResult[0].urgent_loans,
        upcomingLoans: loansResult,
      });
    });
  });
};


// PATCH marked api
export const markAsPaid = (req, res) => {
  const loanId = req.params.id;

  const query = `
    UPDATE loans
    SET
      remaining_emis = remaining_emis - 1,

      next_due_date = DATE_ADD(next_due_date, INTERVAL 1 MONTH),

      is_active = CASE
        WHEN remaining_emis - 1 <= 0 THEN false
        ELSE true
      END

    WHERE id = ? AND remaining_emis > 0
  `;

  db.query(query, [loanId], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Error updating loan",
      });
    }

    res.json({
      message: "EMI marked as paid ✅",
    });
  });
};