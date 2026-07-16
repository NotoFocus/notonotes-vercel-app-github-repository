import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface UpdateNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  t: (key: string) => any;
}

export default function UpdateNotesModal({ isOpen, onClose, lang, t }: UpdateNotesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-slate-950/95 flex items-center justify-center p-4 md:p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 p-4 md:p-4 rounded-3xl w-full max-w-sm max-h-[80vh] flex flex-col">
        <h3 className="text-xl font-bold text-slate-50 mb-4">{t('aboutAppTitle')}</h3>
        <div className="overflow-y-auto pr-2 flex-1 space-y-4 mb-6 custom-scrollbar text-sm text-slate-300">
          <p><strong>Noto v3.0</strong></p>
          <p>{t('aboutAppDesc')}</p>
          
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3 text-amber-200">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-amber-400 mb-1">{t('aboutAppStorageWarningTitle')}</h4>
              <p className="text-[11px] md:text-xs leading-relaxed text-slate-300 whitespace-pre-line">{t('aboutAppStorageWarningDesc')}</p>
            </div>
          </div>

          <p><strong>{t('aboutAppWhatsNew')}</strong></p>
          <ul className="space-y-4">
            <li className="flex flex-col">
              <strong className="text-emerald-400 text-sm mb-0.5">{t('appUpdateTitle')}</strong> 
              <span className="text-emerald-200">{t('appUpdateBody')}</span>
            </li>
            <li className="flex flex-col"><strong className="text-emerald-400 text-sm mb-0.5">{t('aboutAppFeat11')}</strong> <span>{t('aboutAppFeat11Desc')}</span></li>
            <li className="flex flex-col"><strong className="text-emerald-400 text-sm mb-0.5">{t('aboutAppFeat1')}</strong> <span>{t('aboutAppFeat1Desc')}</span></li>
            <li className="flex flex-col"><strong className="text-emerald-400 text-sm mb-0.5">{t('aboutAppFeat2')}</strong> <span>{t('aboutAppFeat2Desc')}</span></li>
            <li className="flex flex-col"><strong className="text-emerald-400 text-sm mb-0.5">{t('aboutAppFeat3')}</strong> <span>{t('aboutAppFeat3Desc')}</span></li>
            <li className="flex flex-col"><strong className="text-emerald-400 text-sm mb-0.5">{t('aboutAppFeat4')}</strong> <span>{t('aboutAppFeat4Desc')}</span></li>
            <li className="flex flex-col"><strong className="text-emerald-400 text-sm mb-0.5">{t('aboutAppFeat5')}</strong> <span>{t('aboutAppFeat5Desc')}</span></li>
            <li className="flex flex-col"><strong className="text-emerald-400 text-sm mb-0.5">{t('aboutAppFeat6')}</strong> <span>{t('aboutAppFeat6Desc')}</span></li>
            <li className="flex flex-col"><strong className="text-emerald-400 text-sm mb-0.5">{t('aboutAppFeat7')}</strong> <span>{t('aboutAppFeat7Desc')}</span></li>
            <li className="flex flex-col"><strong className="text-emerald-400 text-sm mb-0.5">{t('aboutAppFeat8')}</strong> <span>{t('aboutAppFeat8Desc')}</span></li>
            <li className="flex flex-col"><strong className="text-emerald-400 text-sm mb-0.5">{t('aboutAppFeat9')}</strong> <span>{t('aboutAppFeat9Desc')}</span></li>
            <li className="flex flex-col"><strong className="text-emerald-400 text-sm mb-0.5">{t('aboutAppFeat10')}</strong> <span>{t('aboutAppFeat10Desc')}</span></li>
          </ul>
          
          <div className="mt-8 pt-4 border-t border-slate-800 text-xs text-slate-400 text-center leading-relaxed">
            <p>{t('copyrightText')}</p>
          </div>
        </div>
        <button 
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl text-white text-sm font-bold bg-indigo-500 hover:bg-indigo-600 transition-colors cursor-pointer"
        >
          {t('close')}
        </button>
      </div>
    </div>
  );
}
