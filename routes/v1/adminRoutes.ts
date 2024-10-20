import { Router, Response, NextFunction } from 'express';
import roleBasedAccess from '../../middleware/roleBasedAccess';
import { CustomRequest, CustomResponse, authenticatedUsersOnly } from '../../middleware/authenticatedUsersOnly';
import { pageAndLimit } from '../../utils/paginateOption';
import { transactionReceiptCollection } from '../../models/TransactionReceipts';
import { notificationCollection } from '../../models/Notification';
import { buyerCollection } from '../../models/User';
import { shopperCollection, shopperCollectionType } from '../../models/Shopper';
import { shopCollection } from '../../models/Shop';
import { waitingListCollection } from '../../models/WaitingList';
import { shopAdminCollection, shopAdminCollectionType } from '../../models/ShopAdmin';

const adminRoutes = Router();

adminRoutes.use(authenticatedUsersOnly);
// adminRoutes.use(roleBasedAccess(["super-admin", "admin", "staff", "developers"]));

adminRoutes.get("/pending-withdrawal-requests/:page?/:limit?", pageAndLimit, async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const pendingWithdrawals = await transactionReceiptCollection.paginate({ transactionStatus: "pending", transactionType: "withdraw" }, req.paginatePageAndLimit as object);

        const uniqueShoppersIds: string[] = [];
        const uniqueShopAdminsIds: string[] = [];

        let shoppers: Array<any> = [];

        var shopAdmins: Array<any> = [];

        for (let i = 0; i < pendingWithdrawals.docs.length; i++) {
            if (!uniqueShoppersIds.includes(pendingWithdrawals.docs[i].receiverId) && pendingWithdrawals.docs[i].receiverType == "shopper") {
                uniqueShoppersIds.push(pendingWithdrawals.docs[i].receiverId);
            } else if (!uniqueShopAdminsIds.includes(pendingWithdrawals.docs[i].receiverId) && pendingWithdrawals.docs[i].receiverType == "shop") {
                uniqueShopAdminsIds.push(pendingWithdrawals.docs[i].receiverId);
            }
        }

        // console.log("Shoppers", uniqueShoppersIds);
        // console.log("Shop", uniqueShopAdminsIds);

        if (uniqueShoppersIds.length > 0) {
            shoppers = await shopperCollection.find({ _id: { $in: uniqueShoppersIds } }, "balance countrySymbol");
        }

        if (uniqueShopAdminsIds.length > 0) {
            shopAdmins = await shopCollection.find({ _id: { $in: uniqueShopAdminsIds } }, "balance countrySymbol");
        }

        // console.log(shoppers);
        // console.log(shopAdmins);

        const finalResult: Array<any> = [];

        for (let i = 0; i < pendingWithdrawals.docs.length; i++) {
            if (shoppers.length > 0 && pendingWithdrawals.docs[i].receiverType == "shopper") {
                let shopperBalance = shoppers.find(s => s._id == pendingWithdrawals.docs[i].receiverId);
                finalResult.push({
                    requestDetails: pendingWithdrawals.docs[i],
                    balance: shopperBalance
                });
            } else if (shopAdmins.length > 0 && pendingWithdrawals.docs[i].receiverType == "shop") {
                let shopBalance = shopAdmins.find(s => s._id == pendingWithdrawals.docs[i].receiverId);
                finalResult.push({
                    requestDetails: pendingWithdrawals.docs[i],
                    balance: shopBalance
                });
            }
        }

        // console.log(finalResult);

        let pWithdrawals = JSON.parse(JSON.stringify(pendingWithdrawals));

        pWithdrawals.docs = finalResult;

        res.send({
            successful: true,
            pendingWithdrawals: pWithdrawals
        });

    } catch (error) {
        next(error);
    }
});

adminRoutes.get("/pending-withdrawal-request/:id", async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const pendingWithdrawal = await transactionReceiptCollection.findById(req.params.id);

        res.send({
            successful: true,
            pendingWithdrawal
        });

    } catch (error) {
        next(error);
    }
});


