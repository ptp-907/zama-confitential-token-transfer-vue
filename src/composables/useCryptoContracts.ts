import { ethers } from 'ethers'
import { decryptValue } from '../lib/fhevm'
import { 
    USDT_CONTRACT_ADDRESS, 
    CWUSDT_CONTRACT_ADDRESS,
    USDT_CONTRACT_ABI,
    CWUSDT_CONTRACT_ABI
} from '../config/contracts'

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

    return {
        getUSDTBalance,
        getCWUSDTEncryptedBalance,
        decryptBalance,
        handleDepositWithApproval
    }
}
