import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Fingerprint, ShieldCheck, Delete, Sparkles, LogOut, User } from 'lucide-react';

export const LockScreenModal: React.FC = () => {
  const { isLocked, setIsLocked, currentUser, logout } = useApp();
  const [pin, setPin] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('ckb-IQ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isLocked) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setErrorMsg('');
      if (newPin.length === 4) {
        // Unlock immediately on 4 digits or default 1234
        setTimeout(() => {
          setIsLocked(false);
          setPin('');
        }, 200);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleBiometric = () => {
    setIsLocked(false);
    setPin('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between p-6 bg-slate-950/80 backdrop-blur-2xl text-white select-none animate-in fade-in duration-300">
      
      {/* Top Bar: Time and Date */}
      <div className="text-center pt-8 space-y-2">
        <div className="flex items-center justify-center gap-2 text-cyan-400 text-xs font-bold bg-white/10 backdrop-blur-md px-4 py-1 rounded-full border border-white/15 inline-flex">
          <ShieldCheck className="w-4 h-4" />
          <span>سیستەمی پارێزراوی ڕێکخراوی بۆتان بامۆکی</span>
        </div>
        <div className="text-5xl sm:text-6xl font-black tracking-tight text-white/95 font-mono">
          {currentTime || '١١:٣٠'}
        </div>
        <div className="text-sm text-slate-300">
          {currentDate || 'پێنجشەممە، ٣ی ئازاری ٢٠٢٦'}
        </div>
      </div>

      {/* Center: User and PIN Dots */}
      <div className="flex flex-col items-center space-y-4 my-auto">
        <div className="relative">
          {currentUser?.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser?.name || 'بەکارهێنەر'}
              className="w-20 h-20 rounded-3xl object-cover ring-4 ring-cyan-400/40 shadow-2xl"
            />
          ) : (
            <div className="w-20 h-20 rounded-3xl bg-cyan-600 flex items-center justify-center text-white ring-4 ring-cyan-400/40 shadow-2xl">
              <User className="w-10 h-10" />
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-white border-2 border-slate-900 shadow">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-lg font-bold text-white">{currentUser?.name || 'محمد ئیقبال'}</h3>
          <p className="text-xs text-cyan-300">{currentUser?.roleTitleKurdish || 'بەڕێوەبەری گشتی'}</p>
        </div>

        {/* 4 PIN Dots */}
        <div className="flex items-center gap-3 py-2">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                pin.length > i
                  ? 'bg-cyan-400 border-cyan-400 scale-110 shadow-lg shadow-cyan-400/50'
                  : 'bg-white/10 border-white/30'
              }`}
            />
          ))}
        </div>

        {errorMsg && <p className="text-xs text-rose-400 font-bold">{errorMsg}</p>}
        <p className="text-[11px] text-slate-400">کۆدی PINـی ٤ ژمارەیی داخڵبکە یان شوێنپەنجە دابگرە</p>
      </div>

      {/* Bottom: iOS Number Pad & Biometric */}
      <div className="w-full max-w-xs space-y-4 pb-4">
        <div dir="ltr" className="grid grid-cols-3 gap-3 text-center">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-md border border-white/15 text-xl font-bold transition-all mx-auto flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          
          {/* Biometrics */}
          <button
            onClick={handleBiometric}
            className="w-16 h-16 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-400 transition-all mx-auto flex items-center justify-center"
            title="کردنەوە بە شوێنپەنجە / Face ID"
          >
            <Fingerprint className="w-7 h-7" />
          </button>

          {/* Zero */}
          <button
            onClick={() => handleKeyPress('0')}
            className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-md border border-white/15 text-xl font-bold transition-all mx-auto flex items-center justify-center"
          >
            0
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-md border border-white/15 text-slate-300 transition-all mx-auto flex items-center justify-center"
            title="سڕینەوە"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={handleBiometric}
          className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          کردنەوەی خێرا بە ناسینەوەی ڕووخسار / پەنجەمۆر
        </button>

        <button
          onClick={() => {
            setIsLocked(false);
            logout();
          }}
          className="w-full py-2 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-medium border border-white/10 flex items-center justify-center gap-1.5 transition-all"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" />
          <span>دەرچوون / گۆڕینی هەژمار</span>
        </button>
      </div>

    </div>
  );
};
