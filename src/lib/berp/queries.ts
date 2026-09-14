import { createAdminClient } from "@/lib/supabase/admin";
import { BERP_APP_ID } from "./app";

export type BerpClockRow = {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  clock_in_lagos: string;
  clock_out_lagos: string | null;
  site_name: string | null;
  device_id: string | null;
  device_label: string | null;
  device_model: string | null;
  device_os: string | null;
  public_ip: string | null;
  multi_device_priority: boolean;
  full_name: string;
  email: string;
};

export type BerpStaffRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string | null;
  department: string | null;
  job_title: string | null;
  company: string | null;
  joined_year: number | null;
  avatar_url: string | null;
  created_at: string | null;
  live: boolean;
  clock_in: string | null;
  clock_in_lagos: string | null;
  site_name: string | null;
  last_clock_in: string | null;
  last_clock_in_lagos: string | null;
  session_count: number;
};

export type BerpLeaveRow = {
  id: string;
  user_id: string;
  kind: string;
  start_date: string;
  end_date: string;
  note: string;
  status: string;
  full_name: string;
};

export type BerpUpdateRow = {
  id: string;
  user_id: string;
  author_name: string;
  author_role: string;
  title: string;
  body: string;
  created_at: string;
};

export type BerpPushMessageRow = {
  id: string;
  kind: string;
  title: string;
  body: string;
  scheduled_at: string | null;
  recur_time: string | null;
  recur_label: string | null;
  status: string;
  created_at: string;
  sent_at: string | null;
};

export type BerpPushDeliveryRow = {
  id: string;
  message_id: string | null;
  user_id: string;
  device_id: string | null;
  status: string;
  title: string;
  body: string;
  at: string;
  full_name: string;
};

type AuthUser = {
  email: string;
  full_name: string;
};

type ClockSessionRaw = {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  site_name: string | null;
  clock_in_lagos?: string | null;
  clock_out_lagos?: string | null;
  device_id?: string | null;
  device_label?: string | null;
  device_model?: string | null;
  device_os?: string | null;
  public_ip?: string | null;
};

type Person = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string | null;
  department: string | null;
  job_title: string | null;
  company: string | null;
  joined_year: number | null;
  avatar_url: string | null;
  created_at: string | null;
};

async function listAuthUsersById(
  admin: ReturnType<typeof createAdminClient>
) {
  const usersById = new Map<string, AuthUser>();
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data: listed, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) break;
    for (const user of listed.users ?? []) {
      const meta = (user.user_metadata ?? {}) as { full_name?: string };
      usersById.set(user.id, {
        email: (user.email ?? "").trim().toLowerCase(),
        full_name: (meta.full_name ?? "").trim(),
      });
    }
    if ((listed.users ?? []).length < perPage) break;
    page += 1;
  }
  return usersById;
}

function displayName(
  profileName: string | null | undefined,
  auth: AuthUser | undefined,
  email: string
) {
  const fromProfile = profileName?.trim();
  if (fromProfile) return fromProfile;
  if (auth?.full_name) return auth.full_name;
  if (email.includes("@")) return email.split("@")[0];
  return "Staff";
}

async function loadClockSessions(
  admin: ReturnType<typeof createAdminClient>
): Promise<{ rows: ClockSessionRaw[]; error?: string }> {
  const withDevice = await admin
    .from("clock_sessions")
    .select(
      "id, user_id, clock_in, clock_out, clock_in_lagos, clock_out_lagos, site_name, device_id, device_label, device_model, device_os, public_ip"
    )
    .eq("app_id", BERP_APP_ID)
    .order("clock_in", { ascending: false })
    .limit(500);

  if (!withDevice.error) {
    return { rows: (withDevice.data ?? []) as ClockSessionRaw[] };
  }

  const withLagos = await admin
    .from("clock_sessions")
    .select(
      "id, user_id, clock_in, clock_out, clock_in_lagos, clock_out_lagos, site_name"
    )
    .eq("app_id", BERP_APP_ID)
    .order("clock_in", { ascending: false })
    .limit(500);

  if (!withLagos.error) {
    return { rows: (withLagos.data ?? []) as ClockSessionRaw[] };
  }

  const fallback = await admin
    .from("clock_sessions")
    .select("id, user_id, clock_in, clock_out, site_name")
    .eq("app_id", BERP_APP_ID)
    .order("clock_in", { ascending: false })
    .limit(500);

  return {
    rows: (fallback.data ?? []) as ClockSessionRaw[],
    error: fallback.error?.message ?? withLagos.error.message,
  };
}

