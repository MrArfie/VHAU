import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getAllCredentialSummaries, readCredential, updateCredential, getConnectedAccount, getIsIssuer, getContractOwner, type CredentialSummary, type IssueCredentialData } from "@/lib/ethereum";
import { CREDENTIAL_IMAGE_STORAGE_KEY, PROFILE_IMAGE_STORAGE_KEY, saveImageToLocalStorage, parseMetadataURIImages, buildMetadataURIImages } from "@/lib/utils";
import { isCloudinaryConfigured, uploadImageToCloudinary } from "@/lib/cloudinary";
import { Eye, Pencil, Loader2 } from "lucide-react";

const CredentialList = () => {
  const [list, setList] = useState<CredentialSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editTokenId, setEditTokenId] = useState<bigint | null>(null);
  const [editForm, setEditForm] = useState<(IssueCredentialData & { active: boolean }) | null>(null);
  const [initialEditForm, setInitialEditForm] = useState<(IssueCredentialData & { active: boolean }) | null>(null);
  const [editProfileFile, setEditProfileFile] = useState<File | null>(null);
  const [editDiplomaFile, setEditDiplomaFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getConnectedAccount()
      .then((addr) => getContractOwner().then((owner) => ({ addr, owner })))
      .then(({ addr, owner }) => {
        if (cancelled) return;
        if (owner && addr && addr.toLowerCase() === owner.toLowerCase()) {
          setCanEdit(true);
          setAuthChecked(true);
          return;
        }
        return getIsIssuer(addr);
      })
      .then((isIssuer) => {
        if (!cancelled) {
          if (isIssuer) setCanEdit(true);
          setAuthChecked(true);
        }
      })
      .catch(() => {
        if (!cancelled) setAuthChecked(true);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!authChecked || !canEdit) return;
    let cancelled = false;
    getAllCredentialSummaries()
      .then((data) => {
        if (!cancelled) setList(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load list");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [authChecked, canEdit]);

  useEffect(() => {
    if (!editTokenId) return;
    let cancelled = false;
    setSaveError(null);
    readCredential(editTokenId)
      .then((cred) => {
        if (cancelled) return;
        const c = cred as Record<string, unknown>;
        const form = {
          studentName: (c.studentName ?? c[0] ?? "") as string,
          studentNumber: (c.studentNumber ?? c[7] ?? "") as string,
          program: (c.program ?? c[1] ?? "") as string,
          institution: (c.institution ?? c[2] ?? "") as string,
          credentialTitle: (c.credentialTitle ?? c[3] ?? "") as string,
          credentialType: (c.credentialType ?? c[4] ?? "Diploma") as string,
          issuedDate: (c.issuedDate ?? c[5] ?? "") as string,
          metadataURI: (c.metadataURI ?? c[6] ?? "") as string,
          batch: (c.batch ?? c[8] ?? "") as string,
          email: (c.email ?? c[9] ?? "") as string,
          location: (c.location ?? c[10] ?? "") as string,
          credentialTypes: (c.credentialTypes ?? c[11] ?? "") as string,
          active: (c.active ?? c[12] ?? true) as boolean,
        };
        setEditForm(form);
        setInitialEditForm(form);
      })
      .catch(() => {
        if (!cancelled) setEditForm(null);
        if (!cancelled) setInitialEditForm(null);
      });
    return () => { cancelled = true; };
  }, [editTokenId]);

  const handleOpenEdit = (tokenId: bigint) => {
    setEditTokenId(tokenId);
    setEditProfileFile(null);
    setEditDiplomaFile(null);
    setInitialEditForm(null);
  };

  const formChanged = (a: (IssueCredentialData & { active: boolean }) | null, b: (IssueCredentialData & { active: boolean }) | null) => {
    if (!a || !b) return false;
    return (
      a.studentName !== b.studentName ||
      a.studentNumber !== b.studentNumber ||
      a.program !== b.program ||
      a.institution !== b.institution ||
      a.credentialTitle !== b.credentialTitle ||
      a.credentialType !== b.credentialType ||
      a.issuedDate !== b.issuedDate ||
      (a.metadataURI ?? "") !== (b.metadataURI ?? "") ||
      a.batch !== b.batch ||
      a.email !== b.email ||
      a.location !== b.location ||
      (a.credentialTypes ?? "") !== (b.credentialTypes ?? "") ||
      a.active !== b.active
    );
  };

  const handleSaveEdit = async () => {
    if (!editTokenId || !editForm) return;
    setSaveError(null);
    setSaving(true);
    const tokenIdStr = editTokenId.toString();
    let formToSave = editForm;
    try {
      if (isCloudinaryConfigured() && (editProfileFile || editDiplomaFile)) {
        const existing = parseMetadataURIImages(initialEditForm?.metadataURI ?? "");
        let profileUrl: string | null = existing.profileImageUrl ?? null;
        let diplomaUrl: string | null = existing.diplomaImageUrl ?? null;
        if (editProfileFile) {
          const url = await uploadImageToCloudinary(editProfileFile);
          if (url) profileUrl = url;
        }
        if (editDiplomaFile) {
          const url = await uploadImageToCloudinary(editDiplomaFile);
          if (url) diplomaUrl = url;
        }
        formToSave = { ...editForm, metadataURI: buildMetadataURIImages(profileUrl, diplomaUrl) };
      } else {
        if (editProfileFile) {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.onerror = () => reject(new Error("Failed to read file"));
            r.readAsDataURL(editProfileFile);
          });
          await saveImageToLocalStorage(PROFILE_IMAGE_STORAGE_KEY + tokenIdStr, dataUrl, editProfileFile);
        }
        if (editDiplomaFile) {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.onerror = () => reject(new Error("Failed to read file"));
            r.readAsDataURL(editDiplomaFile);
          });
          await saveImageToLocalStorage(CREDENTIAL_IMAGE_STORAGE_KEY + tokenIdStr, dataUrl, editDiplomaFile);
        }
      }
      const onlyImages = !formChanged(formToSave, initialEditForm);
      if (!onlyImages) {
        await updateCredential(editTokenId, formToSave);
        setList((prev) =>
          prev.map((item) =>
            item.tokenId === editTokenId
              ? {
                  ...item,
                  studentName: formToSave.studentName,
                  studentNumber: formToSave.studentNumber,
                  credentialTitle: formToSave.credentialTitle,
                  active: formToSave.active,
                }
              : item
          )
        );
      }
      setEditTokenId(null);
      setEditProfileFile(null);
      setEditDiplomaFile(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (authChecked && !canEdit) {
    return (
      <div className="bg-background min-h-[50vh] flex items-center justify-center px-4">
        <div className="rounded-2xl border border-border/60 bg-card/80 px-8 py-10 text-center max-w-md">
          <h2 className="text-lg font-semibold text-foreground">Access restricted</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Only the contract owner or authorized issuers can view and manage all credentials. Connect with an authorized wallet or use Credentials to search by student number or token ID.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/credentials">Search credentials</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!authChecked) {
    return (
      <div className="bg-background min-h-[50vh] flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Checking access…</span>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-4xl px-4 py-10 pb-16 sm:px-6">
        <div className="rounded-3xl border border-border/60 bg-card/80 px-6 py-8 shadow-sm sm:px-8">
          <header className="mb-6">
            <p className="text-[11px] font-semibold tracking-[0.24em] text-primary uppercase">
              All credentials
            </p>
            <h1 className="mt-2 text-xl font-semibold text-foreground">
              List and edit credentials
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              View all issued credentials. Use View to open the profile, or Edit to update data and images (owner or issuer only).
            </p>
          </header>

          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading…
            </div>
          ) : error ? (
            <p className="text-sm text-destructive py-4">{error}</p>
          ) : list.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8">No credentials issued yet.</p>
          ) : (
            <div className="space-y-2">
              {list.map((item) => (
                <div
                  key={Number(item.tokenId)}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-muted-foreground">#{item.tokenId.toString()}</span>
                      <span className="font-medium text-foreground">{item.studentName || "—"}</span>
                      <Badge variant={item.active ? "default" : "secondary"} className="text-[10px]">
                        {item.active ? "Active" : "Revoked"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {item.studentNumber || "—"} · {item.credentialTitle || "—"}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/credentials?token=${item.tokenId.toString()}`}>
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View
                      </Link>
                    </Button>
                    {canEdit && (
                      <Button variant="outline" size="sm" onClick={() => handleOpenEdit(item.tokenId)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={editTokenId !== null} onOpenChange={(open) => !open && setEditTokenId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit credential #{editTokenId?.toString() ?? ""}</DialogTitle>
          </DialogHeader>
          {editForm && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Student name</Label>
                  <Input
                    value={editForm.studentName}
                    onChange={(e) => setEditForm((f) => f && { ...f, studentName: e.target.value })}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Student number</Label>
                  <Input
                    value={editForm.studentNumber}
                    onChange={(e) => setEditForm((f) => f && { ...f, studentNumber: e.target.value.replace(/\D/g, "") })}
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Credential title</Label>
                <Input
                  value={editForm.credentialTitle}
                  onChange={(e) => setEditForm((f) => f && { ...f, credentialTitle: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Program</Label>
                  <Input
                    value={editForm.program}
                    onChange={(e) => setEditForm((f) => f && { ...f, program: e.target.value })}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Institution</Label>
                  <Input
                    value={editForm.institution}
                    onChange={(e) => setEditForm((f) => f && { ...f, institution: e.target.value })}
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Batch</Label>
                  <Input
                    value={editForm.batch}
                    onChange={(e) => setEditForm((f) => f && { ...f, batch: e.target.value })}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((f) => f && { ...f, email: e.target.value })}
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Location</Label>
                <Input
                  value={editForm.location}
                  onChange={(e) => setEditForm((f) => f && { ...f, location: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Issued date</Label>
                  <Input
                    value={editForm.issuedDate}
                    onChange={(e) => setEditForm((f) => f && { ...f, issuedDate: e.target.value })}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Metadata URI</Label>
                  <Input
                    value={editForm.metadataURI}
                    onChange={(e) => setEditForm((f) => f && { ...f, metadataURI: e.target.value })}
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Credential types (e.g. Diploma | Certificate)</Label>
                <Input
                  value={editForm.credentialTypes ?? ""}
                  onChange={(e) => setEditForm((f) => f && { ...f, credentialTypes: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={editForm.active}
                  onChange={(e) => setEditForm((f) => f && { ...f, active: e.target.checked })}
                  className="rounded border-input"
                />
                <Label htmlFor="edit-active" className="text-xs cursor-pointer">Active (credential is valid)</Label>
              </div>

              <div className="border-t pt-4 space-y-2">
                <Label className="text-xs">Replace images (optional, stored in this browser)</Label>
                <div className="flex gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      className="text-sm max-w-[180px]"
                      onChange={(e) => setEditProfileFile(e.target.files?.[0] ?? null)}
                    />
                    {editProfileFile && <span className="text-xs text-muted-foreground">{editProfileFile.name}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      className="text-sm max-w-[180px]"
                      onChange={(e) => setEditDiplomaFile(e.target.files?.[0] ?? null)}
                    />
                    {editDiplomaFile && <span className="text-xs text-muted-foreground">{editDiplomaFile.name}</span>}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">Profile photo (left) and diploma document (right). Images are saved in this browser only — no transaction or gas. Changing text above and saving will send an on-chain update.</p>
              </div>

              {saveError && <p className="text-xs text-destructive">{saveError}</p>}
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setEditTokenId(null)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CredentialList;
