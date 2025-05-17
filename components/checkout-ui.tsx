"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  Button,
  Input,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Accordion,
  AccordionItem,
} from "@heroui/react";
import { differenceInSeconds } from "date-fns";
import {
  Bars3Icon,
  ClockIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useConnectModal } from "@xellar/kit";
import {
  useAccount,
  useBalance,
  useDisconnect,
  useWriteContract,
  useReadContract,
} from "wagmi";
import Avatar from "react-avatar";
import { parseUnits } from "viem";

import { Payment } from "@/app/server-only/get-payment";
import { usePay } from "@/app/hooks/usePay";

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
];

const paymentGatewayContractAddress =
  "0x8D5680a242F0Ec85153881F89a48150691826123";

const idrxAddress = "0x18Bc5bcC660cf2B9cE3cd51a404aFe1a0cBD3C22";

interface CustomerProfile {
  name: string;
  email: string;
  phone: string;
}

interface BusinessProfile {
  name: string;
  logo: string;
  address: string;
}

interface CheckoutUIProps {
  /** Main accent color (buttons, highlights) */
  primaryColor?: string;
  /** Top bar (with menu) background color */
  topBarColor?: string;
  /** Top bar text color */
  topBarTextColor?: string;
  /** Secondary color for 'Pay with' UI and other elements */
  secondaryColor?: string;
  /** Card border radius */
  borderRadius?: string;
  /** Overlay/page background color */
  overlayColor?: string;
  /** Bottom bar (form) background color */
  bottomBarColor?: string;
  /** Main text color */
  primaryTextColor?: string;
  /** Secondary text color */
  secondaryTextColor?: string;

  onClickConnectWallet?: () => void;
  onClickPay?: () => void;
  payment: Payment;
}

// Helper function to parse IDRX amount (2 decimals)
const parseIdrx = (amount: string) => parseUnits(amount, 2);

