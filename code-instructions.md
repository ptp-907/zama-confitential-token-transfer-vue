
# Project Code Instructions

This document is the authoritative developer handbook for this repository. It describes the project architecture, coding conventions, how the frontend communicates with FHE-enabled smart contracts, FHEVM SDK usage patterns, and step-by-step guidelines for extending the codebase with new fully-encrypted features.

> Location: `code-instructions.md` (root)

**NOTE:** References in this file use the repository relative paths like `src/...`, `hardhat/contracts/...`, and `fhevm-sdk/...`.

**Contents**
- **A. Project Architecture Overview**
- **B. Library Usage Guide**
- **C. Frontend - Smart Contract Communication Flow**
- **D. FHEVM Feature Set (based on project)**
- **E. Coding Conventions**
- **F. Best Practices**
- **G. Extension Guidelines**


**A. Project Architecture Overview**

- **Top-level folders**
	- `src/` - Vue 3 frontend source. Key files:
		- `src/main.ts` - App entry (mounts `App.vue`).
		- `src/App.vue` - Main UI shell and wallet/FHEVM orchestration.
		- `src/components/` - Feature components: `FheCounter.vue`, `FheRatings.vue`, `FheVoting.vue`.
		- `src/lib/fhevm.js` - Lightweight wrapper around the Universal FHEVM SDK used by the frontend.
	- `hardhat/` - Smart contract project and tests built with Hardhat.
		- `hardhat/contracts/` - Solidity contracts: `FHECounter.sol`, `ReviewCardsFHE_uint32.sol`, `SimpleVoting_uint32.sol`.
	- `fhevm-sdk/` - Local `fhevm-sdk` package used as dependency (file: `./fhevm-sdk`).
	- `deploy/` (if present) - deployment scripts / types (not required by dev flow here; some repos use `deploy/` for scripts).

- **High-level module descriptions**
	- UI Shell (`src/App.vue`): wallet connect, network switching, FHEVM initialization, global messages, wires main components.
	- Feature components: each implements an encrypted feature using the same pattern:
		- `FheCounter.vue` — encrypted counter read/increment/decrement (EIP-712 user decryption + encrypted inputs).
		- `FheRatings.vue` — encrypted rating cards with public decryption to reveal stats.
		- `FheVoting.vue` — yes/no encrypted voting using oracle-style reveal with events and callback verification.
	- FHE helper (`src/lib/fhevm.js`): initialization, createEncryptedInput, decrypt helpers, requestUserDecryption, decryptMultipleHandles.

- **Data flow (text-based diagram)**

	Frontend (Vue) --> Wallet (MetaMask) --> ethers.BrowserProvider --> Smart Contract (Sepolia)
				 | 
				 +--> FHEVM SDK (browser CDN via `src/lib/fhevm.js`) -- encrypt/decrypt operations (createEncryptedInput, publicDecrypt, userDecrypt)
				 |
				 +--> Contract events (e.g., `TallyRevealRequested`) -> frontend decrypts handles -> frontend calls `resolveTallyCallback` with `cleartexts` + `decryptionProof`


**B. Library Usage Guide**

- **FHEVM SDK (`src/lib/fhevm.js`)**
	- Initialization: call `initializeFheInstance()` after wallet connection. It expects window.ethereum and a CDN-provided RelayerSDK (`window.RelayerSDK`). This loads WASM and creates the FHEVM instance.
	- Encrypting inputs: use `createEncryptedInput(contractAddress, userAddress, value)` which:
		- Creates an encrypted input handle via `fhe.createEncryptedInput(contractAddress, userAddress)`.
		- Adds value digits with `add32`, `add8`, etc., then `encrypt()`.
		- Returns an object with `encryptedData` (handle) and `proof` for contract calls.
	- Public decryption: `publicDecrypt(handle)` used for handles made publicly decryptable by the contract (e.g., ratings sum/count, review cards). Returns numeric values (handles SDK differences) and contains logic to normalize BigInt results.
	- User (EIP-712) decryption: `requestUserDecryption(contractAddress, signer, ciphertextHandle)` generates a keypair, builds an EIP-712 typed-data object from the relayer SDK, and uses `signer.signTypedData` to produce the signature required by `relayer.userDecrypt`.
	- Batch decryption: `decryptMultipleHandles(contractAddress, signer, handles)` returns `{ cleartexts, decryptionProof, values }` for ABI encoding and later `resolveTallyCallback`.

