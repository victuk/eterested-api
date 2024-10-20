import request from "supertest";
import { httpServer } from "../app";
import { OTPCollection } from "../models/otpManager";
import mongoose from "mongoose";

let buyerTokenAfterResentRequest: string;
let buyerOTPAfterResentRequest: string;

let shopperTokenAfterResentRequest: string;
let shopperOTPAfterResentRequest: string;


afterAll(async () => {
    httpServer.close();
    await mongoose.disconnect();
});

describe("Resetting OTP for the users", () => {
    test("Resend buyer's OTP", async () => {
        const response = await request(httpServer).post("/v1/auth/resend-otp/buyer/reset-password")
        .send({
            email: "mfreke.victor@gmail.com"
        });

        buyerTokenAfterResentRequest = response.body.verificationToken;

        buyerOTPAfterResentRequest = (await OTPCollection.findOne({uId: response.body.verificationToken}))?.otp as string;

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("otp-resent-successful");
        expect(response.body.verificationToken).toBeTruthy();
        expect(response.body.successful).toBe(true);

    });

    test("Resend shopper's OTP", async () => {
        const response = await request(httpServer).post("/v1/auth/resend-otp/shopper/reset-password")
        .send({
            email: "mfreke.victor@gmail.com"
        });

        shopperTokenAfterResentRequest = response.body.verificationToken;

        shopperOTPAfterResentRequest = (await OTPCollection.findOne({uId: response.body.verificationToken}))?.otp as string;

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("otp-resent-successful");
        expect(response.body.verificationToken).toBeTruthy();
        expect(response.body.successful).toBe(true);

    });

    test("Resend shop admin's OTP", async () => {
        const response = await request(httpServer).post("/v1/auth/resend-otp/shop-admin/reset-password")
        .send({
            email: "mfreke.victor@gmail.com"
        });

        // shopAdminTokenAfterResentRequest = response.body.verificationToken;

        // shopAdminOTPAfterResentRequest = (await OTPCollection.findOne({uId: response.body.verificationToken}))?.otp as string;

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("otp-resent-successful");
        expect(response.body.verificationToken).toBeTruthy();
        expect(response.body.successful).toBe(true);

    });
});
