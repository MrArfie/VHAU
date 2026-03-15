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
import { getConnectedAccount, getContractOwner, getIsIssuer, issueCredential, addIssuer, removeIssuer, HAU_VAULT_ADDRESS, type IssueCredentialData } from "@/lib/ethereum";
import { CREDENTIAL_TITLE_DELIMITER, CREDENTIAL_IMAGE_STORAGE_KEY, PROFILE_IMAGE_STORAGE_KEY, saveImageToLocalStorage, buildMetadataURIImages } from "@/lib/utils";
import { isCloudinaryConfigured, uploadImageToCloudinary } from "@/lib/cloudinary";
import { Wallet, CheckCircle, ArrowRight, AlertTriangle, Plus, X, ImagePlus, List } from "lucide-react";

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
  const [isIssuer, setIsIssuer] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuedTokenId, setIssuedTokenId] = useState<string | null>(null);
  const [issuerAddress, setIssuerAddress] = useState("");
  const [issuerActionLoading, setIssuerActionLoading] = useState(false);
  const [issuerActionError, setIssuerActionError] = useState<string | null>(null);
  const [diplomaFile, setDiplomaFile] = useState<File | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);

  useEffect(() => {
    let cancelled = false;
    getContractOwner().then((owner) => {
      if (!cancelled && owner) setContractOwner(owner);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!walletAddress) {
      setIsIssuer(null);
      return;
    }
    let cancelled = false;
    getIsIssuer(walletAddress).then((ok) => {
      if (!cancelled) setIsIssuer(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  const isOwner =
    walletAddress && contractOwner
      ? walletAddress.toLowerCase() === contractOwner.toLowerCase()
      : null;
  const canIssue = isOwner === true || isIssuer === true;

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
      let metadataURI = form.metadataURI || "";
      if (isCloudinaryConfigured() && (diplomaFile || profilePhotoFile)) {
        let profileUrl: string | null = null;
        let diplomaUrl: string | null = null;
        if (profilePhotoFile) {
          profileUrl = await uploadImageToCloudinary(profilePhotoFile);
          if (!profileUrl) setError("Failed to upload profile photo to cloud.");
        }
        if (diplomaFile) {
          diplomaUrl = await uploadImageToCloudinary(diplomaFile);
          if (!diplomaUrl) setError("Failed to upload diploma image to cloud.");
        }
        if ((profilePhotoFile && !profileUrl) || (diplomaFile && !diplomaUrl)) {
          setLoading(false);
          return;
        }
        metadataURI = buildMetadataURIImages(profileUrl, diplomaUrl);
      }
      const allTitles = [form.credentialTitle, ...additionalEntries.map((e) => e.title)].filter(Boolean);
      const credentialTitleValue = allTitles.length ? allTitles.join(CREDENTIAL_TITLE_DELIMITER) : form.credentialTitle;
      const allTypes = [form.credentialType, ...additionalEntries.map((e) => e.type)];
      const credentialTypesValue = allTypes.join(CREDENTIAL_TITLE_DELIMITER);
      const tokenId = await issueCredential(to as `0x${string}`, {
        ...form,
        credentialTitle: credentialTitleValue,
        credentialTypes: credentialTypesValue,
        metadataURI,
      });
      const tokenIdStr = tokenId.toString();
      if (!isCloudinaryConfigured()) {
        if (diplomaFile) {
          try {
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const r = new FileReader();
              r.onload = () => resolve(r.result as string);
              r.onerror = () => reject(new Error("Failed to read file"));
              r.readAsDataURL(diplomaFile);
            });
            await saveImageToLocalStorage(CREDENTIAL_IMAGE_STORAGE_KEY + tokenIdStr, dataUrl, diplomaFile);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not save diploma image in this browser.");
            setLoading(false);
            return;
          }
          setDiplomaFile(null);
        }
        if (profilePhotoFile) {
          try {
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const r = new FileReader();
              r.onload = () => resolve(r.result as string);
              r.onerror = () => reject(new Error("Failed to read file"));
              r.readAsDataURL(profilePhotoFile);
            });
            await saveImageToLocalStorage(PROFILE_IMAGE_STORAGE_KEY + tokenIdStr, dataUrl, profilePhotoFile);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not save profile photo in this browser.");
            setLoading(false);
            return;
          }
          setProfilePhotoFile(null);
        }
      } else {
        setDiplomaFile(null);
        setProfilePhotoFile(null);
      }
      setIssuedTokenId(tokenIdStr);
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
              Connect the contract owner or an authorized issuer wallet on Sepolia. You need Sepolia ETH for gas. Only the owner or members added as issuers can issue credentials.
            </p>
            {walletAddress && canIssue && (
              <Button variant="outline" size="sm" className="mt-4 gap-2" asChild>
                <Link to="/credentials/list">
                  <List className="h-4 w-4" />
                  View all credentials
                </Link>
              </Button>
            )}
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
              {walletAddress && !canIssue && (
                <div className="mb-4 flex gap-2 rounded-lg border border-amber-500/60 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400" role="alert">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>You cannot issue credentials.</strong> Only the contract owner or an address added as an issuer can issue. Ask the owner to add your wallet address as an issuer.
                  </div>
                </div>
              )}
              {isOwner && (
                <div className="mb-4 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Manage issuers</p>
                  <p className="text-[11px] text-muted-foreground">Add a member&apos;s wallet address so they can issue credentials. Only you (the owner) can add or remove issuers.</p>
                  <div className="flex gap-2 flex-wrap items-center">
                    <Input
                      placeholder="0x..."
                      value={issuerAddress}
                      onChange={(e) => { setIssuerAddress(e.target.value); setIssuerActionError(null); }}
                      className="font-mono text-sm max-w-[320px]"
                    />
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      disabled={issuerActionLoading || !/^0x[a-fA-F0-9]{40}$/.test(issuerAddress.trim())}
                      onClick={async () => {
                        setIssuerActionError(null);
                        setIssuerActionLoading(true);
                        try {
                          await addIssuer(issuerAddress.trim() as `0x${string}`);
                          setIssuerAddress("");
                        } catch (e) {
                          setIssuerActionError(e instanceof Error ? e.message : "Failed to add issuer");
                        } finally {
                          setIssuerActionLoading(false);
                        }
                      }}
                    >
                      {issuerActionLoading ? "Adding…" : "Add issuer"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={issuerActionLoading || !/^0x[a-fA-F0-9]{40}$/.test(issuerAddress.trim())}
                      onClick={async () => {
                        setIssuerActionError(null);
                        setIssuerActionLoading(true);
                        try {
                          await removeIssuer(issuerAddress.trim() as `0x${string}`);
                          setIssuerAddress("");
                        } catch (e) {
                          setIssuerActionError(e instanceof Error ? e.message : "Failed to remove issuer");
                        } finally {
                          setIssuerActionLoading(false);
                        }
                      }}
                    >
                      Remove issuer
                    </Button>
                  </div>
                  {issuerActionError && <p className="text-xs text-destructive">{issuerActionError}</p>}
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
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="e.g. 2021000123"
                    value={form.studentNumber}
                    onChange={(e) => setForm((f) => ({ ...f, studentNumber: e.target.value.replace(/\D/g, "") }))}
                    className="text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">Numbers only. Used to search credentials by student number.</p>
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
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Diploma image (optional)</Label>
                  <div className="flex gap-2 items-center flex-wrap">
                    <Input
                      type="file"
                      accept="image/*"
                      className="text-sm max-w-[240px]"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        setDiplomaFile(f || null);
                      }}
                    />
                    {diplomaFile && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <ImagePlus className="h-3.5 w-3.5" />
                        {diplomaFile.name}
                        <button
                          type="button"
                          onClick={() => setDiplomaFile(null)}
                          className="text-destructive hover:underline ml-1"
                        >
                          Remove
                        </button>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Upload from your device. Image is stored in this browser only and will show on the credential profile when viewed on this device. For a permanent URL (any device), use Metadata URI above with an image link.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Profile photo (optional)</Label>
                  <div className="flex gap-2 items-center flex-wrap">
                    <Input
                      type="file"
                      accept="image/*"
                      className="text-sm max-w-[240px]"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        setProfilePhotoFile(f || null);
                      }}
                    />
                    {profilePhotoFile && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <ImagePlus className="h-3.5 w-3.5" />
                        {profilePhotoFile.name}
                        <button
                          type="button"
                          onClick={() => setProfilePhotoFile(null)}
                          className="text-destructive hover:underline ml-1"
                        >
                          Remove
                        </button>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Shows in the circular avatar on the student&apos;s profile. Stored in this browser only.
                  </p>
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
                  disabled={loading || !canIssue}
                >
                  {loading ? "Issuing…" : !canIssue ? "Connect owner or issuer wallet to issue" : "Issue credential"}
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
