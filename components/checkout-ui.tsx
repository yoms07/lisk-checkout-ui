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
import { ConnectButton } from "@xellar/kit";

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

interface ItemDetail {
  name: string;
  price: number;
  quantity: number;
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
}

const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

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
  onClickPay = () => {},
}: CheckoutUIProps) {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerProfile>({
    name: "",
    email: "",
    phone: "",
  });
  const [timeLeft, setTimeLeft] = useState("");

  // Placeholder data - to be replaced with actual data from backend
  const itemDetail: ItemDetail = {
    name: "Sample Product",
    price: 1500000,
    quantity: 1,
  };

  const businessProfile: BusinessProfile = {
    name: "Sample Business",
    logo: "/placeholder-store.png",
    address: "123 Business Street, Jakarta",
  };

  // Countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
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
  }, [expiredAt]);

  const handleWalletConnect = () => setIsWalletConnected(true);
  const handleCustomerInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerInfo({ ...customerInfo, [e.target.name]: e.target.value });
  };
  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement pay logic
  };
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: overlayColor }}
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
      >
        <Card
          className="relative"
          style={{ borderRadius, boxShadow: "0 4px 24px 0 rgba(0,0,0,0.08)" }}
        >
          {/* Top bar with menu */}
          <div
            className="flex justify-between items-center p-6 border-b border-gray-700"
            style={{
              background: topBarColor,
              borderTopLeftRadius: borderRadius,
              borderTopRightRadius: borderRadius,
            }}
          >
            <div className="flex items-center space-x-3">
              <Image
                alt={businessProfile.name}
                className="w-12 h-12 rounded-full bg-gray-700 object-cover"
                height={12}
                src={businessProfile.logo}
                width={12}
              />
              <p
                className="font-semibold text-lg"
                style={{ color: topBarTextColor }}
              >
                {businessProfile.name}
              </p>
            </div>
            <Popover showArrow placement="bottom">
              <PopoverTrigger>
                <Button
                  isIconOnly
                  className="hover:text-white"
                  style={{ color: primaryColor }}
                  variant="light"
                >
                  <Bars3Icon className="w-6 h-6" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
                <Button
                  className="w-full justify-start hover:bg-gray-700 rounded-t-lg"
                  style={{ color: topBarTextColor }}
                  variant="light"
                  onPress={() => setIsWalletConnected(false)}
                >
                  Disconnect Wallet
                </Button>
              </PopoverContent>
            </Popover>
          </div>

          <form
            className="p-6"
            style={{
              background: bottomBarColor,
              borderBottomLeftRadius: borderRadius,
              borderBottomRightRadius: borderRadius,
            }}
            onSubmit={handlePay}
          >
            {/* Total Price Section */}
            <div className="mb-2 flex flex-col items-start pt-1">
              <span
                className="text-xs font-medium"
                style={{ color: secondaryTextColor }}
              >
                Pay
              </span>
              <span
                className="text-2xl font-bold"
                style={{ color: primaryTextColor }}
              >
                {formatCurrency(itemDetail.price)}
              </span>
            </div>

            {/* Accordion for Item Details */}
            <div className="mb-2">
              <Accordion className="rounded-lg" selectionMode="multiple">
                <AccordionItem
                  key="item-details"
                  className="text-sm"
                  title={
                    <span style={{ color: primaryTextColor }}>
                      Order Summary
                    </span>
                  }
                >
                  <div className="pb-4">
                    <p style={{ color: secondaryTextColor }}>
                      {itemDetail.name}
                    </p>
                    <p
                      className="text-lg font-bold"
                      style={{ color: primaryTextColor }}
                    >
                      {formatCurrency(itemDetail.price)}
                    </p>
                  </div>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Billing Info */}
            <div className="mb-6" style={{ borderRadius }}>
              <h2
                className="text-lg font-semibold mb-2"
                style={{ color: primaryTextColor }}
              >
                Billing Information
              </h2>
              <div className="space-y-3">
                <Input
                  classNames={{
                    label: "font-medium",
                    inputWrapper: `bg-[${secondaryColor}]`,
                  }}
                  label="Name"
                  name="name"
                  style={{ color: primaryTextColor }}
                  value={customerInfo.name}
                  onChange={handleCustomerInfoChange}
                />
                <Input
                  classNames={{
                    label: "font-medium",
                    inputWrapper: `bg-[${secondaryColor}]`,
                  }}
                  label="Email"
                  name="email"
                  style={{ color: primaryTextColor }}
                  type="email"
                  value={customerInfo.email}
                  onChange={handleCustomerInfoChange}
                />
                <Input
                  classNames={{
                    label: "font-medium",
                    inputWrapper: `bg-[${secondaryColor}]`,
                  }}
                  label="Phone"
                  name="phone"
                  style={{ color: primaryTextColor }}
                  type="tel"
                  value={customerInfo.phone}
                  onChange={handleCustomerInfoChange}
                />
              </div>
            </div>

            {/* Pay with UI */}
            <div
              className="flex items-center justify-between mb-6 shadow border border-gray-200 px-4 py-3"
              style={{ background: secondaryColor, borderRadius }}
            >
              <div className="flex items-center gap-3">
                {/* Lisk Logo in circle */}
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: primaryColor + "22" }}
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
                      style={{ color: primaryTextColor }}
                    >
                      Pay with
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className="font-medium"
                      style={{ color: secondaryTextColor }}
                    >
                      IDRX on Lisk
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span
                  className="font-semibold text-base"
                  style={{ color: primaryTextColor }}
                >
                  {formatCurrency(itemDetail.price)}
                </span>
                <div className="flex items-center gap-1">
                  <span
                    className="text-sm font-medium"
                    style={{ color: secondaryTextColor }}
                  >
                    Available
                  </span>
                  <ChevronRightIcon
                    className="w-4 h-4"
                    style={{ color: secondaryTextColor }}
                  />
                </div>
              </div>
            </div>

            {/* Expiration (centered, above button, with clock icon) */}
            <div className="mb-1 flex flex-col items-center">
              <span
                className="flex items-center text-xs"
                style={{ color: secondaryTextColor }}
              >
                <ClockIcon className="w-4 h-4 mr-1" />
                {timeLeft}
              </span>
            </div>

            {/* Connect Wallet / Pay Button */}
            <Button
              className="w-full py-3 font-medium"
              style={{
                background: primaryColor,
                color: primaryTextColor,
                borderRadius,
              }}
              type={isWalletConnected ? "submit" : "button"}
              onPress={!isWalletConnected ? handleWalletConnect : undefined}
            >
              {isWalletConnected ? "Pay Now" : "Connect Wallet"}
            </Button>
            <ConnectButton />
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
