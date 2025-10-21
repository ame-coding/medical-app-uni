// express-serv/scheduler.js
import schedule from "node-schedule";
import db from "../dbfiles/db.js";
import sendExpoPush from "./sendExpoPush.js";

/**
 * sendNotification(reminder)
 * - tries reminder.notification_id first (token stored on reminder)
 * - otherwise tries user's push_token (users.push_token)
 * - updates reminders.last_sent_at on success
 */
async function sendNotification(reminder) {
  try {
    let token = reminder.notification_id || null;

    // if no token on reminder, try to fetch user's push_token
    if (!token && reminder.user_id) {
      const u = await db.get("SELECT push_token FROM users WHERE id = ?", [
        reminder.user_id,
      ]);
      token = u?.push_token || null;
    }

    if (!token) {
      console.log("No push token for reminder", reminder.id);
      return { ok: false, error: "no-token" };
    }

    const title = reminder.title || "Reminder";
    const body = reminder.description || "";

    const r = await sendExpoPush(token, title, body, {
      reminderId: String(reminder.id),
    });

    if (r.ok) {
      await db.run(
        "UPDATE reminders SET last_sent_at = CURRENT_TIMESTAMP WHERE id = ?",
        [reminder.id]
      );
      console.log("Notification sent for reminder", reminder.id);
      return { ok: true, resp: r.resp };
    } else {
      console.warn("Push failed for reminder", reminder.id, r.error);
      // If the error indicates invalid/expo token, you may want to clear it:
      // await db.run("UPDATE users SET push_token = NULL WHERE id = ?", [reminder.user_id]);
      return { ok: false, error: r.error };
    }
  } catch (err) {
    console.error("sendNotification error:", err);
    return { ok: false, error: err };
  }
}

/**
 * scheduleReminder(reminder)
 * Supports one-off, 'daily', 'weekly', or cron expression (string).
 * reminder.date_time must be an ISO string.
 */
function scheduleReminder(reminder) {
  const jobName = `reminder_${reminder.id}`;
  if (schedule.scheduledJobs[jobName]) {
    schedule.scheduledJobs[jobName].cancel();
  }

  const runDate = new Date(reminder.date_time);
  if (isNaN(runDate.getTime())) {
    console.warn(
      "Invalid date_time for reminder",
      reminder.id,
      reminder.date_time
    );
    return;
  }

  if (!reminder.repeat_interval) {
    schedule.scheduleJob(jobName, runDate, async () => {
      await sendNotification(reminder);
    });
    return;
  }

  if (reminder.repeat_interval === "daily") {
    const rule = new schedule.RecurrenceRule();
    rule.hour = runDate.getUTCHours();
    rule.minute = runDate.getUTCMinutes();
    rule.tz = "UTC";
    schedule.scheduleJob(jobName, rule, () => sendNotification(reminder));
    return;
  }

  if (reminder.repeat_interval === "weekly") {
    const rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = runDate.getUTCDay();
    rule.hour = runDate.getUTCHours();
    rule.minute = runDate.getUTCMinutes();
    rule.tz = "UTC";
    schedule.scheduleJob(jobName, rule, () => sendNotification(reminder));
    return;
  }

  // try to treat repeat_interval as cron expression
  try {
    schedule.scheduleJob(jobName, reminder.repeat_interval, () =>
      sendNotification(reminder)
    );
  } catch (e) {
    console.error(
      "Invalid repeat_interval for reminder",
      reminder.id,
      e.message
    );
  }
}

/**
 * init(db) - schedule all active reminders on server start.
 */
async function init(dbInstance) {
  const rows = await (dbInstance || db).all(
    `SELECT * FROM reminders WHERE is_active = 1`
  );
  for (const r of rows) scheduleReminder(r);
  console.log("Scheduler initialized, scheduled", rows.length, "reminders");
}

export default { init, scheduleReminder, sendNotification };
