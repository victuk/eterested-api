import "dotenv/config";
import express from "express";
import path from "path";
import createError from "http-errors";
import mongoose from "mongoose";
import tenantRouter from "./routes/v1/userRoutes";
import authRouter from "./routes/v1/authentication";
import agentAndLandlordRouter from "./routes/v1/landlordandSellerRoute"
import cors from "cors";
import logger from "morgan";
import { createServer } from "http";
import { Server } from "socket.io";
// import { ExtendedError } from "socket.io/dist/namespace";
import { hashPassword, verifyJWT } from "./utils/authUtilities";
import { DecodedObject } from "./middleware/authenticatedUsersOnly";
import { userCollection } from "./models/User";
import { chatCollection } from "./models/Chats";
// import { execSync } from "child_process"

var app: express.Application = express();

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

const port = process.env.PORT || "3000";

mongoose
  .connect(`${process.env.MONGO}`)
  .then(() => {
    console.log("Connected to database");
  })
  .catch((error) => {
    console.log(error);
  });

io.use((socket, next) => {
  try {
    const auth = socket.handshake.auth.token || socket.handshake.headers.token;
    const decoded = verifyJWT(auth);
    socket.handshake.auth.credentials = decoded;
    next();
  } catch (error: any) {
    console.log(error);
    next(error);
  }
});

io.on("connection", async (socket) => {

  console.log("Welcome", socket.handshake.auth.credentials);

  socket.send("Connected!");

  let userDetails: DecodedObject = socket.handshake.auth.credentials.userDetails;
  console.log(userDetails.fullName, "with socket id", socket.id, "just joined");

  socket.join(userDetails.userId);

    await userCollection.findByIdAndUpdate(userDetails.userId, {
      isOnline: true
    });

    await chatCollection.updateMany({userId: userDetails.userId}, {
      isOnline: true
    });

    const chats = await chatCollection.find({userId: userDetails.userId});

    const chatIds = chats.map(c => (c.me).toString());

    console.log("chatIds", chatIds);

    socket.to(chatIds).emit("new-presence-status", {
      userId: userDetails.userId,
      isOnline: true
    });

  // if (userDetails.role == "buyer") {

    
    
  // } else if (userDetails.role == "shopper") {
    
  //   await shopperCollection.findByIdAndUpdate(
  //     userDetails.userId,
  //     { isOnline: true }
  //     );


  //   const assignedOrder = await orderCollection.findOne({
  //     assignedShopperId: userDetails.userId,
  //       $nor: [{orderStatus:"order-placed"}, {orderStatus:"delivery-confirmed"}],
  //   }).populate("shopId", "businessName logo streetAddress lga state");

  //   if(assignedOrder) {
  //     await shopperCollection.findByIdAndUpdate(userDetails.userId, {isAssigned: true});
  //     socket.leave((userDetails.userId).toString());
  //   }
  // } else if (userDetails.role == "shopAdmin" || userDetails.role == "staff") {
    
    
  //   await shopAdminCollection.findByIdAndUpdate(userDetails.userId, {
  //     isOnline: true,
  //   });
  //   socket.join(userDetails?.shopId as string);
  // }

  socket.on("disconnect", async (_reason) => {

    socket.leave(userDetails.userId);
    
    await userCollection.findByIdAndUpdate(userDetails.userId, {
      isOnline: false
    });

    await chatCollection.updateMany({userId: userDetails.userId}, {
      isOnline: false
    });

    const chats = await chatCollection.find({userId: userDetails.userId});

    const chatIds = chats.map(c => (c.me).toString());

    socket.to(chatIds).emit("new-presence-status", {
      userId: userDetails.userId,
      isOnline: false
    });

    // if (userDetails.role == "buyer") {

      
    // } else if (userDetails.role == "shopper") {
      
    //   await shopperCollection.findByIdAndUpdate(
    //     userDetails.userId,
    //     { isOnline: false }
    //     );
  
    // } else if (userDetails.role == "shopAdmin" || userDetails.role == "staff") {
      
    //   await shopAdminCollection.findByIdAndUpdate(userDetails.userId, {
    //     isOnline: false,
    //   });
    // }

  });
});

io.engine.on("connection_error", (err) => {
  console.log("Error", err);
  io.send(err);
});

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

app.use(logger("dev"));
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(
//   bodyParser.urlencoded({
//     extended: true,
//   })
// );
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use((req, res: any, next) => {
  res.io = io;
  next();
});

app.use("/v1/auth", authRouter);
app.use("/v1/user", tenantRouter);
// app.use("/v1/landlordandagent", agentAndLandlordRouter);

app.get("/", (req, res) => {
  res.send("I'm healthy");
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (
  err: any,
  req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  console.log(err);

  // for(let k in err) {
  //   console.log(k);
  // }

  // console.log(err.title);

  // send the error
  res.status(err.status || 500).json({
      successful: false,
      errorMessage: err.message
        ? err.message
        : "An internal server error has occurred",
    });

  // if (err.kind) {
  //   res.status(400).json({
  //     successful: false,
  //     errorMessage: err.message,
  //   });
  // } else if (err.status) {
  //   res.status(err.status).json({
  //     successful: false,
  //     errorMessage: err.message,
  //   });
  // } else if (err.errors) {
  //   res.status(400).json({
  //     successful: false,
  //     errorMessage: err._message ? err._message : err.message,
  //   });
  // } else if (err.isJoi) {
  //   res.status(400).json({
  //     successful: false,
  //     errorMessage: err.message,
  //   });
  // } else {
    
  // }
});

httpServer.listen(port, () => {
  console.log(`TypeScript with Express http://localhost:${port}/`);
});

export { io, httpServer, port };
