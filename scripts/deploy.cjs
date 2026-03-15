const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const HAUVaultCredentials = await hre.ethers.getContractFactory("HAUVaultCredentials");
  const contract = await HAUVaultCredentials.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("HAUVaultCredentials deployed to:", address);
  console.log("\nAdd this to your .env file:");
  console.log("VITE_HAU_VAULT_ADDRESS=" + address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
