import { NextResponse } from "next/server";
import { ROLES } from "@/lib/auth/roles";
import { buildVmoSeedAccounts } from "@/lib/setup/build-vmo-seed";
import { seedUserAccounts } from "@/lib/setup/seed-users";
import { VMO_STAFF_PASSWORD } from "@/lib/setup/vmo-staff";
import { getSupabaseConfigError } from "@/lib/supabase/env";

const DEFAULT_ACCOUNTS = [
  {
    email: "admin@bhr.com",
    password: "bhradmin",
    full_name: "Super Admin",
    role: ROLES.SUPER_ADMIN,
  },
  {
    email: "hr@bhr.com",
    password: "bhradmin",
    full_name: "HR Manager",
    role: ROLES.HR_MANAGER,
  },
];

export async function POST() {
  try {
    const configError = getSupabaseConfigError();
    if (configError) {
      return NextResponse.json({ error: configError }, { status: 500 });
    }

    const vmoAccounts = buildVmoSeedAccounts();

    const adminResult = await seedUserAccounts(DEFAULT_ACCOUNTS);
    const staffResult = await seedUserAccounts(vmoAccounts);

    const managers = vmoAccounts.filter((a) => a.role === ROLES.HR_MANAGER);
    const employees = vmoAccounts.filter((a) => a.role === ROLES.EMPLOYEE);

    return NextResponse.json({
      ok: true,
      admin: {
        created: adminResult.created,
        updated: adminResult.updated,
        accounts: DEFAULT_ACCOUNTS.map((a) => ({
          email: a.email,
          password: a.password,
          role: a.role,
        })),
      },
      vmo_staff: {
        created: staffResult.created,
        updated: staffResult.updated,
        password: VMO_STAFF_PASSWORD,
        total: vmoAccounts.length,
        managers: managers.length,
        employees: employees.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Setup failed. Run supabase/schema.sql first.",
      },
      { status: 500 }
    );
  }
}