- **ethers.js (v6)**
	- Provider: use `new ethers.BrowserProvider(window.ethereum)` for MetaMask in the browser.
	- Signer: `await provider.getSigner()` for EIP-712 signing and transaction sending.
	- Contracts: `new ethers.Contract(address, abi, providerOrSigner)` where ABI reproduces contract interface (see components where small ABIs are embedded).
	- Transactions: calling state-changing functions requires passing a `Signer`-connected contract to execute `contract.method(...args)` followed by `tx.wait()`.

- **Wallet connection and signer management**
	- Wallet connect flow lives in `src/App.vue`: request accounts (`ethereum.request({ method: 'eth_requestAccounts' })`), read chain id via `eth_chainId`, then set `account` and `chainId` reactive variables.
	- After connect, `initializeFheInstance()` is called to set up FHEVM.
	- For actions needing signatures (EIP-712 or transactions), create provider and signer locally inside the component:

		- `const provider = new ethers.BrowserProvider(window.ethereum)`
		- `const signer = await provider.getSigner()`

- **Common utilities & helpers**
	- Keep all FHEVM-specific logic in `src/lib/fhevm.js`.
	- Components import only high-level helpers: `createEncryptedInput`, `decryptValue`, `publicDecrypt`, `decryptMultipleHandles` to keep components focused on UI and contract calls.


**C. Frontend - Smart Contract Communication Flow**

- **Contract initialization pattern**
	- Use minimal ABIs within components (only functions/events used).
	- Use `ethers.BrowserProvider` for read-only calls and the `Signer` for write calls.

- **Encrypt-before-call pattern**
	- Steps:
		1. Prepare value(s) to encrypt.
		2. Call `createEncryptedInput(contractAddress, account, value)` which returns `{ encryptedData, proof }`.
		3. Call contract write method with `encryptedData` and `proof` (for example `contract.increment(encryptedData, proof)`).
		4. Wait for `tx.wait()` and handle UX states (busy / success / error).

- **Decrypt-after-read pattern**
	- Read encrypted handle from contract: `const handle = await contract.getCount()`.
	- If decryption must be public (contract made it publicly decryptable): call `publicDecrypt(handle)`.
	- If decryption must be done by the user (EIP-712): call `decryptValue(handle, contractAddress, signer)` which signs typed data and requests user decryption.

- **Event listeners pattern**
	- Oracle-style flow (used in `FheVoting.vue`):
		1. Creator calls `requestTallyReveal(sessionId)` which makes handles publicly decryptable and emits `TallyRevealRequested(sessionId, yesHandle, noHandle)`.
		2. Frontend finds relevant event (from receipt or via `queryFilter`), parses handles, calls `decryptMultipleHandles(…)`.
		3. Frontend submits `resolveTallyCallback(sessionId, cleartexts, decryptionProof)` to contract.
	- Use `contract.queryFilter(filter)` or read logs from a transaction receipt, then `contract.interface.parseLog(log)` to decode logged event data when necessary.

- **Auto-refresh flow**
	- After write transactions finish (confirmed), components call loaders to refresh read state (e.g., `loadCards()`, `loadSessions()`, or `getCount()`).
	- Use `props.onMessage()` pattern to bubble small UI messages from components to `App.vue`.

- **State management conventions**
	- No global store (Vuex/Pinia) in this codebase: components keep local reactive state and `App.vue` orchestrates wallet/fhevm state.
	- Pass `account`, `chainId`, `isConnected`, `fhevmStatus` down as props.


