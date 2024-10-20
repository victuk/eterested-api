import nodemailer from "nodemailer";
import "dotenv/config";
type EmailOptions = {
    to: string | string[],
    subject: string,
    body: string
}

// var transport = nodemailer.createTransport({
//     host: "sandbox.smtp.mailtrap.io",
//     port: 2525,
//     auth: {
//       user: "9022a828b12aaa",
//       pass: "2ff37e445895ca"
//     }
//   });

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    host: process.env.EMAIL_HOST,
    auth: {
        user: process.env.EMAIL_NAME,
        pass: process.env.EMAIL_PASSWORD
    },
    secure: true,
    port: 465
});

async function sendEmail(emailOptions: EmailOptions) {
    const {to, subject, body} = emailOptions;
    try {
        const result = transporter.sendMail({from: "hello@trovi.shop", to, subject, html: body});
        return result;
    } catch (error) {
        console.log(error);
        return error;
    }
}

export {sendEmail}

