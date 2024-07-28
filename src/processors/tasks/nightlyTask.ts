import moment from "moment";
import Session from "../../models/session";
import Event from "../../models/event";
import Subscription from "../../models/subscription";
import Log from "../../models/log";
import Metrics from "../../models/metrics";
const { User } = require("../../models/user");

export const performNightlyTask = async (dateStr?: string) => {
  try {
    console.log(`Nightly task started`);

    const upperDate = dateStr ? moment(dateStr).toDate() : moment().toDate();

    const loweDate = dateStr
      ? moment(dateStr).subtract(1, "days").toDate()
      : moment().subtract(1, "days").toDate();

    console.log(`From: ${loweDate} to : ${upperDate} `);

    await updateAdminMetrics(upperDate, loweDate);
    await updateUserMetrics(upperDate, loweDate);

    console.log(`Nightly task ended`);
  } catch (e: any) {
    console.log("Error running process", e.message);
  }
};

const updateAdminMetrics = async (upperDate: Date, lowerDate: Date) => {
  try {
    const tombstonedQuery = {
      tombstonedDate: {
        $exists: true,
      },
    };

    const userQuery: any = {
      createdDate: { $gte: lowerDate, $lte: upperDate },
    };

    const new_users = await User.countDocuments(userQuery);
    const tombstoned_users = await User.countDocuments({
      ...userQuery,
      ...tombstonedQuery,
    });

    const sessionQuery: any = {
      createdAt: { $gte: lowerDate, $lte: upperDate },
    };
    let new_sessions = await Session.countDocuments(sessionQuery);

    const eventQuery: any = {
      timestamp: { $gte: lowerDate, $lte: upperDate },
    };
    let new_events = await Event.countDocuments(eventQuery);

    const subscriptionQuery: any = {
      subscription_date: { $gte: lowerDate, $lte: upperDate },
    };
    let new_subscriptions = await Subscription.countDocuments(
      subscriptionQuery
    );

    const logQuery: any = {
      timestamp: { $gte: lowerDate, $lte: upperDate },
    };
    let new_logs = await Log.countDocuments(logQuery);

    const metrics = new Metrics({
      type: "admin",
      new_users,
      tombstoned_users,
      new_sessions,
      new_events,
      new_subscriptions,
      new_logs,
      createdAt: upperDate,
    });
    await metrics.save();
  } catch (e: any) {
    console.log("Error with admin metrics", e.message);
  }
};

const updateUserMetrics = async (upperDate: Date, lowerDate: Date) => {
  try {
    const aggregateQuery = [
      // Step 1: Filter logs created within the last one day
      {
        $match: {
          timestamp: { $gte: lowerDate, $lte: upperDate },
        },
      },
      // Step 2: Lookup Events
      {
        $lookup: {
          from: "events",
          localField: "event",
          foreignField: "_id",
          as: "event",
        },
      },
      // Step 3: Unwind Event Array
      {
        $unwind: "$event",
      },
      // Step 4: Lookup Users
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      // Step 5: Unwind User Array
      {
        $unwind: "$user",
      },
      // Step 6: Group by User and Event
      {
        $group: {
          _id: {
            user_id: "$user._id",
            event_id: "$event._id",
          },
          total_logs: { $sum: 1 },
          logs: { $push: "$$ROOT" },
        },
      },
      // Step 7: Project desired fields
      {
        $project: {
          user_id: "$_id.user_id",
          event_id: "$_id.event_id",
          total_logs: 1,
          logs: 1,
        },
      },
    ];

    const results = await Log.aggregate(aggregateQuery).exec();

    const metricPromises = results.map((result) => {
      const metric = new Metrics({
        type: "user",
        user_id: result.user_id,
        event_id: result.event_id,
        log_count: result.total_logs,
        logs: result.logs,
        createdAt: upperDate,
      });
      return metric.save();
    });

    await Promise.all(metricPromises);
  } catch (e: any) {
    console.log("Error with user metrics", e.message);
  }
};