function multiDevicePriorityByUser(rows: ClockSessionRaw[]) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const devices = new Map<string, Set<string>>();
  for (const row of rows) {
    const deviceId = (row.device_id ?? "").trim();
    if (!deviceId) continue;
    const at = Date.parse(row.clock_in);
    if (Number.isNaN(at) || at < weekAgo) continue;
    if (!devices.has(row.user_id)) devices.set(row.user_id, new Set());
    devices.get(row.user_id)!.add(deviceId);
  }
  const priority = new Set<string>();
  for (const [userId, set] of devices) {
    if (set.size > 3) priority.add(userId);
  }
  return priority;
}

async function resolveBerpPeople(
  admin: ReturnType<typeof createAdminClient>,
  userIds: string[],
  authUsers: Map<string, AuthUser>
): Promise<Map<string, Person>> {
  const people = new Map<string, Person>();
  if (userIds.length === 0) return people;

  const profilesPrimary = await admin
    .from("profiles")
    .select(
      "id, full_name, email, phone, role, department, job_title, company, joined_year, avatar_url, created_at"
    )
    .in("id", userIds);
  const profilesRes = profilesPrimary.error
    ? await admin
        .from("profiles")
        .select("id, full_name, email, department, job_title, role, created_at")
        .in("id", userIds)
    : profilesPrimary;

  const [{ data: profiles }, { data: legacy }] = await Promise.all([
    Promise.resolve(profilesRes),
    admin
      .from("legacy_employee_profiles")
      .select("id, full_name, email, department, job_title, role, created_at")
      .in("id", userIds),
  ]);

  const profileById = new Map(
    (profiles ?? []).map((row) => [row.id as string, row])
  );
  const legacyById = new Map(
    (legacy ?? []).map((row) => [row.id as string, row])
  );

  for (const id of userIds) {
    const profile = profileById.get(id);
    const legacyRow = legacyById.get(id);
    const auth = authUsers.get(id);
    const email = (
      auth?.email ||
      (legacyRow?.email as string | null | undefined) ||
      (profile?.email as string | null | undefined) ||
      ""
    )
      .trim()
      .toLowerCase();

    people.set(id, {
      id,
      full_name: displayName(
        (legacyRow?.full_name as string | null | undefined) ||
          (profile?.full_name as string | null | undefined),
        auth,
        email
      ),
      email,
      phone:
        profile && "phone" in profile
          ? ((profile.phone as string | null | undefined) ?? null)
          : null,
      role:
        (legacyRow?.role as string | null | undefined) ??
        (profile?.role as string | null | undefined) ??
        null,
      department:
        (legacyRow?.department as string | null | undefined) ??
        (profile?.department as string | null | undefined) ??
        null,
      job_title:
        (legacyRow?.job_title as string | null | undefined) ??
        (profile?.job_title as string | null | undefined) ??
        null,
      company:
        profile && "company" in profile
          ? ((profile.company as string | null | undefined) ?? null)
          : null,
      joined_year:
        profile &&
        "joined_year" in profile &&
        typeof profile.joined_year === "number"
          ? profile.joined_year
          : null,
      avatar_url:
        profile && "avatar_url" in profile
          ? ((profile.avatar_url as string | null | undefined) ?? null)
          : null,
      created_at:
        (profile?.created_at as string | null | undefined) ??
        (legacyRow?.created_at as string | null | undefined) ??
        null,
    });
  }

  return people;
}

