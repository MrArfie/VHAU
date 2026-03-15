import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, User, Search, ArrowLeft, Mail, Calendar, MapPin, GraduationCap, Award } from "lucide-react";
import { readCredential } from "@/lib/ethereum";

interface Credential {
  title: string;
  type: "diploma" | "certificate";
  institution: string;
  date: string;
  verified: boolean;
}

interface StudentProfile {
  name: string;
  degree: string;
  batch: string;
  email: string;
  dateIssued: string;
  location: string;
  walletAddress: string;
  tokenId: string;
  credentials: Credential[];
}

const mockProfile: StudentProfile = {
  name: "John Doe",
  degree: "BS Computer Science",
  batch: "Batch 2021 — 2025",
  email: "john@ethereum.com",
  dateIssued: "December 01 2025",
  location: "Pampanga, Philippines",
  walletAddress: "0x8d...0cA1a",
  tokenId: "0x65d87",
  credentials: [
    {
      title: "Bachelor of Science in Computer Science",
      type: "diploma",
      institution: "Holy Angel University",
      date: "April 2025",
      verified: true,
    },
    {
      title: "Dean's Lister — Academic Excellence",
      type: "certificate",
      institution: "College of Computing and Information Sciences",
      date: "March 2025",
      verified: true,
    },
    {
      title: "Best Capstone Project — HAU Vault",
      type: "certificate",
      institution: "CCIS Department — Capstone Committee",
      date: "March 2025",
      verified: true,
    },
    {
      title: "Blockchain Development Workshop",
      type: "certificate",
      institution: "HAU — Industry Partners Program",
      date: "November 2024",
      verified: true,
    },
  ],
};

const Credentials = () => {
  const [username, setUsername] = useState("");
  const [course, setCourse] = useState("");
  const [studentId, setStudentId] = useState("");
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const tokenId = BigInt(studentId || "0");
      const onchain = await readCredential(tokenId);

      const chainProfile: StudentProfile = {
        name: onchain.studentName || username || "Student",
        degree: onchain.program || course || "Program",
        batch: "Batch 2021 — 2025",
        email: "onchain@hau.edu", // placeholder – not stored on chain in this contract
        dateIssued: onchain.issuedDate || "On-chain record",
        location: "On-chain",
        walletAddress: "0x…", // would come from your issuance flow
        tokenId: `#${tokenId.toString()}`,
        credentials: [
          {
            title: onchain.credentialTitle || "On-chain Credential",
            type: onchain.credentialType.toLowerCase().includes("diploma") ? "diploma" : "certificate",
            institution: onchain.institution || "Holy Angel University",
            date: onchain.issuedDate || "",
            verified: onchain.active,
          },
        ],
      };

      setProfile(chainProfile);
      setSearched(true);
    } catch (err) {
      console.error(err);
      // Fallback to mock profile so the UI still works
      setError("Unable to reach on-chain credentials. Showing sample data instead.");
      setProfile(mockProfile);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setProfile(null);
    setSearched(false);
    setUsername("");
    setCourse("");
    setStudentId("");
  };

  // Results View — matches Figma exactly
  if (profile && searched) {
    return (
      <div className="bg-background">

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 pb-16">
          {/* Back button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to search
          </button>

          <div className="rounded-3xl border border-border/60 bg-card/70 shadow-sm">
            {/* Profile Section */}
            <div className="flex flex-col items-center text-center px-8 pt-10 pb-8">
              <p className="text-[11px] font-semibold tracking-[0.24em] text-primary uppercase mb-4">
                On‑chain academic profile
              </p>
              {/* Avatar */}
              <div className="w-28 h-28 rounded-full bg-secondary flex items-center justify-center mb-4">
                <User className="w-14 h-14 text-muted-foreground/50" />
              </div>

              {/* Name */}
              <h1 className="text-3xl font-semibold text-foreground leading-tight tracking-tight">
                {profile.name}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                {profile.degree} · {profile.batch}
              </p>

              {/* Contact & details */}
              <div className="mt-5 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="w-3 h-3" />
                  <span>{profile.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>Issued {profile.dateIssued}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{profile.location}</span>
                </div>
              </div>

              {/* Wallet & Token Buttons */}
              <div className="flex items-center gap-3 mt-6">
                <button className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold tracking-wide uppercase">
                  Wallet {profile.walletAddress}
                </button>
                <button className="px-5 py-2 rounded-full bg-destructive text-destructive-foreground text-[11px] font-semibold tracking-wide uppercase">
                  Token {profile.tokenId}
                </button>
              </div>
            </div>

            {/* Yellow Banner */}
            <div className="w-full h-28 rounded-3xl bg-accent mt-6" />

            {/* On-Chain Credentials */}
            <div className="px-6 pt-10 pb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-px bg-foreground" />
                <div>
                  <h2 className="text-base font-semibold text-foreground">On-Chain Credentials</h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Official records anchored to the blockchain and verified by Holy Angel University.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {profile.credentials.map((cred, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-2xl bg-muted/40 px-5 py-4 border border-border/40 shadow-sm"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full border border-border/60 bg-background flex items-center justify-center shrink-0">
                        {cred.type === "diploma" ? (
                          <GraduationCap className="w-4 h-4 text-primary" />
                        ) : (
                          <Award className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground">{cred.title}</p>
                          <Badge
                            className={`text-[10px] px-2 py-0 rounded font-semibold uppercase shrink-0 ${
                              cred.type === "diploma"
                                ? "bg-[hsl(var(--credential-diploma))] text-[hsl(0,0%,100%)]"
                                : "bg-[hsl(var(--credential-certificate))] text-[hsl(0,0%,100%)]"
                            }`}
                          >
                            {cred.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{cred.institution}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className="text-xs text-muted-foreground">{cred.date}</span>
                      {cred.verified && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[hsl(var(--credential-verified))]/10 border border-[hsl(var(--credential-verified))]/20">
                          <CheckCircle className="w-3 h-3 text-[hsl(var(--credential-verified))]" />
                          <span className="text-[10px] font-semibold text-[hsl(var(--credential-verified))] uppercase">
                            Verified
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Search View
  return (
    <div className="bg-background">
      <div className="flex items-center justify-center min-h-[72vh] px-4 pb-16">
        <div className="w-full max-w-2xl rounded-3xl border border-border/60 bg-card/80 px-8 py-8 shadow-sm">
          <header className="mb-6 text-center">
            <p className="text-[11px] font-semibold tracking-[0.24em] text-primary uppercase">
              Credential verification
            </p>
            <h1 className="mt-2 text-xl font-semibold text-foreground">
              Find a student&apos;s record
            </h1>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Enter the details exactly as they appear in the registrar system to locate the student&apos;s on‑chain
              credential profile.
            </p>
          </header>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs text-muted-foreground">
                Full name
              </Label>
              <Input
                id="username"
                placeholder="e.g. John Doe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-10 text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="course" className="text-xs text-muted-foreground">
                  Program / course
                </Label>
                <Input
                  id="course"
                  placeholder="e.g. BS Computer Science"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="studentId" className="text-xs text-muted-foreground">
                  Student ID
                </Label>
                <Input
                  id="studentId"
                  placeholder="e.g. 2021‑000123"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
            </div>
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
            <Button type="submit" className="w-full mt-2 text-sm font-semibold" disabled={loading}>
              {loading ? "Searching…" : "Search credentials"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Credentials;
