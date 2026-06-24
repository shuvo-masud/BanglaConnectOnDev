import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profilesRouter from "./profiles";
import mentorsRouter from "./mentors";
import connectionsRouter from "./connections";
import dashboardRouter from "./dashboard";
import blogsRouter from "./blogs";
import newsRouter from "./news";
import jobsRouter from "./jobs";
import eventsRouter from "./events";
import vaultRouter from "./vault";
import supportRouter from "./support";
import adminRouter from "./admin";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profilesRouter);
router.use(mentorsRouter);
router.use(connectionsRouter);
router.use(dashboardRouter);
router.use(blogsRouter);
router.use(newsRouter);
router.use(jobsRouter);
router.use(eventsRouter);
router.use(vaultRouter);
router.use(supportRouter);
router.use(adminRouter);
router.use(chatRouter);

export default router;
