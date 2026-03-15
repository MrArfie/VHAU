import { createPublicClient, createWalletClient, custom, http } from "viem";
import { sepolia } from "viem/chains";
import { hauVaultAbi } from "./hauVaultAbi";

export const HAU_VAULT_ADDRESS =
  (import.meta.env.VITE_HAU_VAULT_ADDRESS as `0x${string}` | undefined) ??
  "0x0000000000000000000000000000000000000000";

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

export async function readCredential(tokenId: bigint) {
  if (HAU_VAULT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    throw new Error("Contract address not configured");
  }

  return publicClient.readContract({
    address: HAU_VAULT_ADDRESS,
    abi: hauVaultAbi,
    functionName: "credentials",
    args: [tokenId],
  }) as Promise<{
    studentName: string;
    program: string;
    institution: string;
    credentialTitle: string;
    credentialType: string;
    issuedDate: string;
    metadataURI: string;
    active: boolean;
  }>;
}

/** Credential data for issuing (struct fields; active is set by contract). */
export type IssueCredentialData = {
  studentName: string;
  program: string;
  institution: string;
  credentialTitle: string;
  credentialType: string;
  issuedDate: string;
  metadataURI: string;
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

/** Issue a credential on-chain. Caller must be contract owner. */
export async function issueCredential(
  recipientAddress: `0x${string}`,
  data: IssueCredentialData
): Promise<bigint> {
  if (HAU_VAULT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    throw new Error("Contract address not configured. Add VITE_HAU_VAULT_ADDRESS to your .env file.");
  }
  const client = getWalletClient();
  const address = await getConnectedAccount();

  const hash = await client.writeContract({
    address: HAU_VAULT_ADDRESS,
    abi: hauVaultAbi,
    functionName: "issueCredential",
    args: [
      recipientAddress,
      [
        data.studentName,
        data.program,
        data.institution,
        data.credentialTitle,
        data.credentialType,
        data.issuedDate,
        data.metadataURI || "",
      ],
    ],
    account: address,
    gas: 2_000_000n,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error("Transaction failed.");
  const tokenId = await publicClient.readContract({
    address: HAU_VAULT_ADDRESS,
    abi: hauVaultAbi,
    functionName: "totalSupply",
  });
  return tokenId as bigint;
}

