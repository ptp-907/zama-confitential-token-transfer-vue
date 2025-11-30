<template>
    <div v-if="isConnected && fhevmStatus === 'ready'" class="glass-card">
        <div class="card-header">
            <div class="card-title">
                <svg class="card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                    <h2>Transaction History</h2>
                    <p class="card-subtitle">Your cWUSDT transaction records</p>
                </div>
            </div>
            <button 
                @click="refreshHistory" 
                :disabled="isLoading"
                class="btn-secondary"
            >
                <svg v-if="isLoading" class="icon animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <svg v-else class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {{ isLoading ? 'Loading...' : 'Refresh' }}
            </button>
        </div>
        <div class="card-content">
            <!-- Loading State -->
            <div v-if="isLoading && transactions.length === 0" class="empty-state">
                <svg class="empty-icon animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p>Loading transaction history...</p>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="empty-state">
                <svg class="empty-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clip-rule="evenodd" />
                </svg>
                <p class="text-red-400">{{ error }}</p>
                <button @click="refreshHistory" class="btn-primary mt-4">Try Again</button>
            </div>

            <!-- Empty State -->
            <div v-else-if="transactions.length === 0" class="empty-state">
                <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No transactions found</p>
                <p class="text-sm text-gray-400 mt-2">Your cWUSDT transaction history will appear here</p>
            </div>

            <!-- Transactions List -->
            <div v-else class="transactions-list">
                <div 
                    v-for="(tx, index) in transactions" 
                    :key="`${tx.transactionHash}-${index}`"
                    class="transaction-item"
                    :class="getTransactionClass(tx.type)"
                >
                    <div class="transaction-icon">
                        <svg v-if="tx.type === 'deposit'" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 4v16m8-8H4" />
                        </svg>
                        <svg v-else-if="tx.type === 'withdraw' || tx.type === 'withdrawal_request'" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M20 12H4" />
                        </svg>
                        <svg v-else-if="tx.type === 'transfer_sent'" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        <svg v-else class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                        </svg>
                    </div>
                    
                    <div class="transaction-details">
                        <div class="transaction-header">
                            <span class="transaction-type">{{ getTransactionLabel(tx.type) }}</span>
                            <span class="transaction-amount" :class="getAmountClass(tx.type)">
                                {{ getAmountPrefix(tx.type) }}{{ tx.amount }} {{ tx.amount !== 'Encrypted' ? 'cWUSDT' : '' }}
                            </span>
                        </div>
                        
                        <div class="transaction-meta">
                            <span class="transaction-time">{{ formatTimestamp(tx.timestamp) }}</span>
                            <span v-if="tx.from && tx.type === 'transfer_received'" class="transaction-address">
                                From: {{ formatAddress(tx.from) }}
                            </span>
                            <span v-else-if="tx.to && tx.type === 'transfer_sent'" class="transaction-address">
                                To: {{ formatAddress(tx.to) }}
                            </span>
                        </div>
                        
                        <div class="transaction-footer">
                            <a 
                                :href="getExplorerLink(tx.transactionHash)" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                class="transaction-link"
                            >
                                <span>{{ formatHash(tx.transactionHash) }}</span>
                                <svg class="icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                            <span 
                                class="transaction-status"
                                :class="{
                                    'status-success': tx.status === 'success',
                                    'status-pending': tx.status === 'pending',
                                    'status-failed': tx.status === 'failed'
                                }"
                            >
                                {{ tx.status }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.btn-secondary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
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
}

.btn-secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.transactions-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.transaction-item {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    transition: all 0.2s ease;
}

.transaction-item:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.2);
}

.transaction-item.deposit {
    border-left: 3px solid #10B981;
}

.transaction-item.withdraw {
    border-left: 3px solid #F59E0B;
}

.transaction-item.transfer-sent {
    border-left: 3px solid #EF4444;
}

.transaction-item.transfer-received {
    border-left: 3px solid #3B82F6;
}

.transaction-item.withdrawal-request {
    border-left: 3px solid #8B5CF6;
}

.transaction-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    flex-shrink: 0;
}

.deposit .transaction-icon {
    background: rgba(16, 185, 129, 0.1);
    color: #10B981;
}

.withdraw .transaction-icon {
    background: rgba(245, 158, 11, 0.1);
    color: #F59E0B;
}

.transfer-sent .transaction-icon {
    background: rgba(239, 68, 68, 0.1);
    color: #EF4444;
}

