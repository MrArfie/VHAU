import { useState, useEffect } from "react";
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
import { getConnectedAccount, getContractOwner, issueCredential, HAU_VAULT_ADDRESS, type IssueCredentialData } from "@/lib/ethereum";
import { CREDENTIAL_TITLE_DELIMITER } from "@/lib/utils";
import { Wallet, CheckCircle, ArrowRight, AlertTriangle, Plus, X } from "lucide-react";

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
  studentNumber: "",
  program: "",
  institution: "Holy Angel University",
  credentialTitle: "",
  credentialType: "Diploma",
  issuedDate: "",
  metadataURI: "",
  batch: "",
  email: "",
  location: "",
};

type AdditionalEntry = { title: string; type: "Diploma" | "Certificate" };

const IssueCredential = () => {
  const [form, setForm] = useState<IssueCredentialData>(defaultData);
  const [additionalEntries, setAdditionalEntries] = useState<AdditionalEntry[]>([]);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [contractOwner, setContractOwner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuedTokenId, setIssuedTokenId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getContractOwner().then((owner) => {
      if (!cancelled && owner) setContractOwner(owner);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const isOwner =
    walletAddress && contractOwner
      ? walletAddress.toLowerCase() === contractOwner.toLowerCase()
      : null;

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
    if (!form.studentNumber.trim()) {
      setError("Enter the student number (used for search).");
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
      const allTitles = [form.credentialTitle, ...additionalEntries.map((e) => e.title)].filter(Boolean);
      const credentialTitleValue = allTitles.length ? allTitles.join(CREDENTIAL_TITLE_DELIMITER) : form.credentialTitle;
      const allTypes = [form.credentialType, ...additionalEntries.map((e) => e.type)];
      const credentialTypesValue = allTypes.join(CREDENTIAL_TITLE_DELIMITER);
      const tokenId = await issueCredential(to as `0x${string}`, {
        ...form,
        credentialTitle: credentialTitleValue,
        credentialTypes: credentialTypesValue,
      });
      setIssuedTokenId(tokenId.toString());
      setForm(defaultData);
      setAdditionalEntries([]);
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
              <div className="mb-4 space-y-1 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 font-mono text-xs">
                <p className="text-muted-foreground">
                  App contract: <span className="text-foreground break-all">{HAU_VAULT_ADDRESS}</span>
                </p>
                <p className="text-muted-foreground">
                  Your wallet: <span className="text-foreground break-all">{walletAddress}</span>
                </p>
                {contractOwner && (
                  <p className="text-muted-foreground">
                    Contract owner: <span className={isOwner === false ? "text-amber-600 dark:text-amber-400" : "text-foreground"}>{contractOwner}</span>
                  </p>
                )}
                {isOwner === true && (
                  <p className="text-primary font-medium">✓ You are the contract owner.</p>
                )}
              </div>
              {isOwner === false && (
                <div className="mb-4 flex gap-2 rounded-lg border border-amber-500/60 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400" role="alert">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>You are not the contract owner.</strong> The addresses above are different. In your deploy tool, call <code className="rounded bg-amber-500/20 px-1">owner()</code> on the contract to see who the owner is — then connect that same wallet in MetaMask here.
                  </div>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Recipient wallet address</Label>
                  <Input
                    placeholder="0x..."
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    If you get &quot;Contract reverted: revert&quot;, your recipient may be a smart account. Try a normal wallet address (e.g. create a new MetaMask account and use its address), or redeploy the contract with <code className="rounded bg-muted px-1">_mint</code> instead of <code className="rounded bg-muted px-1">_safeMint</code>.
                  </p>
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
                  <Label className="text-xs text-muted-foreground">Student number</Label>
                  <Input
                    placeholder="e.g. 2021-000123"
                    value={form.studentNumber}
                    onChange={(e) => setForm((f) => ({ ...f, studentNumber: e.target.value }))}
                    className="text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">Used to search credentials by student number.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Batch</Label>
                    <Input
                      placeholder="e.g. 2021 — 2025"
                      value={form.batch}
                      onChange={(e) => setForm((f) => ({ ...f, batch: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <Input
                      type="email"
                      placeholder="e.g. student@hau.edu.ph"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Location</Label>
                  <Input
                    placeholder="e.g. Pampanga, Philippines"
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
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
                  <Label className="text-xs text-muted-foreground">Additional credential titles (optional)</Label>
                  <p className="text-[11px] text-muted-foreground">Add more titles; choose Certificate or Diploma for each.</p>
                  <div className="space-y-2">
                    {additionalEntries.map((entry, i) => (
                      <div key={i} className="flex gap-2 items-center flex-wrap">
                        <Input
                          placeholder="e.g. Dean's Lister — Academic Excellence"
                          value={entry.title}
                          onChange={(e) =>
                            setAdditionalEntries((prev) => {
                              const next = [...prev];
                              next[i] = { ...next[i], title: e.target.value };
                              return next;
                            })
                          }
                          className="text-sm flex-1 min-w-[180px]"
                        />
                        <Select
                          value={entry.type}
                          onValueChange={(value: "Diploma" | "Certificate") =>
                            setAdditionalEntries((prev) => {
                              const next = [...prev];
                              next[i] = { ...next[i], type: value };
                              return next;
                            })
                          }
                        >
                          <SelectTrigger className="w-[130px] text-sm shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Diploma" className="text-sm">Diploma</SelectItem>
                            <SelectItem value="Certificate" className="text-sm">Certificate</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          onClick={() => setAdditionalEntries((prev) => prev.filter((_, j) => j !== i))}
                          aria-label="Remove title"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setAdditionalEntries((prev) => [...prev, { title: "", type: "Certificate" }])}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add another title
                    </Button>
                  </div>
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
                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={loading || isOwner === false}
                >
                  {loading ? "Issuing…" : isOwner === false ? "Connect owner wallet to issue" : "Issue credential"}
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
