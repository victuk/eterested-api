import {Schema, InferSchemaType, model, PaginateModel} from "mongoose";
import paginate from "mongoose-paginate-v2";

const chatSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    me: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    numberOfUnreadMessage: {
        type: Number,
        default: 0
    },
    withImage: {
        type: Boolean,
        default: false
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    lastMessage: {
        type: String
    }
}, {timestamps: true});

type chatCollectionType = InferSchemaType<typeof chatSchema>;

chatSchema.plugin(paginate);

const chatCollection = model<chatCollectionType, PaginateModel<chatCollectionType>>("chats", chatSchema);

export {chatCollection, chatCollectionType};
