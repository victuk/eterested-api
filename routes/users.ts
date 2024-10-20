// var express = require('express');
// var router = express.Router();

import express from "express";
import { splitToAccount } from "../utils/transferMoneyUtil";
import axios from "axios";
import { v4 } from "uuid";
import { deleteFromCloudinary, multerUpload } from "../utils/cloudinaryUtils";
import fs from "fs";
import path from "path";
import { newsletterSubscribersCollection } from "../models/NwesletterSubscribers";
import { LandlordSubscriberListCollection } from "../models/LandlordSubscriberList";

const router = express.Router();

/* GET users listing. */
router.get('/', function (req: express.Request, res: express.Response, next: express.NextFunction) {
  res.send('respond with a resource');
});


router.post("/resolve-bank", async function (req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const response = await axios.get("https://api.paystack.co/bank/resolve?account_number=8137249484&bank_code=999991", {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    });
    console.log(response.data);
    res.send(response.data);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.get("/bank-split", async function (req: express.Request, res: express.Response, next: express.NextFunction) {

  try {
    const response = await splitToAccount("2000", "VICTOR PETER UKOK", "8137249484", "999991", "Payment for order", v4());
    res.send(response);
  } catch (error) {
    console.log(error);
    next(error);
  }

});

router.delete("/cloudinary/:publicId", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    console.log(req.params.publicId);
    const result = await deleteFromCloudinary(req.params.publicId, "image");

    if(result == "ok") {
      res.send({
        successful: true,
        message: result
      });
    } else {
      res.status(400).send({
        successful: false,
        message: result
      });
    }

    
  } catch (error) {
    next(error);
  }
});





router.post("/subscribe-to-newsletters", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {

      const { email } = req.body;
      
      const newSubscriber = await newsletterSubscribersCollection.create({email});

      res.status(201).send({
          isSuccessful: true,
          newSubscriber
      });

  } catch (error) {
      next(error);
  }
});


router.post("/landlords-subscribe-to-newsletters", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {

      const { email } = req.body;
      
      const newLandlordSubscriber = await LandlordSubscriberListCollection.create({email});

      res.status(201).send({
          isSuccessful: true,
          newLandlordSubscriber
      });

  } catch (error) {
      next(error);
  }
});

// router.get("/bulk", serveHTMLBulkUpload);




export default router;
