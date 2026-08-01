/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Auction } from '../types';
import { Language } from '../utils/translations';
import { 
  Box, 
  X, 
  Sun, 
  Moon, 
  Sparkles, 
  RotateCw, 
  Maximize2, 
  Eye, 
  Layers,
  Palette
} from 'lucide-react';

interface Artifact3DViewerModalProps {
  auction: Auction;
  lang: Language;
  onClose: () => void;
}

export default function Artifact3DViewerModal({
  auction,
  lang,
  onClose
}: Artifact3DViewerModalProps) {
  const isAr = lang === 'ar';

  const [lighting, setLighting] = useState<'royal_gallery' | 'warm_sun' | 'dark_velvet'>('royal_gallery');
  const [rotationDegree, setRotationDegree] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);

  const rotateLeft = () => setRotationDegree((prev) => (prev - 45 + 360) % 360);
  const rotateRight = () => setRotationDegree((prev) => (prev + 45) % 360);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
      <div className="relative w-full max-w-3xl rounded-2xl border border-amber-500/40 bg-[#0a0a0d] text-white p-6 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Box className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>{isAr ? 'محاكي العرض الثلاثي الأبعاد وصالة العرض' : '3D Interactive Showcase & Gallery Inspector'}</span>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                  {isAr ? 'معاينة 360°' : '360° View'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {isAr ? auction.titleAr : auction.titleEn}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 3D Simulated Interactive Canvas Frame */}
        <div className={`relative aspect-[16/10] w-full rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center transition-colors duration-500 ${
          lighting === 'royal_gallery' ? 'bg-gradient-to-b from-[#1c1c28] via-[#12121c] to-[#0a0a0f]' :
          lighting === 'warm_sun' ? 'bg-gradient-to-b from-[#2a2218] via-[#1a1510] to-[#0c0a08]' :
          'bg-gradient-to-b from-[#0e0e14] via-[#08080c] to-[#020204]'
        }`}>
          
          {/* Ambient Spotlight Glow */}
          <div className={`absolute top-0 h-48 w-48 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
            lighting === 'royal_gallery' ? 'bg-indigo-500/20' :
            lighting === 'warm_sun' ? 'bg-amber-500/25' :
            'bg-rose-500/15'
          }`} />

          {/* Rotatable Image Object */}
          <div 
            className="transition-transform duration-300 ease-out cursor-grab active:cursor-grabbing max-w-[75%] max-h-[75%]"
            style={{
              transform: `rotateY(${rotationDegree}deg) scale(${zoomLevel / 100})`,
              perspective: '1000px'
            }}
          >
            <img
              src={auction.image}
              alt={auction.titleAr}
              className="rounded-xl shadow-2xl border-2 border-amber-500/30 object-cover max-h-[300px]"
            />
          </div>

          {/* On-screen Rotation Degrees HUD */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] font-mono text-amber-400">
            {isAr ? 'زاوية الدوران:' : 'Angle:'} {rotationDegree}°
          </div>

        </div>

        {/* Control Bar: Lighting & Rotation & Zoom Controls */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-white/5 border border-white/10 p-3 rounded-xl">
          
          {/* Lighting Mode Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <Palette className="h-3.5 w-3.5 text-amber-500" />
              {isAr ? 'نمط الإضاءة:' : 'Lighting:'}
            </span>

            {[
              { id: 'royal_gallery', label: isAr ? '🏛️ الصالة الملكية' : '🏛️ Royal Gallery' },
              { id: 'warm_sun', label: isAr ? '☀️ إضاءة متحفية دافئة' : '☀️ Warm Museum' },
              { id: 'dark_velvet', label: isAr ? '🌙 المخمل الداكن' : '🌙 Dark Velvet' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setLighting(m.id as any)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                  lighting === m.id
                    ? 'bg-amber-500 text-black border-amber-500'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Rotation and Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={rotateLeft}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 font-bold transition-all cursor-pointer"
            >
              <RotateCw className="h-3.5 w-3.5 -scale-x-100" />
              <span>{isAr ? 'دوران 45° يسار' : 'Rotate Left'}</span>
            </button>

            <button
              onClick={rotateRight}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 font-bold transition-all cursor-pointer"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>{isAr ? 'دوران 45° يمين' : 'Rotate Right'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
