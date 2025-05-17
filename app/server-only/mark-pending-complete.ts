"use server";
interface ApiResponse {
  status: number;
  message: string;
  data: {
    id: string;
    status: string;
  } | null;
}

interface PaymentIntent {
  sender: string;
  signature: string;
}

export async function markPendingComplete(
  paymentId: string,
  paymentIntent: PaymentIntent
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
      `${apiUrl}/public/payment/${paymentId}/mark-pending-complete`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: paymentIntent.sender,
          signature: paymentIntent.signature,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);

      throw new Error(
        errorData?.message || "Failed to mark payment as pending-complete"
      );
    }

    const data: ApiResponse = await response.json();

    return {
      success: true,
      message:
        data.message || "Payment marked as pending-complete successfully",
    };
  } catch (error) {
    console.error("Error marking payment as pending-complete:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to mark payment as pending-complete",
    };
  }
}
