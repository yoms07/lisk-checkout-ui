"use server";
interface InitiatePaymentRequest {
  sender: string;
}

interface InitiatePaymentResponse {
  recipientAmount: string; // BigNumber representation
  deadline: number; // Unix timestamp
  recipient: string; // Ethereum address
  recipientCurrency: string; // Token contract address
  refundDestination: string; // Ethereum address
  feeAmount: string; // BigNumber representation
  id: string; // 16 bytes identifier
  operator: string; // Ethereum address
  signature: string; // Hex string of signature
  prefix: string; // Hex string of prefix
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: InitiatePaymentResponse | null;
}

export async function initiatePayment(
  paymentId: string,
  sender: string
): Promise<ApiResponse> {
  try {
    if (!paymentId) {
      return {
        success: false,
        message: "Payment ID is required",
        data: null,
      };
    }

    if (!sender) {
      return {
        success: false,
        message: "Sender address is required",
        data: null,
      };
    }

    // Get the backend URL from environment variables
    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
      return {
        success: false,
        message: "Backend URL is not configured",
        data: null,
      };
    }

    // Make the API call to initiate payment
    const response = await fetch(
      `${backendUrl}/public/payment/${paymentId}/initiate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sender }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();

      return {
        success: false,
        message: errorData.message || "Failed to initiate payment",
        data: null,
      };
    }

    const data = await response.json();

    return {
      success: true,
      message: "Payment initiated successfully",
      data: data.data,
    };
  } catch (error) {
    console.log(error);
    console.error("Error initiating payment:", error);

    return {
      success: false,
      message: "Internal server error",
      data: null,
    };
  }
}