export default function CheckoutUI({
  primaryColor = "#2563eb", // blue-600
  topBarColor = "#1e293b", // slate-800
  topBarTextColor = "#fff", // white
  secondaryColor = "#23272f", // deep slate for 'Pay with' UI
  borderRadius = "0.75rem", // rounded-xl
  overlayColor = "#e5e7eb", // gray-200
  bottomBarColor = "#111827", // gray-900
  primaryTextColor = "#fff", // white
  secondaryTextColor = "#a1a1aa", // zinc-400
  onClickConnectWallet = () => {},
  payment,
  onClickPay = () => {},
}: CheckoutUIProps) {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const { open } = useConnectModal();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({
    address,
    token: idrxAddress,
    chainId: 1135,
  });
  const [customerInfo, setCustomerInfo] = useState<CustomerProfile>({
    name: payment.customer.name || "",
    email: payment.customer.email || "",
    phone: payment.customer.phone || "",
  });
  const [timeLeft, setTimeLeft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { writeContractAsync } = useWriteContract();

  const { data: allowance } = useReadContract({
    abi: [
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
    ],
    address: idrxAddress as `0x${string}`,
    functionName: "allowance",
    args: address
      ? [address, paymentGatewayContractAddress as `0x${string}`]
      : undefined,
    query: { enabled: !!address },
  });

  const {
    mutate: pay,
    isPending,
    error: payError,
  } = usePay({
    onSuccess: onClickPay,
    onError: (error) => {
      setError(error.message);
    },
  });

  // Countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const expiredAt = new Date(payment.expired_at);
      const diffInSeconds = differenceInSeconds(expiredAt, now);

      if (diffInSeconds <= 0) {
        setTimeLeft("Expired");

        return;
      }
      const hours = Math.floor(diffInSeconds / 3600);
      const minutes = Math.floor((diffInSeconds % 3600) / 60);
      const seconds = diffInSeconds % 60;

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [payment.expired_at]);

  useEffect(() => {
    if (address) {
      setIsWalletConnected(true);
    } else {
      setIsWalletConnected(false);
    }
  }, [address]);

  const handleWalletConnect = () => setIsWalletConnected(true);
  const handleCustomerInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerInfo({ ...customerInfo, [e.target.name]: e.target.value });
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await pay({ paymentId: payment.payment_id, totalAmount });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      console.error("Payment error:", err);
    }
  };

  const formatCurrency = (amount: string) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(Number(amount));

  const totalAmount = payment.pricing.local.amount;
  const customization = payment.checkout_customization;

  const handleDisconnectWallet = () => {
    disconnect();
    setIsWalletConnected(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: customization?.overlayColor || overlayColor }}
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
      >
        <Card
          className="relative"
          style={{
            borderRadius: customization?.borderRadius || borderRadius,
            boxShadow: "0 4px 24px 0 rgba(0,0,0,0.08)",
          }}
        >
          {/* Top bar with menu */}
          <div
            className="flex justify-between items-center p-6 border-b border-gray-700"
            style={{
              background: customization?.topBarColor || topBarColor,
              borderTopLeftRadius: customization?.borderRadius || borderRadius,
              borderTopRightRadius: customization?.borderRadius || borderRadius,
            }}
          >
            <div className="flex items-center space-x-3">
              {payment.business_profile_id && (
                <Avatar
                  round
                  color={customization?.primaryColor || primaryColor}
                  fgColor="#fff"
                  name={payment.business_profile.business_name}
                  size="48"
                />
              )}
              <div>
                <p
                  className="font-semibold text-lg"
                  style={{
                    color: customization?.topBarTextColor || topBarTextColor,
                  }}
                >
                  {payment.business_profile.business_name}
                </p>
              </div>
            </div>
            <Popover showArrow placement="bottom">
              <PopoverTrigger>
                <Button
                  isIconOnly
                  className="hover:text-white"
                  style={{ color: customization?.primaryColor || primaryColor }}
                  variant="light"
                >
                  <Bars3Icon className="w-6 h-6" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
                <Button
                  className="w-full justify-start hover:bg-gray-700 rounded-t-lg"
                  style={{
                    color: customization?.topBarTextColor || topBarTextColor,
                  }}
                  variant="light"
                  onPress={handleDisconnectWallet}
                >
                  Disconnect Wallet
                </Button>
              </PopoverContent>
            </Popover>
          </div>

          <form
            className="p-6"
            style={{
              background: customization?.bottomBarColor || bottomBarColor,
              borderBottomLeftRadius:
                customization?.borderRadius || borderRadius,
              borderBottomRightRadius:
                customization?.borderRadius || borderRadius,
            }}
            onSubmit={handlePay}
          >
            {/* Total Price Section */}
            <div className="mb-2 flex flex-col items-start pt-1">
              <span
                className="text-xs font-medium"
                style={{
                  color:
                    customization?.secondaryTextColor || secondaryTextColor,
                }}
              >
                Pay
              </span>
              <span
                className="text-2xl font-bold"
                style={{
                  color: customization?.primaryTextColor || primaryTextColor,
                }}
              >
                {formatCurrency(totalAmount)}
              </span>
            </div>

            {/* Accordion for Item Details */}
            <div className="mb-2">
              <Accordion className="rounded-lg" selectionMode="multiple">
                <AccordionItem
                  key="item-details"
                  className="text-sm"
                  title={
                    <span
                      style={{
                        color:
                          customization?.primaryTextColor || primaryTextColor,
                      }}
                    >
                      Order Summary
                    </span>
                  }
                >
                  <div className="pb-4">
                    {payment.items.map((item: any) => (
                      <div key={item.item_id} className="mb-2">
                        <p
                          style={{
                            color:
                              customization?.secondaryTextColor ||
                              secondaryTextColor,
                          }}
                        >
                          {item.name} x {item.quantity}
                        </p>
                        <p
                          className="text-lg font-bold"
                          style={{
                            color:
                              customization?.primaryTextColor ||
                              primaryTextColor,
                          }}
                        >
                          {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                    ))}
                  </div>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Billing Info */}
            {payment.customer.source !== "business" && (
              <div
                className="mb-6"
                style={{
                  borderRadius: customization?.borderRadius || borderRadius,
                }}
              >
                <h2
                  className="text-lg font-semibold mb-2"
                  style={{
                    color: customization?.primaryTextColor || primaryTextColor,
                  }}
                >
                  Billing Information
                </h2>
                <div className="space-y-3">
                  <Input
                    classNames={{
                      label: "font-medium",
                      inputWrapper: `bg-[${customization?.secondaryColor || secondaryColor}]`,
                    }}
                    label="Name"
                    name="name"
                    style={{
                      color:
                        customization?.primaryTextColor || primaryTextColor,
                    }}
                    value={customerInfo.name}
                    onChange={handleCustomerInfoChange}
                  />
                  <Input
                    classNames={{
                      label: "font-medium",
                      inputWrapper: `bg-[${customization?.secondaryColor || secondaryColor}]`,
                    }}
                    label="Email"
                    name="email"
                    style={{
                      color:
                        customization?.primaryTextColor || primaryTextColor,
                    }}
                    type="email"
                    value={customerInfo.email}
                    onChange={handleCustomerInfoChange}
                  />
                  <Input
                    classNames={{
                      label: "font-medium",
                      inputWrapper: `bg-[${customization?.secondaryColor || secondaryColor}]`,
                    }}
                    label="Phone"
                    name="phone"
                    style={{
                      color:
                        customization?.primaryTextColor || primaryTextColor,
                    }}
                    type="tel"
                    value={customerInfo.phone}
                    onChange={handleCustomerInfoChange}
                  />
                </div>
              </div>
            )}

            {/* Pay with UI */}
            <div
              className="flex items-center justify-between mb-6 shadow border border-gray-200 px-4 py-3"
              style={{
                background: customization?.secondaryColor || secondaryColor,
                borderRadius: customization?.borderRadius || borderRadius,
              }}
            >
              <div className="flex items-center gap-3">
                {/* Lisk Logo in circle */}
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    background:
                      (customization?.primaryColor || primaryColor) + "22",
                  }}
                >
                  <Image
                    alt="Lisk Logo"
                    className="w-8 h-8 rounded-full object-contain"
                    height={32}
                    src="/lisk.webp"
                    width={32}
                  />
                </span>
                <div>
                  <div className="flex items-center gap-1">
                    <span
                      className="font-semibold text-base"
                      style={{
                        color:
                          customization?.primaryTextColor || primaryTextColor,
                      }}
                    >
                      Available Balance
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className="font-medium"
                      style={{
                        color:
                          customization?.secondaryTextColor ||
                          secondaryTextColor,
                      }}
                    >
                      IDRX on Lisk
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                {isWalletConnected && balance ? (
                  <>
                    <span
                      className="font-semibold text-base"
                      style={{
                        color:
                          customization?.primaryTextColor || primaryTextColor,
                      }}
                    >
                      {balance.formatted} IDRX
                    </span>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-sm font-medium ${
                          Number(balance.formatted) >= Number(totalAmount)
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {Number(balance.formatted) >= Number(totalAmount)
                          ? "Sufficient Balance"
                          : "Insufficient Balance"}
                      </span>
                      <ChevronRightIcon
                        className="w-4 h-4"
                        style={{
                          color:
                            customization?.secondaryTextColor ||
                            secondaryTextColor,
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <span
                    className="text-sm font-medium"
                    style={{
                      color:
                        customization?.secondaryTextColor || secondaryTextColor,
                    }}
                  >
                    Connect wallet to view balance
                  </span>
                )}
              </div>
            </div>

            {/* Expiration (centered, above button, with clock icon) */}
            <div className="mb-1 flex flex-col items-center">
              <span
                className="flex items-center text-xs"
                style={{
                  color:
                    customization?.secondaryTextColor || secondaryTextColor,
                }}
              >
                <ClockIcon className="w-4 h-4 mr-1" />
                {timeLeft}
              </span>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            {/* Connect Wallet / Pay Button */}
            {!isWalletConnected ? (
              <Button
                className="w-full py-3 font-medium"
                style={{
                  background: customization?.primaryColor || primaryColor,
                  color: customization?.primaryTextColor || primaryTextColor,
                  borderRadius: customization?.borderRadius || borderRadius,
                }}
                onPress={open}
              >
                Connect Wallet
              </Button>
            ) : (
              <Button
                className="w-full py-3 font-medium"
                isDisabled={isPending}
                isLoading={isPending}
                style={{
                  background: customization?.primaryColor || primaryColor,
                  color: customization?.primaryTextColor || primaryTextColor,
                  borderRadius: customization?.borderRadius || borderRadius,
                }}
                type="submit"
              >
                {isPending ? "Processing..." : "Pay Now"}
              </Button>
            )}
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
