import { Response } from "express";
const { User } = require("../models/user");
import Event from "../models/event";
import Subscription from "../models/subscription";
import Log from "../models/log";
import Session from "../models/session";
import { triggerNightlyTask } from "../processors/scheduler";

// Get metrics (total count and optionally filter by created date)
export const getMetrics = async (req: any, res: Response) => {
  const is_admin = req.user?.is_admin;
  if (is_admin) {
    const { fromDate } = req.body;
    try {
      const tombstonedQuery = {
        tombstonedDate: {
          $exists: true,
        },
      };
      const userQuery: any = {
        createdDate: { $gte: new Date(fromDate) },
      };
      let userCount = await User.countDocuments(userQuery);
      let totalCount = await User.countDocuments({});

      let lastWeekTombstoned = await User.countDocuments({
        ...userQuery,
        ...tombstonedQuery,
      });
      let totalTombstoned = await User.countDocuments(tombstonedQuery);
      const percentage = parseFloat(
        ((userCount / totalCount) * 100).toFixed(2)
      );

      const eventQuery: any = {
        timestamp: { $gte: new Date(fromDate) },
      };
      let eventCount = await Event.countDocuments(eventQuery);
      let totalEventCount = await Event.countDocuments({});
      const eventPercentage = parseFloat(
        ((eventCount / totalEventCount) * 100).toFixed(2)
      );

      const subscriptionQuery: any = {
        subscription_date: { $gte: new Date(fromDate) },
      };
      let subscriptionCount = await Subscription.countDocuments(
        subscriptionQuery
      );
      let totalSubscriptionCount = await Subscription.countDocuments({});
      const subscriptionPercentage = parseFloat(
        ((subscriptionCount / totalSubscriptionCount) * 100).toFixed(2)
      );

      const logQuery: any = {
        timestamp: { $gte: new Date(fromDate) },
      };
      let logCount = await Log.countDocuments(logQuery);
      let totalLogCount = await Log.countDocuments({});
      const logPercentage = parseFloat(
        ((logCount / totalLogCount) * 100).toFixed(2)
      );

      const sessionQuery: any = {
        createdAt: { $gte: new Date(fromDate) },
      };
      let sessionCount = await Session.countDocuments(sessionQuery);
      let totalSessionCount = await Session.countDocuments({});
      const sessionPercentage = parseFloat(
        ((sessionCount / totalSessionCount) * 100).toFixed(2)
      );

      res.status(200).json({
        users: {
          total: totalCount,
          lastWeek: userCount,
          percentage: percentage,
          totalTombstoned: totalTombstoned,
          lastWeekTombstoned: lastWeekTombstoned,
        },
        events: {
          total: totalEventCount,
          lastWeek: eventCount,
          percentage: eventPercentage,
        },
        subscriptions: {
          total: totalSubscriptionCount,
          lastWeek: subscriptionCount,
          percentage: subscriptionPercentage,
        },
        logs: {
          total: totalLogCount,
          lastWeek: logCount,
          percentage: logPercentage,
        },
        sessions: {
          total: totalSessionCount,
          lastWeek: sessionCount,
          percentage: sessionPercentage,
        },
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Failed to get user metrics" });
    }
  } else {
    res.status(200).json({ totalCount: 0, useCount: 0 });
  }
};

// Get user metrics (total count and optionally filter by created date)
export const getUserMetrics = async (req: any, res: Response) => {
  const is_admin = req.user?.is_admin;
  if (is_admin) {
    const { fromDate, skip = 0, limit = 50 } = req.body;
    try {
      const tombstonedQuery = {
        tombstonedDate: {
          $exists: true,
        },
      };
      const userQuery: any = {
        createdDate: { $gte: new Date(fromDate) },
      };
      const lastWeekUsers = await User.find(userQuery);
      let totalUsers = await User.find({}).skip(skip).limit(limit).exec();

      let lastWeekTombstoned = await User.find({
        ...userQuery,
        ...tombstonedQuery,
      });
      let totalTombstoned = await User.find(tombstonedQuery);

      res.status(200).json({
        total: totalUsers,
        lastWeek: lastWeekUsers,
        totalTombstoned: totalTombstoned,
        lastWeekTombstoned: lastWeekTombstoned,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Failed to get user metrics" });
    }
  } else {
    res.status(200).json({ totalCount: 0, useCount: 0 });
  }
};

const getAllDatesFromStartDateUntilToday = (startDate: Date) => {
  const dates = [];
  const date = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to midnight to compare dates accurately

  while (date <= today) {
    dates.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return dates;
};

export const generateMetrics = async (req: any, res: Response) => {
  try {
    const { date } = req.body;
    // const dates = getAllDatesFromStartDateUntilToday(date);
    // for (const date of dates) {
    //   const dateString = date.toISOString().split("T")[0];
    //   await triggerNightlyTask(dateString);
    // }

    await triggerNightlyTask(date);
    res.status(200).send(`Nightly task triggered for: ${date}`);
  } catch (e) {
    console.log("Nightly error: ", e);
    res.status(200).send("Nightly task failed");
  }
};
