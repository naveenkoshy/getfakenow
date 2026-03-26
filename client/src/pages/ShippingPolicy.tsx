import { Link } from "wouter";
import { Logo } from "@/components/Logo";

export default function ShippingPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white sticky top-0 z-50">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <Logo size="md" variant="dark" linkTo="/" />
          </div>
        </div>
      </header>

      <div className="container py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-2">Shipping Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: December 12, 2024</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Shipping Coverage</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We currently ship to all addresses within Malaysia. International shipping is not available at this time. We ship to residential addresses, business addresses, and PO boxes throughout Peninsular Malaysia, Sabah, and Sarawak.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Processing Time</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Orders are processed within 1-2 business days (Monday to Friday, excluding public holidays) after payment confirmation. Orders placed on weekends or public holidays will be processed on the next business day. You will receive an email confirmation once your order has been shipped, including tracking information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Shipping Methods and Delivery Time</h2>
            
            <div className="bg-muted p-6 rounded-lg mb-4">
              <h3 className="text-xl font-medium mb-3">Standard Shipping (Peninsular Malaysia)</h3>
              <p className="text-muted-foreground mb-2">Delivery Time: 3-5 business days</p>
              <p className="text-muted-foreground mb-2">Cost: RM10 for orders under RM150</p>
              <p className="text-muted-foreground">Free shipping for orders RM150 and above</p>
            </div>

            <div className="bg-muted p-6 rounded-lg mb-4">
              <h3 className="text-xl font-medium mb-3">Standard Shipping (East Malaysia)</h3>
              <p className="text-muted-foreground mb-2">Delivery Time: 5-7 business days</p>
              <p className="text-muted-foreground mb-2">Cost: RM20 for orders under RM200</p>
              <p className="text-muted-foreground">Free shipping for orders RM200 and above</p>
            </div>

            <div className="bg-muted p-6 rounded-lg">
              <h3 className="text-xl font-medium mb-3">Express Shipping (Peninsular Malaysia)</h3>
              <p className="text-muted-foreground mb-2">Delivery Time: 1-2 business days</p>
              <p className="text-muted-foreground">Cost: RM25 (all orders)</p>
            </div>

            <p className="text-muted-foreground leading-relaxed mt-6">
              Delivery times are estimates and may vary depending on courier service performance, weather conditions, public holidays, and remote location accessibility. We are not responsible for delays caused by circumstances beyond our control.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Order Tracking</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Once your order is shipped, you will receive a tracking number via email. You can track your shipment through our courier partner's website or contact our customer service team for assistance. Please allow 24 hours for tracking information to become active in the courier system.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Delivery Issues</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">Failed Delivery Attempts</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If the courier is unable to deliver your order due to an incorrect address, recipient unavailable, or refused delivery, the package will be returned to our warehouse. You may be charged for re-shipping costs. Please ensure your shipping address is accurate and someone is available to receive the package.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">Lost or Damaged Packages</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If your package is lost during transit or arrives damaged, please contact us within 48 hours of the expected delivery date (for lost packages) or within 24 hours of receipt (for damaged packages). We will work with the courier to investigate and resolve the issue, which may include reshipping your order or issuing a refund.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">Incorrect Address</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Please double-check your shipping address before completing your order. We cannot be held responsible for orders shipped to incorrect addresses provided by the customer. If you need to update your shipping address, contact us immediately after placing your order. Once the order has been shipped, we cannot modify the delivery address.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Customs and Import Duties</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              As we currently ship only within Malaysia, customs duties and import taxes do not apply. Should we expand to international shipping in the future, customers will be responsible for any applicable customs duties, taxes, or fees imposed by their country.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Order Cancellation Before Shipping</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You may cancel your order before it has been shipped by contacting our customer service team. Once an order has been dispatched, it cannot be cancelled, but you may return it according to our Returns & Refunds Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              For shipping inquiries or assistance, please contact us at:
            </p>
            <div className="bg-muted p-6 rounded-lg">
              <p className="font-medium mb-2">Fake by Freetown Customer Service</p>
              <p className="text-muted-foreground">Email: shipping@fakebyfreetown.com</p>
              <p className="text-muted-foreground">Phone: +60 3-XXXX XXXX</p>
              <p className="text-muted-foreground">Business Hours: Monday - Friday, 9:00 AM - 6:00 PM (GMT+8)</p>
            </div>
          </section>
        </div>
      </div>

      <footer className="border-t border-border bg-white mt-16">
        <div className="container py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2026 Fake by Freetown. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
