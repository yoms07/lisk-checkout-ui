"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

import CheckoutUI from "@/components/checkout-ui";
import { CompleteUI } from "@/components/complete-ui";
import { getPayment, Payment } from "@/app/server-only/get-payment";
import { FinishUI } from "@/components/finish-ui";
import { RedirectDialog } from "@/components/redirect-dialog";

export default function Page() {
  const params = useParams();
  const paymentId = params.paymentId as string;
  const [payment, setPayment] = useState<Payment | null>(null);
  const [showRedirect, setShowRedirect] = useState(false);

  // Fetch payment data
  useEffect(() => {
    const fetchPayment = async () => {
      const data = await getPayment(paymentId);

      setPayment(data);
    };

    fetchPayment();
  }, [paymentId]);

  if (!payment) {
    return null; // or loading state
  }

  const customizationProps = {
    borderRadius: payment.checkout_customization?.borderRadius,
    primaryColor: payment.checkout_customization?.primaryColor,
    primaryTextColor: payment.checkout_customization?.primaryTextColor,
    secondaryColor: payment.checkout_customization?.secondaryColor,
    secondaryTextColor: payment.checkout_customization?.secondaryTextColor,
    topBarColor: payment.checkout_customization?.topBarColor,
    topBarTextColor: payment.checkout_customization?.topBarTextColor,
  };

  if (payment.status === "completed") {
    return <CompleteUI payment={payment} />;
  }

  if (payment.status === "pending-complete") {
    return <FinishUI paymentId={paymentId} />;
  }

  return (
    <>
      <CheckoutUI
        payment={payment}
        {...customizationProps}
        onFinish={() => {
          if (payment.success_redirect_url) {
            setShowRedirect(true);
          } else {
            // Refresh payment data to show pending-complete state
            getPayment(paymentId).then(setPayment);
          }
        }}
      />
      {showRedirect && payment.success_redirect_url && (
        <RedirectDialog
          success_redirect_url={payment.success_redirect_url}
          onRedirect={() =>
            (window.location.href = payment.success_redirect_url!)
          }
        />
      )}
    </>
  );
}
