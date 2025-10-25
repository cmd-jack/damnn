import { ethers } from 'ethers';

const CONTRACT_ABI = [
  "function getUnprocessedPayments() public view returns (uint256[])",
  "function getPayment(uint256 paymentId) public view returns (address payer, uint256 amount, uint256 timestamp, bool processed)"
];

export default async function handler(req, res) {
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

    const unprocessedIds = await contract.getUnprocessedPayments();
    const payments = [];

    for (let id of unprocessedIds) {
      const payment = await contract.getPayment(id);
      payments.push({
        id: Number(id),
        payer: payment[0],
        amount: ethers.formatEther(payment[1]),
        timestamp: new Date(Number(payment[2]) * 1000).toISOString()
      });
    }

    res.status(200).json({ unprocessed: payments });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
