import { CheckCircleIcon } from "@heroicons/react/24/outline";

import { Payment } from "@/app/server-only/get-payment";

interface CompleteUIProps {
  payment: Payment;
}

export function CompleteUI({ payment }: CompleteUIProps) {
  const formatCurrency = (amount: string) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(Number(amount));

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
          <CheckCircleIcon className="w-10 h-10 text-green-600" />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900">
            Payment Completed
          </h2>
          <p className="text-gray-600">
            Your payment has been successfully processed
          </p>
        </div>

        <div className="w-full space-y-4 mt-4">
          {/* Items Section - Only show if there are items */}
          {payment.items && payment.items.length > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">
                Items Purchased
              </h3>
              <div className="space-y-3">
                {payment.items.map((item) => (
                  <div
                    key={item.item_id}
                    className="flex justify-between items-start"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        {item.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(item.unit_price)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Details Section */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Payment Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(payment.pricing.local.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment-ID</span>
                <span className="font-medium text-gray-900 text-right">
                  {payment.payment_id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="font-medium text-green-600">Completed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date</span>
                <span className="font-medium text-gray-900">
                  {new Date(payment.updated_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {payment.success_redirect_url && (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">
                You will be redirected to the merchant&apos;s website
              </p>
              <a
                className="inline-block px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                href={payment.success_redirect_url}
                rel="noopener noreferrer"
                target="_blank"
              >
                Return to Merchant
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
