"use server";

interface CustomerInfo {
  name?: string;
  email?: string;
  address?: string;
  phone?: string;
}

interface PaymentIntent {
  sender: string;
  signature: string;
}

interface ApiResponse {
  status: number;
  message: string;
  data: {
    id: string;
    customer: CustomerInfo;
  } | null;
}

export async function updateCustomerInfo(
  paymentId: string,
  paymentIntent: PaymentIntent,
  customerInfo: CustomerInfo
): Promise<{ success: boolean; message: string }> {
  try {
    if (!paymentId) {
      throw new Error("Payment ID is required");
    }

    if (!paymentIntent?.sender || !paymentIntent?.signature) {
      throw new Error("Payment intent with sender and signature is required");
    }

    const apiUrl = process.env.BACKEND_URL;

    if (!apiUrl) {
      throw new Error("API URL is not configured");
    }

    const response = await fetch(
      `${apiUrl}/public/payment/${paymentId}/customer`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: paymentIntent.sender,
          signature: paymentIntent.signature,
          customer: customerInfo,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);

      throw new Error(
        errorData?.message || "Failed to update customer information"
      );
    }

    const data: ApiResponse = await response.json();

    return {
      success: true,
      message: data.message || "Customer information updated successfully",
    };
  } catch (error) {
    console.error("Error updating customer information:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update customer information",
    };
  }
}
