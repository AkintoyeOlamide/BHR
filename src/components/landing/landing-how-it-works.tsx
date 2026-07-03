const helpTopics = [
  {
    question: "What is Bitachon HR?",
    answer:
      "Bitachon HR is your company’s HR portal. You use it to complete performance reviews and see what HR needs from you.",
  },
  {
    question: "When do I need to sign in?",
    answer:
      "Sign in when your manager or HR tells you a review is open, or when you want to check your progress.",
  },
  {
    question: "I forgot my password",
    answer:
      "Ask your HR team to reset it for you. They can send you a new link to get back in.",
  },
];

export function LandingHowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-white py-14 sm:py-16"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-8">
        <div className="max-w-xl">
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
            Questions employees often ask
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Short answers so you always know what to do next.
          </p>
        </div>

        <div className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-6">
          {helpTopics.map((topic) => (
            <article
              key={topic.question}
              className="rounded-xl bg-slate-50 p-5"
            >
              <h3 className="text-sm font-medium text-slate-900">
                {topic.question}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                {topic.answer}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
