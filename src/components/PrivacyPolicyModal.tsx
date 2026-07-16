import React from 'react';
import { Shield } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  t: (key: string) => any;
}

export default function PrivacyPolicyModal({ isOpen, onClose, lang, t }: PrivacyPolicyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-slate-950/95 flex items-center justify-center p-4 md:p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-slate-900 border border-slate-700 shadow-2xl p-4 md:p-4 rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
        
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Shield size={20} />
          </div>
          <h3 className="text-xl font-bold text-slate-50">{t('privacyPolicy')}</h3>
        </div>

        <div className="overflow-y-auto pr-3 flex-1 space-y-5 mb-6 custom-scrollbar text-sm text-slate-300 leading-relaxed">
          <div>
            <h4 className="font-bold text-slate-50 text-lg mb-1">{t('privacyPolicy1')}</h4>
            <p className="text-slate-400">{t('privacyPolicy2')}</p>
          </div>
          
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div>
              <h5 className="font-semibold text-emerald-400 mb-1 flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{t('privacyPolicy3')}</span>
              </h5>
              <p className="pl-6 opacity-90 text-xs">{t('privacyPolicy4')}</p>
            </div>
            <div className="bg-slate-800/80 h-[1px] w-full"></div>
            <div>
              <h5 className="font-semibold text-emerald-400 mb-1 flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{t('privacyPolicy5')}</span>
              </h5>
              <p className="pl-6 opacity-90 text-xs">{t('privacyPolicy6')}</p>
            </div>
            <div className="bg-slate-800/80 h-[1px] w-full"></div>
            <div>
              <h5 className="font-semibold text-emerald-400 mb-1 flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{t('privacyPolicy7')}</span>
              </h5>
              <p className="pl-6 opacity-90 text-xs">{t('privacyPolicy8')}</p>
            </div>
          </div>

          <div className="px-2 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-200">
            <p className="font-medium text-center text-xs">{t('privacyPolicy9')}</p>
          </div>
          
          <div className="mt-6 border-t border-slate-800 pt-5">
            <h4 className="font-bold text-slate-50 text-lg mb-1">{t('auditorGuide')}</h4>
            <p className="text-slate-400 mb-4">{t('auditorGuideDesc')}</p>
            
            <div className="space-y-3">
              <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-3">
                <h5 className="font-semibold text-sky-400 text-sm mb-1">{t('auditorStep1')}</h5>
                <p className="text-slate-400 text-xs">{t('auditorStep1Desc')}</p>
              </div>
              <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-3">
                <h5 className="font-semibold text-sky-400 text-sm mb-1">{t('auditorStep2')}</h5>
                <p className="text-slate-400 text-xs">{t('auditorStep2Desc')}</p>
              </div>
              <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-3">
                <h5 className="font-semibold text-sky-400 text-sm mb-1">{t('auditorStep3')}</h5>
                <p className="text-slate-400 text-xs">{t('auditorStep3Desc')}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-800 pt-5">
            <h4 className="font-bold text-slate-50 text-lg mb-3 flex items-center gap-2">
              <Shield size={16} className="text-emerald-400" />
              {t('auditThreatModelTitle')}
            </h4>
            <div className="space-y-3">
              <div className="bg-slate-900 border border-slate-700/50 border-l-4 border-l-indigo-500 rounded-xl p-3">
                <p className="text-slate-300 text-xs leading-relaxed">{t('auditThreatModel1')}</p>
              </div>
              <div className="bg-slate-900 border border-slate-700/50 border-l-4 border-l-emerald-500 rounded-xl p-3">
                <p className="text-slate-300 text-xs leading-relaxed">{t('auditThreatModel2')}</p>
              </div>
              <div className="bg-slate-900 border border-slate-700/50 border-l-4 border-l-sky-500 rounded-xl p-3">
                <p className="text-slate-300 text-xs leading-relaxed">{t('auditThreatModel3')}</p>
              </div>
              {t('auditThreatModel4') && (
                <div className="bg-slate-900 border border-slate-700/50 border-l-4 border-l-amber-500 rounded-xl p-3">
                  <p className="text-slate-300 text-xs leading-relaxed">{t('auditThreatModel4')}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-slate-800 pt-5">
            <h4 className="font-bold text-slate-50 text-lg mb-3">{t('auditChecklistTitle')}</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✅</span>
                <span className="text-slate-300 text-xs">{t('auditChecklist1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✅</span>
                <span className="text-slate-300 text-xs">{t('auditChecklist2')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✅</span>
                <span className="text-slate-300 text-xs">{t('auditChecklist3')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✅</span>
                <span className="text-slate-300 text-xs">{t('auditChecklist4')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✅</span>
                <span className="text-slate-300 text-xs">{t('auditChecklist5')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✅</span>
                <span className="text-slate-300 text-xs">{t('auditChecklist6')}</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 border-t border-slate-800 pt-5">
            <h4 className="font-bold text-slate-50 text-lg mb-3">{t('auditRisksTitle')}</h4>
            <ul className="space-y-3 list-disc pl-5 text-amber-500 text-xs">
              <li><span className="text-slate-300 leading-relaxed">{t('auditRisks1')}</span></li>
              <li><span className="text-slate-300 leading-relaxed">{t('auditRisks2')}</span></li>
            </ul>
          </div>

          <div className="mt-6 border-t border-slate-800 pt-5 pb-2">
            <h4 className="font-bold text-slate-50 text-lg mb-2">{t('auditRationaleTitle')}</h4>
            <div className="px-4 py-3 bg-slate-800/30 rounded-xl border border-slate-800 border-dashed">
              <p className="text-slate-400 text-xs italic leading-relaxed text-center">"{t('auditRationaleDesc')}"</p>
            </div>
          </div>
        </div>
        <button 
          type="button"
          onClick={onClose}
          className="w-full py-3.5 rounded-xl text-slate-900 text-sm font-bold bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          {t('close')}
        </button>
      </div>
    </div>
  );
}
