import axios from "axios";
import { v4 } from "uuid";

const paystackKey = process.env.PAYSTACK_SECRET_KEY;



type RecepientType = "nuban" | "ghipss" | "mobile_money" | "basa";

async function splitToAccount(amount: string, accountName: string, accountNumber: string, bankCode: string, reason: string, reference: string, recepientType: RecepientType = "nuban", currency: string = "NGN") {
    try {

        const receiptResponse = await axios.post("https://api.paystack.co/transferrecipient", {
            type: recepientType,
            name: accountName,
            account_number: accountNumber,
            bank_code: bankCode,
            currency

        }, {
            headers: {
                Authorization: `Bearer ${paystackKey}`
            }
        });

        const transferResponse = await axios.post("https://api.paystack.co/transfer", {
            source: "balance",
            amount: parseInt(amount) * 100,
            recipient: receiptResponse.data.data.recipient_code,
            reference,
            reason
        }, {
            headers: {
                Authorization: `Bearer ${paystackKey}`
            }
        });

        return {
            error: null,
            response: transferResponse.data,
            isSuccessful: true
        }


    } catch (error) {
        console.log(error);
        return {
            error,
            response: null,
            isSuccessful: false
        }
    }
}



export {
    splitToAccount
}
