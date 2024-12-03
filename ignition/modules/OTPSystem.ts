import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("OTPSystemDeployment", (m) => {
  // Define the contract deployment
  const otpSystem = m.contract("OTPSystem", []);

  return { otpSystem };
});
