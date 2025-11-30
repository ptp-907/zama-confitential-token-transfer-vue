import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useCryptoContracts } from './useCryptoContracts'

export interface UseAccountDataOptions {
    account: string
    isConnected: boolean
    fhevmStatus: 'idle' | 'loading' | 'ready' | 'error'
    onMessage: (message: string) => void
}

/**
 * Composable for managing account data and balance polling
 */
export function useAccountData(options: UseAccountDataOptions) {
    const { account, isConnected, fhevmStatus, onMessage } = options

    // Reactive state
    const usdtBalance = ref<string>('')
    const cwUSDTHandle = ref<string>('')
    const decryptedBalance = ref<number | null>(null)
    const isLoadingUsdtBalance = ref(false)
    const isLoadingCwusdtBalance = ref(false)
    const isDepositing = ref(false)
    const isDecrypting = ref(false)
    const usdtError = ref<string>('')
    const cwUSDTError = ref<string>('')
    const decryptionError = ref<string>('')

    // Interval reference
    let balanceInterval: NodeJS.Timeout | null = null

    // Initialize contract interactions
    const contractInteractions = useCryptoContracts({
        account,
        isConnected,
        onMessage: (message: string) => {
            onMessage(message)
            setTimeout(() => onMessage(''), 5000)
        }
    })

    /**
     * Fetch USDT balance
     */
    const fetchUSDTBalance = async () => {
        if (!isConnected || fhevmStatus !== 'ready') return

        isLoadingUsdtBalance.value = true
        usdtError.value = ''

        try {
            const balance = await contractInteractions.getUSDTBalance()
            usdtBalance.value = balance
        } catch (error) {
            usdtError.value = error instanceof Error ? error.message : 'Failed to load balance'
            onMessage(usdtError.value)
        } finally {
            isLoadingUsdtBalance.value = false
        }
    }

    /**
     * Fetch confidential wrapped USDT encrypted balance
     */
    const fetchCWUSDTEncryptedBalance = async () => {
        if (!isConnected || fhevmStatus !== 'ready') return

        isLoadingCwusdtBalance.value = true
        cwUSDTError.value = ''

        try {
            const handle = await contractInteractions.getCWUSDTEncryptedBalance()
            cwUSDTHandle.value = handle
        } catch (error) {
            cwUSDTError.value = error instanceof Error ? error.message : 'Failed to load encrypted balance'
            onMessage(cwUSDTError.value)
        } finally {
            isLoadingCwusdtBalance.value = false
        }
    }

    /**
     * Fetch both balances simultaneously
     */
    const fetchBalances = async () => {
        if (!isConnected || fhevmStatus !== 'ready') return

        await Promise.all([
            fetchUSDTBalance(),
            fetchCWUSDTEncryptedBalance()
        ])
    }

    /**
     * Decrypt the encrypted balance
     */
    const handleDecrypt = async () => {
        if (!cwUSDTHandle.value) {
            onMessage('No encrypted balance to decrypt')
            return
        }

        isDecrypting.value = true
        decryptionError.value = ''

        try {
            const result = await contractInteractions.decryptBalance(cwUSDTHandle.value)
            decryptedBalance.value = result
            setTimeout(() => onMessage(''), 3000)
        } catch (error) {
            decryptionError.value = error instanceof Error ? error.message : 'Decryption failed'
            onMessage(decryptionError.value)
        } finally {
            isDecrypting.value = false
        }
    }

    /* Deposit handling */
    const handleDeposit = async (amount: number) => {
        if (!amount || amount <= 0) {
            throw new Error('Invalid deposit amount')
        }
        
        isDepositing.value = true
        try {
            await contractInteractions.handleDepositWithApproval(amount)
            onMessage('Deposit successful!')
            
            // Refresh balances after successful deposit
            await fetchBalances()
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Deposit failed'
            onMessage(errorMessage)
            throw error
        } finally {
            isDepositing.value = false
        }
    }

    /**
     * Start polling balances every 15 seconds
     */
    const startBalancePolling = () => {
        stopBalancePolling()
        fetchBalances() // Fetch immediately
        balanceInterval = setInterval(fetchBalances, 15000)
    }

    /**
     * Stop balance polling
     */
    const stopBalancePolling = () => {
        if (balanceInterval) {
            clearInterval(balanceInterval)
            balanceInterval = null
        }
    }

    // Watch for connection and FHEVM status changes
    watch([() => isConnected, () => fhevmStatus], ([connected, status]) => {
        if (connected && status === 'ready') {
            startBalancePolling()
        } else {
            stopBalancePolling()
        }
    })

    // Lifecycle hooks
    onMounted(() => {
        if (isConnected && fhevmStatus === 'ready') {
            startBalancePolling()
        }
    })

    onUnmounted(() => {
        stopBalancePolling()
    })

    return {
        // State
        cwUSDTHandle,
        decryptedBalance,
        isLoadingUsdtBalance,
        isLoadingCwusdtBalance,
        isDepositing,
        isDecrypting,
        usdtBalance,
        usdtError,
        cwUSDTError,
        decryptionError,
        
        // Methods
        fetchUSDTBalance,
        fetchCWUSDTEncryptedBalance,
        fetchBalances,
        handleDecrypt,
        handleDeposit,
        startBalancePolling,
        stopBalancePolling
    }
}
