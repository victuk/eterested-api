import { Response, Router, NextFunction, response } from "express";
import { authenticatedUsersOnly, CustomRequest, CustomResponse } from '../../middleware/authenticatedUsersOnly';

const landlordAndSellerRoutes = Router();

landlordAndSellerRoutes.use(authenticatedUsersOnly);
// landlordAndSellerRoutes.use(roleBasedAccess(["landlord", "seller"]));

landlordAndSellerRoutes.post("/property", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {

        res.send({
            message: "Sorry, what are you doing here? =))"
        });

    } catch (error) {
        next(error);
    }
});

export default landlordAndSellerRoutes;
