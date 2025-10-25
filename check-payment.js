import { ethers } from 'ethers';

const CONTRACT_ABI = [
  "function getUnprocessedPayments() public view returns (uint256[])",
  "function getPayment(uint256 paymentId) public view returns (address payer, uint256 amount, uint256 timestamp, bool processed)",
  "function markProcessed(uint256 paymentId) public"
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      CONTRACT_ABI,
      wallet
    );

    if (req.method === 'GET') {
      // Check for unprocessed payments
      const unprocessedIds = await contract.getUnprocessedPayments();
      
      if (unprocessedIds.length > 0) {
        // Get the latest unprocessed payment
        const latestId = unprocessedIds[unprocessedIds.length - 1];
        const payment = await contract.getPayment(latestId);
        
        res.status(200).json({
          hasPayment: true,
          paymentId: Number(latestId),
          payer: payment[0],
          amount: ethers.formatEther(payment[1]),
          timestamp: Number(payment[2])
        });
      } else {
        res.status(200).json({ hasPayment: false });
      }
    } else if (req.method === 'POST') {
      // Mark payment as processed
      const { paymentId } = req.body;
      
      if (paymentId === undefined) {
        return res.status(400).json({ error: 'paymentId required' });
      }

      const tx = await contract.markProcessed(paymentId);
      await tx.wait();
      
      res.status(200).json({ 
        success: true, 
        txHash: tx.hash 
      });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
