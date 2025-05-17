import CheckoutUI from "@/components/checkout-ui";
import { getPayment } from "@/app/server-only/get-payment";

export default async function Page({
  params,
}: {
  params: { paymentId: string };
}) {
  const { paymentId } = await params;
  const payment = await getPayment(paymentId);

  return (
    <CheckoutUI
      borderRadius={payment.checkout_customization?.borderRadius}
      payment={payment}
      primaryColor={payment.checkout_customization?.primaryColor}
      primaryTextColor={payment.checkout_customization?.primaryTextColor}
      secondaryColor={payment.checkout_customization?.secondaryColor}
      secondaryTextColor={payment.checkout_customization?.secondaryTextColor}
      topBarColor={payment.checkout_customization?.topBarColor}
      topBarTextColor={payment.checkout_customization?.topBarTextColor}
    />
  );
}
