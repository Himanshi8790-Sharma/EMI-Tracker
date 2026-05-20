import cron from "node-cron";
import db from "../config/db.js";

// Daily 9 am run hoga
cron.schedule("0 9 * * *",()=>{
    // cron.schedule("* * * * *", () => {
    console.log("Running Reminder Job...");

    const query = `
    SELECT * FROM loans 
    WHERE is_active = true
    `;

    db.query(query,(err,loans)=>{
        if(err){
            console.log(err);
            return;
        }

        loans.forEach((loan)=>{
            const today = new Date();
            const dueDate = new Date(loan.next_due_date);

            const diffDays = Math.ceil(
                (dueDate - today) / (1000 * 60 * 60 * 24)
            );

            // Condition
            if(diffDays === 3 || diffDays === 1){
                console.log(
                    `Reminder: ${loan.loan_name} EMI due in ${diffDays} days`
                );

                
            }
        })
    })
})