import logger from "../utils/logger";

/**
 * Start recurring server tasks (e.g. cleanup, digests).
 * Add schedulers here when needed (e.g. node-cron); keep stopCronJobs in sync.
 */
export function startCronJobs(): void {
  logger.info("Cron jobs: no scheduled tasks configured");
}

/**
 * Stop all cron timers / intervals started by startCronJobs.
 */
export function stopCronJobs(): void {
  // No-op until scheduled tasks are registered above.
}
