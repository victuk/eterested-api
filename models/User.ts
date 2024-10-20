import {Schema, InferSchemaType, model, PaginateModel} from "mongoose";
import { v4 } from "uuid";

const userSchema = new Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    organizationName: {
        type: String,
        default: ""
    },
    phoneNumber: {
        type: String,
        default: ""
    },
    username: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    emailVerified: {
        type: Boolean,
        default: false,
    },
    provider: {
        type: String,
        enum: ["credentials", "google"],
        default: "credentials"
    },
    providerId: {
        type: String,
    },
    role: {
        type: String,
        enum: ["user", "organization"],
        default: "user"
    },
    profilePic: {
        type: String,
        default: "default"
    },
    cityOrLGA: {
        type: String,
        default: ""
    },
    state: {
        type: String,
        default: ""
    },
    country: {
        type: String,
        default: "Nigeria"
    },
    tags: {
        type: Array,
        default: []
    },
    password: {
        type: String
    }
}, {timestamps: true});

type userCollectionType = InferSchemaType<typeof userSchema>;

const userCollection = model<userCollectionType, PaginateModel<userCollectionType>>("users", userSchema);

export {userCollection, userCollectionType};