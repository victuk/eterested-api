import { Response, Router, NextFunction, response } from "express";
import { authenticatedUsersOnly, CustomRequest, CustomResponse } from '../../middleware/authenticatedUsersOnly';
import roleBasedAccess from '../../middleware/roleBasedAccess';
import { pageAndLimit } from "../../utils/paginateOption";
import { newsletterSubscribersCollection } from "../../models/NwesletterSubscribers";
import { userCollection } from "../../models/User";
import axios from "axios";
import { chatCollection } from "../../models/Chats";
import { messageCollection, messageCollectionType } from "../../models/Messages";
import { eventCollection } from "../../models/Events";
import { eventTicketTypeCollection } from "../../models/EventTicketTypes";
import { eventTicketsBoughtCollection } from "../../models/EventTicketsBought";
import { sendEmail } from "../../utils/emailUtilities";
import moment from "moment";
import { multerUpload, uploadToCloudinary } from "../../utils/cloudinaryUtils";
import { v4 } from "uuid";
import { hashPassword } from "../../utils/authUtilities";

const userRoutes = Router();



userRoutes.get("/events/:page?/:limit?", pageAndLimit, async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {


        req.paginatePageAndLimit!!.populate = [
            {
                path: "eventOrganizer",
                select: "firstName lastName userUniqueId email"
            }
        ];

        req.paginatePageAndLimit!!.sort = { createdAt: -1 };

        const properties = await eventCollection.paginate({}, req.paginatePageAndLimit as object);

        res.send({
            isSuccessful: true,
            properties
        });

    } catch (error) {
        next(error);
    }
});


userRoutes.get("/event/:eventId", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {

        const { eventId } = req.params;

        const eventDetails = await eventCollection.findById(eventId).populate("eventOrganizer", "firstName lastName email");

        const eventTicketTypes = await eventTicketTypeCollection.find({eventId});

        res.send({
            isSuccessful: true,
            eventDetails,
            eventTicketTypes
        });

    } catch (error) {
        next(error);
    }
});

userRoutes.post("/search-an-event/:page/:limit", pageAndLimit, async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {

        const { searchWord } = req.body;

        req.paginatePageAndLimit!!.populate = [
            {
                path: "userId",
                select: "firstName lastName email"
            }
        ];

        req.paginatePageAndLimit!!.sort = { createdAt: -1 };

        const eventsResult = await eventCollection.paginate({
            $or: [
                { title: { $regex: new RegExp(searchWord, "i") } },
                { description: { $regex: new RegExp(searchWord, "i") } },
                { venue: { $regex: new RegExp(searchWord, "i") } }
            ]
        });

        res.send({
            isSuccessful: true,
            eventsResult
        });

    } catch (error) {
        next(error);
    }
});

userRoutes.post("/search-an-organizer/:page/:limit", pageAndLimit, async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {

        const { searchWord } = req.body;

        req.paginatePageAndLimit!!.populate = [
            {
                path: "userId",
                select: "firstName lastName email"
            }
        ];

        req.paginatePageAndLimit!!.sort = { createdAt: -1 };

        const organizers = await userCollection.paginate({
            $or: [
                { firstName: { $regex: new RegExp(searchWord, "i") } },
                { lastName: { $regex: new RegExp(searchWord, "i") } },
                { username: { $regex: new RegExp(searchWord, "i") } },
                { organizationName: { $regex: new RegExp(searchWord, "i") } },
                { email: { $regex: new RegExp(searchWord, "i") } }
            ]
        });

        res.send({
            isSuccessful: true,
            organizers
        });

    } catch (error) {
        next(error);
    }
});


userRoutes.use(authenticatedUsersOnly);
userRoutes.use(roleBasedAccess(["user"]));

userRoutes.post("/upload-file", multerUpload.single("file"), async function (req: CustomRequest, res: CustomResponse, next: NextFunction) {
    try {
  
  
      const resp = await uploadToCloudinary(req.file!!.path);
  
      console.log("res", resp);
  
  
      res.send({
        message: "Upload Successful",
        data: resp
      });
  
    } catch (error) {
      next(error);
    }
});
  
