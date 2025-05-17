import {
  useAccount,
  useBalance,
  useWriteContract,
  useReadContract,
  useSwitchChain,
} from "wagmi";
import { useMutation } from "@tanstack/react-query";
import { parseUnits } from "viem";
import { useConfig } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { lisk } from "viem/chains";

import { markPendingComplete } from "@/app/server-only/mark-pending-complete";
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
  onSuccess?: (data: {
    hash: `0x${string}`;
    paymentId: string;
    sender: string;
    signature: `0x${string}`;
  }) => void;
  onError?: (error: Error) => void;
}

// Helper function to parse IDRX amount (2 decimals)
const parseIdrx = (amount: string) => parseUnits(amount, 2);

export function usePay({ onSuccess, onError }: UsePayOptions = {}) {
  const { address, chain } = useAccount();
  const { data: balance } = useBalance({
    address,
    token: idrxAddress,
    chainId: 1135,
  });
  const { switchChainAsync } = useSwitchChain();

  const { writeContractAsync } = useWriteContract();

  const config = useConfig();

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

      console.log("allowance", allowance);
      console.log("requiredAllowance", requiredAllowance);

      if (chain?.id !== lisk.id) {
        await switchChainAsync({ chainId: lisk.id });
      }

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
          chain: lisk,
        });
      }

      const response = await initiatePayment(paymentId, address);

      if (!response.success || !response.data)
        throw new Error(response.message);

      const {
        id,
        deadline,
        recipient,
        signature,
        recipientAmount,
        recipientCurrency,
        refundDestination,
        feeAmount,
        operator,
        prefix,
      } = response.data;

      console.log(response.data);

      const paymentIntent = {
        recipientAmount: BigInt(recipientAmount),
        deadline: BigInt(deadline),
        recipient: recipient as `0x${string}`,
        recipientCurrency: recipientCurrency as `0x${string}`,
        refundDestination: refundDestination as `0x${string}`,
        feeAmount: BigInt(feeAmount),
        id: ("0x" + id) as `0x${string}`,
        operator: operator as `0x${string}`,
        signature: signature as `0x${string}`,
        prefix: prefix as `0x${string}`,
      };

      console.log("writing contract");
      const hash = await writeContractAsync({
        abi: paymentGatewayContractABI,
        address: paymentGatewayContractAddress as `0x${string}`,
        functionName: "processPreApprovedPayment",
        args: [paymentIntent],
        chain: lisk,
      });

      console.log("contract written");

      const transactionReceipt = await waitForTransactionReceipt(config, {
        hash,
      });

      console.log("transactionReceipt", transactionReceipt);

      // Mark payment as pending-complete after successful transaction
      const markResult = await markPendingComplete(paymentId, {
        sender: address,
        signature: signature as `0x${string}`,
      });

      if (!markResult.success) {
        throw new Error(markResult.message);
      }

      return {
        hash,
        paymentId,
        sender: address,
        signature: signature as `0x${string}`,
      };
    },
    onSuccess,
    onError,
  });

  return mutation;
}