adminRoutes.put("/pending-withdrawal-request/:id", async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    try {

        const { status } = req.body;

        let newAccountBalance: number = 0;

        if (status == "pending") {
            res.send({
                successful: false,
                message: "You can't set a withdrawal request to pending"
            });
            return;
        }

        const updatedPendingWithdrawalStatus = await transactionReceiptCollection.findById(req.params.id);




        if (status == "success") {
            if (updatedPendingWithdrawalStatus?.receiverType == "shopper") {

                if ((await shopperCollection.findById(updatedPendingWithdrawalStatus?.receiverId))!!.balance - updatedPendingWithdrawalStatus.amount < 0) {

                    let tStatus = await transactionReceiptCollection.findByIdAndUpdate(req.params.id, {
                        transactionStatus: "declined"
                    }, { new: true });

                    const newNotification = await notificationCollection.create({
                        userId: tStatus?.receiverId,
                        userType: tStatus?.receiverType,
                        notificationType: `${tStatus?.transactionStatus == "success" ? "withdraw-successful" : ""}${tStatus?.transactionStatus == "declined" ? "withdraw-declined" : ""}`,
                        title: `${tStatus?.transactionStatus == "success" ? "Withdrawal approved successfully!" : ""}${tStatus?.transactionStatus == "declined" ? "Withdrawal declined!" : ""}`,
                        message: `${tStatus?.transactionStatus == "success" ? "Your withdrawal has been approved successfully!" : ""}${tStatus?.transactionStatus == "declined" ? "Your withdrawal has been declined!" : ""}`,
                        postedBy: tStatus?.receiverId,
                        postedByType: tStatus?.receiverType
                    });

                    res.io.to((updatedPendingWithdrawalStatus?.receiverId)?.toString()).emit("notification", newNotification);

                    res.send({
                        details: {
                            transactionStatus: "Insufficient balance!"
                        }
                    });
                    return;
                }

                let t = await shopperCollection.findByIdAndUpdate(updatedPendingWithdrawalStatus?.receiverId, {
                    $inc: { balance: -updatedPendingWithdrawalStatus.amount }
                }, { new: true });
                newAccountBalance = t!!.balance;
            } else if (updatedPendingWithdrawalStatus?.receiverType == "shop") {

                if ((await shopCollection.findById(updatedPendingWithdrawalStatus?.receiverId))!!.balance - updatedPendingWithdrawalStatus.amount < 0) {

                    let tStatus = await transactionReceiptCollection.findByIdAndUpdate(req.params.id, {
                        transactionStatus: "declined"
                    }, { new: true });

                    const newNotification = await notificationCollection.create({
                        userId: tStatus?.receiverId,
                        userType: tStatus?.receiverType,
                        notificationType: `${tStatus?.transactionStatus == "success" ? "withdraw-successful" : ""}${tStatus?.transactionStatus == "declined" ? "withdraw-declined" : ""}`,
                        title: `${tStatus?.transactionStatus == "success" ? "Withdrawal approved successfully!" : ""}${tStatus?.transactionStatus == "declined" ? "Withdrawal declined!" : ""}`,
                        message: `${tStatus?.transactionStatus == "success" ? "Your withdrawal has been approved successfully!" : ""}${tStatus?.transactionStatus == "declined" ? "Your withdrawal has been declined!" : ""}`,
                        postedBy: tStatus?.receiverId,
                        postedByType: tStatus?.receiverType
                    });

                    res.io.to((updatedPendingWithdrawalStatus?.receiverId)?.toString()).emit("notification", newNotification);

                    res.send({
                        details: {
                            transactionStatus: "Insufficient balance!"
                        }
                    });
                    return;
                }

                let u = await shopCollection.findByIdAndUpdate(updatedPendingWithdrawalStatus?.receiverId, {
                    $inc: { balance: -updatedPendingWithdrawalStatus.amount }
                }, { new: true });
                newAccountBalance = u!!.balance;
            } else { return; }
        }

        const updatedT = await transactionReceiptCollection.findByIdAndUpdate(req.params.id, {
            transactionStatus: status
        }, { new: true });

        const newNotification = await notificationCollection.create({
            userId: updatedT?.receiverId,
            userType: updatedT?.receiverType,
            notificationType: `${updatedT?.transactionStatus == "success" ? "withdraw-successful" : ""}${updatedT?.transactionStatus == "declined" ? "withdraw-declined" : ""}`,
            title: `${updatedT?.transactionStatus == "success" ? "Withdrawal approved successfully!" : ""}${updatedT?.transactionStatus == "declined" ? "Withdrawal declined!" : ""}`,
            message: `${updatedT?.transactionStatus == "success" ? "Your withdrawal has been approved successfully!" : ""}${updatedT?.transactionStatus == "declined" ? "Your withdrawal has been declined!" : ""}`,
            postedBy: updatedT?.receiverId,
            postedByType: updatedT?.receiverType
        });

        res.io.to((updatedT?.receiverId)?.toString()).emit("notification", newNotification);

        res.send({
            successful: true,
            details: updatedT,
            newBalance: newAccountBalance
        });

    } catch (error) {
        next(error);
    }
});

adminRoutes.get("/recently-modified-withdrawals", async (_req: CustomRequest, res: Response, next: NextFunction) => {
    try {

        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

        const recentlyModifiedWithdrawals = await transactionReceiptCollection.find({ updatedAt: { $gte: thirtyMinutesAgo } });

        res.send({
            successful: true,
            recentlyModifiedWithdrawals
        });

    } catch (error) {
        next(error);
    }
});


adminRoutes.get("/waiting-list/:page/:limit", pageAndLimit, async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const waitingList = await waitingListCollection.paginate({}, req.paginatePageAndLimit as object);
        res.send({
            waitingList
        });
    } catch (error) {
        next(error);
    }
});



// adminRoutes.post("/normalize-user/:userType", async (req: CustomRequest, res: Response, next: NextFunction) => {
//     try {

//         const {userType} = req.body;

//         var isNormalized = false;

//         if(userType == "shopper") {

//         } else if(userType == "shop-admin") {

//         }

//         res.send({
//             successful: true,
//             isNormalized
//         });
        
//     } catch (error) {
//         next(error);
//     }
// });

export default adminRoutes;