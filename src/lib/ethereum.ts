import { BaseError, ContractFunctionRevertedError, createPublicClient, createWalletClient, custom, decodeErrorResult, http } from "viem";
import { sepolia } from "viem/chains";
import { HAU_VAULT_ADDRESS as CONFIG_ADDRESS } from "@/config";
import { hauVaultAbi } from "./hauVaultAbi";

export const HAU_VAULT_ADDRESS = CONFIG_ADDRESS;

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

/** Returns the contract owner address. */
export async function getContractOwner(): Promise<`0x${string}` | null> {
  if (HAU_VAULT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    return null;
  }
  try {
    const code = await publicClient.getBytecode({ address: HAU_VAULT_ADDRESS });
    if (!code || code === "0x") return null;
    return publicClient.readContract({
      address: HAU_VAULT_ADDRESS,
      abi: hauVaultAbi,
      functionName: "owner",
    } as any) as Promise<`0x${string}`>;
  } catch {
    return null;
  }
}

/** Returns true if the address is allowed to issue credentials (owner or added issuer). */
export async function getIsIssuer(address: string): Promise<boolean> {
  if (HAU_VAULT_ADDRESS === "0x0000000000000000000000000000000000000000" || !address) {
    return false;
  }
  try {
    const owner = await getContractOwner();
    if (owner && address.toLowerCase() === owner.toLowerCase()) return true;
    const isIssuer = await publicClient.readContract({
      address: HAU_VAULT_ADDRESS,
      abi: hauVaultAbi,
      functionName: "issuers",
      args: [address as `0x${string}`],
    } as any);
    return (isIssuer as boolean) ?? false;
  } catch {
    return false;
  }
}

/** Add an issuer (owner only). */
export async function addIssuer(account: `0x${string}`): Promise<void> {
  const walletClient = getWalletClient();
  const [address] = await walletClient.getAddresses();
  if (!address) throw new Error("Connect your wallet first.");
  const hash = await walletClient.writeContract({
    address: HAU_VAULT_ADDRESS,
    abi: hauVaultAbi,
    functionName: "addIssuer",
    args: [account],
    account: address,
  } as any);
  await publicClient.waitForTransactionReceipt({ hash });
}

/** Remove an issuer (owner only). */
export async function removeIssuer(account: `0x${string}`): Promise<void> {
  const walletClient = getWalletClient();
  const [address] = await walletClient.getAddresses();
  if (!address) throw new Error("Connect your wallet first.");
  const hash = await walletClient.writeContract({
    address: HAU_VAULT_ADDRESS,
    abi: hauVaultAbi,
    functionName: "removeIssuer",
    args: [account],
    account: address,
  } as any);
  await publicClient.waitForTransactionReceipt({ hash });
}

export async function readCredential(tokenId: bigint) {
  if (HAU_VAULT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    throw new Error("Contract address not configured");
  }

  return publicClient.readContract({
    address: HAU_VAULT_ADDRESS,
    abi: hauVaultAbi,
    functionName: "credentials",
    args: [tokenId],
  } as any) as Promise<{
    studentName: string;
    program: string;
    institution: string;
    credentialTitle: string;
    credentialType: string;
    issuedDate: string;
    metadataURI: string;
    studentNumber: string;
    batch: string;
    email: string;
    location: string;
    credentialTypes: string;
    active: boolean;
  }>;
}

/** Get total number of credentials minted. */
export async function getTotalSupply(): Promise<bigint> {
  if (HAU_VAULT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    return 0n;
  }
  try {
    const total = await publicClient.readContract({
      address: HAU_VAULT_ADDRESS,
      abi: hauVaultAbi,
      functionName: "totalSupply",
    } as any);
    return (total as bigint) ?? 0n;
  } catch {
    return 0n;
  }
}

/** Summary of a credential for list views. */
export type CredentialSummary = {
  tokenId: bigint;
  studentName: string;
  studentNumber: string;
  credentialTitle: string;
  active: boolean;
};

/** Fetch summaries for all credentials (token IDs 1 to totalSupply). */
export async function getAllCredentialSummaries(): Promise<CredentialSummary[]> {
  const total = await getTotalSupply();
  if (total === 0n) return [];
  const list: CredentialSummary[] = [];
  for (let i = 1n; i <= total; i++) {
    try {
      const cred = await readCredential(i);
      list.push({
        tokenId: i,
        studentName: (cred as any).studentName ?? "",
        studentNumber: (cred as any).studentNumber ?? "",
        credentialTitle: (cred as any).credentialTitle ?? "",
        active: (cred as any).active ?? false,
      });
    } catch {
      list.push({
        tokenId: i,
        studentName: "",
        studentNumber: "",
        credentialTitle: "",
        active: false,
      });
    }
  }
  return list;
}

