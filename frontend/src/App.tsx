import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import 'bootstrap/dist/css/bootstrap.min.css';
import MockERC20ABI from './abis/MockERC20.json';
import UniswapV2PairABI from './abis/UniswapV2Pair.json';
import './App.css';

// Extend the Window interface to include the ethereum property
declare global {
  interface Window {
    ethereum?: any;
  }
}

const KSM_ADDRESS = '0x4FB451440e632eB25B0bBc5e40DF0aE88CCd33fd';
const USDT_ADDRESS = '0x369c6E27533c5bC20277a24aB32C43358EE949A3';
const PAIR_ADDRESS = '0x935E7f86531335c02A458253f220F7D412172D2D';
const WESTEND_CHAIN_ID = '0x190f1b45'; // 420420421 in hex
const WESTEND_RPC_URL = 'https://westend-asset-hub-eth-rpc.polkadot.io';

const App: React.FC = () => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [ksmAmount, setKsmAmount] = useState<string>('1000');
  const [usdtAmount, setUsdtAmount] = useState<string>('1000');
  const [swapAmount, setSwapAmount] = useState<string>('100');
  const [swapToken, setSwapToken] = useState<string>('KSM'); // KSM or USDT
  const [expectedOutput, setExpectedOutput] = useState<string>('0');
  const [reserves, setReserves] = useState<{ reserve0: string; reserve1: string }>({ reserve0: '0', reserve1: '0' });
  const [lpBalance, setLpBalance] = useState<string>('0');
  const [status, setStatus] = useState<string>('');

  // Connect to MetaMask
  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask) {
      try {
        // Check network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== WESTEND_CHAIN_ID) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: WESTEND_CHAIN_ID }],
            });
          } catch (switchError: any) {
            if (switchError.code === 4902 || switchError.message.includes('chain not found')) {
              try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [
                    {
                      chainId: WESTEND_CHAIN_ID,
                      chainName: 'Westend Asset Hub',
                      rpcUrls: [WESTEND_RPC_URL],
                      nativeCurrency: { name: 'Westend', symbol: 'WND', decimals: 18 },
                      blockExplorerUrls: ['https://westend.subscan.io'],
                    },
                  ],
                });
                await window.ethereum.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: WESTEND_CHAIN_ID }],
                });
              } catch (addError) {
                //setStatus(`Failed to add Westend network: ${addError.message}`);
                return;
              }
            } else {
              setStatus(`Failed to switch network: ${switchError.message}`);
              return;
            }
          }
        }

        // Request accounts
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length === 0) {
          setStatus('No accounts selected. Please select an account in MetaMask.');
          return;
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setProvider(provider);
        setSigner(signer);
        setAccount(address);
        setStatus('Wallet connected!');
      } catch (error) {
        setStatus('Failed to connect wallet: ' + (error as Error).message);
      }
    } else {
      setStatus('Please install MetaMask!');
    }
  };

  // Handle MetaMask account or network changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setStatus('Wallet account changed.');
        } else {
          setAccount(null);
          setProvider(null);
          setSigner(null);
          setStatus('Wallet disconnected.');
        }
      };

      const handleChainChanged = () => {
        window.location.reload(); // Reload to recheck network
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  // Calculate expected swap output
  const calculateSwapOutput = useCallback(async () => {
    if (provider && swapAmount && parseFloat(swapAmount) > 0) {
      try {
        const pairContract = new ethers.Contract(PAIR_ADDRESS, UniswapV2PairABI.abi, provider);
        const [reserve0, reserve1] = await pairContract.getReserves();
        const reserveIn = swapToken === 'KSM' ? reserve0 : reserve1;
        const reserveOut = swapToken === 'KSM' ? reserve1 : reserve0;

        const amountIn = ethers.utils.parseEther(swapAmount);
        const amountInWithFee = amountIn.mul(997); // 0.3% fee
        const numerator = amountInWithFee.mul(reserveOut);
        const denominator = reserveIn.mul(1000).add(amountInWithFee);
        const amountOut = numerator.div(denominator);

        setExpectedOutput(ethers.utils.formatEther(amountOut));
      } catch (error) {
        setStatus('Error calculating swap output: ' + (error as Error).message);
      }
    } else {
      setExpectedOutput('0');
    }
  }, [provider, swapAmount, swapToken]);

  // Load reserves, LP balance, and swap output
  const loadData = useCallback(async () => {
    if (provider && signer && account) {
      try {
        const pairContract = new ethers.Contract(PAIR_ADDRESS, UniswapV2PairABI.abi, provider);
        const [reserve0, reserve1] = await pairContract.getReserves();
        const lpBalance = await pairContract.balanceOf(account);
        setReserves({
          reserve0: ethers.utils.formatEther(reserve0),
          reserve1: ethers.utils.formatEther(reserve1),
        });
        setLpBalance(ethers.utils.formatEther(lpBalance));
        await calculateSwapOutput();
      } catch (error) {
        setStatus('Error loading data: ' + (error as Error).message);
      }
    }
  }, [provider, signer, account, calculateSwapOutput]);

  // Add liquidity
  const addLiquidity = async () => {
    if (!provider || !signer || !account) {
      setStatus('Please connect wallet first!');
      return;
    }

    setStatus('Processing...');
    try {
      const ksmContract = new ethers.Contract(KSM_ADDRESS, MockERC20ABI.abi, signer);
      const usdtContract = new ethers.Contract(USDT_ADDRESS, MockERC20ABI.abi, signer);
      const pairContract = new ethers.Contract(PAIR_ADDRESS, UniswapV2PairABI.abi, signer);

      const ksmWei = ethers.utils.parseEther(ksmAmount);
      const usdtWei = ethers.utils.parseEther(usdtAmount);

      // Approve KSM and USDT
      await (await ksmContract.approve(PAIR_ADDRESS, ksmWei)).wait();
      setStatus('KSM approved');
      await (await usdtContract.approve(PAIR_ADDRESS, usdtWei)).wait();
      setStatus('USDT approved');

      // Transfer tokens to pair
      await (await ksmContract.transfer(PAIR_ADDRESS, ksmWei)).wait();
      await (await usdtContract.transfer(PAIR_ADDRESS, usdtWei)).wait();
      setStatus('Tokens transferred');

      // Mint LP tokens
      await (await pairContract.mint(account)).wait();
      setStatus('Liquidity added successfully!');

      // Reload data
      await loadData();
    } catch (error) {
      setStatus('Error: ' + (error as Error).message);
    }
  };

  // Swap tokens
  const swapTokens = async () => {
    if (!provider || !signer || !account) {
      setStatus('Please connect wallet first!');
      return;
    }

    if (parseFloat(swapAmount) <= 0) {
      setStatus('Please enter a valid swap amount.');
      return;
    }

    setStatus('Processing swap...');
    try {
      const inputToken = swapToken === 'KSM' ? KSM_ADDRESS : USDT_ADDRESS;
      const tokenContract = new ethers.Contract(inputToken, MockERC20ABI.abi, signer);
      const pairContract = new ethers.Contract(PAIR_ADDRESS, UniswapV2PairABI.abi, signer);

      const amountIn = ethers.utils.parseEther(swapAmount);
      const [reserve0, reserve1] = await pairContract.getReserves();
      const reserveIn = swapToken === 'KSM' ? reserve0 : reserve1;
      const reserveOut = swapToken === 'KSM' ? reserve1 : reserve0;

      // Calculate amount out with 0.3% fee
      const amountInWithFee = amountIn.mul(997);
      const numerator = amountInWithFee.mul(reserveOut);
      const denominator = reserveIn.mul(1000).add(amountInWithFee);
      const amountOut = numerator.div(denominator);

      // Approve input token
      await (await tokenContract.approve(PAIR_ADDRESS, amountIn)).wait();
      setStatus(`${swapToken} approved`);

      // Transfer input token to pair
      await (await tokenContract.transfer(PAIR_ADDRESS, amountIn)).wait();
      setStatus(`${swapToken} transferred`);

      // Execute swap
      const amount0Out = swapToken === 'KSM' ? 0 : amountOut;
      const amount1Out = swapToken === 'KSM' ? amountOut : 0;
      await (await pairContract.swap(amount0Out, amount1Out, account, [])).wait();
      setStatus('Swap completed successfully!');

      // Reload data
      await loadData();
    } catch (error) {
      setStatus('Error swapping tokens: ' + (error as Error).message);
    }
  };

  // Recalculate swap output when inputs change
  useEffect(() => {
    calculateSwapOutput();
  }, [swapAmount, swapToken, calculateSwapOutput]);

  // Load data on account change
  useEffect(() => {
    loadData();
  }, [account, loadData]);

  return (
    <div className="container mt-5">
      <h1>KusamaSwap v2</h1>
      <p>A Uniswap V2-style AMM on Westend PolkaVM</p>
      {!account ? (
        <button className="btn btn-primary mb-3" onClick={connectWallet}>
          Connect Wallet
        </button>
      ) : (
        <p>Connected: {account}</p>
      )}
      <div className="card p-3 mb-3">
        <h3>Add Liquidity</h3>
        <div className="mb-3">
          <label>KSM Amount:</label>
          <input
            type="number"
            className="form-control"
            value={ksmAmount}
            onChange={(e) => setKsmAmount(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label>USDT Amount:</label>
          <input
            type="number"
            className="form-control"
            value={usdtAmount}
            onChange={(e) => setUsdtAmount(e.target.value)}
          />
        </div>
        <button className="btn btn-success" onClick={addLiquidity}>
          Add Liquidity
        </button>
      </div>
      <div className="card p-3 mb-3">
        <h3>Swap Tokens</h3>
        <div className="mb-3">
          <label>Input Token:</label>
          <select
            className="form-control"
            value={swapToken}
            onChange={(e) => setSwapToken(e.target.value)}
          >
            <option value="KSM">KSM</option>
            <option value="USDT">USDT</option>
          </select>
        </div>
        <div className="mb-3">
          <label>Amount:</label>
          <input
            type="number"
            className="form-control"
            value={swapAmount}
            onChange={(e) => setSwapAmount(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label>Expected Output ({swapToken === 'KSM' ? 'USDT' : 'KSM'}):</label>
          <input
            type="text"
            className="form-control"
            value={expectedOutput}
            readOnly
          />
        </div>
        <button className="btn btn-primary" onClick={swapTokens}>
          Swap
        </button>
      </div>
      <div className="card p-3">
        <h3>Pair Info</h3>
        <p>KSM Reserves: {reserves.reserve0}</p>
        <p>USDT Reserves: {reserves.reserve1}</p>
        <p>Your LP Tokens: {lpBalance}</p>
      </div>
      <p className="mt-3">Status: {status}</p>
    </div>
  );
};

export default App;