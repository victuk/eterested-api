import {Schema, InferSchemaType, model} from "mongoose";

const OTPSchema = new Schema({
    userId: {
        type:Schema.Types.ObjectId,
        ref: "Users",
        required: true
    },
    uId: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    }
}, {timestamps: true});

type OTPCollectionType = InferSchemaType<typeof OTPSchema>;

const OTPCollection = model("OTPs", OTPSchema);

export {OTPCollection, OTPCollectionType};