userRoutes.post("/upload-files", multerUpload.array("files", 20), async function (req: CustomRequest, res: CustomResponse, next: NextFunction) {
    try {
  
      const f = (req.files as any[]).map(f => f.path);
  
      const resp = await uploadToCloudinary(f);
  
      console.log("res", resp);
  
  
      res.send({
        message: "Uploads Successful",
        data: resp
      });
  
    } catch (error) {
      next(error);
    }
});

userRoutes.get("/events-when-loggedin/:page?/:limit?", pageAndLimit, async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {


        req.paginatePageAndLimit!!.populate = [
            {
                path: "eventOrganizer",
                select: "firstName lastName userUniqueId email"
            }
        ];

        req.paginatePageAndLimit!!.sort = { createdAt: -1 };

        const userDetails = await userCollection.findById(req.userDetails?.userId);

        const properties = await eventCollection.paginate({
            state: userDetails?.state,
            country: userDetails?.country,
            tags: {"$in": userDetails?.tags}
        }, req.paginatePageAndLimit as object);

        res.send({
            isSuccessful: true,
            properties
        });

    } catch (error) {
        next(error);
    }
});


userRoutes.post("/create-event", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {

        const {
            title,
            description,
            dateAndTime,
            eventFlyer,
            venue,
            tags,
            cityOrLGA,
            state,
            ticketTypesForEvent
        } = req.body;
        
        let ticketTypes: any;


        console.log("ticketTypesForEvent", ticketTypesForEvent);
        
        const newEvent = await eventCollection.create({
            title,
            description,
            dateAndTime,
            eventFlyer,
            venue,
            tags,
            cityOrLGA,
            state,
            eventOrganizer: req.userDetails?.userId,
        });

        if(ticketTypesForEvent.length == 0) {
            ticketTypes = await eventTicketTypeCollection.create({
                ticketType: "regular",
                eventId: newEvent._id,
                ticketDescription: "Regular ticket created by default",
                cost: 0
            });
        } else {
            for(let i = 0; i < ticketTypesForEvent.length; i++) {
                ticketTypesForEvent[i].eventId = newEvent._id
            }
            ticketTypes = await eventTicketTypeCollection.create(ticketTypesForEvent);
        }

        const eventOrganizerDetails = await userCollection.findById(req.userDetails?.userId);

        const usersInterested = await userCollection.find({
            tags: {"$in": newEvent.tags},
            role: "user",
            state: eventOrganizerDetails?.state,
            cityOrLGA: eventOrganizerDetails?.cityOrLGA,
            country: eventOrganizerDetails?.country
        }).select("email");

        const usersInterestedEmail = usersInterested.map(u => u.email);

        if(usersInterestedEmail.length > 0) {
            await sendEmail({
                to: usersInterestedEmail,
                subject: `e-Terested [New Event] - ${newEvent.title}`,
                body: `
                    <div>Here is an event you may be interested in:</div>
                    <div>${newEvent.title}</div>
                    <img src="${newEvent.eventFlyer}">
                    <div>${newEvent.description}</div>
                    <div>Venue: ${newEvent.venue}</div>
                    <div>Date and time: ${moment(newEvent.dateAndTime).format("LLLL")}</div>
                `
            });
        }

        res.status(201).send({
            newEvent,
            ticketTypes
        });

    } catch (error) {
        next(error);
    }
});

