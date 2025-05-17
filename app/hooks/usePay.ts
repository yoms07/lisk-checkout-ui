import {
  useAccount,
  useBalance,
  useWriteContract,
  useReadContract,
} from "wagmi";
import { useMutation } from "@tanstack/react-query";
import { parseUnits } from "viem";

import { initiatePayment } from "@/app/server-only/initiate-payment";

const paymentGatewayContractAddress =
  "0x8D5680a242F0Ec85153881F89a48150691826123";
const idrxAddress = "0x18Bc5bcC660cf2B9cE3cd51a404aFe1a0cBD3C22";

const erc20Abi = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const paymentGatewayContractABI = [
  {
    type: "function",
    name: "processPreApprovedPayment",
    inputs: [
      {
        name: "intent",
        type: "tuple",
        internalType: "struct PaymentIntent",
        components: [
          {
            name: "recipientAmount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "deadline",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "recipient",
            type: "address",
            internalType: "address payable",
          },
          {
            name: "recipientCurrency",
            type: "address",
            internalType: "address",
          },
          {
            name: "refundDestination",
            type: "address",
            internalType: "address",
          },
          {
            name: "feeAmount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "id",
            type: "bytes16",
            internalType: "bytes16",
          },
          {
            name: "operator",
            type: "address",
            internalType: "address",
          },
          {
            name: "signature",
            type: "bytes",
            internalType: "bytes",
          },
          {
            name: "prefix",
            type: "bytes",
            internalType: "bytes",
          },
        ],
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

interface UsePayOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

// Helper function to parse IDRX amount (2 decimals)
const parseIdrx = (amount: string) => parseUnits(amount, 2);

export function usePay({ onSuccess, onError }: UsePayOptions = {}) {
  const { address } = useAccount();
  const { data: balance } = useBalance({
    address,
    token: idrxAddress,
    chainId: 1135,
  });

  const { writeContractAsync } = useWriteContract();

  const { data: allowance } = useReadContract({
    abi: erc20Abi,
    address: idrxAddress as `0x${string}`,
    functionName: "allowance",
    args: address
      ? [address, paymentGatewayContractAddress as `0x${string}`]
      : undefined,
    query: { enabled: !!address },
  });

  const mutation = useMutation({
    mutationFn: async ({
      paymentId,
      totalAmount,
    }: {
      paymentId: string;
      totalAmount: string;
    }) => {
      if (!address) throw new Error("Please connect your wallet first");
      if (!balance || Number(balance.formatted) < Number(totalAmount)) {
        throw new Error("Insufficient IDRX balance");
      }

      const requiredAllowance = parseIdrx(totalAmount);

      if (!allowance || BigInt(allowance) < requiredAllowance) {
        // Approve tokens
        await writeContractAsync({
          abi: erc20Abi,
          address: idrxAddress as `0x${string}`,
          functionName: "approve",
          args: [
            paymentGatewayContractAddress as `0x${string}`,
            requiredAllowance,
          ],
        });
      }

      const response = await initiatePayment(paymentId, address);

      if (!response.success || !response.data)
        throw new Error(response.message);

      const { id, deadline, recipient, signature } = response.data;

      const paymentIntent = {
        recipientAmount: parseIdrx(totalAmount),
        deadline: BigInt(deadline),
        recipient: recipient as `0x${string}`,
        recipientCurrency: idrxAddress as `0x${string}`,
        refundDestination: address,
        feeAmount: BigInt(0),
        id: id as `0x${string}`,
        operator: address,
        signature: signature as `0x${string}`,
        prefix: "0x" as `0x${string}`,
      };

      await writeContractAsync({
        abi: paymentGatewayContractABI,
        address: paymentGatewayContractAddress as `0x${string}`,
        functionName: "processPreApprovedPayment",
        args: [paymentIntent],
      });
    },
    onSuccess,
    onError,
  });

  return mutation;
}
