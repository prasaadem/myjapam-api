import cron from "node-cron";
import { performNightlyTask } from "./tasks/nightlyTask";

// Schedule tasks to be run on the server
cron.schedule("0 0 * * *", () => {
  console.log("Running a job at midnight every night");
  performNightlyTask();
});

export const triggerNightlyTask = async (date: string) => {
  console.log("Running the nightly task immediately via endpoint");
  await performNightlyTask(date);
};
