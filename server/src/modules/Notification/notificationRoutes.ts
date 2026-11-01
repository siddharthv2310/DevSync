import { Router } from "express";

import { authMiddleware } from "../../middlewares/authMiddleware.js";

import { getNotificationsController, getUnreadCountController, markNotificationAsReadController, markAllNotificationsAsReadController,
       deleteNotificationController,
       getVapidPublicKeyController,
       savePushSubscriptionController,
       removePushSubscriptionController, } from "./notificationController.js";

const router = Router({mergeParams:true});


router.get("/",authMiddleware, getNotificationsController);

router.get("/unread-count",authMiddleware, getUnreadCountController);

router.patch("/read-all", authMiddleware, markAllNotificationsAsReadController);

router.patch( "/:notificationId/read", authMiddleware , markNotificationAsReadController);

router.delete("/:notificationId", authMiddleware , deleteNotificationController);

router.get("/push-public-key", getVapidPublicKeyController);

router.post("/push-subscriptions", savePushSubscriptionController);

router.delete("/push-subscriptions", removePushSubscriptionController);

export default router;