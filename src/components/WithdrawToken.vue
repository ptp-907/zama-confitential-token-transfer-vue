<template>
    <div v-if="isConnected && fhevmStatus === 'ready'" class="glass-card">
        <div class="card-header">
            <div class="card-title">
                <svg class="card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <div>
                    <h2>Withdraw USDT</h2>
                    <p class="card-subtitle">Convert encrypted cWUSDT back to USDT</p>
                </div>
            </div>
        </div>
        <div class="card-content">
            <div class="demo-controls">
                <!-- Encrypted Balance Display -->
                <div class="control-group">
                    <div class="info-card border-purple-500/30">
                        <span class="info-label">Encrypted cWUSDT Balance</span>
                        <span v-if="isLoadingCwusdtBalance" class="info-value text-gray-400">Loading...</span>
                        <span v-else-if="cwUSDTError" class="info-value text-red-400">{{ cwUSDTError }}</span>
                        <span v-else-if="cwUSDTHandle" class="info-value code-text text-xs break-all">
                            {{ cwUSDTHandle.slice(0, 20) }}...{{ cwUSDTHandle.slice(-20) }}
                        </span>
                        <span v-else class="info-value text-gray-500">No encrypted balance</span>
                    </div>
                    
                    <!-- Decrypted Balance Display -->
                    <div v-if="decryptedBalance !== null" class="info-card border-green-500/30">
                        <span class="info-label">Decrypted Balance</span>
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

                <!-- Withdrawal Form -->
                <div class="control-group">
                    <div class="input-group">
                        <label for="withdrawAmount" class="input-label">Amount to Withdraw</label>
                        <div class="input-wrapper">
                            <input 
                                id="withdrawAmount"
                                v-model="withdrawAmount" 
                                type="number" 
                                step="0.01"
                                min="0"
                                :disabled="isWithdrawing || isLoadingCwusdtBalance === null"
                                placeholder="0.0" 
                                class="input-field"
                                @input="validateAmount"
                            />
                            <button 
                                @click="setMaxAmount" 
                                :disabled="isWithdrawing || isLoadingCwusdtBalance === null"
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

                <div class="control-group">
                    <button 
                        @click="handleWithdrawClick" 
                        :disabled="!canWithdraw"
                        class="btn-primary w-full"
                    >
                        <svg v-if="isWithdrawing" class="icon animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                            <path class="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <svg v-else class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        {{ isWithdrawing ? withdrawingStatus : 'Withdraw to USDT' }}
                    </button>
                    
                    <div v-if="withdrawError" class="info-card border-red-500/30">
                        <span class="info-label">Error</span>
                        <span class="info-value text-red-400">{{ withdrawError }}</span>
                    </div>
                    
                    <div v-if="withdrawSuccess" class="info-card border-green-500/30">
                        <span class="info-label">Success</span>
                        <span class="info-value text-green-400">Withdrawal completed successfully!</span>
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
    isWithdrawing,
    isDecrypting,
    cwUSDTError,
    handleDecrypt,
    handleWithdraw,
    fetchCWUSDTEncryptedBalance
} = useAccountData({
    account: props.account,
    isConnected: props.isConnected,
    fhevmStatus: props.fhevmStatus,
    onMessage: props.onMessage
})

// Local component state
const withdrawAmount = ref<string>('')
const validationError = ref<string | null>(null)
const withdrawError = ref<string | null>(null)
const withdrawSuccess = ref<boolean>(false)
const withdrawingStatus = ref<string>('Withdrawing...')

// const decryptedBalance = ref(110 * 1e18) // Placeholder for decrypted balance

const canWithdraw = computed(() => {
    const amount = parseFloat(withdrawAmount.value)
    return !isWithdrawing.value && 
           !isLoadingCwusdtBalance.value && 
           decryptedBalance.value !== null &&
           amount > 0 && 
           amount <= (decryptedBalance.value / 1e18) &&
           !validationError.value
})

// Methods
const formatBalance = (balance: number): string => {
    return ethers.formatUnits(balance.toString(), 18)
}

const validateAmount = () => {
    const amount = parseFloat(withdrawAmount.value)
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
        withdrawAmount.value = formatBalance(decryptedBalance.value)
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

const handleWithdrawClick = async () => {
    if (!canWithdraw.value) return
    
    validateAmount()
    if (validationError.value) return
    
    withdrawError.value = null
    withdrawSuccess.value = false
    
    try {
        const amount = parseFloat(withdrawAmount.value)
        await handleWithdraw(amount)
        
        withdrawSuccess.value = true
        props.onMessage('Withdrawal completed successfully!')
        
        // Reset form
        withdrawAmount.value = ''
        setTimeout(() => {
            withdrawSuccess.value = false
            props.onMessage('')
        }, 3000)
        
    } catch (error) {
        console.error('Withdrawal failed:', error)
        withdrawError.value = error instanceof Error ? error.message : 'Withdrawal failed'
        props.onMessage(withdrawError.value)
    }
}

// Fetch encrypted balance on mount
onMounted(() => {
    if (props.isConnected && props.fhevmStatus === 'ready') {
        fetchCWUSDTEncryptedBalance()
    }
})

</script>
