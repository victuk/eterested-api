import {Schema, InferSchemaType, model, PaginateModel} from "mongoose";
import paginate from "mongoose-paginate-v2";

const messageSchema = new Schema({
    from: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    to: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    messagePictures: {
        type: Array,
        default: []
    },
    message: {
        type: String,
        required: true
    },
    inResponseTo: {
        type: Schema.Types.ObjectId,
        ref: "messages",
        null: true,
        default: null
    },
    forwardedMessage: {
        type: Boolean,
        default: false
    },
    messageOriginator: {
        type: Schema.Types.ObjectId,
        ref: "users",
        null: true,
        default: null
    },
    messageStatus: {
        type: String,
        enum: ["sent", "delivered", "read", "marked-as-unread"],
        default: "sent"
    },
    deletedByFrom: {
        type: Boolean,
        default: false
    },
    deletedByTo: {
        type: Boolean,
        default: false
    }
}, {timestamps: true});

type messageCollectionType = InferSchemaType<typeof messageSchema>;

messageSchema.plugin(paginate);

const messageCollection = model<messageCollectionType, PaginateModel<messageCollectionType>>("messages", messageSchema);

export {messageCollection, messageCollectionType};
