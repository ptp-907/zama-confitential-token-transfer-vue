<template>
    <div v-if="isConnected && fhevmStatus === 'ready'" class="glass-card">
        <div class="card-header">
            <div class="card-title">
                <svg class="card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                    <h2>Account Overview</h2>
                    <p class="card-subtitle">Using REAL FHEVM SDK on Sepolia testnet</p>
                </div>
            </div>
        </div>
        <div class="card-content">
            <div class="demo-controls">
                <div class="control-group">
                    <div class="balance-header">
                        <h3>USDT Balance</h3>
                    </div>
                    <div v-if="isLoadingUsdtBalance" class="info-card border-gray-500/30">
                        <span class="info-label">Balance</span>
                        <span class="info-value code-text">{{ !usdtBalance ? 'Loading...' : usdtBalance }}</span>
                    </div>
                    <div v-else-if="usdtError" class="info-card border-red-500/30">
                        <span class="info-label">Error</span>
                        <span class="info-value text-red-400">{{ usdtError }}</span>
                    </div>
                    <div v-else-if="usdtBalance" class="info-card border-[#FFEB3B]/30">
                        <span class="info-label">Balance</span>
                        <span class="info-value code-text">{{ usdtBalance }}</span>
                    </div>
                    <div v-else class="info-card border-gray-500/30">
                        <span class="info-label">Balance</span>
                        <span class="info-value text-gray-500">No data</span>
                    </div>
                </div>

                <div class="divider"></div>

                <div class="control-group">
                    <div class="balance-header">
                        <h3>cWUSDT Balance</h3>
                    </div>
                    <div v-if="isLoadingCwusdtBalance" class="info-card border-gray-500/30">
                        <span class="info-label">Encrypted Handle</span>
                        <span class="info-value code-text">{{ !cwUSDTHandle ? 'Loading...' : cwUSDTHandle }}</span>
                    </div>
                    <div v-else-if="cwUSDTError" class="info-card border-red-500/30">
                        <span class="info-label">Error</span>
                        <span class="info-value text-red-400">{{ cwUSDTError }}</span>
                    </div>
                    <div v-else-if="cwUSDTHandle" class="info-card border-[#03A9F4]/30">
                        <span class="info-label">Encrypted Handle</span>
                        <span class="info-value code-text">{{ cwUSDTHandle }}</span>
                    </div>
                    <div v-else class="info-card border-gray-500/30">
                        <span class="info-label">Encrypted Handle</span>
                        <span class="info-value text-gray-500">No data</span>
                    </div>
                    
                    <button 
                        @click="handleDecrypt" 
                        :disabled="!cwUSDTHandle || isDecrypting || isLoadingCwusdtBalance"
                        class="btn-secondary w-full"
                    >
                        <svg v-if="isDecrypting" class="icon animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                            <path class="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <svg v-else class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        {{ isDecrypting ? 'Decrypting...' : 'Decrypt Balance' }}
                    </button>
                    
                    <div v-if="decryptionError" class="info-card border-red-500/30">
                        <span class="info-label">Decryption Error</span>
                        <span class="info-value text-red-400">{{ decryptionError }}</span>
                    </div>
                    <div v-else-if="decryptedBalance !== null" class="info-card">
                        <div class="info-row">
                            <span class="info-label">Decrypted Balance</span>
                            <span class="info-value result">{{ decryptedBalance }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
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

// Use account data composable
const {
    usdtBalance,
    cwUSDTHandle,
    decryptedBalance,
    isLoadingUsdtBalance,
    isLoadingCwusdtBalance,
    isDecrypting,
    usdtError,
    cwUSDTError,
    decryptionError,
    handleDecrypt
} = useAccountData({
    account: props.account,
    isConnected: props.isConnected,
    fhevmStatus: props.fhevmStatus,
    onMessage: props.onMessage
})

</script>
