import { Link } from "wouter";

export default function ReturnsPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white sticky top-0 z-50">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <span className="brand-cursive text-4xl text-primary">Fake</span>
                <span className="text-sm text-muted-foreground font-light">by Freetown</span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="container py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-2">Returns & Refunds Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: December 12, 2024</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Commitment</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We want you to be completely satisfied with your purchase. If you're not happy with your order for any reason, we offer a straightforward returns and refunds process in accordance with the Consumer Protection Act 1999 of Malaysia.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Return Eligibility</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You may return most items within 14 days of receiving your order for a full refund or exchange. To be eligible for a return, items must meet the following conditions:
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Items must be unworn, unwashed, and in their original condition with all tags attached. Items must be in their original packaging. Items must not show any signs of wear, alterations, or damage. Proof of purchase (order confirmation email or receipt) must be provided.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Non-Returnable Items</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The following items cannot be returned for hygiene and safety reasons: underwear and intimate apparel, earrings and body jewelry, items marked as "Final Sale" or purchased during clearance sales, gift cards, and items that have been personalized or customized.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">How to Initiate a Return</h2>
            
            <div className="bg-muted p-6 rounded-lg space-y-4">
              <div>
                <p className="font-medium mb-2">Step 1: Contact Us</p>
                <p className="text-muted-foreground">Email returns@fakebyfreetown.com within 14 days of receiving your order. Include your order number, items you wish to return, and reason for return.</p>
              </div>
              
              <div>
                <p className="font-medium mb-2">Step 2: Receive Return Authorization</p>
                <p className="text-muted-foreground">We will review your request and send you a Return Authorization (RA) number along with return instructions within 1-2 business days.</p>
              </div>
              
              <div>
                <p className="font-medium mb-2">Step 3: Pack Your Items</p>
                <p className="text-muted-foreground">Securely pack the items in their original packaging with all tags attached. Include a copy of your order confirmation and the RA number.</p>
              </div>
              
              <div>
                <p className="font-medium mb-2">Step 4: Ship Your Return</p>
                <p className="text-muted-foreground">Ship the package to the return address provided. We recommend using a trackable shipping method. Keep your tracking number for reference.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Return Shipping Costs</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">Change of Mind Returns</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you are returning an item due to a change of mind, you are responsible for the return shipping costs. We recommend using a trackable shipping service to ensure your return reaches us safely.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">Defective or Incorrect Items</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you received a defective, damaged, or incorrect item, we will cover the return shipping costs. Please contact us immediately, and we will provide a prepaid return label or reimburse your shipping costs upon receipt of the return.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Refund Processing</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Once we receive your returned item, we will inspect it to ensure it meets our return eligibility criteria. If approved, your refund will be processed within 5-7 business days. Refunds will be issued to the original payment method used for the purchase.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Please note that it may take an additional 5-10 business days for the refund to appear in your account, depending on your bank or card issuer. Original shipping fees are non-refundable unless the return is due to our error (defective or incorrect item).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Exchanges</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We currently do not offer direct exchanges. If you need a different size or color, please return the original item for a refund and place a new order for the desired item. This ensures you receive your preferred item as quickly as possible, subject to availability.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Defective or Damaged Items</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you receive a defective or damaged item, please contact us within 48 hours of delivery with photos of the defect or damage. We will arrange for a replacement or full refund, including return shipping costs. Quality is important to us, and we will work quickly to resolve any issues.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Wrong Item Received</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you receive the wrong item, please contact us immediately. We will arrange for the correct item to be sent to you at no additional cost and provide a prepaid return label for the incorrect item. We apologize for any inconvenience and will prioritize resolving the issue.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Late or Missing Refunds</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you haven't received your refund within the expected timeframe, please first check your bank account or contact your credit card company, as processing times may vary. If you've done this and still have not received your refund, please contact us at returns@fakebyfreetown.com with your order number and return tracking information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Consumer Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              This returns policy does not affect your statutory rights under the Consumer Protection Act 1999 of Malaysia. If you believe a product is faulty or not as described, you may be entitled to additional remedies under Malaysian consumer protection law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              For returns and refund inquiries, please contact us at:
            </p>
            <div className="bg-muted p-6 rounded-lg">
              <p className="font-medium mb-2">Fake by Freetown Returns Department</p>
              <p className="text-muted-foreground">Email: returns@fakebyfreetown.com</p>
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