userRoutes.post("/attend-event", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {
        
        const {
            eventId,
            buyingForMyself,
            buyingFor,
            totalAmountToPay
        } = req.body;

        console.log(eventId,
            buyingForMyself,
            buyingFor,
            totalAmountToPay);
            
        let eventTickets: Array<any> = [];

        const uIdReference = v4();

        const tic = await eventTicketTypeCollection.findById(buyingFor.ticketTypeId, "-totalTicketsAvailable -totalTicketsBought");

        let totalTickets = 0;

        if(buyingFor.emails.length > 0) {
            for(let i = 0; i < buyingFor.emails.length; i++) {
    
                eventTickets.push({
                    ticketTypeId: tic,
                    eventId,
                    paymentReference: uIdReference,
                    buyerId: req.userDetails?.userId,
                    boughtFor: buyingFor.emails[i],
                    ticketStatus: tic?.cost == 0 ? "paid" : "pending-payment"
                });
                totalTickets++;
            }
        }


        if(buyingForMyself == true) {
            eventTickets.push({
                ticketTypeId: tic,
                eventId,
                paymentReference: uIdReference,
                buyerId: req.userDetails?.userId,
                boughtFor: req.userDetails?.email,
                ticketStatus: tic?.cost == 0 ? "paid" : "pending-payment"
            });
            totalTickets++;
        }

        if(totalTickets * tic!!.cost as number < totalAmountToPay ) {
            res.status(400).send({
                message: "Invalid amount"
            });
            return;
        }

        const pendingTickets = eventTickets.map(t => t.boughtFor);

        if(pendingTickets.length == 0) {
            res.status(400).send({
                message: "No recepient specified"
            });
            return;
        }

        const duplicateTickets = await eventTicketsBoughtCollection.find({
            buyerId: req.userDetails?.userId,
            eventId,
            boughtFor: {"$in": pendingTickets},
            ticketStatus: "paid"
        });

        console.log("buyingFor.emails", pendingTickets);
        console.log("duplicateTickets", duplicateTickets);

        if(duplicateTickets.length > 0) {
            res.status(400).send({
                message: `Duplicate tickets detected with email(s) ${duplicateTickets?.map(d => d?.boughtFor).join(", ")}`
            });
            return;
        }
        
        console.log("eventTickets", eventTickets);

        let ticketRegistrationDetails = await eventTicketsBoughtCollection.create(eventTickets);

        // const newTickets: any = await eventTicketsBoughtCollection.find({eventId, buyerId: req.userDetails?.userId, ticketStatus: "pending-payment"});

        let paymentDetails: any = null;

        console.log(req.originalUrl);


        if(totalAmountToPay > 0) {
            paymentDetails = await axios.post("https://api.paystack.co/transaction/initialize", {
                email: req.userDetails?.email,
                amount: totalAmountToPay * 100,
                reference: uIdReference
            }, {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
                }
            });

            if(paymentDetails.status != 200) {
                res.status(400).send({
                    message: "An error occurred while trying to initialize transaction."
                });
                return;
            }

        }


        res.send({
            ticketRegistrationDetails,
            newTickets: ticketRegistrationDetails,
            paymentDetails: paymentDetails ? paymentDetails.data : null
        });


    } catch (error) {
        next(error);
    }
});

userRoutes.get("/profile", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {
        
        const profile = await userCollection.findById(req.userDetails?.userId, "-password");

        res.send({
            profile
        });

    } catch (error) {
        next(error);
    }
});

// userRoutes.get("/verify-transaction/:reference", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
//     try {

//         const { reference } = req.params; 

//         const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`);

//         console.log(response.data);

//         res.send("Good");

//     } catch (error) {
//         next(error);
//     }
// });

// Location, bathroom, bedroom - rentals
// Location, check-in date check-out date, number of guests - shortlet

userRoutes.put("/profile", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {

        delete req.body.password;

        delete req.body.role;

        let updatedDetails;

        if(req.userDetails?.role == "user") {
            delete req.body.organizationName;
            updatedDetails = await userCollection.findByIdAndUpdate(req.userDetails?.userId, req.body, {new: true});
        } else {
            updatedDetails = await userCollection.findByIdAndUpdate(req.userDetails?.userId, req.body, {new: true});
        }


        res.send({updatedDetails});
        
    } catch (error) {
        next();
    }
});

