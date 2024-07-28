import { Response } from "express";
const { User } = require("../models/user");
import Event from "../models/event";
import Subscription from "../models/subscription";
import Log from "../models/log";

// Get user metrics (total count and optionally filter by created date)
export const getMetrics = async (req: any, res: Response) => {
  const is_admin = req.user?.is_admin;
  if (is_admin) {
    const { fromDate } = req.body;
    try {
      const userQuery: any = {
        createdDate: { $gte: new Date(fromDate) },
      };
      let userCount = await User.countDocuments(userQuery);
      let totalCount = await User.countDocuments({});
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

      res.status(200).json({
        users: {
          total: totalCount,
          lastWeek: userCount,
          percentage: percentage,
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
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Failed to get user metrics" });
    }
  } else {
    res.status(200).json({ totalCount: 0, useCount: 0 });
  }
};
