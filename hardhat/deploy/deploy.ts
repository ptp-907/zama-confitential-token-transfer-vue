import hre from "hardhat";

async function main() {
  console.log("Deploying Confidential USDT (CwUSDT) contracts...");
  // const mockUsdtAddress = "0x7E1DC0898cee5C1c738073020C3e24B4F34a4ACF"; // Replace with your MockUSDT address
  
  // // Deploy MockUSDT first
  console.log("\nDeploying MockUSDT contract...");
  const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
  const mockUsdt = await MockUSDT.deploy(hre.ethers.parseUnits("1000000", 18));
  await mockUsdt.waitForDeployment();
  const mockUsdtAddress = await mockUsdt.getAddress();
  console.log(`MockUSDT contract deployed to: ${mockUsdtAddress}`);
  
  // Deploy CwUSDT (Confidential USDT)
  console.log("Deploying CwUSDT contract...");
  const CwUSDT = await hre.ethers.getContractFactory("CwUSDT");
  const cwUsdt = await CwUSDT.deploy(mockUsdtAddress);
  await cwUsdt.waitForDeployment();
  const cwUsdtAddress = await cwUsdt.getAddress();
  console.log(`CwUSDT contract deployed to: ${cwUsdtAddress}`);
  
  console.log("\n=== Deployment Summary ===");
  console.log(`MockUSDT: ${mockUsdtAddress}`);
  console.log(`CwUSDT: ${cwUsdtAddress}`);
  console.log("\nContracts successfully deployed!");
}

// Export the main function for hardhat-deploy
export default main;