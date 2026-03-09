/**
 * notifications.ts
 *
 * Helpers para criar, listar e enviar notificações:
 * - In-app (banco de dados)
 * - Web Push (celular/desktop)
 * - Email (via owner notification)
 */

import webpush from "web-push";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import {
  InsertNotification,
  Notification,
  notifications,
  pushSubscriptions,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { notifyOwner } from "./_core/notification";

// ─── VAPID Setup ──────────────────────────────────────────────────────────────

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return;
  if (!ENV.vapidPublicKey || !ENV.vapidPrivateKey) return;
  webpush.setVapidDetails(
    "mailto:financas@app.com",
    ENV.vapidPublicKey,
    ENV.vapidPrivateKey
  );
  vapidConfigured = true;
}

// ─── In-App Notifications ─────────────────────────────────────────────────────

export async function createNotification(
  data: Omit<InsertNotification, "id" | "createdAt">
): Promise<Notification | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(notifications).values(data);
  const id = (result as any)[0]?.insertId ?? (result as any).insertId;
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getNotificationsForUser(
  userId: number,
  limit = 50
): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function countUnreadNotifications(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return rows.length;
}

export async function markNotificationRead(
  id: number,
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}

export async function deleteNotification(
  id: number,
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function deleteAllNotifications(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(notifications).where(eq(notifications.userId, userId));
}

// ─── Push Subscriptions ───────────────────────────────────────────────────────

export async function savePushSubscription(
  userId: number,
  endpoint: string,
  p256dh: string,
  auth: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  // Remove existing subscription with same endpoint to avoid duplicates
  await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));
  await db.insert(pushSubscriptions).values({ userId, endpoint, p256dh, auth });
}

export async function removePushSubscription(
  userId: number,
  endpoint: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));
}

export async function getPushSubscriptionsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));
}

// ─── Send Push ────────────────────────────────────────────────────────────────

export async function sendPushToUser(
  userId: number,
  title: string,
  body: string,
  url?: string
): Promise<void> {
  ensureVapid();
  if (!vapidConfigured) return;

  const subs = await getPushSubscriptionsForUser(userId);
  const db = await getDb();

  const payload = JSON.stringify({ title, body, url: url ?? "/" });

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
    } catch (err: any) {
      // Remove expired/invalid subscriptions (410 Gone)
      if (err?.statusCode === 410 && db) {
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.id, sub.id));
      }
    }
  }
}

// ─── Full Notification (in-app + push + email) ────────────────────────────────

export type NotificationType = "alert" | "goal" | "recurring" | "summary" | "reminder" | "info";

export async function notify(params: {
  userId: number;
  title: string;
  body: string;
  type: NotificationType;
  link?: string;
  sendPush?: boolean;
  sendEmail?: boolean;
}): Promise<void> {
  const { userId, title, body, type, link, sendPush = true, sendEmail = false } = params;

  // 1. Save in-app notification
  await createNotification({ userId, title, body, type, link: link ?? null, isRead: false });

  // 2. Send push notification
  if (sendPush) {
    await sendPushToUser(userId, title, body, link);
  }

  // 3. Send email via owner notification (only for owner/admin)
  if (sendEmail) {
    try {
      await notifyOwner({ title, content: `${body}${link ? `\n\nAcesse: ${link}` : ""}` });
    } catch {
      // Non-critical, ignore email failures
    }
  }
}
