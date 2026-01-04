import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { AuthModal } from "./AuthModal";

export function Footer() {
  const { isAuthenticated } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <>
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      <footer className="border-t border-border py-16 bg-gray-900 text-white">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="brand-cursive text-3xl text-primary">Fake</span>
                <span className="text-xs text-gray-400">by Freetown</span>
              </div>
              <p className="text-sm text-gray-400">
                Elevated apparel for every occasion
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white">Shop</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/shop" className="hover:text-white transition-colors">All Products</Link></li>
                <li><Link href="/casual" className="hover:text-white transition-colors">Casual</Link></li>
                <li><Link href="/professional" className="hover:text-white transition-colors">Professional</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white">Account</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {isAuthenticated ? (
                  <>
                    <li><Link href="/account" className="hover:text-white transition-colors">My Account</Link></li>
                    <li><Link href="/orders" className="hover:text-white transition-colors">Orders</Link></li>
                  </>
                ) : (
                  <li><button onClick={() => setAuthModalOpen(true)} className="hover:text-white transition-colors">Sign In</button></li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/shipping-policy" className="hover:text-white transition-colors">Shipping Policy</Link></li>
                <li><Link href="/returns-policy" className="hover:text-white transition-colors">Returns & Refunds</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            © 2026 Fake by Freetown. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
