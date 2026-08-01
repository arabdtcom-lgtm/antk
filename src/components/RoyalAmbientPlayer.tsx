/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Language } from '../utils/translations';
import { audioSynth } from '../utils/audio';
import { Music, Play, Pause, Volume2, VolumeX, Radio, Sparkles } from 'lucide-react';

interface RoyalAmbientPlayerProps {
  lang: Language;
}

export default function RoyalAmbientPlayer({ lang }: RoyalAmbientPlayerProps) {
  const isAr = lang === 'ar';

  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTrack, setActiveTrack] = useState<string>('opera');

  const tracks = [
    { id: 'opera', nameAr: '🎻 صالة الأوبرا الملكية', nameEn: '🎻 Royal Opera Hall', freq: 440 },
    { id: 'oud', nameAr: '📻 تقاسيم العود والجراموفون الأثري', nameEn: '📻 Vintage Gramophone Oud', freq: 330 },
    { id: 'grand', nameAr: '🏛️ أجواء قاعة المزادات الكبرى', nameEn: '🏛️ Grand Auction Room', freq: 523.25 },
  ];

  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      const selected = tracks.find(t => t.id === activeTrack);
      const freq = selected ? selected.freq : 440;
      
      // Synthesize ambient interval chords
      timer = setInterval(() => {
        audioSynth.playAmbientNote(freq, 'sine', 2.5);
      }, 3000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, activeTrack]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs">
      <button
        onClick={togglePlay}
        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
          isPlaying ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20' : 'bg-white/5 text-slate-400 hover:text-white'
        }`}
        title={isPlaying ? (isAr ? 'إيقاف خلفية المزادات' : 'Pause Ambient Music') : (isAr ? 'تشغيل الخلفية الملكية' : 'Play Royal Ambient')}
      >
        {isPlaying ? <Pause className="h-3.5 w-3.5 fill-black" /> : <Play className="h-3.5 w-3.5" />}
      </button>

      {/* Track selector */}
      <select
        value={activeTrack}
        onChange={(e) => setActiveTrack(e.target.value)}
        className="bg-transparent text-[11px] font-bold text-slate-300 outline-none cursor-pointer max-w-[140px] truncate"
      >
        {tracks.map((t) => (
          <option key={t.id} value={t.id} className="bg-[#121218] text-white">
            {isAr ? t.nameAr : t.nameEn}
          </option>
        ))}
      </select>

      {isPlaying && (
        <span className="flex h-2 w-2 relative shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
      )}
    </div>
  );
}
