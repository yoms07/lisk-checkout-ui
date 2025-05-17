import { useMutation } from "@tanstack/react-query";

import { initiatePayment } from "@/app/server-only/initiate-payment";

interface UseInitiatePaymentOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useInitiatePayment(options?: UseInitiatePaymentOptions) {
  return useMutation({
    mutationFn: async ({
      paymentId,
      sender,
    }: {
      paymentId: string;
      sender: string;
    }) => {
      const response = await initiatePayment(paymentId, sender);

      if (!response.success) {
        throw new Error(response.message);
      }

      return response.data;
    },
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
}
