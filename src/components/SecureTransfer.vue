<template>
    <div v-if="isConnected && fhevmStatus === 'ready'" class="glass-card">
        <div class="card-header">
            <div class="card-title">
                <svg class="card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <div>
                    <h2>Secure Transfer</h2>
                    <p class="card-subtitle">Send encrypted cWUSDT to another address</p>
                </div>
            </div>
        </div>
        <div class="card-content">
            <div class="demo-controls">
                <!-- Encrypted Balance Display -->
                <div class="control-group">
                    <div class="info-card border-purple-500/30">
                        <span class="info-label">Your Encrypted cWUSDT Balance</span>
                        <span v-if="isLoadingCwusdtBalance" class="info-value text-gray-400">Loading...</span>
                        <span v-else-if="cwUSDTError" class="info-value text-red-400">{{ cwUSDTError }}</span>
                        <span v-else-if="cwUSDTHandle" class="info-value code-text text-xs break-all">
                            {{ cwUSDTHandle.slice(0, 20) }}...{{ cwUSDTHandle.slice(-20) }}
                        </span>
                        <span v-else class="info-value text-gray-500">No encrypted balance</span>
                    </div>
                    
                    <!-- Decrypted Balance Display -->
                    <div v-if="decryptedBalance !== null" class="info-card border-green-500/30">
                        <span class="info-label">Available Balance</span>
                        <span class="info-value text-green-400">
                            {{ formatBalance(decryptedBalance) }} cWUSDT
                        </span>
                    </div>

                    <!-- Decrypt Button -->
                    <button 
                        v-if="cwUSDTHandle && decryptedBalance === null"
                        @click="handleDecryptBalance" 
                        :disabled="isDecrypting || !cwUSDTHandle"
                        class="btn-secondary w-full"
                    >
                        <svg v-if="isDecrypting" class="icon animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                            <path class="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <svg v-else class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        {{ isDecrypting ? 'Decrypting...' : 'Decrypt Balance' }}
                    </button>
                </div>

                <div class="divider"></div>

                <!-- Transfer Form -->
                <div class="control-group">
                    <!-- Recipient Address Input -->
                    <div class="input-group">
                        <label for="recipientAddress" class="input-label">Recipient Address</label>
                        <input 
                            id="recipientAddress"
                            v-model="recipientAddress" 
                            type="text" 
                            :disabled="isTransferring || isLoadingCwusdtBalance"
                            placeholder="0x..." 
                            class="input-field"
                            @input="validateRecipient"
                        />
                        <div v-if="recipientError" class="validation-error">
                            {{ recipientError }}
                        </div>
                    </div>

                    <!-- Amount Input -->
                    <div class="input-group">
                        <label for="transferAmount" class="input-label">Amount to Transfer</label>
                        <div class="input-wrapper">
                            <input 
                                id="transferAmount"
                                v-model="transferAmount" 
                                type="number" 
                                step="0.01"
                                min="0"
                                :disabled="isTransferring || isLoadingCwusdtBalance || decryptedBalance === null"
                                placeholder="0.0" 
                                class="input-field"
                                @input="validateAmount"
                            />
                            <button 
                                @click="setMaxAmount" 
                                :disabled="isTransferring || isLoadingCwusdtBalance || decryptedBalance === null"
                                class="btn-max"
                            >
                                MAX
                            </button>
                        </div>
                        <div class="input-footer justify-end">
                            <span v-if="isLoadingCwusdtBalance" class="text-sm text-gray-400">
                                Available: Loading...
                            </span>
                            <span v-else-if="cwUSDTError" class="text-sm text-red-400">
                                {{ cwUSDTError }}
                            </span>
                            <span v-else-if="decryptedBalance !== null" class="text-sm text-gray-400">
                                Available: {{ formatBalance(decryptedBalance) }} cWUSDT
                            </span>
                            <span v-else class="text-sm text-gray-500">
                                Decrypt balance first
                            </span>
                        </div>
                        <div v-if="validationError" class="validation-error">
                            {{ validationError }}
                        </div>
                    </div>
                </div>

                <div class="divider"></div>

                <!-- Transfer Info Notice -->
                <div class="transfer-notice">
                    <div class="notice-header">
                        <svg class="notice-icon" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                clip-rule="evenodd" />
                        </svg>
                        <span class="notice-title">Encrypted Transfer</span>
                    </div>
                    <p class="notice-text">
                        This transfer uses <strong>Fully Homomorphic Encryption (FHE)</strong> to keep the transfer amount private on-chain. 
                        The recipient will receive encrypted cWUSDT tokens.
                    </p>
                </div>

                <div class="control-group">
                    <button 
                        @click="handleTransferClick" 
                        :disabled="!canTransfer"
                        class="btn-primary w-full"
                    >
                        <svg v-if="isTransferring" class="icon animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                            <path class="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <svg v-else class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        {{ isTransferring ? transferringStatus : 'Send Encrypted Transfer' }}
                    </button>
                    
                    <div v-if="transferError" class="info-card border-red-500/30">
                        <span class="info-label">Error</span>
                        <span class="info-value text-red-400">{{ transferError }}</span>
                    </div>
                    
                    <div v-if="transferSuccess" class="info-card border-green-500/30">
                        <span class="info-label">Success</span>
                        <span class="info-value text-green-400">Transfer completed successfully!</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.input-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #e5e7eb;
}

.input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.input-field {
    flex: 1;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    color: #ffffff;
    font-size: 1rem;
    transition: all 0.3s ease;
}

.input-field:focus {
    outline: none;
    border-color: rgba(59, 130, 246, 0.5);
    background: rgba(255, 255, 255, 0.08);
}

