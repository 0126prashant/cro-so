const nodemailer = require('nodemailer');
const { Pdf } = require('../model/pdf.model');
const { UserModel } = require('../model/users.model');
require('dotenv').config();

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendEmail(creatorID,userEmail,websiteUrl) {
  // console.log("Preparing to send email for creatorID:", creatorID,userEmail,websiteUrl);
  
  await delay(10000);
  
  // console.log("Delay complete, now sending email for creatorID:", creatorID);
  
  try {
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // console.log("Searching for PDF with creatorID:", creatorID);
    const pdf = await Pdf.findOne({ creatorID });
    // console.log("PDF document found:", pdf);

    if (!pdf) {
      console.error('PDF document not found for creatorID:', creatorID);
      const allPdfs = await Pdf.find({});
      // console.log("All PDFs in the database:", allPdfs);
      return;
    }

    if (!pdf.pdfData) {
      console.error('PDF data is undefined for creatorID:', creatorID);
      return;
    }

    const pdfBuffer = Buffer.from(pdf.pdfData.buffer);

    let mailOptions = {
      from: 'prashant@thealgohype.com',
      to: userEmail,
      // to: "prashantsom75@gmail.com",
      subject: 'AI-Generated CRO Report for Your Website - Insights and Recommendations',
      text: `Please find your AI-generated report for your website ${websiteUrl}.`,
      html: `
      <b>Please find your AI-generated report for your website.</b>
        <p>We hope this email finds you well. As requested, we have conducted a CRO (Conversion Rate Optimization) test on your website, and we have some valuable feedback to share with you. Please find the detailed report in the attachment.</p>
      `,
      attachments: [
        {
          filename: pdf.name,
          content: pdfBuffer,
          contentType: pdf.contentType
        }
      ]
    };

    let info = await transporter.sendMail(mailOptions);

    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

module.exports = {
  sendEmail
};



