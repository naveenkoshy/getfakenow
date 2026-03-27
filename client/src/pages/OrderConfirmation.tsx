import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { SITE_URL } from "@/lib/seo";
import {
  CheckCircle, Package, Truck, PartyPopper, Copy, Share2,
  ShoppingBag, ArrowRight, Heart, Sparkles, Gift
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

// ── Celebration messages ──
const CELEBRATION_MESSAGES = [
  { headline: "You did it, you absolute legend.", sub: "Your order is confirmed and your wardrobe is about to level up." },
  { headline: "Order placed. Drip incoming.", sub: "We're already packing your goods with love (and a hint of sarcasm)." },
  { headline: "Congratulations, you're officially faker.", sub: "And we mean that in the best possible way." },
  { headline: "Ka-ching! Your taste is impeccable.", sub: "The team is doing a little dance. Your order just made our day." },
  { headline: "Welcome to the Fake fam.", sub: "Your order is locked in. Now sit back and wait for the magic." },
];

// ── Simple confetti effect ──
function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];
    const particles: Array<{
      x: number; y: number; w: number; h: number;
      color: string; vx: number; vy: number; rot: number; vr: number;
      opacity: number;
    }> = [];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -Math.random() * canvas.height * 0.5,
        w: Math.random() * 8 + 4,
        h: Math.random() * 6 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 3 + 2,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.2,
        opacity: 1,
      });
    }

    let frame = 0;
    const maxFrames = 180;

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.rot += p.vr;
        if (frame > maxFrames * 0.6) p.opacity -= 0.02;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (frame < maxFrames) requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ mixBlendMode: "multiply" }}
    />
  );
}

export default function OrderConfirmation() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const params = new URLSearchParams(location.split("?")[1]);
  const orderNumber = params.get("order_number");

  const [celebration] = useState(() =>
    CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)]
  );
  const [showConfetti, setShowConfetti] = useState(true);
  const [copied, setCopied] = useState(false);

  // Hide confetti after animation
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleCopyOrderNumber = () => {
    if (orderNumber) {
      navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      toast.success("Order number copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    const shareText = `Just copped some heat from Fake by Freetown! 🔥 Check them out at ${SITE_URL}`;
    if (navigator.share) {
      navigator.share({ title: "Fake by Freetown", text: shareText, url: SITE_URL });
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Share text copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {showConfetti && <ConfettiCanvas />}

      {/* ── Header ── */}
      <header className="border-b border-gray-100 bg-white/95 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-center">
          <Logo size="md" variant="dark" linkTo="/" />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        {/* ── Success Icon ── */}
        <div className="relative inline-block mb-8">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto animate-in zoom-in duration-500">
            <CheckCircle className="h-14 w-14 text-green-500" />
          </div>
          <PartyPopper className="absolute -top-2 -right-4 h-8 w-8 text-yellow-500 animate-bounce" />
          <Sparkles className="absolute -bottom-1 -left-3 h-6 w-6 text-red-400 animate-pulse" />
        </div>

        {/* ── Celebration Copy ── */}
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 mb-3">
          {celebration.headline}
        </h1>
        <p className="text-lg text-gray-500 mb-8 max-w-lg mx-auto">
          {celebration.sub}
        </p>

        {/* ── Order Number Card ── */}
        {orderNumber && (
          <div className="bg-gray-950 rounded-2xl p-8 mb-10 max-w-md mx-auto text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-red-600/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Order Number</p>
            <div className="flex items-center justify-center gap-3">
              <p className="text-2xl md:text-3xl font-black font-mono tracking-wider">{orderNumber}</p>
              <button
                onClick={handleCopyOrderNumber}
                className="text-gray-400 hover:text-white transition-colors p-1"
                title="Copy order number"
              >
                {copied ? <CheckCircle size={18} className="text-green-400" /> : <Copy size={18} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3">Save this — you'll need it to track your order</p>
          </div>
        )}

        {/* ── What Happens Next ── */}
        <div className="bg-gray-50 rounded-2xl p-8 mb-10 max-w-lg mx-auto text-left">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 text-center">
            What happens next?
          </h3>
          <div className="space-y-5">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle size={18} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Order confirmed</p>
                <p className="text-xs text-gray-500">You're here! A confirmation email is on its way.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Package size={18} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">We pack your order</p>
                <p className="text-xs text-gray-500">Our team hand-picks and packs your items with care (and maybe a sticker).</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Truck size={18} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Shipped to your door</p>
                <p className="text-xs text-gray-500">You'll get a tracking number once it's on the move. Usually 3-5 business days.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Heart size={18} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Wear it. Own it. Fake it.</p>
                <p className="text-xs text-gray-500">Put it on, take a selfie, and tag us. We live for that.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto mb-10">
          <Link
            href="/orders"
            className="flex-1 bg-red-600 text-white py-3.5 text-sm font-bold tracking-widest hover:bg-red-700 transition-all rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
          >
            <ShoppingBag size={16} />
            VIEW MY ORDERS
          </Link>
          <Link
            href="/shop"
            className="flex-1 bg-gray-100 text-gray-800 py-3.5 text-sm font-bold tracking-widest hover:bg-gray-200 transition-all rounded-lg flex items-center justify-center gap-2"
          >
            KEEP SHOPPING
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* ── Share / Refer Section ── */}
        <div className="border-t border-gray-100 pt-10">
          <div className="max-w-md mx-auto">
            <Gift size={28} className="text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-black text-gray-900 mb-2">Spread the fake love</h3>
            <p className="text-sm text-gray-500 mb-5">
              Know someone who'd rock our stuff? Share the vibe.
              <br /><span className="text-xs text-gray-400 italic">Good karma guaranteed. Probably.</span>
            </p>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 bg-gray-950 text-white px-8 py-3 text-sm font-bold tracking-widest hover:bg-gray-800 transition-all rounded-lg"
            >
              <Share2 size={16} />
              SHARE WITH FRIENDS
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
