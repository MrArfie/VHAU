import { Link } from "react-router-dom";
import { Shield, Globe, Zap, Lock, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  { value: "400+", label: "On‑chain credentials" },
  { value: "600+", label: "Graduates verified" },
  { value: "30+", label: "Partner institutions" },
];

const features = [
  {
    icon: Shield,
    title: "Tamper‑proof records",
    description: "Diplomas are issued as cryptographically secured tokens, eliminating document fraud and manual checks.",
  },
  {
    icon: Globe,
    title: "Decentralized by design",
    description: "Records are anchored on public blockchain infrastructure, removing single‑point institutional dependency.",
  },
  {
    icon: Zap,
    title: "Instant verification",
    description: "Employers and registrars can confirm authenticity in seconds using a simple credential lookup.",
  },
  {
    icon: Lock,
    title: "Non‑transferable identity",
    description: "Each credential is bound to a verified wallet, ensuring ownership cannot be transferred or resold.",
  },
];

const assurancePoints = [
  "Designed for registrars, employers, and accreditation bodies.",
  "Aligned with emerging standards for verifiable credentials.",
  "Auditable issuance trail for every credential lifecycle event.",
];

const Home = () => {
  return (
    <div className="bg-background">
      <section className="px-8 sm:px-12 pt-10 pb-20 mx-auto max-w-7xl lg:grid lg:grid-cols-[minmax(0,3.2fr)_minmax(0,2.2fr)] lg:gap-10">
        {/* Hero + narrative */}
        <section className="max-w-3xl">
          <p className="text-[11px] font-semibold tracking-[0.28em] text-primary uppercase">
            Holy Angel University · Thesis Project
          </p>
          <p className="mt-2 text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            HAU Vault — Decentralized Academic Credentialing
          </p>

          <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight text-foreground">
            Professional, verifiable
            <br />
            <span className="text-primary">academic credentials on‑chain</span>
          </h1>

          <p className="mt-6 text-sm sm:text-base text-muted-foreground leading-relaxed">
            This system demonstrates a secure, institution‑grade platform for issuing and verifying academic records on the
            Ethereum blockchain. Graduates receive soulbound (non‑transferable) credentials that are globally portable,
            instantly verifiable, and resilient to loss or tampering — aligned with research on verifiable credentials.
          </p>

          {/* CTA */}
          <div className="mt-8">
            <Button asChild size="lg" className="gap-2 font-semibold">
              <Link to="/credentials">
                Verify credentials
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-10 mt-10">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Assurance list */}
          <div className="mt-10 space-y-3">
            {assurancePoints.map((point) => (
              <div key={point} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                <p className="text-xs sm:text-sm text-muted-foreground">{point}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Feature grid */}
        <section className="mt-14 lg:mt-0">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px w-10 bg-primary" />
            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              Platform capabilities
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-lg border border-border/60 bg-card/60 px-4 py-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <feature.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{feature.title}</h3>
                </div>
                <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
};

export default Home;
