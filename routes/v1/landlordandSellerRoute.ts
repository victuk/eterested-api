import { Response, Router, NextFunction, response } from "express";
import { authenticatedUsersOnly, CustomRequest, CustomResponse } from '../../middleware/authenticatedUsersOnly';
import roleBasedAccess from '../../middleware/roleBasedAccess';
import { propertyCollection } from "../../models/Property";
import { pageAndLimit } from "../../utils/paginateOption";
import { comparePassword, hashPassword } from "../../utils/authUtilities";
import { userCollection } from "../../models/User";
import { propertyOrderCollection } from "../../models/PropertyOrders";
import axios from "axios";

const landlordAndSellerRoutes = Router();

landlordAndSellerRoutes.use(authenticatedUsersOnly);
// landlordAndSellerRoutes.use(roleBasedAccess(["landlord", "seller"]));

landlordAndSellerRoutes.post("/property", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {

        req.body.userId = req.userDetails?.userId;
        
        const response = await propertyCollection.create(req.body);

        res.send({
            isSuccessful: true,
            response
        });

    } catch (error) {
        next(error);
    }
});


landlordAndSellerRoutes.get("/properties/:page?/:limit?", pageAndLimit, async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {

        req.paginatePageAndLimit!!.populate = [
            {
                path: "userId",
                select: "fullName email"
            }
        ];
        
        const myProperties = await propertyCollection.paginate({userId: req.userDetails?.userId}, req.paginatePageAndLimit as object);

        res.send({
            isSuccessful: true,
            myProperties
        });

    } catch (error) {
        next(error);
    }
});



landlordAndSellerRoutes.get("/property/:id", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {
        
        const myProperty = await propertyCollection.findById(req.params.id).populate("userId", "fullName email");

        res.send({
            isSuccessful: true,
            myProperty
        });

    } catch (error) {
        next(error);
    }
});


landlordAndSellerRoutes.delete("/property/:id", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {

        const propertyDetails = await propertyCollection.findById(req.params.id);

        if(req!!.userDetails!!.userId != (propertyDetails?.userId)?.toString()) {
            res.status(401).send({
                message: "You are not the owner of this property, so you can't delete"
            });
        }
        
        await propertyCollection.findByIdAndDelete(req.params.id);

        res.send({
            isSuccessful: true,
            message: "Delete Successful"
        });

    } catch (error) {
        next(error);
    }
});



landlordAndSellerRoutes.get("/profile", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {
        
        const userProfile = await userCollection.findById(req.userDetails?.userId);

        res.send({
            isSuccessful: true,
            userProfile
        });

    } catch (error) {
        next(error);
    }
});

landlordAndSellerRoutes.get("/my-listings/:page/:limit", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {
        
        const myListings = await propertyCollection.paginate({userId: req.userDetails?.userId}, req.paginatePageAndLimit as object);

        res.send({ myListings });

    } catch (error) {
        next(error);
    }
});

landlordAndSellerRoutes.put("/my-listings/:id", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {
        
        const property = await propertyCollection.findById(req.params.id);

        if(req.userDetails?.userId == (property?.userId)?.toString()) {
            res.send({
                errorMessage: "You are not  the owner of this property"
            });
            return;
        }

        const updatedProperty = await propertyCollection.findByIdAndUpdate(req.params.id, req.body, { new: true });

        res.send({
            updatedProperty
        });

    } catch (error) {
        next(error);
    }
});

landlordAndSellerRoutes.get("/my-listings/:id", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {
        
        const myListings = await propertyCollection.findById(req.params.id);

        res.send({ myListings });

    } catch (error) {
        next(error);
    }
});

landlordAndSellerRoutes.delete("/my-listings/:id", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {
        
        const property = await propertyCollection.findById(req.params.id);

        if(req.userDetails?.userId == (property?.userId)?.toString()) {
            res.send({
                errorMessage: "You are not  the owner of this property"
            });
            return;
        }

        const deletedProperty = await propertyCollection.findByIdAndDelete(req.params.id);

        res.send({
            message: "Listing deleted succesfully",
            deletedProperty
        });

    } catch (error) {
        next(error);
    }
});

landlordAndSellerRoutes.post("/create-listing", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {
        const {
            apartmentType,
            roomCount,
            bathroomCount,
            allowedGuestCount,
            streetAddress,
            closeLandmark,
            propertyLGA,
            propertyState,
            amenities,
            rentAmount,
            photoURLs,
            videoURLs,
            rentType,
            houseName,
            houseDescription,
            houseRules
        } = req.body;

        const newProperty = await propertyCollection.create({
            userId: req.userDetails?.userId,
            apartmentType,
            roomCount,
            bathroomCount,
            allowedGuestCount,
            streetAddress,
            closeLandmark,
            propertyLGA,
            propertyState,
            amenities,
            rentAmount,
            rentType,
            photoURLs,
            videoURLs,
            houseName,
            houseDescription,
            houseRules,
            step: "create-property"
        });

        res.send({propertyId: newProperty._id, nextStep: "pricing"});


    } catch (error) {
        next(error);
    }
});

