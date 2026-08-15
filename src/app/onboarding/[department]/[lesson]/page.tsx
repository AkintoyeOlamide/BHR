import { notFound } from "next/navigation";
import { OnboardingAppFrame } from "@/components/onboarding/onboarding-app-frame";
import { LessonPlayer } from "@/components/onboarding/lesson-player";
import { getLesson } from "@/lib/onboarding/content";

type PageProps = {
  params: Promise<{ department: string; lesson: string }>;
};

export default async function OnboardingLessonPage({ params }: PageProps) {
  const { department: departmentId, lesson: lessonId } = await params;
  const result = getLesson(departmentId, lessonId);
  if (!result) notFound();

  return (
    <OnboardingAppFrame activeDepartmentId={result.department.id} dense>
      <LessonPlayer department={result.department} lesson={result.lesson} />
    </OnboardingAppFrame>
  );
}