/** Update an existing credential (owner or issuer). */
export async function updateCredential(
  tokenId: bigint,
  data: IssueCredentialData & { active: boolean }
): Promise<void> {
  const walletClient = getWalletClient();
  const [address] = await walletClient.getAddresses();
  if (!address) throw new Error("Connect your wallet first.");
  const args = [
    tokenId,
    [
      data.studentName,
      data.program,
      data.institution,
      data.credentialTitle,
      data.credentialType,
      data.issuedDate,
      data.metadataURI || "",
      data.studentNumber || "",
      data.batch || "",
      data.email || "",
      data.location || "",
      data.credentialTypes ?? "",
      data.active,
    ],
  ] as const;
  const hash = await walletClient.writeContract({
    address: HAU_VAULT_ADDRESS,
    abi: hauVaultAbi,
    functionName: "updateCredential",
    args: args as any,
    account: address,
    gas: 2_000_000n,
  } as any);
  await publicClient.waitForTransactionReceipt({ hash });
}

/** Get credential token ID by student number (0 if none). */
export async function getTokenIdByStudentNumber(studentNumber: string): Promise<bigint> {
  if (HAU_VAULT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    return 0n;
  }
  try {
    const tokenId = await publicClient.readContract({
      address: HAU_VAULT_ADDRESS,
      abi: hauVaultAbi,
      functionName: "tokenIdByStudentNumber",
      args: [studentNumber.trim()],
    } as any);
    return (tokenId as bigint) ?? 0n;
  } catch {
    return 0n;
  }
}

/** Credential data for issuing (struct fields; active is set by contract). */
export type IssueCredentialData = {
  studentName: string;
  studentNumber: string;
  program: string;
  institution: string;
  credentialTitle: string;
  credentialType: string;
  issuedDate: string;
  metadataURI: string;
  batch: string;
  email: string;
  location: string;
  /** Delimiter-separated types per title (e.g. "Diploma | Certificate"). */
  credentialTypes?: string;
};

/** Get wallet client from browser provider (e.g. MetaMask). */
function getWalletClient() {
  const provider = typeof window !== "undefined" ? (window as unknown as { ethereum?: unknown }).ethereum : undefined;
  if (!provider) throw new Error("No wallet found. Install MetaMask or another Web3 wallet.");
  return createWalletClient({
    chain: sepolia,
    transport: custom(provider as import("viem").EIP1193Provider),
  });
}

/** Request connected account; prompts wallet to connect if needed. */
export async function getConnectedAccount(): Promise<`0x${string}`> {
  const client = getWalletClient();
  let addresses = await client.getAddresses();
  if (!addresses?.length) {
    addresses = await client.requestAddresses();
  }
  const address = addresses?.[0];
  if (!address) throw new Error("Connect your wallet first.");
  return address;
}