**D. FHEVM Feature Set (based on project)**

- **Encrypted Counter (`FHECounter`)**
	- Read: `getCount()` returns `euint32` as `bytes32` handle.
	- Decrypt: use EIP-712 user decryption (`decryptValue`) to let the user decrypt their handle.
	- Update: create encrypted input for `1` and call `increment`/`decrement` with the encrypted handle + proof.
	- Contract operations use `FHE.fromExternal`, `FHE.add`/`FHE.sub`, `FHE.allowThis`, `FHE.allow`.

- **Encrypted Ratings (`FheRatings`)**
	- Each card keeps encrypted sum and encrypted count (`euint32`). Contract exposes `getEncryptedStats(cardId)` returning bytes32 handles.
	- Frontend calls `publicDecrypt(handle)` for handles that the contract ensured are publicly decryptable.
	- Average calculation performed on the frontend after decryption: `average = sum / count`.
	- Submitting a rating: encrypt the rating value (1..5) and call `submitEncryptedRating(cardId, encryptedData, proof)`.

- **Encrypted Voting (`FheVoting`)**
	- Votes are encrypted as 0/1.
	- After voting ends the creator calls `requestTallyReveal`, which `makePubliclyDecryptable` on tally handles and emits `TallyRevealRequested` with handles.
	- Frontend decrypts both handles with `decryptMultipleHandles`, then calls `resolveTallyCallback(sessionId, cleartexts, decryptionProof)`.
	- Contract verifies the proof with `FHE.checkSignatures(handles, cleartexts, proof)` before storing final tallies.

- **How to extend to new fully-encrypted features**
	- Pattern to follow: store encrypted values on-chain as `euint32` (or appropriate e-type), provide getters that return handles (bytes32), make values decryptable (publicly via `FHE.makePubliclyDecryptable` or via user decryption), and provide write entrypoints that accept `externalEuint32` + `bytes proof`.


**E. Coding Conventions**

- **Component structure rules**
	- Use single-file components (`.vue`) with `<script setup lang="ts">`.
	- Components should be focused: handle UI and contract interactions for a single feature.
	- Keep FHE logic in `src/lib/fhevm.js` and import helper functions; components should not reimplement SDK-specific details.

- **Naming rules**
	- Files & components: PascalCase for Vue components and filenames (`FheCounter.vue`, `FheVoting.vue`).
	- JS/TS variables & functions: camelCase (`createEncryptedInput`, `decryptMultipleHandles`).
	- Contract functions and solidity artifacts keep their original names; components embed small ABIs using the contract function names.

- **Common composables / patterns**
	- No global composables in repo yet; prefer keeping small helpers in `src/lib/fhevm.js`.
	- Use local helper functions inside components for contract ABI and calls.

- **Error/loading UX**
	- Each component uses boolean reactive flags: `isLoading`, `isDecrypting`, `isIncrementing`, etc.
	- Use `props.onMessage('...')` to show short user messages in the main app area.
	- On errors: log with `console.error` and show a user-friendly message via `props.onMessage`.

- **API/contract call wrapping style**
	- Read calls use provider-only contracts.
	- Write calls use signer-connected contracts and always `await tx.wait()`.
	- Use try/catch with final `finally` to reset loading flags.


**F. Best Practices**

- **Security**
	- Never log decrypted plaintexts in persistent logs. Temporary console logs for debugging are OK during development but must be removed before production.
	- Avoid storing secrets or private keys in the frontend. The relayer keypair is generated in the SDK and used transiently during user decryption.

- **Chain validation**
	- Validate `chainId` and compare with `CONTRACT_ADDRESSES` mapping before calling contracts.
	- Prompt the user to switch networks and use `wallet_switchEthereumChain` / `wallet_addEthereumChain` as implemented in `App.vue`.

