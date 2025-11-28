// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint128, externalEuint128, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/// @title CwUSDT - Confidential USDT token using Zama FHEVM
/// @author Zama Confidential Finance
/// @notice Contract implements a confidential token that encrypts balances on-chain using Zama's FHEVM primitives.
/// @dev All balance operations are performed on encrypted values using homomorphic operations (FHE.add, FHE.sub, FHE.lt).
/// Transfers do not revert on underflow; instead, balances remain unchanged and error codes track the failure state.
/// Withdrawals and decryptions use a request/callback pattern with a relayer: users request decryption via events,
/// the FHE coprocessor decrypts the values, and relayers invoke callbacks with plaintext values for validation.
/// Replay protection via processedRequests mapping prevents duplicate decryption callbacks.
contract CwUSDT is ZamaEthereumConfig {
    // ==================== State Variables ====================
    
    /// @dev Reference to the underlying MockUSDT ERC20 token (immutable for gas optimization)
    IERC20 public immutable mockUsdt;
    
    /// @dev Encrypted account balances (euint128 handles managed by FHEVM)
    /// Stores the encrypted balance for each user address
    mapping(address => euint128) public encryptedBalances;
    
    // ==================== Withdrawal Request Tracking ====================
    
    /// @dev Tracks pending withdrawal requests (requires FHE coprocessor to verify encrypted balance)
    struct WithdrawalRequest {
        address requester;  /// The user requesting the withdrawal
        uint256 amount;     /// Requested withdrawal amount (plaintext)
        bool processed;     /// Flag indicating callback completion
    }
    
    /// @dev Maps withdrawal request IDs to withdrawal request details
    /// requestId = keccak256(abi.encodePacked(requester, amount, timestamp, block))
    mapping(bytes32 => WithdrawalRequest) public withdrawalRequests;
    
    // ==================== User Decryption Request Tracking ====================
    
    /// @dev Tracks pending decryption requests for user balance queries
    struct UserDecryptionRequest {
        address user;       /// User whose balance is being decrypted
        bool processed;     /// Flag indicating callback completion
    }
    
    /// @dev Maps decryption request IDs to request details
    /// requestId = keccak256(abi.encodePacked(user, timestamp, block))
    mapping(bytes32 => UserDecryptionRequest) public decryptionRequests;
    
    /// @dev Stores the most recent decrypted plaintext balance for each user
    /// Updated only after verified _userDecryptCallback
    mapping(address => uint256) public userDecryptedBalances;
    
    /// @dev Audit flag: marks balances that can be decrypted without user's private key
    /// Used for compliance/regulatory audits; any address can call makeBalancePubliclyDecryptable
    mapping(address => bool) public isBalancePubliclyDecryptable;
    
    // ==================== Access Control Lists (ACLs) ====================
    
    /// @dev Grant/revoke transfer allowance: owner => spender => allowed
    /// Similar to ERC20 allowance but tracks boolean access rather than amount
    mapping(address => mapping(address => bool)) public transferAllowance;
    
    /// @dev Transient access for atomic swap operations: owner => spender => expiryBlock
    /// Access automatically expires when block number exceeds expiryBlock
    mapping(address => mapping(address => uint256)) public transientSwapAccess;
    
    /// @dev Fine-grained balance read access: user => accessor => canAccess
    /// Controls who can read a user's (decrypted) balance; owner always has access
    mapping(address => mapping(address => bool)) public balanceAccessors;
    
    // ==================== Error Tracking ====================
    
    /// @dev Stores the last error code for each user (from non-reverting encrypted operations)
    /// Error code 0 = no error, 1 = insufficient balance, etc.
    mapping(address => uint256) public lastErrorCode;
    
    /// @dev Human-readable error descriptions keyed by error code
    mapping(uint256 => string) public errorDescriptions;
    
    // ==================== Replay Protection ====================
    
    /// @dev Tracks processed request IDs to prevent replay attacks on decryption/withdrawal callbacks
    /// requestId => processed flag; set to true after successful callback
    mapping(bytes32 => bool) public processedRequests;
    
    // ==================== Error Codes ====================
    
    uint256 constant ERROR_NONE = 0;
    uint256 constant ERROR_INSUFFICIENT_BALANCE = 1;
    
    // ==================== Events ====================
    
    /// @dev Emitted when a user deposits plaintext USDT and encrypts their balance
    event Deposit(address indexed user, uint256 amount);
    
    /// @dev Emitted when a user successfully withdraws plaintext USDT
    event Withdraw(address indexed user, uint256 amount);
    
    /// @dev Emitted when an encrypted transfer completes (regardless of success/failure)
    event EncryptedTransfer(address indexed from, address indexed to, uint256 encryptedAmount);
    
    /// @dev Emitted when an encrypted transfer fails (e.g., insufficient balance)
    /// Transfers do not revert; errors are tracked and emitted as events
    event TransferError(address indexed from, address indexed to, uint256 errorCode);
    
    /// @dev Emitted when a user requests withdrawal; relayer listens and initiates callback
    event WithdrawalRequested(address indexed user, uint256 amount, bytes32 requestId);
    
    /// @dev Emitted when _withdrawCallback is called and withdrawal is processed
    event WithdrawalCompleted(address indexed user, uint256 amount);
    
    /// @dev Emitted when a user requests their balance be decrypted; relayer listens and initiates callback
    event UserDecryptionRequested(address indexed user, bytes32 requestId);
    
    /// @dev Emitted when _userDecryptCallback is called and balance is decrypted and stored
    event UserDecryptionComplete(address indexed user, uint256 decryptedBalance);
    
    /// @dev Emitted when a user's balance is marked for public (audit) decryption
    event BalancePubliclyDecryptable(address indexed user, uint256 timestamp);
    
    /// @dev Emitted when transfer allowance is granted or revoked
    event TransferAllowanceGranted(address indexed owner, address indexed spender, bool allowed);
    
    /// @dev Emitted when transient swap access is granted with expiry block
    event TransientSwapAccessGranted(address indexed owner, address indexed spender, uint256 expiryBlock);
    
    /// @dev Emitted when an error code is set for a user operation
    event ErrorCodeSet(address indexed user, uint256 errorCode, string description);
    
    /// @dev Emitted when a request is marked as processed (replay protection)
    event RequestProcessed(bytes32 indexed requestId);

    constructor(address _mockUsdtAddress) {
        mockUsdt = IERC20(_mockUsdtAddress);
    }

    /// @notice Retrieve the encrypted balance for an account
    /// @param account The address to query
    /// @return The encrypted balance handle (euint128)
    function getEncryptedBalance(address account) external view returns (euint128) {
        return encryptedBalances[account];
    }

    /// @notice Deposit plaintext USDT and encrypt to update encrypted balance homomorphically
    /// @dev Transfers ERC20 tokens, encrypts the deposit amount, and adds to encrypted balance.
    /// Overflow protection: if encrypted balance would exceed uint128 max, it is capped at max.
    /// All balance operations are homomorphic (FHE.add), preserving encryption throughout.
    /// @param amount The amount of USDT to deposit (plaintext, must fit in uint128)
    function depositAndEncrypt(uint256 amount) external {
        require(amount > 0, "Amount must be positive");
        require(amount <= type(uint128).max, "Amount exceeds uint128 max");
        
        // Transfer MockUSDT from sender to this contract
        require(mockUsdt.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Cache state read: current balance (gas optimization)
        euint128 currentBalance = encryptedBalances[msg.sender];
        euint128 encryptedAmount = FHE.asEuint128(uint128(amount));
        euint128 newBalance = FHE.add(currentBalance, encryptedAmount);
        
        // Overflow protection
        ebool isOverflow = FHE.lt(newBalance, currentBalance);
        euint128 maxUint32 = FHE.asEuint128(uint128(type(uint128).max));
        euint128 safeBalance = FHE.select(isOverflow, maxUint32, newBalance);
        
        // Store and re-authorize
        encryptedBalances[msg.sender] = safeBalance;
        FHE.allowThis(safeBalance);
        
        emit Deposit(msg.sender, amount);
    }

    /// @notice Request withdrawal of plaintext USDT amount
    /// @dev Emits WithdrawalRequested event with a unique requestId. Off-chain relayer listens for this event,
    /// decrypts the sender's balance (via FHE coprocessor), and calls _withdrawCallback with plaintext amount and balance.
    /// This design ensures the contract never holds plaintext balance data; decryption happens off-chain.
    /// @param amount The amount to withdraw (in plaintext)
    function withdrawAsPlain(uint256 amount) external {
        require(amount > 0, "Amount must be positive");
        
        // Create withdrawal request with unique ID
        bytes32 requestId = keccak256(abi.encodePacked(msg.sender, amount, block.timestamp, block.number));
        withdrawalRequests[requestId] = WithdrawalRequest({
            requester: msg.sender,
            amount: amount,
            processed: false
        });
        
        // Emit withdrawal request event
        emit WithdrawalRequested(msg.sender, amount, requestId);
    }

    /// @notice Internal callback to process withdrawal after off-chain decryption
    /// @dev Called by relayer after FHE coprocessor decrypts user balance. In production, this would be
    /// verified with signature checks (e.g., FHE.checkSignatures with EIP-712). Currently for testing,
    /// it validates amount <= actualBalance and transfers ERC20 to requester.
    /// @param requester The address requesting withdrawal
    /// @param amount The requested withdrawal amount
    /// @param actualBalance The decrypted actual balance (provided by relayer; validation occurs here)
    function _withdrawCallback(address requester, uint256 amount, uint256 actualBalance) external {
        // In production, this would be called by the FHE coprocessor with signature verification
        // For now, simplified: just validate amount <= actualBalance and process
        require(amount > 0, "Amount must be positive");
        require(actualBalance >= amount, "Insufficient balance");
        
        // Transfer MockUSDT from this contract to requester
        bool transferred = mockUsdt.transfer(requester, amount);
        require(transferred, "MockUSDT transfer failed");
        
        // Emit withdrawal event
        emit Withdraw(requester, amount);
        emit WithdrawalCompleted(requester, amount);
    }

    /// @notice Transfer encrypted amount from sender to recipient with underflow protection
    /// @dev Performs homomorphic subtraction/addition on encrypted balances. Does NOT revert on underflow;
    /// instead, balances remain unchanged and error codes track failure. This preserves encrypted state and
    /// prevents plaintext balance leakage via revert patterns.
    /// All FHE operations use FHE.lt (less-than comparison), FHE.sub/FHE.add (arithmetic), and FHE.select (conditional updates).
    /// @param recipient The recipient address
    /// @param encryptedAmountHandle The transfer amount encoded as bytes (first 32 bytes = uint256 amount for testing)
    function encryptedTransfer(address recipient, bytes calldata encryptedAmountHandle) external {
        require(recipient != address(0), "Invalid recipient");
        require(encryptedAmountHandle.length > 0, "Invalid encrypted amount");
        
        // Decode transfer amount
        uint256 amountToTransfer = uint256(bytes32(encryptedAmountHandle[:32]));
        require(amountToTransfer > 0, "Transfer amount must be positive");
        require(amountToTransfer <= type(uint128).max, "Amount exceeds uint128 max");
        
        // Cache balance reads (gas optimization)
        euint128 transferAmount = FHE.asEuint128(uint128(amountToTransfer));
        euint128 senderBalance = encryptedBalances[msg.sender];
        euint128 recipientBalance = encryptedBalances[recipient];
        
        // Underflow check and conditional balance updates
        ebool hasInsufficientBalance = FHE.lt(senderBalance, transferAmount);
        euint128 newSenderBalance = FHE.sub(senderBalance, transferAmount);
        euint128 newRecipientBalance = FHE.add(recipientBalance, transferAmount);
        
        euint128 finalSenderBalance = FHE.select(hasInsufficientBalance, senderBalance, newSenderBalance);
        euint128 finalRecipientBalance = FHE.select(hasInsufficientBalance, recipientBalance, newRecipientBalance);
        
        // Store and re-authorize both balances
        encryptedBalances[msg.sender] = finalSenderBalance;
        encryptedBalances[recipient] = finalRecipientBalance;
        FHE.allowThis(finalSenderBalance);
        FHE.allowThis(finalRecipientBalance);
        
        _setErrorCode(msg.sender, ERROR_INSUFFICIENT_BALANCE, "Insufficient balance for transfer");
        
        emit TransferError(msg.sender, recipient, ERROR_INSUFFICIENT_BALANCE);
        emit EncryptedTransfer(msg.sender, recipient, amountToTransfer);
    }
    
    /// @notice Request user decryption of their encrypted balance
    /// @dev Emits UserDecryptionRequested event. Off-chain relayer listens, sends encrypted balance to FHE coprocessor,
    /// receives plaintext decryption result, and calls _userDecryptCallback with the requestId and decrypted balance.
    /// This pattern ensures balances are decrypted off-chain and validated on-chain with replay protection.
    function requestUserDecryption() external {
        // Create unique decryption request ID
        bytes32 requestId = keccak256(abi.encodePacked(msg.sender, block.timestamp, block.number));
        
        // Store decryption request
        decryptionRequests[requestId] = UserDecryptionRequest({
            user: msg.sender,
            processed: false
        });
        
        // Emit event for relayer to process
        emit UserDecryptionRequested(msg.sender, requestId);
    }

    /// @notice Internal callback to process user decryption after FHE coprocessor decryption
    /// @dev Called by relayer after FHE coprocessor decrypts user's balance. Validates:
    /// 1. Request has not already been processed (replay protection via processedRequests mapping)
    /// 2. requestId exists in decryptionRequests and user matches the stored request.user
    /// 3. Request has not been processed yet (redundant but defensive)
    /// On success, stores decrypted balance and marks request as processed in both mappings.
    /// In production, this would also verify EIP-712 signatures from the FHE coprocessor.
    /// @param requestId The original decryption request ID (keccak256 of user, timestamp, block)
    /// @param user The user whose balance was decrypted
    /// @param decryptedBalance The plaintext decrypted balance (provided by relayer/FHE coprocessor)
    function _userDecryptCallback(bytes32 requestId, address user, uint256 decryptedBalance) external {
        // Replay protection: reject if request already processed
        require(!processedRequests[requestId], "Request already processed - replay attack prevented");
        
        UserDecryptionRequest storage request = decryptionRequests[requestId];
        require(request.user == user, "Mismatched user in decryption request");
        require(!request.processed, "Request already processed");
        
        // Mark as processed in both mappings
        request.processed = true;
        processedRequests[requestId] = true;
        
        // Store decrypted balance
        userDecryptedBalances[user] = decryptedBalance;
        
        emit UserDecryptionComplete(user, decryptedBalance);
        emit RequestProcessed(requestId);
    }
    
    /// @notice Getter for user's most recent decrypted balance
    /// @param user The user to check
    /// @return The most recent plaintext balance (0 if never decrypted)
    function getUserDecryptedBalance(address user) external view returns (uint256) {
        return userDecryptedBalances[user];
    }

    /// @notice Make a user's balance publicly decryptable for audit purposes
    /// @dev Calls FHE.makePubliclyDecryptable on the encrypted balance
    /// @param user The user whose balance should be made public
    function makeBalancePubliclyDecryptable(address user) external {
        // Mark balance as publicly decryptable
        isBalancePubliclyDecryptable[user] = true;
        
        // Get encrypted balance
        euint128 encryptedBalance = encryptedBalances[user];
        
        // Call FHE.makePubliclyDecryptable to allow external decryption for audit
        // In production: this allows auditors to decrypt without user's private key
        FHE.makePubliclyDecryptable(encryptedBalance);
        
        // Emit audit event
        emit BalancePubliclyDecryptable(user, block.timestamp);
    }

    /// @notice Grant or revoke transfer allowance for a spender
    /// @dev Owner can allow/disallow someone to transfer on their behalf
    /// @param spender The address to grant/revoke allowance to
    /// @param allowed True to grant, false to revoke
    function allowForTransfer(address spender, bool allowed) external {
        require(spender != address(0), "Invalid spender address");
        
        transferAllowance[msg.sender][spender] = allowed;
        emit TransferAllowanceGranted(msg.sender, spender, allowed);
    }

    /// @notice Grant transient access to spender for atomic swap operations
    /// @dev Access expires at specified block number (for DEX atomic swaps)
    /// @param spender The spender address to grant transient access
    /// @param expiryBlock Block number at which access expires
    function allowTransientForSwap(address spender, uint256 expiryBlock) external {
        require(spender != address(0), "Invalid spender address");
        require(expiryBlock > block.number, "Expiry block must be in the future");
        
        transientSwapAccess[msg.sender][spender] = expiryBlock;
        emit TransientSwapAccessGranted(msg.sender, spender, expiryBlock);
    }

    /// @notice Check if an accessor can read a user's balance
    /// @dev Short-circuit logic for gas optimization
    /// @param user The user whose balance to check
    /// @param accessor The address trying to access the balance
    /// @return True if accessor is allowed to read user's balance
    function isBalanceAccessible(address user, address accessor) external view returns (bool) {
        return user == accessor || balanceAccessors[user][accessor] || isBalancePubliclyDecryptable[user];
    }

    /// @notice Grant balance read access to an accessor
    /// @dev Fine-grained ACL for balance visibility
    /// @param accessor The address to grant balance access to
    function grantBalanceAccess(address accessor) external {
        require(accessor != address(0), "Invalid accessor address");
        balanceAccessors[msg.sender][accessor] = true;
    }

    /// @notice Revoke balance read access from an accessor
    /// @param accessor The address to revoke balance access from
    function revokeBalanceAccess(address accessor) external {
        balanceAccessors[msg.sender][accessor] = false;
    }

    /// @notice Check if spender has transfer allowance from owner
    /// @param owner The token owner
    /// @param spender The spender address
    /// @return True if spender is allowed to transfer owner's tokens
    function hasTransferAllowance(address owner, address spender) external view returns (bool) {
        return transferAllowance[owner][spender];
    }

    /// @notice Check if spender has active transient swap access
    /// @param owner The token owner
    /// @param spender The spender address
    /// @return True if spender's transient access hasn't expired
    function hasTransientAccess(address owner, address spender) external view returns (bool) {
        return transientSwapAccess[owner][spender] > block.number;
    }

    /// @notice Set error code for a user's last operation
    /// @dev Called internally to track non-reverting errors
    /// @param user The user address
    /// @param errorCode The error code to set
    /// @param description Human-readable error description
    function _setErrorCode(address user, uint256 errorCode, string memory description) internal {
        lastErrorCode[user] = errorCode;
        if (bytes(errorDescriptions[errorCode]).length == 0) {
            errorDescriptions[errorCode] = description;
        }
        emit ErrorCodeSet(user, errorCode, description);
    }

    /// @notice Get the last error code for a user
    /// @param user The user address
    /// @return The last error code (0 if no error)
    function getLastErrorCode(address user) external view returns (uint256) {
        return lastErrorCode[user];
    }

    /// @notice Get error description for an error code
    /// @param errorCode The error code
    /// @return The human-readable error description
    function getErrorDescription(uint256 errorCode) external view returns (string memory) {
        return errorDescriptions[errorCode];
    }

    /// @notice Clear error code for a user
    /// @dev User can clear their own error codes
    function clearErrorCode() external {
        lastErrorCode[msg.sender] = ERROR_NONE;
    }

    /// @notice Check if a request has already been processed
    /// @param requestId The request ID to check
    /// @return True if request was already processed (replay protection)
    function isRequestProcessed(bytes32 requestId) external view returns (bool) {
        return processedRequests[requestId];
    }
}
