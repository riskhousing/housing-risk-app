// src/pages/ContactPage.tsx
import { useState } from "react";
import { appTheme } from "../styles/themes";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true); // prototype only
  }

  return (
    <div className={appTheme.pageBg}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-6 md:grid-cols-2">
          <div className={`rounded-3xl border ${appTheme.borderSoft} ${appTheme.panelBg} p-6 sm:p-8 ${appTheme.panelRing}`}>
            <h1 className={`text-2xl font-extrabold ${appTheme.textPrimary}`}>Contact Us</h1>
            <p className={`mt-2 text-sm ${appTheme.textMuted}`}>
              Send a message for inquiries, support, or partnership requests. (Prototype form only for now.)
            </p>

            <div className="mt-6 space-y-3 text-sm">
              <div className={`rounded-2xl border ${appTheme.borderSoft} ${appTheme.panelBg} p-4`}>
                <div className={`text-xs font-semibold uppercase tracking-wide ${appTheme.textMuted}`}>Email</div>
                <div className={`mt-1 ${appTheme.textPrimary}`}>support@ridhah.ph</div>
              </div>

              <div className={`rounded-2xl border ${appTheme.borderSoft} ${appTheme.panelBg} p-4`}>
                <div className={`text-xs font-semibold uppercase tracking-wide ${appTheme.textMuted}`}>Office</div>
                <div className={`mt-1 ${appTheme.textPrimary}`}>Cebu City, Philippines</div>
              </div>
            </div>
          </div>

          <div className={`rounded-3xl border ${appTheme.borderSoft} ${appTheme.panelBg} p-6 sm:p-8 ${appTheme.panelRing}`}>
            <h2 className={`text-lg font-semibold ${appTheme.textPrimary}`}>Send a message</h2>

            {sent ? (
              <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                Message sent (prototype). We’ll connect this to email later.
              </div>
            ) : null}

            <form className="mt-4 space-y-4" onSubmit={onSubmit}>
              <label className="block">
                <div className={`mb-1 text-sm font-medium ${appTheme.textPrimary}`}>Name</div>
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-indigo-400/60"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </label>

              <label className="block">
                <div className={`mb-1 text-sm font-medium ${appTheme.textPrimary}`}>Email</div>
                <input
                  type="email"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-indigo-400/60"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                />
              </label>

              <label className="block">
                <div className={`mb-1 text-sm font-medium ${appTheme.textPrimary}`}>Message</div>
                <textarea
                  className="min-h-[120px] w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-indigo-400/60"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help?"
                />
              </label>

              <button type="submit" className={appTheme.buttonPrimary}>
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
