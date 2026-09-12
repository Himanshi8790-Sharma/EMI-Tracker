import db from "../config/db.js";

export const runReminderCheck = () =>
    new Promise((resolve, reject) => {
    console.log("Running Reminder Job...");

    const query = `
    SELECT * FROM loans 
    WHERE is_active = true
    `;

    db.query(query,(err,loans)=>{
        if(err){
            console.log(err);
            reject(err);
            return;
        }

        let remindersFound = 0;

        loans.forEach((loan)=>{
            const today = new Date();
            const dueDate = new Date(loan.next_due_date);

            const diffDays = Math.ceil(
                (dueDate - today) / (1000 * 60 * 60 * 24)
            );

            // Condition
            if(diffDays === 3 || diffDays === 1){
                remindersFound += 1;
                console.log(
                    `Reminder: ${loan.loan_name} EMI due in ${diffDays} days`
                );
            }
        });

        resolve({ loansChecked: loans.length, remindersFound });
    });
  });