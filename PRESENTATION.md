# VHAU — HAU Vault: Presentation Outline & Tools Matrix

## 1. Objectives

- **Issue verifiable academic credentials** (diplomas, certificates) as on-chain, soulbound NFTs so they cannot be transferred or faked.
- **Allow only the contract owner and authorized issuers** to mint and update credentials; students and the public can view and verify.
- **Store credential data on-chain** (student name, program, institution, titles, types, dates, metadata URI, batch, email, location) and support **multiple titles and types per credential** (e.g. BSIT + Dean’s Lister + Best Capstone).
- **Support profile and diploma images** (optional): via **Cloudinary** (stored in contract metadataURI, visible on any device) or local upload (browser-only fallback).
- **Provide a list-and-edit view** for owner/issuers to manage all credentials; restrict this view to authorized accounts only.

---

## 2. Tools / Framework & Matrix

### Technology matrix

| Category | Technology | Purpose |
|----------|------------|--------|
| **Frontend framework** | React 18 | UI components and state |
| **Build tool** | Vite 5 | Dev server, bundling, HMR |
| **Language** | TypeScript 5 | Type-safe frontend and ABI usage |
| **Routing** | React Router 6 | Routes: Home, Credentials, Add credential, All credentials (hidden) |
| **UI components** | Radix UI + shadcn/ui | Accessible primitives (Dialog, Select, Input, Button, Badge) |
| **Styling** | Tailwind CSS 3 | Utility-first CSS, theming |
| **Icons** | Lucide React | UI icons (Wallet, CheckCircle, GraduationCap, etc.) |
| **Blockchain interaction** | viem 2 | Read/write contracts, Sepolia RPC, wallet (MetaMask) |
| **Smart contracts** | Solidity 0.8.20 | ERC-721 credential logic |
| **Contract libraries** | OpenZeppelin Contracts 5 | ERC721Enumerable, Ownable |
| **Network** | Ethereum Sepolia | Testnet for deployment and testing |
| **Contract deployment** | Remix IDE | Compile and deploy HAUVaultCredentials |
| **Wallet** | MetaMask (or compatible) | Connect wallet, sign transactions |
| **State / data** | React useState/useEffect | Local state; no separate global store |
| **Forms** | Native inputs + Radix Select | Issue credential, edit credential, search |
| **Validation** | In-app checks + contract reverts | Required fields, owner/issuer checks |
| **Image storage (optional)** | Cloudinary | Upload profile/diploma; URLs stored in contract metadataURI so images show on any device |

### Frontend dependency summary

| Layer | Key packages |
|-------|------------------|
| Core | react, react-dom, react-router-dom |
| Build | vite, @vitejs/plugin-react-swc, typescript |
| UI | @radix-ui/* (dialog, select, label, etc.), tailwindcss, lucide-react |
| Blockchain | viem |
| Dev / test | vitest, eslint, @testing-library/react |

---

## 3. Token Used

- **Standard:** ERC-721 (non-fungible token).
- **Token name:** `HAU Vault Credential`
- **Symbol:** `HAUCRED`
- **Behavior:** **Soulbound** — tokens are non-transferable (override `_update` to revert on transfer).
- **Role:** Each minted token represents one academic credential; token ID is used to look up credential data (student name, program, titles, types, dates, etc.) and to display profile/diploma images (via Metadata URI or local storage).

---

## 4. Architecture: Integration of Token/Blockchain with Frontend

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite + TypeScript)      │
│  Pages: Home | Credentials (search + profile) | Issue | List     │
│  UI: shadcn/Radix, Tailwind, Lucide                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │  viem (readContract, writeContract,
                             │       getWalletClient, publicClient)
                             │  + config: HAU_VAULT_ADDRESS (Sepolia)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ETHEREUM SEPOLIA (testnet)                   │
│  • Wallet (MetaMask): sign tx, pay gas (Sepolia ETH)              │
│  • RPC: public HTTP endpoint for reads / tx broadcast             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │  Contract calls (issueCredential,
                             │  updateCredential, credentials(id), etc.)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              SMART CONTRACT: HAUVaultCredentials.sol             │
│  • ERC721Enumerable + Ownable (OpenZeppelin)                     │
│  • Soulbound: no transfer after mint                              │
│  • Issuers: owner + mapping(address => bool) issuers              │
│  • Storage: credentials(tokenId) → struct (name, program,       │
│    institution, title, type, date, metadataURI, studentNumber,   │
│    batch, email, location, credentialTypes, active)              │
│  • tokenIdByStudentNumber(studentNumber) → tokenId               │
│  • totalSupply() → count for “all credentials” list              │
└─────────────────────────────────────────────────────────────────┘
```

**Data flow (high level):**

1. **Issue credential:** User fills form (Issue Credential page) → frontend builds struct → `issueCredential(to, data)` via viem → contract mints token and stores credential; optional profile/diploma images saved in browser (localStorage) or via metadata URI on-chain.
2. **View credential:** User searches by student number or token ID (Credentials page) → frontend calls `tokenIdByStudentNumber` or uses token ID → `credentials(tokenId)` → UI displays profile and credential cards; images from metadata URI or localStorage.
3. **List / edit (owner or issuer only):** All credentials list uses `totalSupply()` and `credentials(i)`; edit uses `updateCredential(tokenId, data)` and optionally updates local images.

---

## 5. Deployment

| Component | How it’s deployed |
|-----------|--------------------|
| **Smart contract** | Remix IDE: compile HAUVaultCredentials.sol (Solidity 0.8.20, optimizer on, optional Via IR if “stack too deep”) → Deploy & Run → Injected Provider (MetaMask) → Network: Sepolia → Deploy. Copy deployed contract address into `src/config.ts` as `HAU_VAULT_ADDRESS`. |
| **Frontend** | Local: `npm run dev` (Vite). Production: `npm run build` → host `dist/` on any static host (e.g. Vercel, Netlify, GitHub Pages). No server required; app talks to Sepolia RPC and user’s wallet. |
| **Config** | Contract address is in `src/config.ts`; no .env needed for the app. Redeploy contract → update `HAU_VAULT_ADDRESS` → rebuild/redeploy frontend. |

---

## Quick reference for slides

- **Objectives:** Soulbound academic credentials, owner/issuer-only mint and update, multi-title/type, optional images, restricted list view.
- **Stack:** React, Vite, TypeScript, Tailwind, Radix/shadcn, viem, Solidity, OpenZeppelin, Sepolia, Remix, MetaMask.
- **Token:** ERC-721 “HAU Vault Credential” (HAUCRED), soulbound.
- **Architecture:** Frontend (viem) ↔ Sepolia ↔ HAUVaultCredentials.sol; config points to one contract address.
- **Deployment:** Contract via Remix (Sepolia); frontend build and static hosting; update `config.ts` after contract redeploy.
