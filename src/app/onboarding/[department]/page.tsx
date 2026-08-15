import { notFound, redirect } from "next/navigation";
import {
  getDepartment,
  getFirstLessonPath,
} from "@/lib/onboarding/content";

type PageProps = {
  params: Promise<{ department: string }>;
};

export default async function OnboardingDepartmentPage({ params }: PageProps) {
  const { department: departmentId } = await params;
  const department = getDepartment(departmentId);
  if (!department) notFound();

  redirect(getFirstLessonPath(department.id));
}
