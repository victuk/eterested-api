import {Schema, InferSchemaType, model, PaginateModel} from "mongoose";
import paginate from "mongoose-paginate-v2";

const currencyEnum = ["gbp", "usd", "eur", "ngn"];

const newsletterSubscribersSchema = new Schema({
    email: {
        type: String,
        unique: true,
        required: true,
    }
}, {timestamps: true});

type newsletterSubscribersCollectionType = InferSchemaType<typeof newsletterSubscribersSchema>;

newsletterSubscribersSchema.plugin(paginate);

const newsletterSubscribersCollection = model<newsletterSubscribersCollectionType, PaginateModel<newsletterSubscribersCollectionType>>("newsletters", newsletterSubscribersSchema);

export {newsletterSubscribersCollection, newsletterSubscribersCollectionType};
