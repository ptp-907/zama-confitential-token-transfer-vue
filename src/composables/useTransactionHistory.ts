import { ref } from 'vue'
import { ethers } from 'ethers'
import { CWUSDT_CONTRACT_ADDRESS, CWUSDT_CONTRACT_ABI } from '../config/contracts'

export interface Transaction {
    type: 'deposit' | 'withdraw' | 'transfer_sent' | 'transfer_received' | 'withdrawal_request'
    amount: string
    from?: string
    to?: string
    timestamp: number
    blockNumber: number
    transactionHash: string
    status: 'success' | 'pending' | 'failed'
}

/**
 * Composable for fetching and managing transaction history
 */
export function useTransactionHistory() {
    const transactions = ref<Transaction[]>([])
    const isLoading = ref(false)
    const error = ref<string>('')

    /**
     * Fetch transaction history from contract events
     */
    const fetchHistory = async (account: string) => {
        if (!window.ethereum || !account) {
            error.value = 'Wallet not connected'
            return
        }

        isLoading.value = true
        error.value = ''

        try {
            const provider = new ethers.BrowserProvider(window.ethereum)
            const contract = new ethers.Contract(
                CWUSDT_CONTRACT_ADDRESS,
                CWUSDT_CONTRACT_ABI,
                provider
            )

            // Get current block number
            const currentBlock = await provider.getBlockNumber()
            const fromBlock = Math.max(0, currentBlock - 10000) // Last ~10000 blocks

            console.log('Fetching history from block:', fromBlock, 'to:', currentBlock)

            const txList: Transaction[] = []

            // Fetch Deposit events
            try {
                const depositFilter = contract.filters.Deposit(account)
                const depositEvents = await contract.queryFilter(depositFilter, fromBlock, currentBlock)
                
                for (const event of depositEvents) {
                    const block = await event.getBlock()
                    txList.push({
                        type: 'deposit',
                        amount: ethers.formatUnits(event.args?.amount || 0, 18),
                        timestamp: block.timestamp,
                        blockNumber: event.blockNumber,
                        transactionHash: event.transactionHash,
                        status: 'success'
                    })
                }
                console.log('Deposit events found:', depositEvents.length)
            } catch (err) {
                console.error('Error fetching deposits:', err)
            }

            // Fetch Withdraw events
            try {
                const withdrawFilter = contract.filters.Withdraw(account)
                const withdrawEvents = await contract.queryFilter(withdrawFilter, fromBlock, currentBlock)
                
                for (const event of withdrawEvents) {
                    const block = await event.getBlock()
                    txList.push({
                        type: 'withdraw',
                        amount: ethers.formatUnits(event.args?.amount || 0, 18),
                        timestamp: block.timestamp,
                        blockNumber: event.blockNumber,
                        transactionHash: event.transactionHash,
                        status: 'success'
                    })
                }
                console.log('Withdraw events found:', withdrawEvents.length)
            } catch (err) {
                console.error('Error fetching withdrawals:', err)
            }

            // Fetch WithdrawalRequested events
            try {
                const withdrawalRequestFilter = contract.filters.WithdrawalRequested(account)
                const withdrawalRequestEvents = await contract.queryFilter(withdrawalRequestFilter, fromBlock, currentBlock)
                
                for (const event of withdrawalRequestEvents) {
                    const block = await event.getBlock()
                    txList.push({
                        type: 'withdrawal_request',
                        amount: ethers.formatUnits(event.args?.amount || 0, 18),
                        timestamp: block.timestamp,
                        blockNumber: event.blockNumber,
                        transactionHash: event.transactionHash,
                        status: 'pending'
                    })
                }
                console.log('Withdrawal request events found:', withdrawalRequestEvents.length)
            } catch (err) {
                console.error('Error fetching withdrawal requests:', err)
            }

            // Fetch EncryptedTransfer events (sent)
            try {
                const transferSentFilter = contract.filters.EncryptedTransfer(account, null)
                const transferSentEvents = await contract.queryFilter(transferSentFilter, fromBlock, currentBlock)
                
                for (const event of transferSentEvents) {
                    const block = await event.getBlock()
                    txList.push({
                        type: 'transfer_sent',
                        amount: 'Encrypted',
                        from: event.args?.from,
                        to: event.args?.to,
                        timestamp: block.timestamp,
                        blockNumber: event.blockNumber,
                        transactionHash: event.transactionHash,
                        status: 'success'
                    })
                }
                console.log('Transfer sent events found:', transferSentEvents.length)
            } catch (err) {
                console.error('Error fetching sent transfers:', err)
            }

            // Fetch EncryptedTransfer events (received)
            try {
                const transferReceivedFilter = contract.filters.EncryptedTransfer(null, account)
                const transferReceivedEvents = await contract.queryFilter(transferReceivedFilter, fromBlock, currentBlock)
                
                for (const event of transferReceivedEvents) {
                    // Skip if it's sent to self (already counted above)
                    if (event.args?.from?.toLowerCase() === account.toLowerCase()) {
                        continue
                    }
                    
                    const block = await event.getBlock()
                    txList.push({
                        type: 'transfer_received',
                        amount: 'Encrypted',
                        from: event.args?.from,
                        to: event.args?.to,
                        timestamp: block.timestamp,
                        blockNumber: event.blockNumber,
                        transactionHash: event.transactionHash,
                        status: 'success'
                    })
                }
                console.log('Transfer received events found:', transferReceivedEvents.length)
            } catch (err) {
                console.error('Error fetching received transfers:', err)
            }

            // Sort by timestamp (newest first)
            txList.sort((a, b) => b.timestamp - a.timestamp)

            transactions.value = txList
            console.log('Total transactions found:', txList.length)

        } catch (err) {
            console.error('Failed to fetch transaction history:', err)
            error.value = err instanceof Error ? err.message : 'Failed to fetch history'
        } finally {
            isLoading.value = false
        }
    }

    return {
        transactions,
        isLoading,
        error,
        fetchHistory
    }
}
