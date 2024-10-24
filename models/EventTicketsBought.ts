import {Schema, InferSchemaType, model, PaginateModel} from "mongoose";
import paginate from "mongoose-paginate-v2";

const eventTicketsBoughtSchema = new Schema({
    ticketTypeId: {
        type: Object,
        required: true
    },
    eventId: {
        type: Schema.Types.ObjectId,
        ref: "events",
        required: true
    },
    buyerId: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    boughtFor: {
        type: String,
        required: true
    },
    ticketStatus: {
        type: String,
        enum: ["pending-payment", "paid", "payment-failed"],
        default: "pending-payment"
    },
    paymentReference: {
        type: String,
        required: true
    },
    eventRating: {
        type: Number,
        enum: [0, 1, 2, 3, 4, 5],
        default: 0
    }
}, {timestamps: true});

type eventTicketsBoughtCollectionType = InferSchemaType<typeof eventTicketsBoughtSchema>;

eventTicketsBoughtSchema.plugin(paginate);

const eventTicketsBoughtCollection = model<eventTicketsBoughtCollectionType, PaginateModel<eventTicketsBoughtCollectionType>>("eventTicketsBoughts", eventTicketsBoughtSchema);

export {eventTicketsBoughtCollection, eventTicketsBoughtCollectionType};