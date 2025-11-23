import { Suspense } from "react";
import CheckoutPageContent from "./CheckoutPageContent";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading checkout...</div>}>
      <CheckoutPageContent />
    </Suspense>
  );
}


































