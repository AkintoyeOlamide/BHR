import { createAdminClient } from "@/lib/supabase/admin";
import { generatePassword } from "@/lib/auth/generate-password";

export type EnsureUserCredentialsInput = {
  email: string;
  full_name: string;
  role: string;
  department?: string | null;
  job_title?: string | null;
};

export type UserCredentials = {
  email: string;
  password: string;
  created: boolean;
};

async function findAuthUserIdByEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string
) {
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(error.message);
    }

    const found = (data.users ?? []).find(
      (user) => user.email?.toLowerCase() === email
    );
    if (found) return found.id;

    if ((data.users ?? []).length < perPage) return null;
    page += 1;
  }
}

export async function ensureUserCredentials(
  input: EnsureUserCredentialsInput
): Promise<UserCredentials> {
  const admin = createAdminClient();
  const email = input.email.trim().toLowerCase();
  const password = generatePassword();
  const existingUserId = await findAuthUserIdByEmail(admin, email);

  if (existingUserId) {
    const { error } = await admin.auth.admin.updateUserById(existingUserId, {
      password,
      email_confirm: true,
      user_metadata: {
        full_name: input.full_name,
        role: input.role,
      },
    });

    if (error) {
      throw new Error(`${email}: ${error.message}`);
    }

    await admin.from("profiles").upsert({
      id: existingUserId,
      email,
      full_name: input.full_name,
      role: input.role,
      department: input.department ?? null,
      job_title: input.job_title ?? null,
    });

    return { email, password, created: false };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: input.full_name,
      role: input.role,
    },
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? `Could not create account for ${email}`);
  }

  await admin.from("profiles").upsert({
    id: data.user.id,
    email,
    full_name: input.full_name,
    role: input.role,
    department: input.department ?? null,
    job_title: input.job_title ?? null,
  });

  return { email, password, created: true };
}
