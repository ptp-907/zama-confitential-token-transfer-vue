# 🔐 ZAMA Confidential Token Transfer - Vue Application

A Vue 3 application enabling encrypted token transfers using ZAMA's Fully Homomorphic Encryption (FHE) on the Ethereum Sepolia testnet. This showcase demonstrates secure, privacy-preserving token transactions with encrypted state management.

## 🚀 **Quick Start**

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:5173
```

## ✨ **Features**

- ✅ **Encrypted Token Transfers** - USDT transfers with FHE encryption
- ✅ **Confidential Account Overview** - Encrypted balance tracking
- ✅ **Secure Deposits & Withdrawals** - Privacy-preserving transactions
- ✅ **Transaction History** - Encrypted transaction logs
- ✅ **Real FHEVM Integration** - Sepolia testnet with cdnjs SDK
- ✅ **EIP-712 User Decryption** - Secure authentication & decryption
- ✅ **Modern Vue 3** - Composition API with TypeScript
- ✅ **Beautiful UI** - Zama theme with responsive design

## 🔧 **Tech Stack**

- **Vue 3** - Progressive JavaScript framework with Composition API
- **TypeScript** - Full type safety and better IDE support
- **Vite** - Next-generation frontend tooling
- **Ethers.js v6** - Ethereum interactions and smart contract communication
- **fhevm-sdk** - Local FHEVM SDK for encryption/decryption
- **Tailwind CSS** - Utility-first CSS framework (via inline styles)

## 🏗️ **Project Structure**

```
src/
├── App.vue                           # Main application component
├── main.ts                           # Application entry point
├── App.css                           # Global styles
├── lib/
│   └── fhevm.js                     # FHEVM utility functions
├── components/
│   ├── AccountOverview.vue          # Display encrypted balances
│   ├── DepositToken.vue             # Deposit USDT to cwUSDT
│   ├── SecureTransfer.vue           # Encrypted token transfers
│   ├── TransactionHistory.vue       # View transaction logs
│   └── WithdrawToken.vue            # Withdraw from cwUSDT to USDT
├── composables/
│   ├── useAccountData.ts            # Account balance & data management
│   ├── useCryptoContracts.ts        # Smart contract interactions
│   └── useTransactionHistory.ts     # Transaction history management
├── config/
│   └── contracts.ts                 # Contract addresses & ABIs
└── types/
    └── (auto-generated hardhat types)
```

## 💡 **Core Components**

### **AccountOverview**
Displays encrypted account information including:
- Wallet address connection status
- Encrypted USDT balance
- Encrypted cwUSDT (confidential wrapped USDT) balance
- Network information

### **DepositToken**
Enables users to:
- Deposit USDT into the cwUSDT confidential contract
- Encrypt deposit amounts using FHEVM
- Monitor transaction status

### **SecureTransfer**
Core secure transfer functionality:
- Encrypted recipient address input
- Encrypted transfer amount
- FHE-powered transaction execution
- Transaction status tracking

### **WithdrawToken**
Allows withdrawal operations:
- Withdraw cwUSDT back to USDT
- Encrypted withdrawal amounts
- Balance validation

### **TransactionHistory**
View and track:
- All encrypted transactions
- Transaction timestamps
- Transaction status
- Amount details

## 🎯 **Composables**

Vue composables handle business logic:

- **`useAccountData`** - Fetch and cache encrypted account balances
- **`useCryptoContracts`** - Manage FHEVM contract instances and interactions
- **`useTransactionHistory`** - Retrieve and filter transaction history

## 📋 **Smart Contracts**

### **USDT Contract**
- Standard ERC-20 token interface
- Address: `0xd4A46c0E812e3Ba4f533Bb41f26DB45597ECDfAA` (Sepolia)

### **cwUSDT (Confidential Wrapped USDT)**
- Encrypted balance management
- Address: `0xdaBFb471cadB73D1aa31bA7f2a25c5B59aD33CED` (Sepolia)

### **Network Configuration**
- **Active Network:** Sepolia testnet
- **Chain ID:** 11155111
- **Network Name:** Ethereum Sepolia

Switch networks in `src/config/contracts.ts`:
```typescript
export const ACTIVE_NETWORK: NetworkType = 'sepolia' // or 'localhost'
```

## 🔐 **FHEVM Security Features**

- **End-to-End Encryption** - All sensitive data encrypted client-side
- **EIP-712 Signing** - Secure user decryption requests
- **Homomorphic Operations** - Computations on encrypted data
- **Privacy Preservation** - Contract state remains encrypted
- **CDN-based SDK** - Latest FHEVM operations via Zama's CDN

## 🛠️ **Development Commands**

```bash
# Install dependencies
pnpm install

