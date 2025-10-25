import { ethers } from 'ethers';

const CONTRACT_ABI = [
  "function paymentAmount() public view returns (uint256)"
];

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      CONTRACT_ABI,
      provider
    );

    const paymentAmount = await contract.paymentAmount();

    res.status(200).json({
      contractAddress: process.env.CONTRACT_ADDRESS,
      paymentAmount: ethers.formatEther(paymentAmount),
      network: 'Celo Alfajores Testnet',
      chainId: 44787
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
