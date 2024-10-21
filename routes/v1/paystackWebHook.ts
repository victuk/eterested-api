import { Request, Response, Router, NextFunction } from "express";
import axios from "axios";
import {
  CustomRequest,
  CustomResponse,
} from "../../middleware/authenticatedUsersOnly";
import crypto from "crypto";
import { eventTicketsBoughtCollection } from "../../models/EventTicketsBought";
import { eventTicketTypeCollection } from "../../models/EventTicketTypes";

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

          res.sendStatus(200);
        } else {

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
