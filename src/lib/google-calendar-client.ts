import { google } from "googleapis";
import type { GoogleAccount } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { BusyBlock } from "@/lib/availability";
import { clampBusyToDay } from "@/lib/availability";
import { getBusinessTimeZone } from "@/lib/booking";
import { endOfLocalDay, startOfLocalDay } from "@/lib/time-utils";

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET son requeridos");
  }

  return new google.auth.OAuth2(clientId, clientSecret);
}

function bindTokenRefresh(googleAccount: GoogleAccount, oauth2: InstanceType<typeof google.auth.OAuth2>) {
  oauth2.setCredentials({
    access_token: googleAccount.accessToken,
    refresh_token: googleAccount.refreshToken,
    expiry_date: Number(googleAccount.expiryDate),
  });

  oauth2.on("tokens", async (tokens) => {
    if (!tokens.access_token) return;

    await prisma.googleAccount.update({
      where: { id: googleAccount.id },
      data: {
        accessToken: tokens.access_token,
        expiryDate: BigInt(
          tokens.expiry_date ?? Date.now() + 55 * 60 * 1000,
        ),
        ...(tokens.refresh_token
          ? { refreshToken: tokens.refresh_token }
          : {}),
      },
    });
  });

  return google.calendar({ version: "v3", auth: oauth2 });
}

export async function fetchGoogleBusyBlocks(
  googleAccount: GoogleAccount,
  date: Date,
): Promise<BusyBlock[]> {
  const oauth2 = getOAuth2Client();
  const calendar = bindTokenRefresh(googleAccount, oauth2);
  const dayStart = startOfLocalDay(date);
  const dayEnd = endOfLocalDay(date);

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: dayStart.toISOString(),
    timeMax: dayEnd.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  const busy: BusyBlock[] = [];

  for (const event of response.data.items ?? []) {
    if (event.status === "cancelled") continue;

    let busyStart: Date | null = null;
    let busyEnd: Date | null = null;

    if (event.start?.dateTime && event.end?.dateTime) {
      busyStart = new Date(event.start.dateTime);
      busyEnd = new Date(event.end.dateTime);
    } else if (event.start?.date && event.end?.date) {
      busyStart = new Date(event.start.date);
      busyEnd = new Date(event.end.date);
    }

    if (!busyStart || !busyEnd) continue;

    const interval = clampBusyToDay(busyStart, busyEnd, dayStart, dayEnd);
    if (interval) busy.push(interval);
  }

  return busy;
}

export type CreateCalendarEventParams = {
  summary: string;
  description: string;
  startTime: Date;
  endTime: Date;
  attendeeEmail: string;
};

function toLocalDateTimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

export async function createGoogleCalendarEvent(
  googleAccount: GoogleAccount,
  params: CreateCalendarEventParams,
): Promise<string> {
  const oauth2 = getOAuth2Client();
  const calendar = bindTokenRefresh(googleAccount, oauth2);
  const timeZone = getBusinessTimeZone();

  const response = await calendar.events.insert({
    calendarId: "primary",
    sendUpdates: "all",
    requestBody: {
      summary: params.summary,
      description: params.description,
      start: {
        dateTime: toLocalDateTimeString(params.startTime),
        timeZone,
      },
      end: {
        dateTime: toLocalDateTimeString(params.endTime),
        timeZone,
      },
      attendees: [{ email: params.attendeeEmail }],
    },
  });

  const eventId = response.data.id;
  if (!eventId) {
    throw new Error("Google Calendar no devolvió ID del evento");
  }

  return eventId;
}

export async function deleteGoogleCalendarEvent(
  googleAccount: GoogleAccount,
  eventId: string,
): Promise<void> {
  const oauth2 = getOAuth2Client();
  const calendar = bindTokenRefresh(googleAccount, oauth2);

  await calendar.events.delete({
    calendarId: "primary",
    eventId,
    sendUpdates: "all",
  });
}
