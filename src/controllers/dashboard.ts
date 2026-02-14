import { Response } from "express";
import mongoose from "mongoose";
import User from "../models/user";
import Subscription from "../models/subscription";
import Log from "../models/log";

export async function getDashboard(req: any, res: Response): Promise<void> {
  try {
    const userId = req.body.userId;
    if (!userId) {
      res.status(400).json({ message: "userId is required" });
      return;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // 1. Get user for greeting
    const user = await User.findById(userObjectId).select("first_name");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // 2. Get all subscriptions with populated event data
    const subscriptions = await Subscription.find({ user: userObjectId })
      .populate("event")
      .sort({ subscription_date: -1 });

    // 3. Calculate stats
    let totalLifetimeCount = 0;
    let activeJapams = 0;
    let completedJapams = 0;

    const activeSubscriptions: any[] = [];

    subscriptions.forEach((sub: any) => {
      const sum = sub.sum || 0;
      const goal = sub.event?.value || 0;
      totalLifetimeCount += sum;

      if (goal > 0 && sum >= goal) {
        completedJapams++;
      } else {
        activeJapams++;
        activeSubscriptions.push(sub);
      }
    });

    // 4. Get today's log count
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayCount = await Log.countDocuments({
      user: userObjectId,
      timestamp: { $gte: startOfToday },
    });

    // 5. Calculate streak - aggregate logs by date, walk backward
    const dailyLogs = await Log.aggregate([
      { $match: { user: userObjectId } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    let currentStreak = 0;
    if (dailyLogs.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if user logged today or yesterday to start the streak
      const mostRecentLogDate = new Date(dailyLogs[0]._id + "T00:00:00");
      const diffFromToday = Math.floor(
        (today.getTime() - mostRecentLogDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Streak only counts if last log was today or yesterday
      if (diffFromToday <= 1) {
        let expectedDate = new Date(mostRecentLogDate);

        for (const dayLog of dailyLogs) {
          const logDate = new Date(dayLog._id + "T00:00:00");
          const expectedStr = expectedDate.toISOString().split("T")[0];
          const logStr = logDate.toISOString().split("T")[0];

          if (expectedStr === logStr) {
            currentStreak++;
            expectedDate.setDate(expectedDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }

    // 6. Get recent activity - last 5 log entries
    const recentLogs = await Log.find({ user: userObjectId })
      .sort({ timestamp: -1 })
      .limit(5)
      .populate("event");

    const recentActivity = recentLogs.map((log: any) => {
      // Find the subscription for this log's event
      const sub = subscriptions.find(
        (s: any) => s.event._id.toString() === log.event._id.toString(),
      );
      return {
        eventTitle: log.event?.title || "",
        eventSubtitle: log.event?.subtitle || "",
        subscriptionId: sub ? sub._id.toString() : "",
        timestamp: log.timestamp.toISOString(),
      };
    });

    // 7. Calculate continueJapams - active subs sorted by most recent log
    // Get the most recent log timestamp for each event
    const recentLogsByEvent = await Log.aggregate([
      { $match: { user: userObjectId } },
      {
        $group: {
          _id: "$event",
          lastLogTime: { $max: "$timestamp" },
        },
      },
      { $sort: { lastLogTime: -1 } },
    ]);

    const lastLogMap = new Map<string, Date>();
    recentLogsByEvent.forEach((entry: any) => {
      lastLogMap.set(entry._id.toString(), entry.lastLogTime);
    });

    // Filter active subs that have logs, sorted by last log time
    const continueJapams = activeSubscriptions
      .filter((sub: any) => lastLogMap.has(sub.event._id.toString()))
      .sort((a: any, b: any) => {
        const aTime = lastLogMap.get(a.event._id.toString())?.getTime() || 0;
        const bTime = lastLogMap.get(b.event._id.toString())?.getTime() || 0;
        return bTime - aTime;
      })
      .slice(0, 5)
      .map((sub: any) => {
        const sum = sub.sum || 0;
        const goal = sub.event.value || 1;
        return {
          subscriptionId: sub._id.toString(),
          eventTitle: sub.event.title,
          eventSubtitle: sub.event.subtitle || "",
          imageUrl: sub.event.url || null,
          currentCount: sum,
          goalCount: goal,
          progressPercent: Math.min(Math.round((sum / goal) * 100), 100),
        };
      });

    // 8. Calculate nearCompletion - subscriptions at 80-99%
    const nearCompletion = activeSubscriptions
      .map((sub: any) => {
        const sum = sub.sum || 0;
        const goal = sub.event.value || 1;
        const progress = Math.min(Math.round((sum / goal) * 100), 100);
        return {
          subscriptionId: sub._id.toString(),
          eventTitle: sub.event.title,
          currentCount: sum,
          goalCount: goal,
          progressPercent: progress,
        };
      })
      .filter(
        (item) => item.progressPercent >= 80 && item.progressPercent < 100,
      );

    // 9. Build greeting
    const now = new Date();
    const hour = now.getHours();
    let greetingMessage: string;
    if (hour < 12) {
      greetingMessage = "Good Morning";
    } else if (hour < 17) {
      greetingMessage = "Good Afternoon";
    } else {
      greetingMessage = "Good Evening";
    }

    const dateStr = now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    // Build response
    const dashboardData = {
      greeting: {
        message: greetingMessage,
        userName: user.first_name,
        date: dateStr,
      },
      stats: {
        totalJapams: subscriptions.length,
        activeJapams,
        completedJapams,
        totalLifetimeCount,
        todayCount,
        currentStreak,
      },
      recentActivity,
      continueJapams,
      nearCompletion,
    };

    res.status(200).json(dashboardData);
  } catch (error: any) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Failed to load dashboard data" });
  }
}
