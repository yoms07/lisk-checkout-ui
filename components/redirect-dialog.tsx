import { useEffect, useState } from "react";

interface RedirectDialogProps {
  success_redirect_url: string;
  onRedirect: () => void;
}

export function RedirectDialog({
  success_redirect_url,
  onRedirect,
}: RedirectDialogProps) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      onRedirect();
    }
  }, [countdown, onRedirect]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Payment Successful!
          </h2>
          <p className="text-gray-600">
            Redirecting you to the merchant&apos;s website in {countdown}{" "}
            seconds...
          </p>
          <div className="flex justify-center gap-2">
            <button
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
              onClick={onRedirect}
            >
              Redirect Now
            </button>
            <button
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-900"
              onClick={() => window.open(success_redirect_url, "_blank")}
            >
              Open in New Tab
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
