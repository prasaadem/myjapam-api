import { Response } from "express";
import Event from "../models/event";
import Subscription from "../models/subscription";
import Log from "../models/log";
import Session from "../models/session";
import { triggerNightlyTask } from "../processors/scheduler";
import moment from "moment";
import User from "../models/user";
import Metrics from "../models/metrics";

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

// Get session metrics (total count and optionally filter by created date)
export const getSessionMetrics = async (req: any, res: Response) => {
  const is_admin = req.user?.is_admin;
  if (is_admin) {
    const { fromDate, skip = 0, limit = 50 } = req.body;
    try {
      const sessionQuery: any = {
        createdDate: { $gte: new Date(fromDate) },
      };
      const lastWeekSessions = await Session.find(sessionQuery);
      let totalSessions = await Session.find({}).skip(skip).limit(limit).exec();

      res.status(200).json({
        total: totalSessions,
        lastWeek: lastWeekSessions,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Failed to get session metrics" });
    }
  } else {
    res.status(200).json({ totalCount: 0, useCount: 0 });
  }
};

// Get event metrics (total count and optionally filter by created date)
export const getEventMetrics = async (req: any, res: Response) => {
  const is_admin = req.user?.is_admin;
  if (is_admin) {
    const { fromDate, skip = 0, limit = 50 } = req.body;
    try {
      const eventQuery: any = {
        timestamp: { $gte: new Date(fromDate) },
      };
      const lastWeekEvents = await Event.find(eventQuery);
      let totalEventCount = await Event.find({}).skip(skip).limit(limit).exec();

      res.status(200).json({
        total: totalEventCount,
        lastWeek: lastWeekEvents,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Failed to get event metrics" });
    }
  } else {
    res.status(200).json({ totalCount: 0, useCount: 0 });
  }
};

// Get subscription metrics (total count and optionally filter by created date)
export const getSubscriptionMetrics = async (req: any, res: Response) => {
  const is_admin = req.user?.is_admin;
  if (is_admin) {
    const { fromDate, skip = 0, limit = 50 } = req.body;
    try {
      const subscriptionQuery: any = {
        subscription_date: { $gte: new Date(fromDate) },
      };
      const lastWeekSubscriptions = await Subscription.find(subscriptionQuery)
        .populate("user")
        .populate("event")
        .exec();
      let totalSubscriptionCount = await Subscription.find({})
        .populate("user")
        .populate("event")
        .skip(skip)
        .limit(limit)
        .exec();

      res.status(200).json({
        total: totalSubscriptionCount,
        lastWeek: lastWeekSubscriptions,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Failed to get event metrics" });
    }
  } else {
    res.status(200).json({ totalCount: 0, useCount: 0 });
  }
};

// Get subscription metrics (total count and optionally filter by created date)
export const getLogMetrics = async (req: any, res: Response) => {
  const is_admin = req.user?.is_admin;
  if (is_admin) {
    const { fromDate, skip = 0, limit = 50 } = req.body;
    try {
      const logQuery: any = {
        timestamp: { $gte: new Date(fromDate) },
      };
      const lastWeekSubscriptions = await Log.find(logQuery)
        .populate("user")
        .populate("event")
        .exec();
      let totalSubscriptionCount = await Log.find({})
        .populate("user")
        .populate("event")
        .skip(skip)
        .limit(limit)
        .exec();

      res.status(200).json({
        total: totalSubscriptionCount,
        lastWeek: lastWeekSubscriptions,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Failed to get event metrics" });
    }
  } else {
    res.status(200).json({ totalCount: 0, useCount: 0 });
  }
};

export const generateMetrics = async (req: any, res: Response) => {
  try {
    const { date } = req.body;

    const upperDate = date ? moment(date).toDate() : moment().toDate();

    const lowerDate = date
      ? moment(date).subtract(1, "days").toDate()
      : moment().subtract(1, "days").toDate();

    const tombstonedQuery = {
      tombstonedDate: { $gte: lowerDate, $lte: upperDate },
    };

    const userQuery: any = {
      createdDate: { $gte: lowerDate, $lte: upperDate },
    };

    const new_users = await User.countDocuments(userQuery);
    const tombstoned_users = await User.countDocuments(tombstonedQuery);

    await triggerNightlyTask(date);
    res.status(200).send({
      message: `Nightly task triggered for: ${date}`,
      lowerDate,
      upperDate,
      new_users,
      tombstoned_users,
    });
  } catch (e) {
    console.log("Nightly error: ", e);
    res.status(200).send("Nightly task failed");
  }
};

export const userLogs = async (req: any, res: Response) => {
  try {
    const requesterId = req.user?.userId;
    const { eventId, startDate, endDate } = req.body;

    const upperDate = endDate ? moment(endDate).toDate() : moment().toDate();

    const lowerDate = startDate
      ? moment(startDate).toDate()
      : moment().toDate();

    const metricsQuery = {
      type: "user",
      event_id: eventId,
      user_id: requesterId,
      createdAt: { $gte: lowerDate, $lte: upperDate },
    };

    const logMetrics = await Metrics.find(metricsQuery).sort({ createdAt: 1 });

    res.status(200).send(logMetrics);
  } catch (e) {
    console.log("Nightly error: ", e);
    res.status(200).send("Nightly task failed");
  }
};
