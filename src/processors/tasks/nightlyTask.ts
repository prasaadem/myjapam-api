import moment from "moment";
import Session from "../../models/session";
import Event from "../../models/event";
import Subscription from "../../models/subscription";
import Log from "../../models/log";
import Metrics from "../../models/metrics";
import User from "../../models/user";
import mailer from "../../helpers/sesMailer";

export const performNightlyTask = async (dateStr?: string) => {
  try {
    console.log(`Nightly task started`);

    const upperDate = dateStr ? moment(dateStr).toDate() : moment().toDate();

    const lowerDate = dateStr
      ? moment(dateStr).subtract(1, "days").toDate()
      : moment().subtract(1, "days").toDate();

    console.log(`From: ${lowerDate} to : ${upperDate} `);

    await updateAdminMetrics(upperDate, lowerDate);
    await updateUserMetrics(upperDate, lowerDate);

    console.log(`Nightly task ended`);
  } catch (e: any) {
    console.log("Error running process", e.message);
  }
};

const updateAdminMetrics = async (upperDate: Date, lowerDate: Date) => {
  try {
    const tombstonedQuery = {
      tombstonedDate: { $gte: lowerDate, $lte: upperDate },
    };

    if (!(lowerDate instanceof Date) || !(upperDate instanceof Date)) {
      throw new Error("Invalid date format");
    }

    const userQuery = {
      createdDate: { $gte: lowerDate, $lte: upperDate },
    };

    // Log the query and dates for debugging
    console.log("User Query:", userQuery);
    console.log("Lower Date:", lowerDate);
    console.log("Upper Date:", upperDate);

    const new_users = await User.countDocuments(userQuery);

    const tombstoned_users = await User.countDocuments(tombstonedQuery);

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

    const response = {
      type: "admin",
      new_users,
      tombstoned_users,
      new_sessions,
      new_events,
      new_subscriptions,
      new_logs,
      createdAt: upperDate,
    };

    const metrics = new Metrics(response);
    await metrics.save();

    await mailer.adminEmailNotify(
      `Ran Nightly task for admin: ${upperDate}`,
      formatUserActivitySummary(response)
    );
  } catch (e: any) {
    console.log("Error with admin metrics", e.message);
  }
};

const formatUserActivitySummary = (response: any) => {
  return `
    User Activity Summary:

    Type: ${response.type}
    New Users: ${response.new_users}
    Tombstoned Users: ${response.tombstoned_users}
    New Sessions: ${response.new_sessions}
    New Events: ${response.new_events}
    New Subscriptions: ${response.new_subscriptions}
    New Logs: ${response.new_logs}
    Created At: ${response.createdAt}
    `;
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
