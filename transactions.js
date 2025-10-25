import { ethers } from 'ethers';

const CONTRACT_ABI = [
  "function getTotalPayments() public view returns (uint256)",
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

    const totalPayments = await contract.getTotalPayments();
    const payments = [];

    // Limit to last 50 transactions to avoid timeout
    const start = totalPayments > 50n ? Number(totalPayments) - 50 : 0;
    
    for (let i = start; i < totalPayments; i++) {
      const payment = await contract.getPayment(i);
      payments.push({
        id: i,
        payer: payment[0],
        amount: ethers.formatEther(payment[1]),
        timestamp: new Date(Number(payment[2]) * 1000).toISOString(),
        processed: payment[3]
      });
    }

    res.status(200).json({ 
      transactions: payments.reverse(),
      total: Number(totalPayments)
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