userRoutes.get("/my-events/:page/:limit", pageAndLimit, async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {

        req.paginatePageAndLimit!!.populate = [
            {
                path: "eventOrganizer",
                select: "firstName lastName userUniqueId email"
            }
        ];

        req.paginatePageAndLimit!!.sort = { createdAt: -1 };
        
        const myEvents = await eventCollection.paginate({eventOrganizer: req.userDetails?.userId}, req.paginatePageAndLimit as object);

        res.send({
            myEvents
        });

    } catch (error) {
        next(error);
    }
});

userRoutes.get("/my-event/:eventId", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {
        const {eventId} = req.params;

        const eventDetails = await eventCollection.findById(eventId);

        const eventTicketTypes = await eventTicketTypeCollection.find({eventId});

        const totalParticipants = await eventTicketsBoughtCollection.countDocuments({eventId});

        res.send({
            eventDetails,
            eventTicketTypes,
            totalParticipants
        });

    } catch (error) {
        next(error);
    }
});

userRoutes.get("/my-tickets/:page/:limit", pageAndLimit, async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {

        req.paginatePageAndLimit!!.populate = [
            {
                path: "buyerId"
            },
            {
                path: "eventId"
            }
        ];
        
        const myTickets = await eventTicketsBoughtCollection.paginate({
            boughtFor: req.userDetails?.email
        }, req.paginatePageAndLimit as object);

        res.send({
            myTickets,
            myId: req.userDetails?.userId
        });

    } catch (error) {
        next(error);
    }
});

userRoutes.put("/my-event/:eventId", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {

        const {eventId} = req.params;

        const {
            title,
            description,
            dateAndTime,
            eventFlyer,
            venue,
            tags,
            cityOrLGA,
            state,
            country
        } = req.body;

        const eventDetails = await eventCollection.findById(eventId);

       if(req.userDetails?.userId != (eventDetails!!.eventOrganizer).toString()) {
        res.status(400).send({
            message: "You are not allowed to edit this event"
        });
       }

       const updatedEvent = await eventCollection.findByIdAndUpdate(eventId, {
            title,
            description,
            dateAndTime,
            eventFlyer,
            venue,
            tags,
            cityOrLGA,
            state,
            country
       }, {new: true});

       const eventOrganizerDetails = await userCollection.findById(req.userDetails?.userId);

        // const usersInterested = await userCollection.find({
        //     tags: {"$in": updatedEvent?.tags},
        //     role: "user",
        //     state: eventOrganizerDetails?.state,
        //     cityOrLGA: eventOrganizerDetails?.cityOrLGA,
        //     country: eventOrganizerDetails?.country
        // }).select("email");

        const usersInterested = await eventTicketsBoughtCollection.find({
            eventId: updatedEvent?._id
        });

        const usersInterestedEmail = usersInterested.map(u => u.boughtFor);

        await sendEmail({
            to: usersInterestedEmail,
            subject: `e-Terested [Updated Event] - ${updatedEvent?.title}`,
            body: `
            <div>
                <div>Here is an update to ${updatedEvent?.title} event:</div>
                <div>${updatedEvent?.title}</div>
                ${updatedEvent?.eventFlyer && (`
                    <img src="${updatedEvent?.eventFlyer}">
                `)}
                <div>${updatedEvent?.description}</div>
                <div>Venue: ${updatedEvent?.venue}</div>
                <div>Date and time: ${moment(updatedEvent?.dateAndTime).format("LLLL")}</div>
            </div>
            `
        });


       res.send({
        updatedEvent
       });

    } catch (error) {
        next(error);
    }
});


userRoutes.put("/password", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {
        
        const {
            password, confirmPassword
        } = req.body;

        if(password != confirmPassword) {
            res.status(400).send({
                message: "Passwords do not mathch"
            });
            return;
        }

        const hashedPassword = hashPassword(password);

        await userCollection.findByIdAndUpdate(req.userDetails?.userId, {
            password: hashedPassword
        });

        res.send({
            message: "Password updated successfully"
        });

    } catch (error) {
        next(error);
    }
});


