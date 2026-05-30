import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import dashboardRouter from "./dashboard.js";
import missionsRouter from "./missions.js";
import campaignsRouter from "./campaigns.js";
import coinsRouter from "./coins.js";
import leaderboardRouter from "./leaderboard.js";
import achievementsRouter from "./achievements.js";
import ticketsRouter from "./tickets.js";
import referralsRouter from "./referrals.js";
import notificationsRouter from "./notifications.js";
import uploadRouter from "./upload.js";
import adminRouter from "./admin.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(dashboardRouter);
router.use(missionsRouter);
router.use(campaignsRouter);
router.use(coinsRouter);
router.use(leaderboardRouter);
router.use(achievementsRouter);
router.use(ticketsRouter);
router.use(referralsRouter);
router.use(notificationsRouter);
router.use(uploadRouter);
router.use(adminRouter);

export default router;