.input-field:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.input-field::placeholder {
    color: rgba(255, 255, 255, 0.3);
}

/* Remove spinner for number input */
.input-field::-webkit-outer-spin-button,
.input-field::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.input-field[type=number] {
    -moz-appearance: textfield;
}

.btn-max {
    padding: 0.5rem 1rem;
    background: rgba(59, 130, 246, 0.2);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 0.375rem;
    color: #60a5fa;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-max:hover:not(:disabled) {
    background: rgba(59, 130, 246, 0.3);
    border-color: rgba(59, 130, 246, 0.5);
}

.btn-max:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-secondary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: rgba(168, 85, 247, 0.2);
    border: 1px solid rgba(168, 85, 247, 0.3);
    border-radius: 0.5rem;
    color: #c084fc;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-secondary:hover:not(:disabled) {
    background: rgba(168, 85, 247, 0.3);
    border-color: rgba(168, 85, 247, 0.5);
    transform: translateY(-1px);
}

.btn-secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}

.input-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0.25rem;
}

.validation-error {
    padding: 0.5rem 0.75rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 0.375rem;
    color: #fca5a5;
    font-size: 0.875rem;
}

.transfer-notice {
    padding: 1rem;
    background: rgba(59, 130, 246, 0.05);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 0.5rem;
}

.notice-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}

.notice-icon {
    width: 1.25rem;
    height: 1.25rem;
    color: #60a5fa;
}

.notice-title {
    color: #60a5fa;
    font-weight: 600;
    font-size: 0.875rem;
}

.notice-text {
    color: #9CA3AF;
    font-size: 0.75rem;
    line-height: 1.5;
}

.notice-text strong {
    color: #60a5fa;
}

.w-full {
    width: 100%;
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ethers } from 'ethers'
import { useAccountData } from '../composables/useAccountData'

// Props
interface Props {
  account: string
  chainId: number
  isConnected: boolean
  fhevmStatus: 'idle' | 'loading' | 'ready' | 'error'
  onMessage: (message: string) => void
}

const props = defineProps<Props>()

// Reactive state from composable
const {
    cwUSDTHandle,
    decryptedBalance,
    isLoadingCwusdtBalance,
    isTransferring,
    isDecrypting,
    cwUSDTError,
    handleDecrypt,
    handleTransfer,
    fetchCWUSDTEncryptedBalance
} = useAccountData({
    account: props.account,
    isConnected: props.isConnected,
    fhevmStatus: props.fhevmStatus,
    onMessage: props.onMessage
})

// Local component state
const recipientAddress = ref<string>('')
const transferAmount = ref<string>('')
const recipientError = ref<string | null>(null)
const validationError = ref<string | null>(null)
const transferError = ref<string | null>(null)
const transferSuccess = ref<boolean>(false)
const transferringStatus = ref<string>('Transferring...')

const canTransfer = computed(() => {
    const amount = parseFloat(transferAmount.value)
    return !isTransferring.value && 
           !isLoadingCwusdtBalance.value && 
           decryptedBalance.value !== null &&
           recipientAddress.value &&
           ethers.isAddress(recipientAddress.value) &&
           !recipientError.value &&
           amount > 0 && 
           amount <= (decryptedBalance.value / 1e18) &&
           !validationError.value
})

// Methods
const formatBalance = (balance: number): string => {
    return ethers.formatUnits(balance.toString(), 18)
}

const validateRecipient = () => {
    if (!recipientAddress.value) {
        recipientError.value = null
        return
    }
    
    if (!ethers.isAddress(recipientAddress.value)) {
        recipientError.value = 'Invalid Ethereum address.'
    } else if (recipientAddress.value.toLowerCase() === props.account.toLowerCase()) {
        recipientError.value = 'Cannot transfer to yourself.'
    } else {
        recipientError.value = null
    }
}

const validateAmount = () => {
    const amount = parseFloat(transferAmount.value)
    if (isNaN(amount) || amount <= 0) {
        validationError.value = 'Please enter a valid amount greater than 0.'
    } else if (decryptedBalance.value !== null && amount > (decryptedBalance.value / 1e18)) {
        validationError.value = 'Insufficient cWUSDT balance.'
    } else {
        validationError.value = null
    }
}

const setMaxAmount = () => {
    if (decryptedBalance.value !== null) {
        transferAmount.value = formatBalance(decryptedBalance.value)
        validateAmount()
    }
}

const handleDecryptBalance = async () => {
    try {
        await handleDecrypt()
    } catch (error) {
        console.error('Decryption failed:', error)
        props.onMessage(error instanceof Error ? error.message : 'Decryption failed')
    }
}

const handleTransferClick = async () => {
    if (!canTransfer.value) return
    
    validateRecipient()
    validateAmount()
    
    if (recipientError.value || validationError.value) return
    
    transferError.value = null
    transferSuccess.value = false
    
    try {
        const amount = parseFloat(transferAmount.value)
        await handleTransfer(recipientAddress.value, amount)
        
        transferSuccess.value = true
        props.onMessage('Encrypted transfer completed successfully!')
        
        // Reset form
        recipientAddress.value = ''
        transferAmount.value = ''
        setTimeout(() => {
            transferSuccess.value = false
            props.onMessage('')
        }, 3000)
        
    } catch (error) {
        console.error('Transfer failed:', error)
        transferError.value = error instanceof Error ? error.message : 'Transfer failed'
        props.onMessage(transferError.value)
    }
}

// Fetch encrypted balance on mount
onMounted(() => {
    if (props.isConnected && props.fhevmStatus === 'ready') {
        fetchCWUSDTEncryptedBalance()
    }
})

</script>
