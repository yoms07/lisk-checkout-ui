interface Asset {
  type: string;
  address: string;
  chainId: number;
  decimals: number;
}

interface Pricing {
  local: {
    amount: string;
    asset: Asset;
  };
}

interface Item {
  item_id: string;
  name: string;
  description: string;
  quantity: number;
  unit_price: string;
  unit_currency: string;
}

interface Customer {
  name: string;
  email: string;
  address: string;
  phone: string;
  source: string;
}

interface CheckoutCustomization {
  primaryColor: string;
  topBarColor: string;
  topBarTextColor: string;
  secondaryColor: string;
  borderRadius: string;
  overlayColor: string;
  bottomBarColor: string;
  primaryTextColor: string;
  secondaryTextColor: string;
  _id: string;
}

interface BusinessProfile {
  id: string;
  business_name: string;
  logo_url: string;
  business_description: string;
  contact_email: string;
  contact_phone: string;
  checkout_customization: CheckoutCustomization;
}

export interface Payment {
  id: string;
  business_profile_id: string;
  payment_id: string;
  external_id: string;
  status: string;
  customer: Customer;
  pricing: Pricing;
  items: Item[];
  expired_at: string;
  created_at: string;
  updated_at: string;
  source: string;
  checkout_customization: CheckoutCustomization | null;
  business_profile: BusinessProfile;
}

interface ApiResponse {
  status: number;
  message: string;
  data: Payment | null;
}

export async function getPayment(paymentId: string): Promise<Payment> {
  try {
    if (!paymentId) {
      throw new Error("Payment ID is required");
    }

    const apiUrl = process.env.BACKEND_URL;

    if (!apiUrl) {
      throw new Error("API URL is not configured");
    }

    const response = await fetch(`${apiUrl}/public/payment/${paymentId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);

      throw new Error(errorData?.message || "Failed to fetch payment");
    }

    const data = await response.json();

    return data.data;
  } catch (error) {
    console.error("Error fetching payment:", error);

    throw new Error("Failed to fetch payment");
  }
}
