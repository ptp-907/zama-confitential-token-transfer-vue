import { ethers } from 'ethers'
import { decryptValue, createEncryptedInput } from '../lib/fhevm'
import { 
    USDT_CONTRACT_ADDRESS, 
    CWUSDT_CONTRACT_ADDRESS,
    USDT_CONTRACT_ABI,
    CWUSDT_CONTRACT_ABI
} from '../config/contracts'

console.log('USDT_CONTRACT_ADDRESS:', USDT_CONTRACT_ADDRESS)
console.log('CWUSDT_CONTRACT_ADDRESS:', CWUSDT_CONTRACT_ADDRESS)
// Extend Window interface to include ethereum
declare global {
    interface Window {
        ethereum?: any
    }
}

export interface ContractInteractionOptions {
    account: string
    isConnected: boolean
    onMessage?: (message: string) => void
}

/**
 * Composable for interacting with crypto contracts
 */
export function useCryptoContracts(options: ContractInteractionOptions) {
    const { account, isConnected, onMessage } = options

    /**
     * Get USDT balance for the connected account
     */
    const getUSDTBalance = async (): Promise<string> => {
        if (!isConnected || !window.ethereum) {
            throw new Error('Wallet not connected')
        }

        try {
            const provider = new ethers.BrowserProvider(window.ethereum)
            console.log('Provider:', provider)
            const contract = new ethers.Contract(
                USDT_CONTRACT_ADDRESS, 
                USDT_CONTRACT_ABI, 
                provider
            )
            const balance = await contract.balanceOf(account)
            const formattedBalance = ethers.formatUnits(balance, 18)
            
            return formattedBalance
        } catch (error) {
            console.error('Get USDT balance failed:', error)
            throw new Error('Failed to get USDT balance')
        }
    }

    /**
     * Get confidential wrapped USDT encrypted balance
     */
    const getCWUSDTEncryptedBalance = async (): Promise<string> => {
        if (!isConnected || !window.ethereum) {
            throw new Error('Wallet not connected')
        }

        try {
            const provider = new ethers.BrowserProvider(window.ethereum)
            const contract = new ethers.Contract(
                CWUSDT_CONTRACT_ADDRESS, 
                CWUSDT_CONTRACT_ABI, 
                provider
            )
            const encryptedBalance = await contract.getEncryptedBalance(account)
            
            return encryptedBalance
        } catch (error) {
            console.error('Get cWUSDT encrypted balance failed:', error)
            throw new Error('Failed to get cWUSDT encrypted balance')
        }
    }

    /**
     * Decrypt encrypted balance using EIP-712 signature
     */
    const decryptBalance = async (encryptedHandle: string): Promise<number> => {
        if (!encryptedHandle || !window.ethereum) {
            throw new Error('Invalid encrypted handle or wallet not connected')
        }

        try {
            onMessage?.('Decrypting with EIP-712 user decryption...')
            
            const provider = new ethers.BrowserProvider(window.ethereum)
            const signer = await provider.getSigner()
            
            const result = await decryptValue(
                encryptedHandle, 
                CWUSDT_CONTRACT_ADDRESS, 
                signer
            )
            
            onMessage?.('EIP-712 decryption completed!')
            
            return result
        } catch (error) {
            console.error('Decryption failed:', error)
            throw new Error('Decryption failed')
        }
    }

    /**
     * Handle deposit of USDT tokens with approval step
     */
    const handleDepositWithApproval = async (amount: number): Promise<void> => {
        if (!isConnected || !window.ethereum) {
            throw new Error('Wallet not connected')
        }
        
        if (!amount || amount <= 0) {
            throw new Error('Deposit amount must be greater than zero')
        }
        
        try {
            onMessage?.('Initializing deposit...')
            
            const provider = new ethers.BrowserProvider(window.ethereum)
            const signer = await provider.getSigner()
            const usdtContract = new ethers.Contract(
                USDT_CONTRACT_ADDRESS, 
                USDT_CONTRACT_ABI, 
                signer
            )
            const cwusdtContract = new ethers.Contract(
                CWUSDT_CONTRACT_ADDRESS, 
                CWUSDT_CONTRACT_ABI, 
                signer
            )
            
            // Convert amount to Wei (18 decimals)
            const amountInWei = ethers.parseUnits(amount.toString(), 18)
            console.log('Deposit amount:', amount, 'Wei:', amountInWei.toString())

            // Check balance
            const balance = await usdtContract.balanceOf(account)
            console.log('Current USDT balance:', ethers.formatUnits(balance, 18))
            
            if (amountInWei > balance) {
                throw new Error('Insufficient USDT balance for deposit')
            }

            // Step 1: Check and approve if needed
            const currentAllowance = await usdtContract.allowance(account, CWUSDT_CONTRACT_ADDRESS)
            console.log('Current allowance:', ethers.formatUnits(currentAllowance, 18))
            
            if (currentAllowance < amountInWei) {
                onMessage?.('Approving USDT spend for cWUSDT contract...')
                const approveTx = await usdtContract.approve(
                    CWUSDT_CONTRACT_ADDRESS, 
                    amountInWei
                )
                console.log('Approval transaction sent:', approveTx.hash)
                await approveTx.wait()
                console.log('Approval transaction confirmed:', approveTx.hash)
                onMessage?.('USDT spend approved!')
            }

            // Step 2: Deposit USDT tokens to receive cWUSDT tokens
            onMessage?.('Depositing tokens...')
            const depositTx = await cwusdtContract.depositAndEncrypt(amountInWei)
            console.log('Deposit transaction sent:', depositTx.hash)
            await depositTx.wait()
            console.log('Deposit transaction confirmed:', depositTx.hash)
            onMessage?.('Deposit completed!')
        } catch (error) {
            console.error('Deposit failed:', error)
            if (error instanceof Error) {
                throw error
            }
            throw new Error('Deposit failed')
        }
    }

    /**
     * Handle withdrawal of USDT tokens from cWUSDT contract
     * This implements a two-step withdrawal process:
     * 1. Call withdrawAsPlain to create withdrawal request
     * 2. Decrypt balance and call _withdrawCallback to complete withdrawal
     */
    const handleWithdraw = async (amount: number): Promise<void> => {
        if (!window.ethereum) {
            throw new Error('Wallet not connected')
        }
        
        if (!amount || amount <= 0) {
            throw new Error('Withdrawal amount must be greater than zero')
        }
        
        try {
            onMessage?.('Initializing withdrawal...')
            
            const provider = new ethers.BrowserProvider(window.ethereum)
            const signer = await provider.getSigner()
            
            // Verify the account matches
            const signerAddress = await signer.getAddress()
            if (signerAddress.toLowerCase() !== account.toLowerCase()) {
                throw new Error('Account mismatch. Please reconnect your wallet.')
            }
            
            const cwusdtContract = new ethers.Contract(
                CWUSDT_CONTRACT_ADDRESS, 
                CWUSDT_CONTRACT_ABI, 
                signer
            )
            
            // Convert amount to Wei (18 decimals)
            const amountInWei = ethers.parseUnits(amount.toString(), 18)
            console.log('Withdrawal amount:', amount, 'Wei:', amountInWei.toString())

            // Get encrypted balance handle
            const encryptedBalance = await cwusdtContract.getEncryptedBalance(signerAddress)
            if (!encryptedBalance || encryptedBalance === '0x0' || encryptedBalance === '0x' || 
                encryptedBalance === '0x0000000000000000000000000000000000000000000000000000000000000000') {
                throw new Error('No encrypted balance found. Please deposit first.')
            }
            console.log('Encrypted balance handle:', encryptedBalance)

            // Step 1: Call withdrawAsPlain to create withdrawal request
            onMessage?.('Creating withdrawal request...')
            const withdrawTx = await cwusdtContract.withdrawAsPlain(amountInWei)
            console.log('Withdrawal request transaction sent:', withdrawTx.hash)
            
            onMessage?.('Waiting for request confirmation...')
            const receipt = await withdrawTx.wait()
            console.log('Withdrawal request confirmed:', withdrawTx.hash)
            
            // Extract requestId from the WithdrawalRequested event
            const withdrawalRequestedEvent = receipt.logs.find((log: any) => {
                try {
                    const parsed = cwusdtContract.interface.parseLog({
                        topics: log.topics as string[],
                        data: log.data
                    })
                    return parsed?.name === 'WithdrawalRequested'
                } catch {
                    return false
                }
            })
            
            if (!withdrawalRequestedEvent) {
                throw new Error('WithdrawalRequested event not found in transaction')
            }
            
            const parsedEvent = cwusdtContract.interface.parseLog({
                topics: withdrawalRequestedEvent.topics as string[],
                data: withdrawalRequestedEvent.data
            })
            const requestId = parsedEvent?.args?.requestId
            console.log('Withdrawal requestId:', requestId)
            
            // Step 2: Decrypt the balance using EIP-712
            onMessage?.('Decrypting balance...')
            
            // Placeholder for decrypted balance
            // const decryptedBalanceInWei = ethers.parseUnits('1000', 18)

            const decryptedBalanceValue = await decryptValue(
                encryptedBalance, 
                CWUSDT_CONTRACT_ADDRESS, 
                signer
            )
            console.log('Decrypted balance:', decryptedBalanceValue)
            
            // Validate sufficient balance
            const decryptedBalanceInWei = ethers.parseUnits(decryptedBalanceValue.toString(), 0)
            if (decryptedBalanceInWei < amountInWei) {
                throw new Error(`Insufficient balance. You have ${ethers.formatUnits(decryptedBalanceInWei, 18)} but trying to withdraw ${amount}`)
            }
            
            // Step 3: Call _withdrawCallback to complete the withdrawal
            onMessage?.('Processing withdrawal callback...')
            const callbackTx = await cwusdtContract._withdrawCallback(
                requestId,
                signerAddress,
                amountInWei,
                decryptedBalanceInWei
            )
            console.log('Withdrawal callback transaction sent:', callbackTx.hash)
            
            onMessage?.('Waiting for withdrawal to complete...')
            await callbackTx.wait()
            console.log('Withdrawal callback confirmed:', callbackTx.hash)
            
            onMessage?.('Withdrawal completed successfully!')
        } catch (error) {
            console.error('Withdrawal failed:', error)
            if (error instanceof Error) {
                throw new Error(`Withdrawal failed: ${error.message}`)
            }
            throw new Error('Withdrawal failed: Unknown error')
        }
    }

    /**
     * Handle encrypted transfer of cWUSDT tokens
     */
    const handleEncryptedTransfer = async (recipient: string, amount: number): Promise<void> => {
        if (!window.ethereum) {
            throw new Error('Wallet not connected')
        }
        
        if (!recipient || !ethers.isAddress(recipient)) {
            throw new Error('Invalid recipient address')
        }
        
        if (!amount || amount <= 0) {
            throw new Error('Transfer amount must be greater than zero')
        }
        
        try {
            onMessage?.('Initializing encrypted transfer...')
            
            const provider = new ethers.BrowserProvider(window.ethereum)
            const signer = await provider.getSigner()
            
            // Verify the account matches
            const signerAddress = await signer.getAddress()
            if (signerAddress.toLowerCase() !== account.toLowerCase()) {
                throw new Error('Account mismatch. Please reconnect your wallet.')
            }
            
            const cwusdtContract = new ethers.Contract(
                CWUSDT_CONTRACT_ADDRESS, 
                CWUSDT_CONTRACT_ABI, 
                signer
            )
            
            // Convert amount to Wei (18 decimals) - need to pass as number for encryption
            const amountInWei = ethers.parseUnits(amount.toString(), 18)
            console.log('Transfer amount:', amount, 'Wei:', amountInWei.toString())

            // Check encrypted balance exists
            const encryptedBalance = await cwusdtContract.getEncryptedBalance(signerAddress)
            if (!encryptedBalance || encryptedBalance === '0x0' || encryptedBalance === '0x' || 
                encryptedBalance === '0x0000000000000000000000000000000000000000000000000000000000000000') {
                throw new Error('No encrypted balance found. Please deposit first.')
            }
            console.log('Encrypted balance handle:', encryptedBalance)
            
            // Create encrypted input using FHEVM SDK
            onMessage?.('Encrypting transfer amount...')
            console.log('Creating encrypted input for:', {
                contract: CWUSDT_CONTRACT_ADDRESS,
                account: signerAddress,
                amount: Number(amountInWei)
            })
            
            const encryptedInput = await createEncryptedInput(
                CWUSDT_CONTRACT_ADDRESS, 
                signerAddress, 
                Number(amountInWei)
            )
            
            console.log('Encrypted input created:', encryptedInput)
            
            if (!encryptedInput.encryptedData || !encryptedInput.proof) {
                throw new Error('Failed to create encrypted input')
            }

            // Call encryptedTransfer function
            onMessage?.('Processing encrypted transfer transaction...')
            const transferTx = await cwusdtContract.encryptedTransfer(
                recipient,
                encryptedInput.encryptedData,
                encryptedInput.proof
            )
            console.log('Transfer transaction sent:', transferTx.hash)
            
            onMessage?.('Waiting for transaction confirmation...')
            await transferTx.wait()
            console.log('Transfer transaction confirmed:', transferTx.hash)
            
            onMessage?.('Encrypted transfer completed successfully!')
        } catch (error) {
            console.error('Encrypted transfer failed:', error)
            if (error instanceof Error) {
                throw new Error(`Encrypted transfer failed: ${error.message}`)
            }
            throw new Error('Encrypted transfer failed: Unknown error')
        }
    }

    return {
        getUSDTBalance,
        getCWUSDTEncryptedBalance,
        decryptBalance,
        handleDepositWithApproval,
        handleWithdraw,
        handleEncryptedTransfer
    }
}
