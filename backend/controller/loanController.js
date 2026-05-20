import db from "../config/db.js";

// ADD loan = POST 
export const addLoan = (req,res)=>{
    const userId = req.user.id; //token s id lenege 

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
    }= req.body;

      // basic validation
  if (!loan_name || !total_amount || !emi_amount || !total_emis || !next_due_date) {
    return res.status(400).json({ message: "Required fields missing" });
  }

   const query = `
    INSERT INTO loans 
    (user_id, loan_name, total_amount, emi_amount, total_emis, remaining_emis,interest_rate, start_date, next_due_date, payer_type, payer_name, payer_phone, payer_email,  color,notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)
  `;

  db.query(query,
    [
      userId,
      loan_name,
      total_amount,
      emi_amount,
      total_emis,
      remaining_emis || total_emis, // default to total_emis if not provided
      interest_rate || null,
      start_date || null,
      next_due_date,
      payer_type || "self",
      payer_name || null,
      payer_phone || null,
      payer_email || null,
      color || "#7F77DD",
      notes || null,
    ],
    (err,result)=>{
        if(err){
      // return res.status(500).json({ message: "Error adding loan" });
      console.log("MYSQL ERROR:", err);

return res.status(500).json({
  message: err.message,
});

        }
        res.status(201).json({
            message:"Loan added successfully ✅",
          loanId: result.insertId,
        })
    }
  )

}

// GET ALL LOANS
export const getLoans = (req, res) => {
  const userId = req.user.id;

const query = `
  SELECT 
    *,
    DATEDIFF(next_due_date, CURDATE()) AS daysLeft
  FROM loans 
  WHERE user_id = ? 
  AND is_active = true
  ORDER BY next_due_date ASC
`;

  db.query(query, [userId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching loans" });
    }

    res.json({
      count: result.length,
      loans: result,
    });
  });
};

// Get specific loan GET
export const getSingleLoan = (req,res)=>{
    const userId = req.user.id;
    const loanId = req.params.id;


  const query = `
    SELECT 
      id,
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
      is_active,
      created_at,
      DATEDIFF(next_due_date, CURDATE()) AS  daysLeft
    FROM loans
    WHERE id = ? AND user_id = ?
  `;


  db.query(query, [loanId, userId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching loan" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Loan not found" });
    }

    res.json({
      loan: result[0],
    });
  });
}

// Update loan Put
export const updateLoan = (req,res)=>{
console.log("BODY:", req.body);
console.log("PARAMS:", req.params);

    const userId = req.user.id;
    const loanId = req.params.id;

    
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


  const query = `
    UPDATE loans SET
      loan_name = ?,
      total_amount = ?,
      emi_amount = ?,
      total_emis = ?,
      interest_rate = ?,
      start_date = ?,
      next_due_date = ?,
      payer_type = ?,
      payer_name = ?,
      payer_phone = ?,
      payer_email = ?,
      notes = ?
    WHERE id = ? AND user_id = ?
  `;

  db.query(query,[
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
      loanId,
      userId,
    ],(err,result)=>{
         if (err) {

    console.log("MYSQL ERROR:", err);
        return res.status(500).json({ message: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Loan not found" });
      }

      res.json({ message: "Loan updated successfully ✅" });
    

  })
}

// Delete Loan
export const deleteLoan = (req,res)=>{
    const userId = req.user.id;
    const loanId = req.params.id;

     const query = `
    UPDATE loans 
    SET is_active = false 
    WHERE id = ? AND user_id = ?
  `;

  db.query(query, [loanId, userId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error deleting loan" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Loan not found" });
    }

    res.json({ message: "Loan deleted successfully 🗑️" });
  });
}





