const helpTopics = [
  {
    question: "What is BHR?",
    answer:
      "BHR is your company’s HR portal. You use it to complete performance reviews and see what HR needs from you.",
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
      className="relative border-t border-white/5 bg-[#06060f] py-20"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Questions employees often ask
          </h2>
          <p className="mt-3 text-white/50">
            Short answers so you always know what to do next.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {helpTopics.map((topic) => (
            <article
              key={topic.question}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            >
              <h3 className="font-semibold text-white">{topic.question}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/50">
                {topic.answer}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