/** Only people who have BERP rows (app_id = berp). */
export async function fetchBerpOverview() {
  try {
    const admin = createAdminClient();

    const [clockResult, leave, updates, pushMessages, pushDeliveries, authUsers] =
      await Promise.all([
      loadClockSessions(admin),
      admin
        .from("leave_requests")
        .select("id, user_id, kind, start_date, end_date, note, status")
        .eq("app_id", BERP_APP_ID)
        .order("start_date", { ascending: false })
        .limit(100),
      admin
        .from("staff_updates")
        .select(
          "id, user_id, author_name, author_role, title, body, created_at"
        )
        .eq("app_id", BERP_APP_ID)
        .order("created_at", { ascending: false })
        .limit(100),
      admin
        .from("berp_push_messages")
        .select(
          "id, kind, title, body, scheduled_at, recur_time, recur_label, status, created_at, sent_at"
        )
        .eq("app_id", BERP_APP_ID)
        .order("created_at", { ascending: false })
        .limit(80),
      admin
        .from("berp_push_deliveries")
        .select(
          "id, message_id, user_id, device_id, status, title, body, at"
        )
        .eq("app_id", BERP_APP_ID)
        .order("at", { ascending: false })
        .limit(80),
      listAuthUsersById(admin),
    ]);

    const berpUserIds = [
      ...new Set(
        [
          ...clockResult.rows.map((row) => row.user_id),
          ...(leave.data ?? []).map((row) => row.user_id as string),
          ...(updates.data ?? []).map((row) => row.user_id as string),
          ...(pushDeliveries.data ?? []).map((row) => row.user_id as string),
        ].filter(Boolean)
      ),
    ];

    const people = await resolveBerpPeople(admin, berpUserIds, authUsers);
    const nameOf = (userId: string) => people.get(userId)?.full_name ?? "Staff";
    const emailOf = (userId: string) => people.get(userId)?.email ?? "";

    const priorityUsers = multiDevicePriorityByUser(clockResult.rows);

    const clockRows: BerpClockRow[] = clockResult.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      clock_in: row.clock_in,
      clock_out: row.clock_out,
      clock_in_lagos:
        typeof row.clock_in_lagos === "string" ? row.clock_in_lagos : "",
      clock_out_lagos:
        typeof row.clock_out_lagos === "string" ? row.clock_out_lagos : null,
      site_name: row.site_name,
      device_id: row.device_id ?? null,
      device_label: row.device_label ?? null,
      device_model: row.device_model ?? null,
      device_os: row.device_os ?? null,
      public_ip: row.public_ip ?? null,
      multi_device_priority: priorityUsers.has(row.user_id),
      full_name: nameOf(row.user_id),
      email: emailOf(row.user_id),
    }));

    const openByUser = new Map<string, BerpClockRow>();
    const latestByUser = new Map<string, BerpClockRow>();
    const sessionCountByUser = new Map<string, number>();

    for (const row of clockRows) {
      sessionCountByUser.set(
        row.user_id,
        (sessionCountByUser.get(row.user_id) ?? 0) + 1
      );
      if (!latestByUser.has(row.user_id)) {
        latestByUser.set(row.user_id, row);
      }
      if (row.clock_out) continue;
      const existing = openByUser.get(row.user_id);
      if (!existing || row.clock_in > existing.clock_in) {
        openByUser.set(row.user_id, row);
      }
    }

    const staff: BerpStaffRow[] = berpUserIds
      .map((id) => {
        const person = people.get(id) ?? {
          id,
          full_name: "Staff",
          email: "",
          phone: null,
          role: null,
          department: null,
          job_title: null,
          company: null,
          joined_year: null,
          avatar_url: null,
          created_at: null,
        };
        const open = openByUser.get(id);
        const latest = latestByUser.get(id);
        return {
          ...person,
          live: Boolean(open),
          clock_in: open?.clock_in ?? null,
          clock_in_lagos: open?.clock_in_lagos ?? null,
          site_name: open?.site_name ?? latest?.site_name ?? null,
          last_clock_in: latest?.clock_in ?? null,
          last_clock_in_lagos: latest?.clock_in_lagos ?? null,
          session_count: sessionCountByUser.get(id) ?? 0,
        };
      })
      .sort((a, b) => {
        if (a.live !== b.live) return a.live ? -1 : 1;
        return a.full_name.localeCompare(b.full_name);
      });

    const live = [...openByUser.values()].sort((a, b) =>
      b.clock_in.localeCompare(a.clock_in)
    );

    const leaveRows: BerpLeaveRow[] = (leave.data ?? []).map((row) => ({
      id: row.id,
      user_id: row.user_id,
      kind: row.kind,
      start_date: row.start_date,
      end_date: row.end_date,
      note: row.note,
      status: row.status,
      full_name: nameOf(row.user_id),
    }));

    const pushMessageRows = (pushMessages.data ??
      []) as BerpPushMessageRow[];
    const pushDeliveryRows: BerpPushDeliveryRow[] = (
      pushDeliveries.data ?? []
    ).map((row) => ({
      id: row.id as string,
      message_id: (row.message_id as string | null) ?? null,
      user_id: row.user_id as string,
      device_id: (row.device_id as string | null) ?? null,
      status: row.status as string,
      title: (row.title as string) ?? "",
      body: (row.body as string) ?? "",
      at: row.at as string,
      full_name: nameOf(row.user_id as string),
    }));

    return {
      live,
      staff,
      clock: clockRows,
      leave: leaveRows,
      updates: (updates.data ?? []) as BerpUpdateRow[],
      pushMessages: pushMessageRows,
      pushDeliveries: pushDeliveryRows,
      errors: [
        clockResult.error,
        leave.error?.message,
        updates.error?.message,
        pushMessages.error?.message,
        pushDeliveries.error?.message,
      ]
        .filter(Boolean)
        .join(" "),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load BERP rows.";
    return {
      live: [],
      staff: [],
      clock: [],
      leave: [],
      updates: [],
      pushMessages: [],
      pushDeliveries: [],
      errors: message,
    };
  }
}
