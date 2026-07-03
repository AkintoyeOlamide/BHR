import { createAdminClient } from "@/lib/supabase/admin";

export type SeedUserAccount = {
  email: string;
  password: string;
  full_name: string;
  role: string;
  department?: string;
  job_title?: string;
};

async function ensureProfile(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  account: SeedUserAccount
) {
  await admin.from("profiles").upsert({
    id: userId,
    email: account.email.toLowerCase(),
    full_name: account.full_name,
    role: account.role,
    department: account.department ?? null,
    job_title: account.job_title ?? null,
  });
}

export async function seedUserAccounts(accounts: SeedUserAccount[]) {
  const admin = createAdminClient();
  const usersByEmail = new Map<string, { id: string }>();

  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error: listError } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (listError) {
      throw new Error(listError.message);
    }

    for (const user of data.users ?? []) {
      if (user.email) {
        usersByEmail.set(user.email.toLowerCase(), { id: user.id });
      }
    }

    if ((data.users ?? []).length < perPage) break;
    page += 1;
  }

  const created: string[] = [];
  const updated: string[] = [];

  for (const account of accounts) {
    const email = account.email.toLowerCase();
    const found = usersByEmail.get(email);

    if (found) {
      const { error } = await admin.auth.admin.updateUserById(found.id, {
        password: account.password,
        email_confirm: true,
        user_metadata: {
          full_name: account.full_name,
          role: account.role,
        },
      });

      if (error) {
        throw new Error(`${email}: ${error.message}`);
      }

      await ensureProfile(admin, found.id, { ...account, email });
      updated.push(email);
      continue;
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: account.password,
      email_confirm: true,
      user_metadata: {
        full_name: account.full_name,
        role: account.role,
      },
    });

    if (error || !data.user) {
      throw new Error(error?.message ?? `Failed to create ${email}`);
    }

    await ensureProfile(admin, data.user.id, { ...account, email });
    created.push(email);
  }

  return { created, updated };
}
