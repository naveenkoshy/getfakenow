import { Link } from "wouter";
import { Logo } from "@/components/Logo";

export default function TermsOfService() {
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
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: December 12, 2024</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Agreement to Terms</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              By accessing and using the Fake by Freetown website and purchasing our products, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Use of Website</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">Eligibility</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You must be at least 18 years old to make purchases on our website. By placing an order, you represent that you are of legal age to form a binding contract and meet all eligibility requirements. If you are under 18, you may use our website only with the involvement and consent of a parent or guardian.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">Account Registration</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To make purchases, you may be required to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate and current. You must notify us immediately of any unauthorized use of your account.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">Prohibited Activities</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You agree not to use our website for any unlawful purpose or in any way that could damage, disable, overburden, or impair our servers or networks. Prohibited activities include attempting to gain unauthorized access to any portion of the website, interfering with the proper functioning of the website, using any automated system to access the website without our express written permission, transmitting viruses or malicious code, collecting or harvesting any information from the website or other users, and impersonating any person or entity or misrepresenting your affiliation with any person or entity.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Products and Pricing</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">Product Information</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We strive to provide accurate product descriptions, images, and pricing information. However, we do not warrant that product descriptions, colors, images, or other content on the website are accurate, complete, reliable, current, or error-free. Product colors may vary slightly due to monitor settings and photography lighting.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">Pricing</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              All prices are listed in Malaysian Ringgit (RM) and include applicable taxes unless otherwise stated. We reserve the right to change prices at any time without notice. However, the price charged for your order will be the price displayed at the time you complete your purchase. In the event of a pricing error, we reserve the right to cancel the order and notify you.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">Product Availability</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              All products are subject to availability. We reserve the right to limit quantities purchased per person, per household, or per order. We may also discontinue products at any time. If a product becomes unavailable after you place an order, we will notify you and offer a refund or substitute product.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Orders and Payment</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">Order Acceptance</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Your receipt of an order confirmation does not constitute our acceptance of your order. We reserve the right to accept or decline your order for any reason, including product availability, errors in product or pricing information, or suspected fraudulent activity. If your order is cancelled after payment has been processed, we will issue a full refund.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">Payment Methods</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We accept major credit cards, debit cards, and other payment methods as indicated on our website. Payment processing is handled securely through our third-party payment provider (Stripe). By providing payment information, you represent that you are authorized to use the payment method and authorize us to charge the total amount of your order.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">Payment Security</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use industry-standard encryption and security measures to protect your payment information. However, we do not store your complete credit card information on our servers. All payment data is processed and stored securely by our payment service provider in compliance with PCI DSS standards.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Intellectual Property Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              All content on this website, including text, graphics, logos, images, product designs, and software, is the property of Fake by Freetown or its content suppliers and is protected by Malaysian and international copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, modify, create derivative works of, publicly display, republish, download, store, or transmit any of the material on our website without our prior written consent.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The "Fake" brand name, logo, and all related designs, trademarks, and trade dress are proprietary to Fake by Freetown. You may not use these marks without our express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To the fullest extent permitted by law, Fake by Freetown shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, use, or goodwill, arising out of or related to your use of the website or products, even if we have been advised of the possibility of such damages.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Our total liability for any claims arising from your use of the website or purchase of products shall not exceed the amount you paid for the products in question. Some jurisdictions do not allow the exclusion or limitation of certain damages, so some of the above limitations may not apply to you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You agree to indemnify, defend, and hold harmless Fake by Freetown and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising out of or related to your violation of these Terms of Service, your use of the website, or your violation of any rights of another party.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Governing Law and Dispute Resolution</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              These Terms of Service shall be governed by and construed in accordance with the laws of Malaysia, without regard to its conflict of law provisions. Any disputes arising from or relating to these terms or your use of the website shall be subject to the exclusive jurisdiction of the courts of Malaysia.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Before initiating any legal proceedings, you agree to first attempt to resolve any dispute informally by contacting us. We will work in good faith to resolve any disputes amicably.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Modifications to Terms</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting to the website with a new "Last updated" date. Your continued use of the website after any changes constitutes your acceptance of the new terms. We encourage you to review these terms periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Severability</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If any provision of these Terms of Service is found to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect. The invalid provision shall be modified to the minimum extent necessary to make it valid and enforceable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Entire Agreement</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              These Terms of Service, together with our Privacy Policy, Shipping Policy, and Returns & Refunds Policy, constitute the entire agreement between you and Fake by Freetown regarding your use of the website and purchase of products, superseding any prior agreements or understandings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="bg-muted p-6 rounded-lg">
              <p className="font-medium mb-2">Fake by Freetown</p>
              <p className="text-muted-foreground">Email: legal@fakebyfreetown.com</p>
              <p className="text-muted-foreground">Address: Kuala Lumpur, Malaysia</p>
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