// // =================================================== Chats and messages implementation below =======================================

// userRoutes.post("/message", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
//     try {

//         const {
//             to,
//             message,
//             messagePictures,
//             inResponseTo
//         } = req.body;

//         let chatDetails: any = {};

//         const unreadMessagesCount = await messageCollection.countDocuments({from: req.userDetails?.userId, to, "$or": [{messageStatus: "sent"}, {messageStatus: "delivered"}]});
        
//         if(!(await chatCollection.findOne({userId: req.userDetails?.userId, me: to}))) {
//             chatDetails = await chatCollection.create({userId: req.userDetails?.userId, me: to, numberOfUnreadMessage: unreadMessagesCount, lastMessage: message, withPictures: messagePictures.length > 0});
//         } else {
//             chatDetails = await chatCollection.findOneAndUpdate({userId: req.userDetails?.userId, me: to}, {numberOfUnreadMessage: unreadMessagesCount, lastMessage: message, withPictures: messagePictures.length > 0});
//         }
        
//         if(!(await chatCollection.findOne({userId: to, me: req.userDetails?.userId}))) {
//             const newChat = (await chatCollection.create({userId: to, me: req.userDetails?.userId, lastMessage: message, withPictures: messagePictures.length > 0})).populate("userId", "firstName lastName userUniqueId email");
//             res.io.to(req.userDetails?.userId).emit("new-chat", {
//                 newChat
//             });
//         } else {
//             const newChat = await chatCollection.findOneAndUpdate({userId: to, me: req.userDetails?.userId}, {lastMessage: message, withPictures: messagePictures.length > 0}).populate("userId", "firstName lastName userUniqueId email");
//             res.io.to(req.userDetails?.userId).emit("new-chat", {
//                 newChat
//             });
//         }


//         const newMessage = await messageCollection.create({
//             from: req.userDetails?.userId,
//             to,
//             messageOriginator: req.userDetails?.userId,
//             message,
//             messagePictures,
//             inResponseTo: inResponseTo ? inResponseTo : null,
//             messageStatus: "sent"
//         });

//         res.io.to(to).emit("new-message", {
//             newMessage,
//             chatDetails
//         });

//         res.send({
//             newMessage
//         });

//     } catch (error) {
//         next(error);
//     }
// });

// userRoutes.post("/forward-message", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
//     try {
        
//         const {to, messageId} = req.body;

//         const messageToBeForwarded = await messageCollection.findById(messageId);


//         let messageDetails: any = {};

//         const unreadMessagesCount = await messageCollection.countDocuments({from: req.userDetails?.userId, to, "$or": [{messageStatus: "sent"}, {messageStatus: "delivered"}]});
        
//         if(!(await chatCollection.findOne({userId: req.userDetails?.userId, me: to}))) {
//             messageDetails = await chatCollection.create({userId: req.userDetails?.userId, me: to, numberOfUnreadMessage: unreadMessagesCount, lastMessage: messageToBeForwarded?.message});
//         } else {
//             messageDetails = await chatCollection.findOneAndUpdate({userId: req.userDetails?.userId, me: to}, {numberOfUnreadMessage: unreadMessagesCount, lastMessage: messageToBeForwarded?.message});
//         }
        


//         const newMessage = await messageCollection.create({
//             from: req.userDetails?.userId,
//             to,
//             messagePictures: messageToBeForwarded?.messagePictures,
//             message: messageToBeForwarded?.message,
//             messageStatus: "sent"
//         });

//         res.io.to(to).emit("new-message", {
//             newMessage,
//             messageDetails
//         });



//     } catch (error) {
//         next(error);
//     }
// });

// userRoutes.get("/chats/:page?/:limit?", pageAndLimit, async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
//     try {
        
//         req.paginatePageAndLimit!!.select = "-isOnline";

//         req.paginatePageAndLimit!!.populate = [
//             {
//                 path: "userId",
//                 select:"firstName lastName userUniqueId email"
//             }
//         ];

