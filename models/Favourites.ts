import {Schema, InferSchemaType, model, PaginateModel} from "mongoose";
import paginate from "mongoose-paginate-v2";

const favouriteSchema = new Schema({
    eventId: {
        type: Schema.Types.ObjectId,
        ref: "events",
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true
    }
}, {timestamps: true});

type favouriteCollectionType = InferSchemaType<typeof favouriteSchema>;

favouriteSchema.plugin(paginate);

const favouriteCollection = model<favouriteCollectionType, PaginateModel<favouriteCollectionType>>("favourites", favouriteSchema);

export {favouriteCollection, favouriteCollectionType};