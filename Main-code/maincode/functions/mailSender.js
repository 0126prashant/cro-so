const nodemailer = require('nodemailer');
require('dotenv').config();
async function sendEmail() {
    try {
        // Create a transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com", // Replace with your mail server host
            port: 587, // Usually 587 for secure, 25 for insecure connections
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER, // Use environment variable for email
                pass: process.env.EMAIL_PASSWORD // Use environment variable for password
            }
        });

        // Setup email data
        let mailOptions = {
          from: 'ly3223333@gmail.com', // Sender address
          to: 'prashantsom75@gmail.com', // List of receivers
          // cc: 'cc@example.com', // CC recipient's email address
          subject: 'Testing', // Subject line
          text: 'Hello world?', // Plain text body
          html: `
          <b>Hello world?</b>
          <p>Isn't NodeMailer useful?</p>
          `, // HTML body content
          // attachments: [
          //     {
          //         filename: 'document.pdf', // Name of the attached file
          //         path: '/path/to/your/document.pdf', // Replace with the actual path to your PDF file
          //         encoding: 'base64' // Use 'base64' for binary files
          //     }
          // ]
      };

      // Send mail with defined transport object
      let info = await transporter.sendMail(mailOptions);

      console.log('Message sent: %s', info.messageId);
  } catch (error) {
      console.error('Error sending email:', error);
  }
}

sendEmail();