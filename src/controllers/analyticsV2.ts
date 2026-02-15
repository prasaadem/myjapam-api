import { Response } from "express";
import mongoose from "mongoose";
import Subscription from "../models/subscription";
import Log from "../models/log";

// ── Helpers ──────────────────────────────────────────────────────────

function getPeriodStartDate(period: string): Date | null {
  const now = new Date();
  switch (period) {
    case "week":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    case "month":
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case "quarter":
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case "year":
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    case "all":
    default:
      return null;
  }
}

function calculateStreaks(
  sortedDays: Array<{ date: string; count: number }>
): { currentStreak: number; longestStreak: number } {
  if (sortedDays.length === 0) return { currentStreak: 0, longestStreak: 0 };

  // sortedDays should be sorted descending by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Check if most recent day is today or yesterday
  const mostRecent = new Date(sortedDays[0].date + "T00:00:00");
  const diffFromToday = Math.floor(
    (today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffFromToday > 1) {
    // No current streak, but still calculate longest
    currentStreak = 0;
  }

  // Walk through all days to find longest streak
  // First, build a Set of all active dates
  const dateSet = new Set(sortedDays.map((d) => d.date));

  // Find earliest and latest dates
  const allDates = sortedDays.map((d) => new Date(d.date + "T00:00:00"));
  const earliest = new Date(Math.min(...allDates.map((d) => d.getTime())));

  // Walk forward from earliest to today
  let streak = 0;
  const cursor = new Date(earliest);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= today) {
    const dateStr = cursor.toISOString().split("T")[0];
    if (dateSet.has(dateStr)) {
      streak++;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      streak = 0;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  // Current streak: walk backward from today
  if (diffFromToday <= 1) {
    const walkBack = new Date(mostRecent);
    for (let i = 0; i < sortedDays.length; i++) {
      const dayDate = new Date(sortedDays[i].date + "T00:00:00");
      const expectedStr = walkBack.toISOString().split("T")[0];
      const dayStr = dayDate.toISOString().split("T")[0];

      if (expectedStr === dayStr) {
        currentStreak++;
        walkBack.setDate(walkBack.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return { currentStreak, longestStreak };
}

function getDayName(dayIndex: number): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[dayIndex];
}

function getTimePreference(hour: number): "morning" | "afternoon" | "evening" {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

// ── Endpoint 1: Subscription Analytics ───────────────────────────────

export async function getSubscriptionAnalytics(
  req: any,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const { subscriptionId } = req.params;
    const period = (req.query.period as string) || "all";

    // Get subscription with event data
    const subscription = await Subscription.findById(subscriptionId).populate(
      "event"
    );
    if (!subscription) {
      res.status(404).json({ message: "Subscription not found" });
      return;
    }

    const event = subscription.event as any;
    const eventId = event._id;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const goal = event.value || 1;
    const currentCount = (subscription.sum as number) || 0;
    const subscriptionDate = subscription.subscription_date;

    // Period date filter
    const periodStart = getPeriodStartDate(period);
    const baseMatch: any = { user: userObjectId, event: eventId };
    const periodMatch: any = periodStart
      ? { ...baseMatch, timestamp: { $gte: periodStart } }
      : baseMatch;

    // Run all aggregation pipelines in parallel
    const [
      dailyCountsAll,
      dailyCountsPeriod,
      hourlyDistResult,
      dayOfWeekResult,
      weeklyAggResult,
      monthlyAggResult,
      allLogsForMilestones,
    ] = await Promise.all([
      // 1. Daily counts (ALL time - for streaks and heatmap)
      Log.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
      ]),

      // 2. Daily counts (period-filtered - for chart data)
      Log.aggregate([
        { $match: periodMatch },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 3. Hourly distribution (all time)
      Log.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: { $hour: "$timestamp" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 4. Day of week distribution (all time)
      Log.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: { $dayOfWeek: "$timestamp" }, // 1=Sun, 7=Sat
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 5. Weekly aggregation (period-filtered)
      Log.aggregate([
        { $match: periodMatch },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-W%V", date: "$timestamp" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 6. Monthly aggregation (period-filtered)
      Log.aggregate([
        { $match: periodMatch },
        {
          $group: {
            _id: {
              month: { $month: "$timestamp" },
              year: { $year: "$timestamp" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // 7. All logs sorted by sum for milestone detection
      Log.find(baseMatch).sort({ sum: 1 }).select("sum timestamp").lean(),
    ]);

    // ── Compute volume metrics ──
    const totalCountInPeriod = dailyCountsPeriod.reduce(
      (acc: number, d: any) => acc + d.count,
      0
    );

    // Best day
    let bestDay: { date: string; count: number } | null = null;
    for (const d of dailyCountsAll) {
      if (!bestDay || d.count > bestDay.count) {
        bestDay = { date: d._id, count: d.count };
      }
    }

    // Best week
    let bestWeek: { startDate: string; count: number } | null = null;
    for (const w of weeklyAggResult) {
      if (!bestWeek || w.count > bestWeek.count) {
        bestWeek = { startDate: w._id, count: w.count };
      }
    }

    // Best month
    let bestMonth: { month: string; year: number; count: number } | null = null;
    for (const m of monthlyAggResult) {
      if (!bestMonth || m.count > bestMonth.count) {
        const monthNames = [
          "",
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        bestMonth = {
          month: monthNames[m._id.month],
          year: m._id.year,
          count: m.count,
        };
      }
    }

    // Rolling averages
    const now = new Date();
    const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const prev7 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    let last7Count = 0;
    let prev7Count = 0;
    let last30Count = 0;

    for (const d of dailyCountsAll) {
      const date = new Date(d._id + "T00:00:00");
      if (date >= last7) last7Count += d.count;
      if (date >= prev7 && date < last7) prev7Count += d.count;
      if (date >= last30) last30Count += d.count;
    }

    const totalActiveDays = dailyCountsAll.length;
    const totalDaysSubscribed = Math.max(
      1,
      Math.ceil(
        (now.getTime() - new Date(subscriptionDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const dailyAverage =
      totalActiveDays > 0 ? currentCount / totalDaysSubscribed : 0;
    const weeklyAverage = last7Count / 7;
    const monthlyAverage = last30Count / 30;

    // ── Streak analytics ──
    const streakDays = dailyCountsAll.map((d: any) => ({
      date: d._id,
      count: d.count,
    }));
    const { currentStreak, longestStreak } = calculateStreaks(streakDays);

    // Calendar heatmap (last 90 days)
    const heatmapStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const dateCountMap = new Map<string, number>();
    for (const d of dailyCountsAll) {
      dateCountMap.set(d._id, d.count);
    }
    const calendarHeatmap: Array<{ date: string; count: number }> = [];
    const heatmapCursor = new Date(heatmapStart);
    heatmapCursor.setHours(0, 0, 0, 0);
    while (heatmapCursor <= now) {
      const dateStr = heatmapCursor.toISOString().split("T")[0];
      calendarHeatmap.push({
        date: dateStr,
        count: dateCountMap.get(dateStr) || 0,
      });
      heatmapCursor.setDate(heatmapCursor.getDate() + 1);
    }

    // ── Progress analytics ──
    const percentComplete = Math.min(
      Math.round((currentCount / goal) * 100),
      100
    );
    const remaining = Math.max(goal - currentCount, 0);
    const currentPace = weeklyAverage; // logs per day over last 7 days
    const requiredPace =
      remaining > 0 ? remaining / Math.max(totalDaysSubscribed, 1) : 0;

    let estimatedDaysToComplete: number | null = null;
    let projectedCompletionDate: string | null = null;
    if (currentPace > 0 && remaining > 0) {
      estimatedDaysToComplete = Math.ceil(remaining / currentPace);
      const projDate = new Date(
        now.getTime() + estimatedDaysToComplete * 24 * 60 * 60 * 1000
      );
      projectedCompletionDate = projDate.toISOString().split("T")[0];
    }

    let status: "on-track" | "behind" | "ahead" | "completed" = "on-track";
    if (currentCount >= goal) {
      status = "completed";
    } else if (currentPace > 0 && requiredPace > 0) {
      const ratio = currentPace / requiredPace;
      if (ratio >= 1.2) status = "ahead";
      else if (ratio < 0.8) status = "behind";
    }

    let paceTrend: "accelerating" | "steady" | "decelerating" = "steady";
    if (prev7Count > 0) {
      const ratio = last7Count / prev7Count;
      if (ratio > 1.15) paceTrend = "accelerating";
      else if (ratio < 0.85) paceTrend = "decelerating";
    }

    // ── Pattern insights ──
    // Hourly distribution
    const hourlyDistribution: Array<{ hour: number; count: number }> = [];
    const hourMap = new Map<number, number>();
    for (const h of hourlyDistResult) {
      hourMap.set(h._id, h.count);
    }
    let mostActiveHour = 0;
    let maxHourCount = 0;
    for (let h = 0; h < 24; h++) {
      const count = hourMap.get(h) || 0;
      hourlyDistribution.push({ hour: h, count });
      if (count > maxHourCount) {
        maxHourCount = count;
        mostActiveHour = h;
      }
    }

    // Day of week distribution
    const dayDistribution: Array<{ day: string; count: number }> = [];
    const dayMap = new Map<number, number>();
    for (const d of dayOfWeekResult) {
      dayMap.set(d._id, d.count);
    }
    let mostActiveDay = "Mon";
    let maxDayCount = 0;
    let weekdayTotal = 0;
    let weekendTotal = 0;
    // MongoDB $dayOfWeek: 1=Sun, 2=Mon, ..., 7=Sat
    for (let d = 1; d <= 7; d++) {
      const count = dayMap.get(d) || 0;
      const dayName = getDayName(d - 1); // Convert to 0-indexed
      dayDistribution.push({ day: dayName, count });
      if (count > maxDayCount) {
        maxDayCount = count;
        mostActiveDay = dayName;
      }
      if (d >= 2 && d <= 6) weekdayTotal += count;
      else weekendTotal += count;
    }

    // Consistency score
    const consistencyScore = Math.min(
      Math.round((totalActiveDays / totalDaysSubscribed) * 100),
      100
    );

    // ── Period comparison ──
    let periodLabel = "This Week vs Last Week";
    let compCurrent = { count: last7Count, average: last7Count / 7 };
    let compPrevious = { count: prev7Count, average: prev7Count / 7 };

    if (period === "month" || period === "quarter" || period === "year") {
      // This month vs last month
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      let thisMonthCount = 0;
      let lastMonthCount = 0;
      for (const d of dailyCountsAll) {
        const date = new Date(d._id + "T00:00:00");
        if (date >= thisMonthStart) thisMonthCount += d.count;
        else if (date >= lastMonthStart && date < thisMonthStart)
          lastMonthCount += d.count;
      }
      const thisMonthDays = Math.max(1, now.getDate());
      const lastMonthDays = Math.max(
        1,
        new Date(now.getFullYear(), now.getMonth(), 0).getDate()
      );
      periodLabel = "This Month vs Last Month";
      compCurrent = {
        count: thisMonthCount,
        average: thisMonthCount / thisMonthDays,
      };
      compPrevious = {
        count: lastMonthCount,
        average: lastMonthCount / lastMonthDays,
      };
    }

    const percentChange =
      compPrevious.count > 0
        ? Math.round(
            ((compCurrent.count - compPrevious.count) / compPrevious.count) * 100
          )
        : compCurrent.count > 0
          ? 100
          : 0;
    const compTrend: "up" | "down" | "stable" =
      percentChange > 5 ? "up" : percentChange < -5 ? "down" : "stable";

    // ── Milestones ──
    const milestonePercents = [10, 25, 50, 75, 90, 100];
    const milestones = milestonePercents.map((pct) => {
      const targetValue = Math.ceil((pct / 100) * goal);
      const achieved = currentCount >= targetValue;

      let achievedDate: string | undefined;
      let daysFromStart: number | undefined;

      if (achieved && allLogsForMilestones.length > 0) {
        // Find the first log where sum >= targetValue
        const milestoneLog = allLogsForMilestones.find(
          (log: any) => log.sum >= targetValue
        );
        if (milestoneLog) {
          achievedDate = (milestoneLog as any).timestamp
            .toISOString()
            .split("T")[0];
          daysFromStart = Math.ceil(
            ((milestoneLog as any).timestamp.getTime() -
              new Date(subscriptionDate).getTime()) /
              (1000 * 60 * 60 * 24)
          );
        }
      }

      return { percent: pct, targetValue, achieved, achievedDate, daysFromStart };
    });

    // ── Personal records ──
    // Most consistent week: find 7-day sliding window with highest minimum daily count
    let mostConsistentWeek: {
      startDate: string;
      avgPerDay: number;
    } | null = null;
    if (calendarHeatmap.length >= 7) {
      let bestMinAvg = -1;
      for (let i = 0; i <= calendarHeatmap.length - 7; i++) {
        const window = calendarHeatmap.slice(i, i + 7);
        const activeDaysInWindow = window.filter((d) => d.count > 0).length;
        const windowTotal = window.reduce((acc, d) => acc + d.count, 0);
        const avgPerDay = windowTotal / 7;
        // Prefer windows with more active days and higher average
        const score = activeDaysInWindow * avgPerDay;
        if (score > bestMinAvg && activeDaysInWindow >= 5) {
          bestMinAvg = score;
          mostConsistentWeek = {
            startDate: window[0].date,
            avgPerDay: Math.round(avgPerDay * 10) / 10,
          };
        }
      }
    }

    // ── Chart data ──
    const chartDaily = dailyCountsPeriod.map((d: any) => ({
      date: d._id,
      count: d.count,
    }));

    const chartWeekly = weeklyAggResult.map((w: any) => ({
      week: w._id,
      count: w.count,
    }));

    const chartMonthly = monthlyAggResult.map((m: any) => {
      const monthNames = [
        "",
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return {
        month: `${monthNames[m._id.month]} ${m._id.year}`,
        count: m.count,
      };
    });

    // ── Build time range response ──
    const startDate = periodStart
      ? periodStart.toISOString().split("T")[0]
      : subscriptionDate
        ? new Date(subscriptionDate).toISOString().split("T")[0]
        : now.toISOString().split("T")[0];
    const endDate = now.toISOString().split("T")[0];
    const daysInRange = Math.max(
      1,
      Math.ceil(
        (now.getTime() - new Date(startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );

    // ── Response ──
    res.status(200).json({
      subscription: {
        id: subscription._id,
        title: event.title,
        subtitle: event.subtitle || "",
        goal,
        currentCount,
        subscriptionDate: subscriptionDate
          ? new Date(subscriptionDate).toISOString()
          : null,
      },

      timeRange: { startDate, endDate, daysInRange },

      volumeMetrics: {
        totalCount: currentCount,
        dailyAverage: Math.round(dailyAverage * 10) / 10,
        weeklyAverage: Math.round(weeklyAverage * 10) / 10,
        monthlyAverage: Math.round(monthlyAverage * 10) / 10,
        bestDay,
        bestWeek,
        bestMonth,
      },

      streakAnalytics: {
        currentStreak,
        longestStreak,
        totalActiveDays,
        calendarHeatmap,
      },

      progressAnalytics: {
        percentComplete,
        remaining,
        estimatedDaysToComplete,
        projectedCompletionDate,
        status,
        currentPace: Math.round(currentPace * 10) / 10,
        requiredPace: Math.round(requiredPace * 10) / 10,
        paceTrend,
      },

      patternInsights: {
        timeOfDay: {
          mostActiveHour,
          preference: getTimePreference(mostActiveHour),
          hourlyDistribution,
        },
        dayOfWeek: {
          mostActiveDay,
          weekdayTotal,
          weekendTotal,
          dayDistribution,
        },
        consistencyScore,
      },

      comparison: {
        periodLabel,
        current: {
          count: compCurrent.count,
          average: Math.round(compCurrent.average * 10) / 10,
        },
        previous: {
          count: compPrevious.count,
          average: Math.round(compPrevious.average * 10) / 10,
        },
        percentChange,
        trend: compTrend,
      },

      milestones,

      personalRecords: {
        highestSingleDay: bestDay,
        longestStreak: { days: longestStreak },
        mostConsistentWeek,
      },

      chartData: {
        daily: chartDaily,
        weekly: chartWeekly,
        monthly: chartMonthly,
      },
    });
  } catch (error: any) {
    console.error("Subscription analytics error:", error);
    res
      .status(500)
      .json({ message: "Failed to compute subscription analytics" });
  }
}

// ── Endpoint 2: Overview Analytics ───────────────────────────────────

export async function getOverviewAnalytics(
  req: any,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get all subscriptions with events
    const subscriptions = await Subscription.find({
      user: userObjectId,
    }).populate("event");

    // Run aggregation pipelines in parallel
    const now = new Date();
    const last30Start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last15Start = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    const prev15Start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [dailyCountsAll, dailyCountsLast30, logsByEvent] = await Promise.all([
      // Daily counts (all time) for streak
      Log.aggregate([
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
      ]),

      // Daily counts last 30 days for trend chart
      Log.aggregate([
        {
          $match: {
            user: userObjectId,
            timestamp: { $gte: last30Start },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Logs per event for japam performance
      Log.aggregate([
        { $match: { user: userObjectId } },
        {
          $group: {
            _id: "$event",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Aggregate stats
    let totalLogs = 0;
    let activeJapams = 0;
    let completedJapams = 0;

    const logCountByEvent = new Map<string, number>();
    for (const le of logsByEvent) {
      logCountByEvent.set(le._id.toString(), le.count);
      totalLogs += le.count;
    }

    // Overall streak (any event)
    const overallStreakDays = dailyCountsAll.map((d: any) => ({
      date: d._id,
      count: d.count,
    }));
    const { currentStreak: overallStreak } = calculateStreaks(overallStreakDays);

    // Japam performance
    const japamPerformance: Array<{
      subscriptionId: string;
      title: string;
      progress: number;
      status: "on-track" | "behind" | "ahead" | "completed";
      activityPercent: number;
    }> = [];

    let mostActive: { title: string; count: number } | null = null;
    let nearestToGoal: { title: string; percent: number } | null = null;

    for (const sub of subscriptions) {
      const event = sub.event as any;
      if (!event) continue;

      const sum = (sub.sum as number) || 0;
      const goal = event.value || 1;
      const progress = Math.min(Math.round((sum / goal) * 100), 100);
      const eventLogCount = logCountByEvent.get(event._id.toString()) || 0;
      const activityPercent =
        totalLogs > 0 ? Math.round((eventLogCount / totalLogs) * 100) : 0;

      let status: "on-track" | "behind" | "ahead" | "completed" = "on-track";
      if (sum >= goal) {
        status = "completed";
        completedJapams++;
      } else {
        activeJapams++;
        // Calculate pace-based status
        const subDays = Math.max(
          1,
          Math.ceil(
            (now.getTime() - new Date(sub.subscription_date).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        );
        const currentPace = sum / subDays;
        const requiredPace = (goal - sum) / Math.max(subDays, 1);
        if (currentPace > 0 && requiredPace > 0) {
          const ratio = currentPace / requiredPace;
          if (ratio >= 1.2) status = "ahead";
          else if (ratio < 0.8) status = "behind";
        }
      }

      japamPerformance.push({
        subscriptionId: sub._id.toString(),
        title: event.title,
        progress,
        status,
        activityPercent,
      });

      // Track top performers
      if (!mostActive || eventLogCount > mostActive.count) {
        mostActive = { title: event.title, count: eventLogCount };
      }
      if (
        status !== "completed" &&
        progress > 0 &&
        (!nearestToGoal || progress > nearestToGoal.percent)
      ) {
        nearestToGoal = { title: event.title, percent: progress };
      }
    }

    // Activity trend
    const last30Days: Array<{ date: string; count: number }> = [];
    const dateCountMap = new Map<string, number>();
    for (const d of dailyCountsLast30) {
      dateCountMap.set(d._id, d.count);
    }
    const trendCursor = new Date(last30Start);
    trendCursor.setHours(0, 0, 0, 0);
    let last15Count = 0;
    let prev15Count = 0;
    while (trendCursor <= now) {
      const dateStr = trendCursor.toISOString().split("T")[0];
      const count = dateCountMap.get(dateStr) || 0;
      last30Days.push({ date: dateStr, count });
      if (trendCursor >= last15Start) last15Count += count;
      else prev15Count += count;
      trendCursor.setDate(trendCursor.getDate() + 1);
    }

    const trendPercentChange =
      prev15Count > 0
        ? Math.round(((last15Count - prev15Count) / prev15Count) * 100)
        : last15Count > 0
          ? 100
          : 0;
    const trend: "increasing" | "stable" | "decreasing" =
      trendPercentChange > 10
        ? "increasing"
        : trendPercentChange < -10
          ? "decreasing"
          : "stable";

    // Find longest streak across individual japams
    let longestStreakJapam: { title: string; days: number } | null = null;
    for (const sub of subscriptions) {
      const event = sub.event as any;
      if (!event) continue;

      const subDailyLogs = await Log.aggregate([
        { $match: { user: userObjectId, event: event._id } },
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

      const days = subDailyLogs.map((d: any) => ({
        date: d._id,
        count: d.count,
      }));
      const { longestStreak: ls } = calculateStreaks(days);

      if (!longestStreakJapam || ls > longestStreakJapam.days) {
        longestStreakJapam = { title: event.title, days: ls };
      }
    }

    res.status(200).json({
      aggregateStats: {
        totalLogs,
        totalActiveDays: dailyCountsAll.length,
        totalJapams: subscriptions.length,
        activeJapams,
        completedJapams,
        overallStreak,
      },

      activityTrend: {
        last30Days,
        trend,
        percentChange: trendPercentChange,
      },

      japamPerformance,

      topPerformers: {
        mostActive,
        longestStreak: longestStreakJapam,
        nearestToGoal,
      },
    });
  } catch (error: any) {
    console.error("Overview analytics error:", error);
    res.status(500).json({ message: "Failed to compute overview analytics" });
  }
}
