import { router } from '../trpc';
import { authRouter } from './auth';
import { adminRouter } from './admin';
import { availabilityRouter } from './availability';
import { appointmentRouter } from './appointment';
import { barbersRouter } from './barbers';
import { consentRouter } from './consent';
import { dashboardRouter } from './dashboard';
import { customersRouter } from './customers';
import { servicesRouter } from './services';
import { portfolioRouter } from './portfolio';
import { reviewsRouter } from './reviews';
import { settingsRouter } from './settings';
import { mediaRouter } from './media';

export const appRouter = router({
  auth: authRouter,
  admin: adminRouter,
  availability: availabilityRouter,
  appointment: appointmentRouter,
  barbers: barbersRouter,
  consent: consentRouter,
  dashboard: dashboardRouter,
  customers: customersRouter,
  services: servicesRouter,
  portfolio: portfolioRouter,
  reviews: reviewsRouter,
  settings: settingsRouter,
  media: mediaRouter,
});

export type AppRouter = typeof appRouter;