/** Turn viem revert errors into a clear user-facing message. */
function normalizeRevertError(simErr: unknown): Error {
  // Try to get raw revert data from the error (viem sometimes exposes it)
  const errWithData = simErr as { data?: `0x${string}`; cause?: { data?: `0x${string}` } };
  const revertData = errWithData?.data ?? errWithData?.cause?.data;
  if (revertData && revertData.startsWith("0x") && revertData.length > 10) {
    try {
      const decoded = decodeErrorResult({ abi: hauVaultAbi, data: revertData });
      const name = decoded.errorName;
      const args = decoded.args;
      if (name === "OwnableUnauthorizedAccount") {
        return new Error(
          "Only the contract owner or an authorized issuer can issue credentials. Ask the owner to add your wallet as an issuer."
        );
      }
      if (name === "Error" && args && typeof (args as unknown as { message?: string }).message === "string") {
        const msg = (args as unknown as { message: string }).message;
        if (msg.includes("Not owner or issuer")) {
          return new Error(
            "Only the contract owner or an authorized issuer can issue credentials. Ask the owner to add your wallet as an issuer."
          );
        }
        return new Error(`Contract reverted: ${msg}`);
      }
      if (name === "ERC721InvalidReceiver") {
        return new Error(
          "The contract uses _safeMint but the recipient address does not accept NFTs. Redeploy the contract with _mint(to, tokenId) instead of _safeMint in Remix, then update src/config.ts with the new address."
        );
      }
      return new Error(`Contract reverted: ${name}${args ? ` (${JSON.stringify(args)})` : ""}`);
    } catch {
      // decodeErrorResult failed, fall through to generic handling
    }
  }

  const revertErr =
    simErr instanceof BaseError
      ? simErr.walk((e) => e instanceof ContractFunctionRevertedError)
      : undefined;
  if (revertErr instanceof ContractFunctionRevertedError) {
    const err = revertErr as unknown as { errorName?: string; name?: string; errorArgs?: unknown; args?: unknown; data?: `0x${string}` };
    const name = err.errorName ?? err.name ?? "revert";
    const args = err.errorArgs ?? err.args;
    if (name === "OwnableUnauthorizedAccount" && args && typeof (args as { account?: string }).account === "string") {
      return new Error(
        "Only the contract owner or an authorized issuer can issue credentials. Ask the owner to add your wallet as an issuer."
      );
    }
    const errMsg = args && typeof (args as { message?: string }).message === "string" ? (args as { message: string }).message : "";
    if (errMsg && errMsg.includes("Not owner or issuer")) {
      return new Error(
        "Only the contract owner or an authorized issuer can issue credentials. Ask the owner to add your wallet as an issuer."
      );
    }
    if (name === "ERC721InvalidReceiver") {
      return new Error(
        "The contract uses _safeMint but the recipient does not accept NFTs. Redeploy with _mint(to, tokenId) in Remix and update src/config.ts."
      );
    }
    const isGenericRevert =
      name === "revert" || name === "ContractFunctionRevertedError";
    const hint = isGenericRevert
      ? "The contract may still use _safeMint (minting to a smart account fails). In Remix use _mint(to, tokenId), recompile, redeploy, and set the new address in src/config.ts. Or try issuing to a different wallet (e.g. a new MetaMask account)."
      : args
        ? ` (${JSON.stringify(args)})`
        : "";
    return new Error(
      isGenericRevert ? hint : `Contract reverted: ${name}${hint}`
    );
  }
  const msg = simErr instanceof Error ? simErr.message : String(simErr);
  if (msg.includes("ContractFunctionRevertedError") || msg.includes("revert")) {
    return new Error(
      "Transaction reverted. The contract may still use _safeMint. In Remix use _mint(to, tokenId), recompile, redeploy, and update src/config.ts with the new contract address."
    );
  }
  if (msg.includes("Ownable") || msg.includes("owner") || msg.includes("caller")) {
    return new Error(
      "Only the contract owner can issue credentials. Connect the same MetaMask account that deployed the contract in Remix."
    );
  }
  return simErr instanceof Error ? simErr : new Error(String(simErr));
}

/** Issue a credential on-chain. Caller must be contract owner. */
export async function issueCredential(
  recipientAddress: `0x${string}`,
  data: IssueCredentialData
): Promise<bigint> {
  if (HAU_VAULT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    throw new Error("Contract address not configured. Set it in src/config.ts.");
  }
  const client = getWalletClient();
  const address = await getConnectedAccount();

  const code = await publicClient.getBytecode({ address: HAU_VAULT_ADDRESS });
  if (!code || code === "0x") {
    throw new Error(
      "The configured address is a wallet, not a contract. In Remix, copy the address under “Deployed Contracts” (the contract name), not your Account address."
    );
  }

  const args = [
    recipientAddress,
    [
      data.studentName,
      data.program,
      data.institution,
      data.credentialTitle,
      data.credentialType,
      data.issuedDate,
      data.metadataURI || "",
      data.studentNumber || "",
      data.batch || "",
      data.email || "",
      data.location || "",
      data.credentialTypes ?? "",
      true, // active – contract overwrites with true, but ABI requires last field
    ],
  ] as const;

  try {
    await publicClient.simulateContract({
      address: HAU_VAULT_ADDRESS,
      abi: hauVaultAbi,
      functionName: "issueCredential",
      args: args as any,
      account: address,
    } as any);
  } catch (simErr: unknown) {
    throw normalizeRevertError(simErr);
  }

  let hash: `0x${string}`;
  try {
    hash = await client.writeContract({
      address: HAU_VAULT_ADDRESS,
      abi: hauVaultAbi,
      functionName: "issueCredential",
      args: args as any,
      account: address,
      gas: 2_000_000n,
    } as any);
  } catch (writeErr: unknown) {
    throw normalizeRevertError(writeErr);
  }

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error(
      "Transaction reverted on-chain. The contract may still use _safeMint. In Remix change to _mint(to, tokenId), recompile, redeploy, and update the address in src/config.ts."
    );
  }
  const tokenId = await publicClient.readContract({
    address: HAU_VAULT_ADDRESS,
    abi: hauVaultAbi,
    functionName: "totalSupply",
  } as any);
  return tokenId as bigint;
}
