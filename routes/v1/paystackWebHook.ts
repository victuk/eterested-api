import { Request, Response, Router, NextFunction } from "express";
import axios from "axios";
import {
  CustomRequest,
  CustomResponse,
} from "../../middleware/authenticatedUsersOnly";
import crypto from "crypto";
import { eventTicketsBoughtCollection } from "../../models/EventTicketsBought";
import { eventTicketTypeCollection } from "../../models/EventTicketTypes";
import { sendEmail } from "../../utils/emailUtilities";
import { userCollection } from "../../models/User";
import { eventCollection } from "../../models/Events";
import moment from "moment";

const paystackRouter = Router();

paystackRouter.post(
  "/webhook",
  async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {
      console.log(req.body.data);

      const hash = crypto
        .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY as string)
        .update(JSON.stringify(req.body))
        .digest("hex");
      if (hash == req.headers["x-paystack-signature"]) {
        // Retrieve the request's body
        const event = req.body;
        console.log("Event", event);

        if (event.event == "charge.success" && event.data.status == "success") {
          const ticketsBought =
            await eventTicketsBoughtCollection.countDocuments({
              paymentReference: event.data.reference,
            });

          const ticketDetails = await eventTicketsBoughtCollection.findOne({
            paymentReference: event.data.reference,
          });

          await eventTicketsBoughtCollection.updateMany({
            paymentReference: event.data.reference,
          }, {
            ticketStatus: "paid"
          });

          await eventTicketTypeCollection.findByIdAndUpdate(
            ticketDetails?.ticketTypeId,
            {
              $inc: { totalTicketsBought: ticketsBought },
            }
          );

          const userDetails = await userCollection.findById(ticketDetails?.buyerId);

          const eventDetails = await eventCollection.findById(ticketDetails?.eventId);

          const ticketOwners =
            await eventTicketsBoughtCollection.find({
              paymentReference: event.data.reference,
            });

            const usersToReceiveEmail = ticketOwners.map(e => e.boughtFor).filter((e: string) => e != userDetails?.email);

            const otherAttendees = await eventTicketsBoughtCollection.find({
              eventId: ticketDetails?.eventId,
              buyerId: ticketDetails?.buyerId,
              boughtFor: {"$ne": userDetails?.email}
            });

            const otherAttendeesEmail = otherAttendees.map(att => att.boughtFor);

          await sendEmail({
            to: userDetails!!.email,
            subject: "eTerested - Successful ticket purchase",
            body: `
                <div>Dear ${userDetails?.firstName} ${userDetails?.lastName}</div>
                <div>
                    Your payment for the "${eventDetails?.title}" event is successful.
                    ${usersToReceiveEmail.length > 0 && (`<div>
                        You have also been able to purchase tickets for${(ticketOwners.map(t => t.boughtFor)).includes(userDetails!!.email) ? " yourself and:" : ":"}
                    ${usersToReceiveEmail.map((t: string, index: number) => (`<div>${index + 1}. ${t}</div>`))}
                    </div>`)}
                </div>
            `
          });

          if(otherAttendees.length > 0) {
            for(let i = 0; i < otherAttendees.length; i++) {
              await sendEmail({
                to: otherAttendees[i].boughtFor,
                subject: "eTerested - Successful ticket purchase",
                body: `
                <div>
                    <div>Dear ${otherAttendeesEmail[i]}</div>
                    <div>
                        A ${(otherAttendees[i].ticketTypeId.ticketType).toLocaleUpperCase()} ticket has been bought for you by ${userDetails?.firstName} ${userDetails?.lastName} for ${eventDetails?.title}.
                        Event Details below:
                        <div>Date: ${moment(eventDetails?.dateAndTime).format("LLLL")}</div>
                        <div>Venue: ${eventDetails?.venue}</div>
                        ${eventDetails?.eventFlyer && (`
                          <img src="${eventDetails.eventFlyer}" style="height: 400px; width: 100%; background-size: contain;" />
                          `)}
                    </div>
                    <div></div>
                </div>
                `
              });
            }
          }
          
          res.sendStatus(200);
        } else {

            const ticketDetails = await eventTicketsBoughtCollection.findOne({
                paymentReference: event.data.reference,
              });

              const userDetails = await userCollection.findById(ticketDetails?.buyerId);

              const eventDetails = await eventCollection.findById(ticketDetails?.eventId);

              await sendEmail({
                to: userDetails!!.email,
                subject: "eTerested - Ticket purchase failed",
                body: `
                    <div>Dear ${userDetails?.firstName} ${userDetails?.lastName}</div>
                    <div>
                        Your payment for the "${eventDetails?.title}" event failed, kindly try again later.
                    </div>
                `
              });

            await eventTicketsBoughtCollection.updateMany({
                paymentReference: event.data.reference,
              }, {
                ticketStatus: "payment-failed"
              });

            res.sendStatus(400);
        }
      }
    } catch (error) {
      next(error);
    }
  }
);

paystackRouter.get(
  "/bank-list",
  async (req: Request, res: Response, next: NextFunction) => {
    const response = await axios.get(
      "https://api.paystack.co/bank?country=nigeria",
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    res.send(response.data);
  }
);

export default paystackRouter;