- **Key invalidation & proof verification**
	- When using `userDecrypt`, ensure your UX informs users about why they must sign EIP-712 typed data.
	- For oracle-style reveals, always submit `cleartexts` (ABI-encoded) plus `decryptionProof` and rely on contract `FHE.checkSignatures(...)` for onchain verification.

- **Use events instead of polling (when possible)**
	- The reveal pattern relies on `TallyRevealRequested` event. The frontend reads the event from the transaction receipt or via `queryFilter` and proceeds to decrypt handles.
	- Prefer event-driven flows for finalization steps (reveal, resolution, callback) rather than naive polling.


**G. Extension Guidelines**

Below are step-by-step instructions for common extension tasks. Follow existing patterns exactly to keep consistency.

- **Add a new encrypted feature (frontend + contract)**
	1. Create Solidity contract functions mirroring patterns in `ReviewCardsFHE_uint32.sol` or `SimpleVoting_uint32.sol`. Use `euintXX` types, `FHE.fromExternal`, `FHE.allowThis`, `FHE.allow`, and `FHE.makePubliclyDecryptable` as needed.
	2. Deploy the contract via your preferred Hardhat script. Ensure you add the new address to the `CONTRACT_ADDRESSES` mapping in `src/App.vue` or a config file.
	3. Add a new Vue component `src/components/YourFeature.vue` following the structure of `FheCounter.vue` or `FheRatings.vue`:
		 - Minimal ABI for functions you need.
		 - Use `createEncryptedInput(contractAddress, account, value)` for encrypt-before-call.
		 - Use `publicDecrypt(handle)` or `decryptValue(handle, contractAddress, signer)` for decrypt-after-read.
	4. Add UI wiring to `App.vue` (import component; conditionally show when `isConnected && fhevmStatus === 'ready'`).

- **Add a new contract ABI**
	- If you need only a few methods/events, embed a minimal ABI array in the component like existing components. For more complexity, create a shared `src/contracts/` helper module exporting ABIs.

- **Integrate new encrypt/decrypt logic**
	- Add any bespoke encryption helper to `src/lib/fhevm.js`. Export the function and import it from components.
	- Keep SDK initialization (`initializeFheInstance`) centralized and call it once after wallet connect.


Appendix — Useful Patterns (snippets)

1) Contract read (provider):

```
const provider = new ethers.BrowserProvider(window.ethereum)
const contract = new ethers.Contract(contractAddress, ABI, provider)
const handle = await contract.getCount()
```

2) Encrypt + write (signer):

```
const provider = new ethers.BrowserProvider(window.ethereum)
const signer = await provider.getSigner()
const contract = new ethers.Contract(contractAddress, ABI, signer)
const encryptedInput = await createEncryptedInput(contractAddress, account, 1)
const tx = await contract.increment(encryptedInput.encryptedData, encryptedInput.proof)
await tx.wait()
```

3) EIP-712 user decryption (flow):

```
const provider = new ethers.BrowserProvider(window.ethereum)
const signer = await provider.getSigner()
const decrypted = await decryptValue(handle, contractAddress, signer)
```

4) Oracle-style reveal (event -> decryptMultipleHandles -> callback):

```
// after requestTallyReveal call and receipt
const parsed = contract.interface.parseLog(log)
const [yesHandle, noHandle] = [parsed.args.yesVotesHandle, parsed.args.noVotesHandle]
const result = await decryptMultipleHandles(contractAddress, signer, [yesHandle, noHandle])
await contract.resolveTallyCallback(sessionId, result.cleartexts, result.decryptionProof)
```


Final notes
- This repository uses `ethers` v6, Vue 3 Composition API and a CDN-based FHEVM SDK. Keep FHE-specific logic isolated in `src/lib/fhevm.js` and UI + contract calls in components.
- If you want, I can:
	- run a quick lint / type check, or
	- commit `code-instructions.md` and create a short PR message, or
	- add a small `CONTRIBUTING.md` with these condensed instructions.

-- End of Handbook

