const nodemailer = require('nodemailer');
const { Pdf } = require('../model/pdf.model');
const { UserModel } = require('../model/users.model');
require('dotenv').config();

async function sendEmail(creatorID) {
  console.log("creator id :", creatorID);
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

    const pdf = await Pdf.findOne({ creatorID });
    // const userData = await UserModel.findOne({ creatorID });
    // console.log("userData",userData);
    console.log("checking-pdf", pdf); // Log the retrieved document for debugging

    if (!pdf) {
      console.error('PDF document not found for creatorID:', creatorID);
      return;
    }

    if (!pdf.pdfData) {
      console.error('PDF data is undefined for creatorID:', creatorID);
      return;
    }

    const pdfBuffer = Buffer.from(pdf.pdfData.buffer);

    let mailOptions = {
      from: 'prashant@thealgohype.com',
      to: pdf.email,
      // to: "prashantsom75@gmail.com",
      subject: ' AI-Generated CRO Report for Your Website - Insights and Recommendations',
      text: `Please find your AI-generated report for your website ${pdf.websiteName}.`,
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
// sendEmail("660eed6179e904992d906ea4")
module.exports = {
  sendEmail
};