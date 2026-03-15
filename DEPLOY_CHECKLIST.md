# Deploy checklist (fix "_safeMint" / "Contract reverted" when issuing)

The app shows that error when the **deployed** contract still uses `_safeMint`. The code in this repo uses `_mint`. You must deploy **this** version from Remix.

## 1. Use this project’s contract in Remix

1. Open **`contracts/HAUVaultCredentials.sol`** in your editor.
2. **Select all** (Ctrl+A) and **copy**.
3. In **Remix**, open the file you use for this contract.
4. **Select all** and **paste** (overwrite everything). **Save** (Ctrl+S).
5. In Remix, press **Ctrl+F** and search for **`_safeMint`**.
   - If you see any result → you still have the wrong file. Paste again from step 2.
   - If you see **no** result → the file has `_mint` and is correct.

## 2. Compile and deploy

1. **Solidity Compiler** tab → click **Compile**. Wait for “Compilation successful.”
2. **Deploy & Run** tab:
   - **Environment:** Injected Provider - MetaMask  
   - **Network:** Sepolia  
   - **Contract:** HAUVaultCredentials  
3. Click **Deploy** (or Deploy & Verify). Confirm in MetaMask.
4. After it succeeds, copy the **new contract address** from “Deployed Contracts.”

## 3. Point the app at the new contract

1. Open **`src/config.ts`** in this project.
2. Set **`HAU_VAULT_ADDRESS`** to the address you copied (in quotes):

   ```ts
   export const HAU_VAULT_ADDRESS =
     "0xYourNewAddressFromRemix" as `0x${string}`;
   ```

3. Save. Restart the dev server if it’s running (`npm run dev`).

## 4. Try again

- Open **Add credential**, connect the **same** MetaMask account you used to deploy, and issue a credential.
- The “contract may still use _safeMint” error should stop once the app is using the newly deployed contract that uses `_mint`.

## 5. Hosted site: images on all devices (Cloudinary)

If you deploy the frontend (e.g. Vercel, Netlify), images will only show on other devices (e.g. your phone) if Cloudinary is configured for the deployed build.

1. In your hosting provider, open the project, Settings, Environment variables.
2. Add: VITE_CLOUDINARY_CLOUD_NAME (your cloud name) and VITE_CLOUDINARY_UPLOAD_PRESET (your unsigned preset name).
3. Redeploy the site so the new build includes these env vars.
4. On the live site, open Add credential. You should see a green Cloud storage enabled banner. If you see Cloud storage not configured, the env vars were not set or the build did not pick them up.
5. New credentials issued with images will then show on any device. For existing credentials, use View all credentials, Edit, replace the images and save so the new cloud URLs are stored on-chain.
