import { Request, Response, Router, NextFunction } from "express";
import axios from "axios";
import { CustomRequest, CustomResponse } from "../../middleware/authenticatedUsersOnly";
import crypto from "crypto";

const paystackRouter = Router();

paystackRouter.post("/webhook", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {

        console.log(req.body.data);

        const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY as string).update(JSON.stringify(req.body)).digest('hex');
        if (hash == req.headers['x-paystack-signature']) {
        // Retrieve the request's body
        const event = req.body;
        console.log("Event", event);
        // Do something with event  
        }
        res.send(200);

        res.send(req.body.data); // originally res.send(200);

    } catch (error) {
        next(error);
    }
});

paystackRouter.get("/bank-list", async (req: Request, res: Response, next: NextFunction) => {
    const response = await axios.get("https://api.paystack.co/bank?country=nigeria", {
        headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
    });

    res.send(response.data);

});

export default paystackRouter;