landlordAndSellerRoutes.put("/pricing/:propertyId", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {

        const {
            listingFee,
            cautionFee,
            clearingFee,
            additionalFee
        } = req.body;

        const {
            propertyId
        } = req.params;

        const propertyDetails = await propertyCollection.findById(propertyId, "userId");

        if((propertyDetails?.userId)?.toString() != req.userDetails?.userId) {
            res.status(400).send({
                message: "This property does not belong to you"
            });
            return;
        }

        await propertyCollection.findByIdAndUpdate(propertyId, {
            listingFee,
            cautionFee,
            clearingFee,
            additionalFee,
            step: "pricing"
        });

        res.send({
            propertyId,
            nextStep: "availability"
        });
        
    } catch (error) {
        next(error);
    }
});

landlordAndSellerRoutes.put("/availability/:propertyId", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {
        
        const {
            availableStartDate,
            availableEndDate
        } = req.body;

        const {
            propertyId
        } = req.params;

        const propertyDetails = await propertyCollection.findById(propertyId, "userId");

        if((propertyDetails?.userId)?.toString() != req.userDetails?.userId) {
            res.status(400).send({
                message: "This property does not belong to you"
            });
            return;
        }

        await propertyCollection.findByIdAndUpdate(propertyId, {
            availableStartDate,
            availableEndDate
        });

        res.send({
            propertyId,
            nextStep: "preview"
        });

    } catch (error) {
        next(error);
    }
});

landlordAndSellerRoutes.get("/preview/:propertyId", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {

    try {

        const {propertyId} = req.params;

        const propertyDetails = await propertyCollection.findById(propertyId);

        if((propertyDetails?.userId)?.toString() != req.userDetails?.userId) {
            res.status(400).send({
                message: "This property does not belong to you"
            });
            return;
        }

        res.send({propertyDetails});

    } catch (error) {
        next(error);
    }

});

landlordAndSellerRoutes.post("/publish/:propertyId", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {
        
        const {propertyId} = req.params;

        const propertyDetails = await propertyCollection.findById(propertyId);

        if((propertyDetails?.userId)?.toString() != req.userDetails?.userId) {
            console.log((propertyDetails?.userId)?.toString(), req.userDetails?.userId);
            res.status(400).send({
                message: "This property does not belong to you"
            });
            return;
        }

        if(propertyDetails?.propertyStatus == "available") {
            res.status(400).send({
                message: "This property has already been published"
            });
            return;
        }

        // const propertyStatus = await propertyCollection.findByIdAndUpdate(propertyId, {
        //     propertyStatus: "available"
        // }, {new: true});

        const userDetails = await userCollection.findById(req.userDetails?.userId);

        if(propertyDetails?.rentType == "rent") {}

        const response = await axios.post("https://api.paystack.co/transaction/initialize", {
            email: userDetails?.email,
            amount: 500
        });

        res.send({
            fromPaystack: response
        });


    } catch (error) {
        next(error);
    }
});



// landlordAndSellerRoutes.get("/earning-summary", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
//     try {

//         const properties = await propertyCollection.find({userId: req.userDetails?.userId});

//         const propertyIds = properties.map(p => p._id);

//         const totalEarned = propertyCollection.aggregate([
//             {

//             }
//         ]);

        
//     } catch (error) {
//         next(error);
//     }
// });

landlordAndSellerRoutes.get("/property-bookings/:page/:limit", pageAndLimit, async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {

        const properties = await propertyCollection.find({userId: req.userDetails?.userId});

        if(properties.length == 0) {
            res.send({bookingResult: []});
            return;
        }

        const propertyIds = properties.map(p => p._id);

        req.paginatePageAndLimit?.sort({createdAt: -1});

        const bookingResult = await propertyOrderCollection.paginate({property: {"$in": propertyIds}});

        res.send({bookingResult});
        
    } catch (error) {
        next(error);
    }
});

landlordAndSellerRoutes.put("/change-password", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {

        const {oldPassword, newPassword}: {oldPassword: string, newPassword: string} = req.body;
        
        const user = await userCollection.findById(req.userDetails?.userId);

        const doPasswordsMatch = comparePassword(oldPassword, user!!.password as string);

        if (!doPasswordsMatch) {
            res.status(400).send({
                isSuccessful: true,
                message: "Passwords do not match"
            });
            return;
        }

        if(newPassword.length < 8) {
            res.status(400).send({
                isSuccessful: true,
                message: "Password length is too short"
            });
            return;
        }

        const hashedPassword = hashPassword(newPassword);

        await userCollection.findByIdAndUpdate(req.userDetails?.userId, {
            password: hashedPassword
        });

        res.send({
            isSuccessful: true,
            message: "New password saved successfully"
        });

    } catch (error) {
        next(error);
    }
});


// landlordAndSellerRoutes.get("/ad/:id", pageAndLimit, async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
//     try {
        
//         const ad = await advertCollection.findById(req.params.id);


//         res.send({
//             isSuccessful: true,
//             ad
//         });

//     } catch (error) {
//         next(error);
//     }
// });


export default landlordAndSellerRoutes;