//         req.paginatePageAndLimit!!.sort = {updatedAt: -1};

//         const chats = await chatCollection.paginate({me: req.userDetails?.userId}, req.paginatePageAndLimit as object);

//         res.send({
//             chats
//         });

//     } catch (error) {
//         next(error);
//     }
// });

// // Here, userId refers to the other person I'm chatting with.
// userRoutes.get("/messages/:userId/:page?/:limit?", pageAndLimit, async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
//     try {
        
//         const { userId } = req.params;

//         req.paginatePageAndLimit!!.populate = [
//             {
//                 path: "inResponseTo",
//                 select: "-createdAt -updatedAt"
//             }
//         ];

//         req.paginatePageAndLimit!!.sort = {updatedAt: -1};

//         const messages = await messageCollection.paginate({
//             "$or": [
//                 {"$and": [{from: req.userDetails?.userId}, {to: userId}, {deletedByFrom: false}]},
//                 {"$and": [{from: userId}, {to: req.userDetails?.userId}, {deletedByTo: false}]},
//             ]
//         }, req.paginatePageAndLimit as object);

//         const updatedChat = await chatCollection.findOneAndUpdate({userId, me: req.userDetails?.userId}, {
//             numberOfUnreadMessage: 0
//         }, {new: true}).populate("userId", "firstName lastName userUniqueId email");

//         if (messages.docs.length == 0) {
//             res.send({
//                 messages,
//                 updatedChat
//             });
//             return;
//         }

//         const parsedMessages: any = JSON.parse(JSON.stringify(messages));

//         const result = parsedMessages.docs.map((message: any) => {
//             if((message.from).toString() == req.userDetails?.userId) {
//                 message.fromMe = true;
//             } else {
//                 message.fromMe = false;
//             }
//             return message;
//         });

//         await messageCollection.updateMany({from: userId, to: req.userDetails?.userId, "$or": [
//             {messageStatus: "sent"},
//             {messageStatus: "delivered"}
//         ]}, {
//             messageStatus: "read"
//         });

        

//         res.io.to(userId).emit("read-message", {
//             messages: result,
//             updatedChat
//         });

//         res.send({
//             messages: result,
//             updatedChat
//         });

//     } catch (error) {
//         next(error);
//     }
// });

// userRoutes.delete("/message", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
//     try {

//         const {messageId, deleteForEveryone} = req.body;

//         const message = await messageCollection.findById(messageId);

//         if(deleteForEveryone == true) {

//             if((message!!.from).toString() != req.userDetails?.userId) {
//                 res.status(401).send({
//                     errorMessage: "You can not delete this message"
//                 });
//                 return;
//             }

//             await messageCollection.findByIdAndUpdate(messageId, {
//                 deletedByFrom: true,
//                 deletedByTo: true
//             });

//             res.io.to((message!!.to).toString()).emit("delete-message", {
//                 messageId
//             });

//         } else {

//             if((message!!.from).toString() == req.userDetails?.userId) {
//                 await messageCollection.findByIdAndUpdate(messageId, {
//                     deletedByFrom: true
//                 });
//             } else if ((message!!.to).toString() == req.userDetails?.userId) {
//                 await messageCollection.findByIdAndUpdate(messageId, {
//                     deletedByTo: true
//                 });
//             }
//         }


//         res.send({
//             messageId,
//             status: "deleted"
//         });
        
//     } catch (error) {
//         next(error);
//     }
// });


// userRoutes.post("/clear-chat/:chatId", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
//     try {

//         const { chatId } = req.params;

//         const chat = await chatCollection.findById(chatId);
        
//         await messageCollection.updateMany({from: req.userDetails?.userId, to: chat?.userId}, {deletedByFrom: true});
//         await messageCollection.updateMany({from: chat?.userId, to: req.userDetails?.userId}, {deletedByTo: true});

//         res.send({
//             messages: []
//         });

//     } catch (error) {
//         next(error);
//     }
// });



export default userRoutes;
