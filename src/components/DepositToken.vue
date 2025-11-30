<template>
    <div v-if="isConnected && fhevmStatus === 'ready'" class="glass-card">
        <div class="card-header">
            <div class="card-title">
                <svg class="card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <div>
                    <h2>Deposit USDT</h2>
                    <p class="card-subtitle">Convert USDT to encrypted cWUSDT tokens</p>
                </div>
            </div>
        </div>
        <div class="card-content">
            <div class="demo-controls">
                <div class="control-group">
                    <div class="input-group">
                        <label for="depositAmount" class="input-label">Amount to Deposit</label>
                        <div class="input-wrapper">
                            <input 
                                id="depositAmount"
                                v-model="depositAmount" 
                                type="number" 
                                step="0.01"
                                min="0"
                                :disabled="isDepositing || isLoadingUsdtBalance"
                                placeholder="0.0" 
                                class="input-field"
                                @input="validateAmount"
                            />
                            <button 
                                @click="setMaxAmount" 
                                :disabled="isDepositing || isLoadingUsdtBalance || !usdtBalance"
                                class="btn-max"
                            >
                                MAX
                            </button>
                        </div>
                        <div class="input-footer justify-end">
                            <span v-if="isLoadingUsdtBalance" class="text-sm text-gray-400">
                                Available: {{ !usdtBalance ? 'Loading...' : usdtBalance }} USDT
                            </span>
                            <span v-else-if="usdtError" class="text-sm text-red-400">
                                {{ usdtError }}
                            </span>
                            <span v-else-if="usdtBalance" class="text-sm text-gray-400">
                                Available: {{ usdtBalance }} USDT
                            </span>
                            <span v-else class="text-sm text-gray-500">
                                No balance available
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
                        @click="handleDepositClick" 
                        :disabled="!canDeposit"
                        class="btn-primary w-full"
                    >
                        <svg v-if="isDepositing" class="icon animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                            <path class="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <svg v-else class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        {{ isDepositing ? depositingStatus : 'Deposit to cwUSDT' }}
                    </button>
                    
                    <div v-if="depositError" class="info-card border-red-500/30">
                        <span class="info-label">Error</span>
                        <span class="info-value text-red-400">{{ depositError }}</span>
                    </div>
                    
                    <div v-if="depositSuccess" class="info-card border-green-500/30">
                        <span class="info-label">Success</span>
                        <span class="info-value text-green-400">Deposit completed successfully!</span>
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
import { ref, computed, onMounted, watch } from 'vue'
import { ethers } from 'ethers'
import { createEncryptedInput, publicDecrypt } from '../lib/fhevm'
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

// Reactive state
const {
    usdtBalance,
    isLoadingUsdtBalance,
    isDepositing,
    usdtError,
    handleDeposit,
    fetchUSDTBalance
} = useAccountData({
    account: props.account,
    isConnected: props.isConnected,
    fhevmStatus: props.fhevmStatus,
    onMessage: props.onMessage
})

// Fetch balance on mount
onMounted(() => {
    if (props.isConnected && props.fhevmStatus === 'ready') {
        fetchUSDTBalance()
    }
})

const depositAmount = ref<string>('')
const validationError = ref<string | null>(null)
const depositError = ref<string | null>(null)
const depositSuccess = ref<boolean>(false)
const depositingStatus = ref<string>('Depositing...')

const canDeposit = computed(() => {
    const amount = parseFloat(depositAmount.value)
    return !isDepositing.value && 
           !isLoadingUsdtBalance.value && 
           amount > 0 && 
           amount <= parseFloat(usdtBalance.value || '0') &&
           !validationError.value
})

// Methods
const validateAmount = () => {
    const amount = parseFloat(depositAmount.value)
    if (isNaN(amount) || amount <= 0) {
        validationError.value = 'Please enter a valid amount greater than 0.'
    } else if (usdtBalance.value && amount > parseFloat(usdtBalance.value)) {
        validationError.value = 'Insufficient USDT balance.'
    } else {
        validationError.value = null
    }
}

const setMaxAmount = () => {
    depositAmount.value = usdtBalance.value || '0'
    validateAmount()
}

const handleDepositClick = async () => {
    if (!canDeposit.value) return
    
    validateAmount()
    if (validationError.value) return
    
    depositError.value = null
    depositSuccess.value = false
    
    try {
        const amount = parseFloat(depositAmount.value)
        await handleDeposit(amount)
        
        depositSuccess.value = true
        props.onMessage('Deposit completed successfully!')
        
        // Reset form
        depositAmount.value = ''
        setTimeout(() => {
            depositSuccess.value = false
            props.onMessage('')
        }, 3000)
        
    } catch (error) {
        console.error('Deposit failed:', error)
        depositError.value = error instanceof Error ? error.message : 'Deposit failed'
        props.onMessage(depositError.value)
    }
}

</script>