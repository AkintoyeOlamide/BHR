import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BERP Privacy Policy | Bitachon Enterprise",
  description:
    "Privacy policy for the BERP staff mobile application used by Bitachon Enterprise employees.",
};

export default function BerpPrivacyPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-12 text-stone-800">
      <article className="mx-auto max-w-2xl space-y-6 rounded-2xl bg-white p-6 shadow-sm sm:p-10">
        <header className="space-y-2 border-b border-stone-100 pb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            Bitachon Enterprise
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
            BERP Privacy Policy
          </h1>
          <p className="text-sm text-stone-500">
            Last updated: 7 September 2026
          </p>
        </header>

        <section className="space-y-3 text-sm leading-relaxed text-stone-700">
          <p>
            BERP (Bitachon Enterprise Resource Portal) is an internal staff
            application operated by Bitachon Enterprise for employees. This
            policy explains what information the mobile app collects and how it
            is used.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-stone-900">
            Information we collect
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-stone-700">
            <li>
              <strong>Account details:</strong> name, email address, and
              password (handled securely via our authentication provider).
            </li>
            <li>
              <strong>Staff profile:</strong> company, department, job title,
              year joined, and optional profile photo.
            </li>
            <li>
              <strong>Attendance:</strong> clock-in and clock-out times, and the
              approved workplace site used for clock-in.
            </li>
            <li>
              <strong>Location:</strong> precise location only when you clock
              in, to confirm you are at an approved workplace. Location is not
              tracked in the background for other purposes.
            </li>
            <li>
              <strong>Device details:</strong> device label/model, operating
              system, a locally generated device identifier, and public IP
              address associated with clock-in events for security monitoring.
            </li>
            <li>
              <strong>Workplace records:</strong> leave requests, team updates
              you post, and appraisal information available to you.
            </li>
            <li>
              <strong>Notifications:</strong> local reminder preferences and
              delivery status for staff alerts scheduled by administrators.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-stone-900">
            How we use information
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-stone-700">
            <li>Provide staff clock-in, leave, updates, and appraisal features.</li>
            <li>Confirm attendance at approved workplaces.</li>
            <li>
              Help HR and authorised managers operate Bitachon Enterprise
              workforce tools.
            </li>
            <li>
              Detect unusual multi-device clock activity and protect workplace
              systems.
            </li>
            <li>Send staff reminders and operational notifications.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-stone-900">
            Sharing
          </h2>
          <p className="text-sm leading-relaxed text-stone-700">
            Staff data is shared only with authorised Bitachon Enterprise
            administrators and managers through our internal systems, and with
            infrastructure providers that host authentication, database, and
            storage services for us. We do not sell personal information.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-stone-900">
            Retention
          </h2>
          <p className="text-sm leading-relaxed text-stone-700">
            We retain account, attendance, leave, and related workplace records
            for as long as needed for employment and operational purposes, or as
            required by applicable law and company policy.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-stone-900">
            Your choices
          </h2>
          <p className="text-sm leading-relaxed text-stone-700">
            You may update profile details in the app, control notification
            preferences where available, and contact your HR administrator to
            request account or data corrections. Location and camera access can
            also be controlled in your device settings; denying location will
            prevent geofenced clock-in.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-stone-900">
            Children
          </h2>
          <p className="text-sm leading-relaxed text-stone-700">
            BERP is intended for Bitachon Enterprise staff only and is not
            directed to children.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-stone-900">
            Contact
          </h2>
          <p className="text-sm leading-relaxed text-stone-700">
            For privacy questions about BERP, contact Bitachon Enterprise HR /
            IT through your usual internal channels, or email the address
            published in the Google Play listing for this app.
          </p>
        </section>
      </article>
    </main>
  );
}
