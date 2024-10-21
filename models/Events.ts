import {Schema, InferSchemaType, model, PaginateModel} from "mongoose";
import paginate from "mongoose-paginate-v2";

const eventSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    eventOrganizer: {
        type: Schema.Types.ObjectId,
        ref: "events",
        required: true
    },
    description: {
        type: String,
        required: true
    },
    dateAndTime: {
        type: Date,
        required: true
    },
    eventFlyer: {
        type: String,
    },
    venue: {
        type: String,
        required: true
    },
    tags: {
        type: Array,
        default: []
    },
    cityOrLGA: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    country: {
        type: String,
        default: "Nigeria"
    },
    averageRating: {
        type: Number,
        default: 0
    },
    averageRatingByTicketType: {
        type: Array,
        default: []
    },
}, {timestamps: true});

type eventCollectionType = InferSchemaType<typeof eventSchema>;

eventSchema.plugin(paginate);

const eventCollection = model<eventCollectionType, PaginateModel<eventCollectionType>>("events", eventSchema);

export {eventCollection, eventCollectionType};