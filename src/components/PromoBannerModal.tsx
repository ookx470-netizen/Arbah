import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Share2, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  X, 
  Crown, 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  Gift, 
  Users,
  QrCode,
  Palette,
  CheckCircle2,
  ExternalLink,
  Layers,
  Award,
  Send,
  MessageCircle,
  Flame,
  Diamond
} from 'lucide-react';
import { User } from '../types';

interface PromoBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

type CardStyle = 'crypto-gold' | 'neon-cyber' | 'royal-blue' | 'emerald-wealth' | 'amethyst-vip';

export const PromoBannerModal: React.FC<PromoBannerModalProps> = ({
  isOpen,
  onClose,
  user
}) => {
  const [selectedStyle, setSelectedStyle] = useState<CardStyle>('crypto-gold');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://oxlo.app';
  const inviteCode = user.inviteCode || 'OXLO';
  const referralLink = `${origin}/?ref=${inviteCode}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(referralLink)}&margin=1&format=png`;

  const promoMessage = `🔥 انضم الآن إلى منصة OXLO الرقمية الرسمية لكسب الأرباح والمهام اليومية!
💎 سحب فوري عبر شبكة USDT Polygon
👑 كود الدعوة الحصري: ${inviteCode}
🚀 رابط التسجيل المباشر: ${referralLink}`;

  const handleCopy = (text: string, type: 'code' | 'link' | 'msg') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const handleShareTelegram = () => {
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(promoMessage)}`;
    window.open(tgUrl, '_blank');
  };

  const handleShareWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(promoMessage)}`;
    window.open(waUrl, '_blank');
  };

  // High-Resolution 1080x1440 Poster Generation using HTML5 Canvas
  const handleDownloadImage = async () => {
    setIsGeneratingImg(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      // 1080 x 1440 HD Story / Post Format
      const width = 1080;
      const height = 1440;
      canvas.width = width;
      canvas.height = height;

      // 1. Theme Color Palettes & Background Gradients
      if (selectedStyle === 'crypto-gold') {
        // Deep obsidian with warm golden radial glow
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#0a0a0d');
        bgGrad.addColorStop(0.35, '#14110b');
        bgGrad.addColorStop(0.7, '#0d0d12');
        bgGrad.addColorStop(1, '#050507');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Ambient Golden Glows
        const glow1 = ctx.createRadialGradient(width * 0.5, 240, 20, width * 0.5, 240, 550);
        glow1.addColorStop(0, 'rgba(245, 158, 11, 0.28)');
        glow1.addColorStop(0.6, 'rgba(217, 119, 6, 0.08)');
        glow1.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow1;
        ctx.fillRect(0, 0, width, height);

        const glow2 = ctx.createRadialGradient(width * 0.5, height - 200, 30, width * 0.5, height - 200, 480);
        glow2.addColorStop(0, 'rgba(234, 179, 8, 0.18)');
        glow2.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow2;
        ctx.fillRect(0, 0, width, height);

      } else if (selectedStyle === 'neon-cyber') {
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#060a14');
        bgGrad.addColorStop(0.4, '#09152b');
        bgGrad.addColorStop(0.8, '#060d1b');
        bgGrad.addColorStop(1, '#02040a');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        const glow1 = ctx.createRadialGradient(width * 0.5, 220, 20, width * 0.5, 220, 520);
        glow1.addColorStop(0, 'rgba(6, 182, 212, 0.32)');
        glow1.addColorStop(0.7, 'rgba(59, 130, 246, 0.08)');
        glow1.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow1;
        ctx.fillRect(0, 0, width, height);

        const glow2 = ctx.createRadialGradient(width * 0.2, height - 150, 10, width * 0.2, height - 150, 400);
        glow2.addColorStop(0, 'rgba(168, 85, 247, 0.22)');
        glow2.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow2;
        ctx.fillRect(0, 0, width, height);

      } else if (selectedStyle === 'royal-blue') {
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#090d1f');
        bgGrad.addColorStop(0.4, '#131b40');
        bgGrad.addColorStop(0.8, '#0b1028');
        bgGrad.addColorStop(1, '#050711');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        const glow = ctx.createRadialGradient(width * 0.5, 240, 20, width * 0.5, 240, 550);
        glow.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
        glow.addColorStop(0.6, 'rgba(59, 130, 246, 0.12)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);

      } else if (selectedStyle === 'emerald-wealth') {
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#021812');
        bgGrad.addColorStop(0.4, '#062d22');
        bgGrad.addColorStop(0.8, '#031913');
        bgGrad.addColorStop(1, '#010c08');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        const glow = ctx.createRadialGradient(width * 0.5, 240, 20, width * 0.5, 240, 550);
        glow.addColorStop(0, 'rgba(16, 185, 129, 0.32)');
        glow.addColorStop(0.6, 'rgba(5, 150, 105, 0.1)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);

      } else {
        // Amethyst VIP
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#15091f');
        bgGrad.addColorStop(0.4, '#261038');
        bgGrad.addColorStop(0.8, '#180a24');
        bgGrad.addColorStop(1, '#0a0410');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        const glow = ctx.createRadialGradient(width * 0.5, 240, 20, width * 0.5, 240, 550);
        glow.addColorStop(0, 'rgba(217, 70, 239, 0.32)');
        glow.addColorStop(0.6, 'rgba(168, 85, 247, 0.12)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Subtle Geometric / Particle Mesh Pattern
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 60) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let j = 0; j < height; j += 60) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(width, j);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Main Glassmorphism Frame Container
      const framePad = 48;
      const frameX = framePad;
      const frameY = framePad;
      const frameW = width - framePad * 2;
      const frameH = height - framePad * 2;
      const frameR = 44;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(frameX, frameY, frameW, frameH, frameR);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.fill();

      // Border Glow & Gradient Stroke
      const borderGrad = ctx.createLinearGradient(frameX, frameY, frameX + frameW, frameY + frameH);
      if (selectedStyle === 'crypto-gold') {
        borderGrad.addColorStop(0, 'rgba(251, 191, 36, 0.7)');
        borderGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.2)');
        borderGrad.addColorStop(1, 'rgba(217, 119, 6, 0.6)');
      } else if (selectedStyle === 'neon-cyber') {
        borderGrad.addColorStop(0, 'rgba(34, 211, 238, 0.7)');
        borderGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.2)');
        borderGrad.addColorStop(1, 'rgba(168, 85, 247, 0.6)');
      } else if (selectedStyle === 'royal-blue') {
        borderGrad.addColorStop(0, 'rgba(129, 140, 248, 0.7)');
        borderGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.2)');
        borderGrad.addColorStop(1, 'rgba(59, 130, 246, 0.6)');
      } else if (selectedStyle === 'emerald-wealth') {
        borderGrad.addColorStop(0, 'rgba(52, 211, 153, 0.7)');
        borderGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.2)');
        borderGrad.addColorStop(1, 'rgba(5, 150, 105, 0.6)');
      } else {
        borderGrad.addColorStop(0, 'rgba(244, 114, 182, 0.7)');
        borderGrad.addColorStop(0.5, 'rgba(192, 132, 252, 0.2)');
        borderGrad.addColorStop(1, 'rgba(217, 70, 239, 0.6)');
      }
      ctx.strokeStyle = borderGrad;
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.restore();

      // 4. Top Header & Brand Emblem
      ctx.textAlign = 'center';
      
      // Top Pill Badge
      const topPillW = 380;
      const topPillH = 46;
      const topPillX = (width - topPillW) / 2;
      const topPillY = 100;
      
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(topPillX, topPillY, topPillW, topPillH, 23);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = '900 18px sans-serif';
      ctx.fillStyle = selectedStyle === 'crypto-gold' ? '#fde047' :
                      selectedStyle === 'neon-cyber' ? '#67e8f9' :
                      selectedStyle === 'royal-blue' ? '#a5b4fc' :
                      selectedStyle === 'emerald-wealth' ? '#6ee7b7' :
                      '#f472b6';
      ctx.fillText('★ OFFICIAL VIP INVITATION ★', width / 2, topPillY + 29);
      ctx.restore();

      // Main Logo Brand Title
      ctx.font = '900 62px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = selectedStyle === 'crypto-gold' ? 'rgba(245, 158, 11, 0.6)' :
                         selectedStyle === 'neon-cyber' ? 'rgba(6, 182, 212, 0.6)' :
                         selectedStyle === 'royal-blue' ? 'rgba(99, 102, 241, 0.6)' :
                         selectedStyle === 'emerald-wealth' ? 'rgba(16, 185, 129, 0.6)' :
                         'rgba(217, 70, 239, 0.6)';
      ctx.shadowBlur = 24;
      ctx.fillText('OXLO NETWORK', width / 2, 215);
      ctx.shadowBlur = 0; // reset

      // Sub-headline
      ctx.font = '700 24px sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('منظومة المهام الرقمية والأرباح اليومية الرسمية', width / 2, 260);

      // 5. Inviter Card Badge (Prominent Box)
      const inviterBoxW = 620;
      const inviterBoxH = 86;
      const inviterBoxX = (width - inviterBoxW) / 2;
      const inviterBoxY = 300;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(inviterBoxX, inviterBoxY, inviterBoxW, inviterBoxH, 24);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Avatar circle on canvas
      const avatarR = 26;
      const avatarX = inviterBoxX + 50;
      const avatarY = inviterBoxY + inviterBoxH / 2;
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
      ctx.fillStyle = selectedStyle === 'crypto-gold' ? '#f59e0b' :
                      selectedStyle === 'neon-cyber' ? '#06b6d4' :
                      selectedStyle === 'royal-blue' ? '#6366f1' :
                      selectedStyle === 'emerald-wealth' ? '#10b981' :
                      '#d946ef';
      ctx.fill();
      ctx.font = '900 20px sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      const initial = (user.username || 'VIP').charAt(0).toUpperCase();
      ctx.fillText(initial, avatarX, avatarY + 7);

      ctx.textAlign = 'right';
      ctx.font = '700 18px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('دعوة رسمية حصرية مقدمة من القائد:', inviterBoxX + inviterBoxW - 30, inviterBoxY + 34);

      ctx.font = '900 26px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(user.username || 'عضو مميز', inviterBoxX + inviterBoxW - 30, inviterBoxY + 68);
      ctx.restore();

      // 6. Value Proposition Cards (3 Modern Grid Pills)
      const features = [
        { title: 'مهام يومية فورية', sub: 'أرباح ثابتة يومياً', icon: '⚡' },
        { title: 'سحب Polygon فوري', sub: 'معالجة آلية وآمنة 100%', icon: '🛡️' },
        { title: 'عمولات فريق 10%', sub: 'مكافآت 3 مستويات مباشرة', icon: '💎' }
      ];

      const featItemW = 280;
      const featItemH = 92;
      const featGap = 20;
      const featTotalW = featItemW * 3 + featGap * 2;
      const featStartX = (width - featTotalW) / 2;
      const featY = 415;

      features.forEach((feat, idx) => {
        const fX = featStartX + idx * (featItemW + featGap);
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(fX, featY, featItemW, featItemH, 20);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.font = '700 24px sans-serif';
        ctx.fillText(feat.icon, fX + featItemW / 2, featY + 36);

        ctx.font = '800 18px sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(feat.title, fX + featItemW / 2, featY + 62);

        ctx.font = '600 13px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(feat.sub, fX + featItemW / 2, featY + 80);
        ctx.restore();
      });

      // 7. QR Code Center Frame Container (Ultra-Sharp Luxury Frame)
      const qrBoxSize = 400;
      const qrBoxX = (width - qrBoxSize) / 2;
      const qrBoxY = 535;

      // Glow behind QR
      ctx.save();
      const qrGlow = ctx.createRadialGradient(width / 2, qrBoxY + qrBoxSize / 2, 50, width / 2, qrBoxY + qrBoxSize / 2, 280);
      qrGlow.addColorStop(0, selectedStyle === 'crypto-gold' ? 'rgba(245, 158, 11, 0.3)' :
                             selectedStyle === 'neon-cyber' ? 'rgba(6, 182, 212, 0.3)' :
                             selectedStyle === 'royal-blue' ? 'rgba(99, 102, 241, 0.3)' :
                             selectedStyle === 'emerald-wealth' ? 'rgba(16, 185, 129, 0.3)' :
                             'rgba(217, 70, 239, 0.3)');
      qrGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = qrGlow;
      ctx.fillRect(qrBoxX - 60, qrBoxY - 60, qrBoxSize + 120, qrBoxSize + 120);

      // White QR Base Rounded Box
      ctx.beginPath();
      ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 36);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // QR Frame Border
      ctx.strokeStyle = selectedStyle === 'crypto-gold' ? '#f59e0b' :
                        selectedStyle === 'neon-cyber' ? '#06b6d4' :
                        selectedStyle === 'royal-blue' ? '#6366f1' :
                        selectedStyle === 'emerald-wealth' ? '#10b981' :
                        '#d946ef';
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.restore();

      // Draw QR Code Image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = qrCodeUrl;
      await new Promise((resolve) => {
        img.onload = () => {
          ctx.drawImage(img, qrBoxX + 24, qrBoxY + 24, qrBoxSize - 48, qrBoxSize - 48);
          resolve(null);
        };
        img.onerror = () => {
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 26px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Scan QR Code', width / 2, qrBoxY + qrBoxSize / 2);
          resolve(null);
        };
      });

      // QR Scan Instruction Label
      ctx.textAlign = 'center';
      ctx.font = '800 20px sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('📷 امسح رمز QR بكاميرا هاتفك أو تليجرام للتسجيل الفوري', width / 2, 975);

      // 8. Metallic Exclusive Invite Code Box
      const codeBoxW = 760;
      const codeBoxH = 135;
      const codeBoxX = (width - codeBoxW) / 2;
      const codeBoxY = 1015;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(codeBoxX, codeBoxY, codeBoxW, codeBoxH, 28);
      
      const codeBgGrad = ctx.createLinearGradient(codeBoxX, codeBoxY, codeBoxX + codeBoxW, codeBoxY + codeBoxH);
      if (selectedStyle === 'crypto-gold') {
        codeBgGrad.addColorStop(0, 'rgba(245, 158, 11, 0.18)');
        codeBgGrad.addColorStop(0.5, 'rgba(234, 179, 8, 0.08)');
        codeBgGrad.addColorStop(1, 'rgba(217, 119, 6, 0.18)');
      } else if (selectedStyle === 'neon-cyber') {
        codeBgGrad.addColorStop(0, 'rgba(6, 182, 212, 0.18)');
        codeBgGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.08)');
        codeBgGrad.addColorStop(1, 'rgba(168, 85, 247, 0.18)');
      } else if (selectedStyle === 'royal-blue') {
        codeBgGrad.addColorStop(0, 'rgba(99, 102, 241, 0.18)');
        codeBgGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.08)');
        codeBgGrad.addColorStop(1, 'rgba(99, 102, 241, 0.18)');
      } else if (selectedStyle === 'emerald-wealth') {
        codeBgGrad.addColorStop(0, 'rgba(16, 185, 129, 0.18)');
        codeBgGrad.addColorStop(0.5, 'rgba(5, 150, 105, 0.08)');
        codeBgGrad.addColorStop(1, 'rgba(16, 185, 129, 0.18)');
      } else {
        codeBgGrad.addColorStop(0, 'rgba(217, 70, 239, 0.18)');
        codeBgGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.08)');
        codeBgGrad.addColorStop(1, 'rgba(217, 70, 239, 0.18)');
      }
      ctx.fillStyle = codeBgGrad;
      ctx.fill();

      ctx.strokeStyle = selectedStyle === 'crypto-gold' ? 'rgba(245, 158, 11, 0.6)' :
                        selectedStyle === 'neon-cyber' ? 'rgba(6, 182, 212, 0.6)' :
                        selectedStyle === 'royal-blue' ? 'rgba(99, 102, 241, 0.6)' :
                        selectedStyle === 'emerald-wealth' ? 'rgba(16, 185, 129, 0.6)' :
                        'rgba(217, 70, 239, 0.6)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.font = '700 20px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('كود الدعوة الرسمي والحصري (INVITE CODE)', width / 2, codeBoxY + 44);

      ctx.font = '900 52px monospace';
      ctx.fillStyle = selectedStyle === 'crypto-gold' ? '#fde047' :
                      selectedStyle === 'neon-cyber' ? '#67e8f9' :
                      selectedStyle === 'royal-blue' ? '#c7d2fe' :
                      selectedStyle === 'emerald-wealth' ? '#a7f3d0' :
                      '#fbcfe8';
      ctx.fillText(inviteCode, width / 2, codeBoxY + 104);
      ctx.restore();

      // 9. Official Trust Footer & Verification Seal
      ctx.font = '700 18px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('🔒 شبكة لا مركزية موثوقة • سحوبات فورية Polygon Network • دعم فني على مدار الساعة', width / 2, 1195);

      ctx.font = '600 15px sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText('OXLO VIP NETWORK © 2026 • ALL RIGHTS RESERVED', width / 2, 1230);

      // Convert Canvas to Blob and Trigger Download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `OXLO_VIP_INVITE_${inviteCode}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      }, 'image/png', 1.0);

    } catch (err) {
      console.error('Error generating promo card image:', err);
    } finally {
      setIsGeneratingImg(false);
    }
  };

  const styleConfigs: Record<CardStyle, { 
    name: string; 
    themeLabel: string;
    bg: string; 
    border: string; 
    accentGrad: string; 
    glowColor: string; 
    codeText: string; 
    badgeColor: string;
    pillBg: string;
  }> = {
    'crypto-gold': {
      name: 'الذهب الملكي (Black Gold VIP)',
      themeLabel: 'ذهب 24K الفاخر',
      bg: 'bg-gradient-to-b from-stone-950 via-stone-900 to-black',
      border: 'border-amber-500/50 shadow-amber-500/10',
      accentGrad: 'from-amber-400 via-yellow-500 to-amber-600',
      glowColor: 'bg-amber-500/15',
      codeText: 'text-amber-400',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      pillBg: 'from-amber-500/20 to-yellow-500/10'
    },
    'neon-cyber': {
      name: 'النيون السيبراني (Cyber Cyan)',
      themeLabel: 'سايبر المستقبلي',
      bg: 'bg-gradient-to-b from-slate-950 via-cyan-950/50 to-black',
      border: 'border-cyan-500/50 shadow-cyan-500/10',
      accentGrad: 'from-cyan-400 via-sky-500 to-blue-600',
      glowColor: 'bg-cyan-500/15',
      codeText: 'text-cyan-400',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      pillBg: 'from-cyan-500/20 to-blue-500/10'
    },
    'royal-blue': {
      name: 'الأزرق الملكي الياقوتي (Sapphire)',
      themeLabel: 'الياقوت الإمبراطوري',
      bg: 'bg-gradient-to-b from-slate-950 via-indigo-950/60 to-black',
      border: 'border-indigo-500/50 shadow-indigo-500/10',
      accentGrad: 'from-indigo-400 via-blue-500 to-indigo-600',
      glowColor: 'bg-indigo-500/15',
      codeText: 'text-indigo-400',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      pillBg: 'from-indigo-500/20 to-blue-500/10'
    },
    'emerald-wealth': {
      name: 'الزمرد الأخضر (Emerald Growth)',
      themeLabel: 'الزمرد الاستثماري',
      bg: 'bg-gradient-to-b from-stone-950 via-emerald-950/60 to-black',
      border: 'border-emerald-500/50 shadow-emerald-500/10',
      accentGrad: 'from-emerald-400 via-teal-500 to-emerald-600',
      glowColor: 'bg-emerald-500/15',
      codeText: 'text-emerald-400',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      pillBg: 'from-emerald-500/20 to-teal-500/10'
    },
    'amethyst-vip': {
      name: 'الأرجواني الملكي (Amethyst Violet)',
      themeLabel: 'الأماتيست الفاخر',
      bg: 'bg-gradient-to-b from-slate-950 via-purple-950/60 to-black',
      border: 'border-fuchsia-500/50 shadow-fuchsia-500/10',
      accentGrad: 'from-fuchsia-400 via-purple-500 to-pink-600',
      glowColor: 'bg-fuchsia-500/15',
      codeText: 'text-fuchsia-400',
      badgeColor: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
      pillBg: 'from-fuchsia-500/20 to-purple-500/10'
    }
  };

  const currentTheme = styleConfigs[selectedStyle];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto" dir="rtl">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[94vh]"
        >
          {/* Top Modal Header */}
          <div className="bg-slate-950/95 p-4 sm:p-5 border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                <Crown className="w-5 h-5 fill-amber-400/30 stroke-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm text-white">بطاقة الدعوة التسويقية الفاخرة</h3>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 font-black px-2 py-0.5 rounded-full border border-amber-500/30">
                    VIP HD
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                  انشر بطاقتك واكسب عمولات فريقك حتى 10%
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
            
            {/* Style Selector Tabs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-black text-slate-300 px-1">
                <div className="flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-amber-400" />
                  <span>طراز المظهر والسمة الملكية:</span>
                </div>
                <span className="text-[10px] text-amber-400 font-bold font-mono">
                  {currentTheme.themeLabel}
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(styleConfigs) as CardStyle[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSelectedStyle(st)}
                    className={`p-2.5 rounded-2xl border text-right transition-all cursor-pointer flex items-center justify-between ${
                      selectedStyle === st
                        ? 'bg-white/15 border-white/40 text-white shadow-md'
                        : 'bg-slate-950/40 border-white/5 text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    <span className="text-[10px] font-black">{styleConfigs[st].name}</span>
                    {selectedStyle === st && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mr-1" />}
                  </button>
                ))}
              </div>
            </div>

            {/* LIVE PREVIEW PROMO CARD */}
            <div 
              className={`${currentTheme.bg} ${currentTheme.border} border-2 rounded-[2.2rem] p-5 sm:p-6 text-center shadow-2xl relative overflow-hidden space-y-4`}
            >
              {/* Background ambient lighting */}
              <div className={`absolute top-0 right-0 w-44 h-44 ${currentTheme.glowColor} rounded-full blur-3xl pointer-events-none`} />
              <div className={`absolute bottom-0 left-0 w-44 h-44 ${currentTheme.glowColor} rounded-full blur-3xl pointer-events-none`} />

              {/* Top VIP Pill */}
              <div className="relative z-10 space-y-1.5">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black tracking-wider ${currentTheme.badgeColor}`}>
                  <Crown className="w-3.5 h-3.5" />
                  <span>OXLO OFFICIAL VIP NETWORK</span>
                </div>
                <h4 className="text-sm font-black text-white">منظومة المهام الرقمية والأرباح اليومية</h4>
              </div>

              {/* Inviter Badge Box */}
              <div className="bg-white/5 border border-white/10 py-2 px-4 rounded-2xl inline-flex items-center gap-2.5 shadow-sm">
                <div className={`w-7 h-7 rounded-full bg-gradient-to-tr ${currentTheme.accentGrad} text-stone-950 font-black text-xs flex items-center justify-center`}>
                  {(user.username || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="text-[11px] text-slate-300 font-bold">
                  دعوة رسمية من القائد: <strong className="text-white font-black">{user.username || 'عضو مميز'}</strong>
                </span>
              </div>

              {/* QR Code Container with Corner Brackets */}
              <div className="relative z-10 flex flex-col items-center justify-center my-1">
                <div className="relative p-1">
                  {/* Decorative Frame Glow */}
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-tr ${currentTheme.accentGrad} blur-sm opacity-60`} />
                  
                  <div className="relative bg-white p-3.5 rounded-2xl shadow-2xl border-4 border-white/20">
                    <img
                      src={qrCodeUrl}
                      alt="Invite QR Code"
                      className="w-36 h-36 sm:w-44 sm:h-44 rounded-xl block"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-slate-300 font-bold mt-2.5 flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>امسح رمز QR للتسجيل الفوري والبدء</span>
                </span>
              </div>

              {/* Premium Invite Code Metallic Box */}
              <div className={`bg-gradient-to-r ${currentTheme.pillBg} border border-white/15 p-3 rounded-2xl relative z-10 flex items-center justify-between shadow-inner`}>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 block">رمز الدعوة الحصري الخاص بك:</span>
                  <span className={`text-lg font-black font-mono tracking-widest ${currentTheme.codeText}`}>
                    {inviteCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(inviteCode, 'code')}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'تم النسخ' : 'نسخ الكود'}</span>
                </button>
              </div>

              {/* 3 Value Pillars */}
              <div className="grid grid-cols-3 gap-1.5 text-[9px] font-black text-slate-200 pt-1">
                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                  <Zap className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                  <span>مهام يومية</span>
                </div>
                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 mx-auto mb-1" />
                  <span>سحب Polygon</span>
                </div>
                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                  <Gift className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1" />
                  <span>عمولات 10%</span>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS & SHARING TOOLKIT */}
            <div className="space-y-2.5 pt-1">
              {/* Download PNG High-Res Button */}
              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={isGeneratingImg}
                className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-stone-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {isGeneratingImg ? (
                  <>
                    <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                    <span>جاري إنشاء وتحميل البوستر بدقة فائقة HD...</span>
                  </>
                ) : downloadSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-stone-950" />
                    <span>تم تنزيل البوستر الدعائي بنجاح! 🎉</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 stroke-[2.5]" />
                    <span>تنزيل البطاقة كصورة إعلانية (PNG بدقة عالية 1080p)</span>
                  </>
                )}
              </button>

              {/* Direct Social Media Sharing Row */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleShareTelegram}
                  className="py-3 px-3 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Send className="w-4 h-4 text-sky-400" />
                  <span>مشاركة عبر تليجرام</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="py-3 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>مشاركة عبر واتساب</span>
                </button>
              </div>

              {/* Copy Links & Pre-formatted Text */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(referralLink, 'link')}
                  className="py-3 px-3 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-2xl border border-white/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                  <span>{copiedLink ? 'تم نسخ الرابط!' : 'نسخ رابط الدعوة'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(promoMessage, 'msg')}
                  className="py-3 px-3 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-2xl border border-white/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                >
                  {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Flame className="w-4 h-4 text-amber-400" />}
                  <span>{copiedText ? 'تم نسخ النص الإعلاني!' : 'نسخ النص الترويجي'}</span>
                </button>
              </div>

            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