# Start development server (Vite)
pnpm dev

# Build for production
pnpm build

# Preview production build locally
pnpm preview

# Type checking
pnpm type-check

# Lint TypeScript
pnpm lint
```

## 🔗 **Wallet Integration**

The application supports:
- **MetaMask** - Primary wallet provider
- **Other EIP-1193 compatible wallets**

### Connect Wallet:
1. Click "Connect Wallet" in the header
2. Approve MetaMask connection
3. Ensure you're on Sepolia testnet
4. Start making encrypted transactions

## 📦 **Dependencies**

| Package | Version | Purpose |
|---------|---------|---------|
| `vue` | ^3.4.0 | Vue 3 framework |
| `ethers` | ^6.13.1 | Ethereum interactions |
| `fhevm-sdk` | local | FHEVM encryption/decryption |
| `typescript` | ^5.0.0 | Type safety |
| `vite` | ^5.0.0 | Build tooling |

## 🌐 **Network Information**

- **Testnet:** Ethereum Sepolia
- **ChainID:** 11155111
- **Contract Addresses:** See `src/config/contracts.ts`
- **FHEVM SDK:** CDN-hosted from Zama

## 📱 **User Workflow**

1. **Connect Wallet** → Link MetaMask to application
2. **View Account** → See encrypted balance overview
3. **Deposit Tokens** → Transfer USDT to cwUSDT contract
4. **Transfer Securely** → Send encrypted token amounts
5. **Withdraw Funds** → Convert cwUSDT back to USDT
6. **Check History** → Review encrypted transaction logs

## 🎨 **UI/UX Features**

- **Real-time Status Indicators** - Network and FHEVM status
- **Glass-morphism Design** - Modern card-based layout
- **Responsive Layout** - Works on desktop and tablet
- **Error Handling** - User-friendly error messages
- **Transaction Feedback** - Progress indicators and confirmations
- **Accessible Colors** - Zama theme (yellow/gold & black)

## 🔄 **State Management**

The application uses Vue's Composition API with:
- Local reactive state via `ref()` and `reactive()`
- Shared composables for cross-component data
- FHEVM instance caching
- Contract instance management

## ⚙️ **Configuration**

Edit `src/config/contracts.ts` to:
- Change active network (localhost/sepolia)
- Update contract addresses
- Modify contract ABIs
- Configure chain IDs

## 🚨 **Important Notes**

- **Testnet Only** - Currently configured for Sepolia testnet
- **Requires MetaMask** - Wallet connection is mandatory
- **Sufficient Gas** - Ensure account has ETH for gas fees
- **USDT Balance** - Deposit at least some USDT to test transfers
- **Network Switching** - Application validates correct network

## 🎉 **Success Metrics**

- ✅ **Encrypted Transactions** - All transfers use FHEVM encryption
- ✅ **Real Contract Integration** - Live Sepolia testnet interaction
- ✅ **Multi-component Architecture** - Modular, maintainable code
- ✅ **Type Safety** - Full TypeScript coverage
- ✅ **User-friendly Interface** - Intuitive, responsive UI
- ✅ **Privacy-First Design** - Sensitive data always encrypted

## 📚 **Resources**

- [ZAMA Documentation](https://docs.zama.ai/)
- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Vue 3 Guide](https://vuejs.org/)
- [Ethers.js Documentation](https://docs.ethers.org/v6/)
- [Ethereum Sepolia Testnet](https://sepolia.etherscan.io/)

## 📄 **License**

This project is part of ZAMA's confidential computing showcase.

---

**Secure, Private, Encrypted Token Transfers with FHEVM** 🔐
