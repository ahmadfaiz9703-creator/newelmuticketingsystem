import { signIn, signUp } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  return (
    <main className="min-h-screen grid md:grid-cols-2">
      <section className="bg-navy-900 text-white p-8 md:p-14 flex flex-col justify-between">
        <p className="font-semibold tracking-tight text-lg">ELMU IT Support</p>
        <div className="py-10">
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight max-w-md">
            Report an IT problem. Track it until it is fixed.
          </h1>
          <p className="mt-4 text-navy-100 max-w-md">
            Sign in with your ELMU email to submit a request and follow its progress.
          </p>
        </div>
        <p className="text-sm text-navy-100/70">Microsoft 365, OpenLearning, Vialing/SKY CMS, network and more.</p>
      </section>

      <section className="flex items-center justify-center p-6 md:p-14 bg-white">
        <form className="w-full max-w-sm space-y-4">
          <h2 className="text-xl font-semibold text-navy-900">Sign in</h2>
          {error && <p role="alert" className="rounded-md bg-red-50 text-red-800 text-sm px-3 py-2">{error}</p>}
          {message && <p role="status" className="rounded-md bg-emerald-50 text-emerald-800 text-sm px-3 py-2">{message}</p>}

          <div>
            <label className="label" htmlFor="email">Email</label>
            <input className="input" id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input className="input" id="password" name="password" type="password" autoComplete="current-password" minLength={8} required />
          </div>
          <button formAction={signIn} className="btn-primary w-full">Sign in</button>

          <div className="pt-4 border-t border-slate-200 space-y-3">
            <p className="text-sm text-slate-600">New here? Enter your name above and create a requester account.</p>
            <div>
              <label className="label" htmlFor="full_name">Full name (new accounts only)</label>
              <input className="input" id="full_name" name="full_name" autoComplete="name" />
            </div>
            <button formAction={signUp} formNoValidate className="btn-secondary w-full">Create account</button>
          </div>
        </form>
      </section>
    </main>
  );
}
