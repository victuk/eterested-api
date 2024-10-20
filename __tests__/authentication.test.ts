import request from "supertest";
import mongoose from "mongoose";
import { OTPCollection } from "../models/otpManager";
import { httpServer } from "../app";
import path from "path";


const otpandtoken = {
    buyer: {
        otp: "",
        token: ""
    },
    shopper: {
        otp: "",
        token: ""
    },
    shopAdmin: {
        otp: "",
        token: ""
    }
}


beforeAll(async() => {
    // await buyerCollection.findOneAndDelete({
    //     email: "mfreke.victor@gmail.com"
    // });
    // await shopperCollection.findOneAndDelete({
    //     shopperEmail: "mfreke.victor@gmail.com"
    // });
    // const shopAdmin = await shopAdminCollection.findOneAndDelete({
    //     ownerEmail: "mfreke.victor@gmail.com"
    // });

    // await shopRoleIdentifierCollection.findOneAndDelete({
    //     ownerId: shopAdmin?._id
    // });

    // await shopCollection.findOneAndDelete({
    //     businessEmail: "mfreke.victor@gmail.com"
    // });

    await OTPCollection.deleteMany();
});

afterAll(async () => {
    httpServer.close();
    await mongoose.disconnect();
});

describe("This test suit tests the buyer's login routes", () => {
    
    test("Register the buyer with his/her details", async () => {
        const response = await request(httpServer)
        .post("/v1/auth/register/buyer")
        .send({
            firstName: "Victor",
            lastName: "Ukok",
            phoneNumber: "0837249484",
            email: "mfreke.victor@gmail.com",
            password: "testaccount",
            provider: "credentials"
        });

        otpandtoken.buyer.token = response.body.verificationToken;

        otpandtoken.buyer.otp = ((await OTPCollection.findOne({uId: response.body.verificationToken}, "otp"))?.otp)?.toString() as string;

        expect(response.status).toBe(201);
        expect(response.body.message).toBe("created");
        expect(response.body.registrationStep).toBe("verify-email");
        expect(response.body.successful).toBe(true);
        expect(typeof(response.body.verificationToken)).toBe("string");
    });

   
});