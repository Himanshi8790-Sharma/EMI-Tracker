export const generateWhatsAppLink = (req, res) => {
  const { phone, name, loan_name, amount, due_date } = req.body;

  const message = `Hi ${name}, 
Your EMI of ₹${amount} for ${loan_name} is due on ${due_date}. Please make the payment.`;

  const encodedMessage = encodeURIComponent(message);

  const whatsappLink = `https://wa.me/91${phone}?text=${encodedMessage}`;

  res.json({ whatsappLink });
};