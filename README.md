# OTP System

## Overview

This project implements an **OTP (One-Time Password) System** as a smart contract using Solidity. It leverages the **EIP-712 standard** for securely signing and verifying OTP requests, ensuring tamper-proof operations. The smart contract includes functionality to request, verify, and manage OTPs with expiration and usage tracking.

You could access more details here: https://drive.google.com/drive/folders/1uunj8ygJ5Tvdsl1GMLc4SeYMwQY3BtAR?usp=sharing

### Features

- Secure OTP generation and storage
- EIP-712 signature verification
- Expiration and usage validation for OTPs
- Event-driven architecture for request and verification

---

## Local Setup Guide

### Step 1: Compile Smart Contract

Run the following command to compile the smart contract in artifacts folder:

```bash
npx hardhat compile
```

### Step 2: Start the Local Blockchain

Run the following command to start a local blockchain using Hardhat:

```bash
npx hardhat node
```

### Step 3: Deploy the OTP Smart Contract

Use the **Hardhat Ignition** module

To deploy the contract locally:

```bash
yarn deploy-local
```

To deploy the contract on Sepolia network

```bash
yarn deploy-sepolia
```

after deployment, verify the contract

```bash
yarn verify:sepolia {YOUR_CONTRACT_ADDRESS}
```

### Step 4: Run docker and migrate sql scripts

```bash
docker-compose down -v

docker-compose up -d
```

### Step 5: Run service

```bash
yarn build

yarn start
```

## Running Tests

To test the OTP smart contract, execute the following command:

```bash
npx hardhat test
```
