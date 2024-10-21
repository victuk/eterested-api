import {Schema, InferSchemaType, model} from "mongoose";

const eventTicketTypeSchema = new Schema({
    ticketType: {
        type: String,
        enum: ["regular", "vip", "vvip", "table-for-2", "table-for-10"],
        required: true
    },
    eventId: {
        type: Schema.Types.ObjectId,
        ref: "events",
        required: true
    },
    ticketDescription: {
        type: String,
        required: true
    },
    cost: {
        type: Number,
        default: 0
    },
    totalTicketsAvailable: {
        type: Number,
        default: 1000
    },
    totalTicketsBought: {
        type: Number,
        default: 0
    }
}, {timestamps: true});

type eventTicketTypeCollectionType = InferSchemaType<typeof eventTicketTypeSchema>;

const eventTicketTypeCollection = model("eventtickettypes", eventTicketTypeSchema);

export {eventTicketTypeCollection, eventTicketTypeCollectionType};