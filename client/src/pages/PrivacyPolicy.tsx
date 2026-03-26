import { Link } from "wouter";
import { Logo } from "@/components/Logo";

export default function PrivacyPolicy() {
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
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: December 12, 2024</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Fake by Freetown ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, disclose, and safeguard your information when you visit our website and make purchases from our online store, in compliance with Malaysia's Personal Data Protection Act 2010 (PDPA).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">Personal Information</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              When you create an account or place an order, we collect personal information including your name, email address, phone number, shipping address, and billing information. Payment card details are processed securely through our payment provider (Stripe) and are not stored on our servers.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">Order Information</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We collect details about the products you purchase, order history, and preferences to fulfill your orders and improve your shopping experience.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">Technical Information</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We automatically collect certain technical information when you visit our website, including your IP address, browser type, device information, and browsing behavior through cookies and similar technologies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use your personal information to process and fulfill your orders, communicate with you about your purchases, provide customer support, send order confirmations and shipping updates, process payments and prevent fraud, improve our products and services, and send marketing communications (with your consent).
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We will not sell, rent, or trade your personal information to third parties for their marketing purposes without your explicit consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Information Sharing and Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We may share your information with service providers who assist us in operating our website and conducting our business (such as payment processors, shipping carriers, and hosting providers), legal authorities when required by law or to protect our rights, and business partners with your consent for specific purposes.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              All third-party service providers are required to maintain the confidentiality and security of your personal information and are prohibited from using it for any purpose other than providing services to us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include encryption of sensitive data during transmission (SSL/TLS), secure storage systems, regular security assessments, and restricted access to personal information on a need-to-know basis.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              However, no method of transmission over the internet or electronic storage is completely secure. While we strive to protect your personal information, we cannot guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Your Rights Under PDPA</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Under Malaysia's Personal Data Protection Act 2010, you have the right to access your personal data we hold, request correction of inaccurate or incomplete data, withdraw consent for data processing (where consent is the legal basis), request deletion of your personal data (subject to legal obligations), limit the processing of your personal data, and lodge a complaint with the Personal Data Protection Commissioner if you believe your rights have been violated.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To exercise any of these rights, please contact us using the information provided at the end of this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Cookies and Tracking Technologies</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use cookies and similar tracking technologies to enhance your browsing experience, analyze website traffic, and personalize content. Essential cookies are necessary for the website to function properly (such as shopping cart functionality). Analytics cookies help us understand how visitors interact with our website. You can control cookie preferences through your browser settings, though disabling certain cookies may affect website functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this privacy policy, comply with legal obligations (such as tax and accounting requirements), resolve disputes, and enforce our agreements. Order and transaction data are typically retained for seven years in accordance with Malaysian tax regulations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Our website and services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Changes to This Privacy Policy</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We may update this privacy policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes by posting the updated policy on our website with a new "Last updated" date. Your continued use of our website after such changes constitutes your acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you have any questions, concerns, or requests regarding this privacy policy or our data practices, please contact us at:
            </p>
            <div className="bg-muted p-6 rounded-lg">
              <p className="font-medium mb-2">Fake by Freetown</p>
              <p className="text-muted-foreground">Email: privacy@fakebyfreetown.com</p>
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
