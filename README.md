# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Connecting the Solidity contract (HAU Vault)

The React app **only reads** from the blockchain (no wallet popup). You just need to deploy the contract once and put its address in `.env`.

### Deploying **without MetaMask**

1. **Use another wallet in Remix**  
   In [Remix](https://remix.ethereum.org) → **Deploy & Run Transactions** → set Environment to **WalletConnect** or **Injected Provider**, then connect **Brave**, **Coinbase Wallet**, **Rabby**, or any other wallet that supports Sepolia.

2. **Use Remix with a private key**  
   - Create a new account (e.g. [MyEtherWallet](https://www.myetherwallet.com/) → Create New Wallet) and export the **private key**.  
   - Get **Sepolia test ETH** from a [faucet](https://sepoliafaucet.com/) to that address.  
   - In Remix, install the “Remix Account” or “Private Key” plugin, or use an environment that lets you paste a private key to sign transactions. Then deploy as usual.

3. **Use the app without a real contract**  
   If you don’t deploy yet, the app still works: the **Credentials** page shows **sample data** when the contract address is missing or the read fails. You can present the thesis UI and add the real contract later.

### After the contract is deployed

1. Copy the **deployed contract address** (e.g. `0xAbc...`).
2. In the **project root** (same folder as `package.json`), create or edit **`.env`**:

```bash
VITE_HAU_VAULT_ADDRESS=0xYourDeployedContractAddress
```

3. Restart the dev server: `npm run dev`.
4. In the app, open **Credentials**, enter a **Student ID** equal to a **token ID** you issued (e.g. `1`), and click **Search credentials**. The app will read from the contract and show the on-chain credential.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
