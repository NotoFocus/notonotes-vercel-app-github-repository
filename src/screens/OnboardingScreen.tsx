import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, NotebookPen, Home, LayoutList, CalendarDays, Rocket } from 'lucide-react';
import { useAppStore } from '../store';
import { useTranslation } from '../translations';

export default function OnboardingScreen({ onFinish }: { onFinish: () => void }) {
  const { user, updateUser, lang } = useAppStore();
  const t = useTranslation(lang);
  
  const [step, setStep] = useState(0);
  const [name, setName] = useState(user.name !== 'Pengguna' ? user.name : '');

  const handleNext = () => {
    if (step === 0 && !name.trim()) return;
    
    if (step === 0) {
      updateUser({ ...user, name: name.trim() });
    }
    
    if (step < 5) {
      setStep(step + 1);
    } else {
      onFinish();
    }
  };

  const steps = [
    // Step 0: Name input
    <motion.div 
      key="step-0"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex flex-col items-center text-center px-8 w-full max-w-sm"
    >
      <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-8">
        <span className="text-4xl">👋</span>
      </div>
      <h2 className="text-3xl font-bold mb-4 text-slate-100">{t('welcomeTo')}</h2>
      <p className="text-slate-400 mb-10">{t('whoAreYou')}</p>
      
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleNext()}
        placeholder={t('yourName') as string}
        className="w-full bg-slate-900 border border-slate-700/50 rounded-2xl px-6 py-4 text-slate-100 placeholder-slate-500 text-center text-lg outline-none focus:border-indigo-500/50 focus:bg-slate-800/80 transition-all mb-8 shadow-inner"
        autoFocus
      />
    </motion.div>,

    // Step 1: Home
    <motion.div 
      key="step-1"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex flex-col items-center text-center px-8 w-full max-w-sm"
    >
      <div className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center mb-8 border border-orange-500/20 relative">
        <Home className="w-12 h-12 text-orange-400 relative z-10" />
      </div>
      <h2 className="text-2xl font-bold mb-4 text-slate-100">{t('tourHome')}</h2>
      <p className="text-slate-400 text-center leading-relaxed">
        {t('tourHomeDesc')}
      </p>
    </motion.div>,

    // Step 2: Tasks
    <motion.div 
      key="step-2"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex flex-col items-center text-center px-8 w-full max-w-sm"
    >
      <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mb-8 border border-indigo-500/20 relative">
        <LayoutList className="w-12 h-12 text-indigo-400 relative z-10" />
      </div>
      <h2 className="text-2xl font-bold mb-4 text-slate-100">{t('tourTasks')}</h2>
      <p className="text-slate-400 text-center leading-relaxed">
        {t('tourTasksDesc')}
      </p>
    </motion.div>,

    // Step 3: Notes
    <motion.div 
      key="step-3"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex flex-col items-center text-center px-8 w-full max-w-sm"
    >
      <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-8 border border-blue-500/20 relative">
        <NotebookPen className="w-12 h-12 text-blue-400 relative z-10" />
      </div>
      <h2 className="text-2xl font-bold mb-4 text-slate-100">{t('tourNotes')}</h2>
      <p className="text-slate-400 text-center leading-relaxed">
        {t('tourNotesDesc')}
      </p>
    </motion.div>,

    // Step 4: Calendar
    <motion.div 
      key="step-4"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex flex-col items-center text-center px-8 w-full max-w-sm"
    >
      <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mb-8 border border-rose-500/20 relative">
        <CalendarDays className="w-12 h-12 text-rose-400 relative z-10" />
      </div>
      <h2 className="text-2xl font-bold mb-4 text-slate-100">{t('tourCalendar')}</h2>
      <p className="text-slate-400 text-center leading-relaxed">
        {t('tourCalendarDesc')}
      </p>
    </motion.div>,

    // Step 5: All set
    <motion.div 
      key="step-5"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      className="flex flex-col items-center text-center px-8 w-full max-w-sm"
    >
      <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-8 border border-green-500/20 relative">
        <Rocket className="w-12 h-12 text-green-400 relative z-10" />
      </div>
      <h2 className="text-2xl font-bold mb-4 text-slate-100">{t('allSet')}{name ? `, ${name}` : ''}!</h2>
      <p className="text-slate-400 text-center leading-relaxed">
        {t('allSetDesc')}
      </p>
    </motion.div>
  ];

  return (
    <div className="absolute inset-0 bg-slate-950 z-[100] flex flex-col font-sans">
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <AnimatePresence mode="wait">
          {steps[step]}
        </AnimatePresence>
      </div>

      <div className="h-32 flex flex-col items-center justify-start px-8">
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-indigo-500' : 'w-1.5 bg-slate-800'}`} 
            />
          ))}
        </div>
        
        <button
          onClick={handleNext}
          disabled={step === 0 && !name.trim()}
          className="w-full max-w-sm bg-indigo-500 text-white rounded-full py-4 font-bold text-lg hover:bg-indigo-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-indigo-500/25"
        >
          {step === 5 ? t('startUsing') : step === 0 ? t('continue') : t('next')}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