.transfer-received .transaction-icon {
    background: rgba(59, 130, 246, 0.1);
    color: #3B82F6;
}

.withdrawal-request .transaction-icon {
    background: rgba(139, 92, 246, 0.1);
    color: #8B5CF6;
}

.transaction-icon .icon {
    width: 1.25rem;
    height: 1.25rem;
}

.transaction-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.transaction-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.transaction-type {
    font-size: 0.875rem;
    font-weight: 600;
    color: #E5E7EB;
}

.transaction-amount {
    font-size: 0.875rem;
    font-weight: 600;
}

.transaction-amount.positive {
    color: #10B981;
}

.transaction-amount.negative {
    color: #EF4444;
}

.transaction-amount.neutral {
    color: #8B5CF6;
}

.transaction-meta {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.transaction-time {
    font-size: 0.75rem;
    color: #9CA3AF;
}

.transaction-address {
    font-size: 0.75rem;
    color: #9CA3AF;
    font-family: monospace;
}

.transaction-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
}

.transaction-link {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: #60A5FA;
    text-decoration: none;
    font-family: monospace;
    transition: color 0.2s ease;
}

.transaction-link:hover {
    color: #93C5FD;
}

.icon-small {
    width: 0.875rem;
    height: 0.875rem;
}

.transaction-status {
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    letter-spacing: 0.05em;
}

.status-success {
    background: rgba(16, 185, 129, 0.1);
    color: #10B981;
}

.status-pending {
    background: rgba(245, 158, 11, 0.1);
    color: #F59E0B;
}

.status-failed {
    background: rgba(239, 68, 68, 0.1);
    color: #EF4444;
}

.mt-4 {
    margin-top: 1rem;
}
</style>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useTransactionHistory } from '../composables/useTransactionHistory'
import { NETWORK_NAME, EXPECTED_CHAIN_ID } from '../config/contracts'

// Props
interface Props {
  account: string
  chainId: number
  isConnected: boolean
  fhevmStatus: 'idle' | 'loading' | 'ready' | 'error'
  onMessage: (message: string) => void
}

const props = defineProps<Props>()

// Use transaction history composable
const {
    transactions,
    isLoading,
    error,
    fetchHistory
} = useTransactionHistory()

// Methods
const refreshHistory = async () => {
    if (!props.account) {
        props.onMessage('Please connect your wallet first')
        return
    }
    props.onMessage('Refreshing transaction history...')
    await fetchHistory(props.account)
    props.onMessage('Transaction history updated!')
    setTimeout(() => props.onMessage(''), 2000)
}

const getTransactionLabel = (type: string): string => {
    const labels = {
        'deposit': 'Deposit',
        'withdraw': 'Withdrawal',
        'transfer_sent': 'Transfer Sent',
        'transfer_received': 'Transfer Received',
        'withdrawal_request': 'Withdrawal Request'
    }
    return labels[type as keyof typeof labels] || type
}

const getTransactionClass = (type: string): string => {
    return type.replace('_', '-')
}

const getAmountPrefix = (type: string): string => {
    if (type === 'deposit' || type === 'transfer_received') {
        return '+'
    } else if (type === 'withdraw' || type === 'transfer_sent') {
        return '-'
    }
    return ''
}

const getAmountClass = (type: string): string => {
    if (type === 'deposit' || type === 'transfer_received') {
        return 'positive'
    } else if (type === 'withdraw' || type === 'transfer_sent') {
        return 'negative'
    }
    return 'neutral'
}

const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp * 1000)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
}

const formatAddress = (address: string): string => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const formatHash = (hash: string): string => {
    if (!hash) return ''
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`
}

const getExplorerLink = (hash: string): string => {
    const explorers = {
        11155111: 'https://sepolia.etherscan.io',
        31337: 'http://localhost:8545'
    }
    const baseUrl = explorers[EXPECTED_CHAIN_ID as keyof typeof explorers] || 'https://etherscan.io'
    return `${baseUrl}/tx/${hash}`
}

// Fetch history on mount
onMounted(() => {
    if (props.isConnected && props.fhevmStatus === 'ready' && props.account) {
        fetchHistory(props.account)
    }
})

// Watch for connection changes
watch([() => props.isConnected, () => props.fhevmStatus, () => props.account], ([connected, status, account]) => {
    if (connected && status === 'ready' && account) {
        fetchHistory(account)
    }
})

</script>
