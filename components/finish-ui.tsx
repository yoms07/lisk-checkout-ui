interface FinishUIProps {
  paymentId: string;
}

export function FinishUI({ paymentId }: FinishUIProps) {
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Processing Payment
        </h2>
      </div>
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-gray-600">
            Your payment is being processed. Please wait while we confirm your
            transaction.
          </p>
          <p className="text-sm text-gray-500">Payment ID: {paymentId}</p>
        </div>
      </div>
    </div>
  );
}
