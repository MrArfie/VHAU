import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getConnectedAccount, issueCredential, type IssueCredentialData } from "@/lib/ethereum";
import { Wallet, CheckCircle, ArrowRight } from "lucide-react";

/** Credential titles and their specializations/programs (for dropdowns). */
const CREDENTIAL_TITLE_TO_PROGRAMS: Record<string, string[]> = {
  "Bachelor of Science in Computer Science": [
    "Web Development",
    "Cybersecurity",
    "Data Science",
    "Mobile Development",
    "Software Engineering",
    "Artificial Intelligence",
    "Game Development",
    "Network Administration",
  ],
  "Bachelor of Science in Information Technology": [
    "Web Development",
    "Cybersecurity",
    "Data Science",
    "Network Administration",
    "Systems Administration",
    "Cloud Computing",
  ],
  "Bachelor of Science in Information Systems": [
    "Business Analytics",
    "Enterprise Systems",
    "Web Development",
    "Data Science",
  ],
  "Bachelor of Science in Electronics Engineering": [
    "Embedded Systems",
    "Communications",
    "Power Systems",
  ],
  "Bachelor of Science in Computer Engineering": [
    "Hardware Design",
    "Embedded Systems",
    "Network Systems",
  ],
  "Bachelor of Arts in Communication": [
    "Journalism",
    "Digital Media",
    "Public Relations",
  ],
  "Bachelor of Elementary Education": ["General Education", "Early Childhood", "Special Education"],
  "Bachelor of Secondary Education": ["General Education", "Math", "Science", "English", "Filipino"],
  "Dean's Lister — Academic Excellence": ["Dean's Lister"],
  "Best Capstone Project": ["Capstone Award"],
  "Blockchain Development Workshop": ["Blockchain", "Web3"],
  "Other Diploma": ["Other"],
  "Other Certificate": ["Other"],
};

const CREDENTIAL_TITLES = Object.keys(CREDENTIAL_TITLE_TO_PROGRAMS);

const defaultData: IssueCredentialData = {
  studentName: "",
  program: "",
  institution: "Holy Angel University",
  credentialTitle: "",
  credentialType: "Diploma",
  issuedDate: "",
  metadataURI: "",
};

const IssueCredential = () => {
  const [form, setForm] = useState<IssueCredentialData>(defaultData);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuedTokenId, setIssuedTokenId] = useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);
    try {
      const addr = await getConnectedAccount();
      setWalletAddress(addr);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect wallet");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIssuedTokenId(null);

    const to = recipientAddress.trim();
    if (!to.startsWith("0x") || to.length !== 42) {
      setError("Enter a valid recipient wallet address (0x + 40 hex characters).");
      return;
    }
    if (!form.studentName.trim()) {
      setError("Enter the student name.");
      return;
    }
    if (!form.credentialTitle) {
      setError("Select a credential title.");
      return;
    }
    if (!form.program) {
      setError("Select a program/specialization.");
      return;
    }
    if (!form.institution.trim()) {
      setError("Enter the institution.");
      return;
    }
    if (!form.issuedDate.trim()) {
      setError("Enter the issued date.");
      return;
    }

    setLoading(true);
    try {
      const tokenId = await issueCredential(to as `0x${string}`, form);
      setIssuedTokenId(tokenId.toString());
      setForm(defaultData);
      setRecipientAddress("");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Transaction failed";
      setError(message);
      console.error("Issue credential error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-2xl px-4 py-10 pb-16 sm:px-6">
        <div className="rounded-3xl border border-border/60 bg-card/80 px-6 py-8 shadow-sm sm:px-8">
          <header className="mb-6">
            <p className="text-[11px] font-semibold tracking-[0.24em] text-primary uppercase">
              Add credential
            </p>
            <h1 className="mt-2 text-xl font-semibold text-foreground">
              Issue on-chain credential
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Connect the contract owner wallet on Sepolia. You need Sepolia ETH for gas. Only the contract owner can issue credentials.
            </p>
          </header>

          {!walletAddress ? (
            <div className="space-y-4">
              <Button type="button" onClick={handleConnect} className="gap-2">
                <Wallet className="h-4 w-4" />
                Connect wallet
              </Button>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          ) : (
            <>
              <p className="mb-4 text-xs text-muted-foreground">
                Connected: <span className="font-mono text-foreground">{walletAddress.slice(0, 10)}…{walletAddress.slice(-8)}</span>
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Recipient wallet address</Label>
                  <Input
                    placeholder="0x..."
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Student name</Label>
                  <Input
                    placeholder="e.g. Juan Dela Cruz"
                    value={form.studentName}
                    onChange={(e) => setForm((f) => ({ ...f, studentName: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Credential title</Label>
                  <Select
                    value={form.credentialTitle || undefined}
                    onValueChange={(value) => {
                      const programs = CREDENTIAL_TITLE_TO_PROGRAMS[value] ?? [];
                      setForm((f) => ({
                        ...f,
                        credentialTitle: value,
                        program: programs[0] ?? "",
                      }));
                    }}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select credential title" />
                    </SelectTrigger>
                    <SelectContent>
                      {CREDENTIAL_TITLES.map((title) => (
                        <SelectItem key={title} value={title} className="text-sm">
                          {title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Program</Label>
                  <Select
                    value={form.program || undefined}
                    onValueChange={(value) => setForm((f) => ({ ...f, program: value }))}
                    disabled={!form.credentialTitle}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder={form.credentialTitle ? "Select program" : "Select credential title first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {(CREDENTIAL_TITLE_TO_PROGRAMS[form.credentialTitle] ?? []).map((program) => (
                        <SelectItem key={program} value={program} className="text-sm">
                          {program}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Credential type</Label>
                  <Select
                    value={form.credentialType}
                    onValueChange={(value) => setForm((f) => ({ ...f, credentialType: value }))}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Diploma" className="text-sm">Diploma</SelectItem>
                      <SelectItem value="Certificate" className="text-sm">Certificate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Institution</Label>
                  <Input
                    placeholder="Holy Angel University"
                    value={form.institution}
                    onChange={(e) => setForm((f) => ({ ...f, institution: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Issued date</Label>
                    <Input
                      placeholder="e.g. April 2025"
                      value={form.issuedDate}
                      onChange={(e) => setForm((f) => ({ ...f, issuedDate: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Metadata URI (optional)</Label>
                    <Input
                      placeholder="https:// or ipfs://"
                      value={form.metadataURI}
                      onChange={(e) => setForm((f) => ({ ...f, metadataURI: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                </div>
                {error && (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                    {error}
                  </div>
                )}
                {issuedTokenId && (
                  <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
                    <CheckCircle className="h-4 w-4" />
                    Credential issued. Token ID: <strong>{issuedTokenId}</strong>.{" "}
                    <Link to="/credentials" className="underline">
                      View in Credentials
                    </Link>
                  </div>
                )}
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? "Issuing…" : "Issue credential"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IssueCredential;
