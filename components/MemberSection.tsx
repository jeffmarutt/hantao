
import React, { useState, useEffect } from 'react';
import { Plus, User, X, CreditCard, Wallet, QrCode, ChevronDown, Building2 } from 'lucide-react';
import { Member } from '../types';

interface MemberSectionProps {
  members: Member[];
  onAddMember: (name: string, promptPay?: string) => void;
  onRemoveMember: (id: string) => void;
  onUpdatePayerPromptPay?: (promptPayId: string) => void;
  compact?: boolean; 
}

const BANKS = [
  { id: 'PromptPay', name: 'PromptPay', label: 'พร้อมเพย์', color: 'text-blue-600 bg-blue-50 border-blue-100' },
  { id: 'KBank', name: 'KBank', label: 'กสิกร', color: 'text-green-600 bg-green-50 border-green-100' },
  { id: 'SCB', name: 'SCB', label: 'ไทยพาณิชย์', color: 'text-purple-600 bg-purple-50 border-purple-100' },
  { id: 'KTB', name: 'KTB', label: 'กรุงไทย', color: 'text-sky-600 bg-sky-50 border-sky-100' },
  { id: 'BBL', name: 'BBL', label: 'กรุงเทพ', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
  { id: 'TTB', name: 'ttb', label: 'ทหารไทยธนชาต', color: 'text-blue-600 bg-blue-50 border-blue-100' },
  { id: 'GSB', name: 'GSB', label: 'ออมสิน', color: 'text-pink-600 bg-pink-50 border-pink-100' },
  { id: 'BAY', name: 'BAY', label: 'กรุงศรี', color: 'text-yellow-600 bg-yellow-50 border-yellow-100' },
  { id: 'Other', name: 'Other', label: 'อื่นๆ', color: 'text-slate-600 bg-slate-50 border-slate-100' },
];

export const MemberSection: React.FC<MemberSectionProps> = ({
  members,
  onAddMember,
  onRemoveMember,
  onUpdatePayerPromptPay,
  compact = false,
}) => {
  const [name, setName] = useState('');
  
  // State for First Member (Add Mode)
  const [selectedBank, setSelectedBank] = useState('PromptPay');
  const [accNumber, setAccNumber] = useState('');

  // State for Existing Payer (Edit Mode)
  const payer = members.find(m => m.isPayer);
  const [payerBank, setPayerBank] = useState('PromptPay');
  const [payerAccNumber, setPayerAccNumber] = useState('');

  // Effect to parse existing payer info when loaded
  useEffect(() => {
    if (payer && payer.promptPayId) {
      const parts = payer.promptPayId.split(' ');
      const potentialBank = parts[0];
      const bankExists = BANKS.find(b => b.name === potentialBank);
      
      if (bankExists) {
        setPayerBank(bankExists.id);
        setPayerAccNumber(parts.slice(1).join(' '));
      } else {
        // Fallback for old data format
        setPayerBank('PromptPay');
        setPayerAccNumber(payer.promptPayId);
      }
    } else {
        setPayerBank('PromptPay');
        setPayerAccNumber('');
    }
  }, [payer?.id]); // Only re-run if payer changes, not on every keystroke

  const handleAdd = () => {
    if (name.trim()) {
      let finalPromptPay = undefined;
      if (members.length === 0) {
         // Only set promptpay for the first member
         const bankObj = BANKS.find(b => b.id === selectedBank);
         finalPromptPay = accNumber.trim() ? `${bankObj?.name} ${accNumber.trim()}` : undefined;
      }
      
      onAddMember(name, finalPromptPay);
      
      setName('');
      setAccNumber('');
      setSelectedBank('PromptPay');
    }
  };

  const handlePayerUpdate = (newBankId: string, newNumber: string) => {
      setPayerBank(newBankId);
      setPayerAccNumber(newNumber);
      
      if (onUpdatePayerPromptPay) {
          const bankObj = BANKS.find(b => b.id === newBankId);
          const finalString = newNumber.trim() ? `${bankObj?.name} ${newNumber.trim()}` : '';
          onUpdatePayerPromptPay(finalString);
      }
  };

  const wrapperClasses = compact 
    ? "bg-transparent w-full max-w-md mx-auto" 
    : "bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors";

  const renderPaymentInput = (
    bankId: string, 
    number: string, 
    onBankChange: (val: string) => void, 
    onNumberChange: (val: string) => void
  ) => {
    const currentBank = BANKS.find(b => b.id === bankId) || BANKS[0];

    return (
        <div className="flex gap-2 w-full">
            {/* Bank Selector */}
            <div className="relative w-[40%] min-w-[120px]">
                <select
                    value={bankId}
                    onChange={(e) => onBankChange(e.target.value)}
                    className={`w-full h-12 pl-3 pr-8 appearance-none rounded-xl font-bold text-sm border-2 outline-none transition-all cursor-pointer ${currentBank.color} dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-offset-1 focus:ring-teal-500`}
                >
                    {BANKS.map(b => (
                        <option key={b.id} value={b.id}>{b.label}</option>
                    ))}
                </select>
                <ChevronDown size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50`} />
            </div>

            {/* Number Input */}
            <div className="relative flex-1">
                <input 
                    type="text" 
                    inputMode="numeric"
                    value={number}
                    onChange={(e) => onNumberChange(e.target.value)}
                    placeholder="เลขบัญชี / เบอร์โทร"
                    className="w-full h-12 pl-4 pr-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                />
            </div>
        </div>
    );
  };

  return (
    <div className={wrapperClasses}>
      {!compact && (
        <h2 className="text-lg font-bold mb-4 flex items-center text-teal-800 dark:text-teal-400">
          <span className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded-lg mr-3">
            <User className="text-teal-700 dark:text-teal-300" size={20} />
          </span>
          1. สมาชิก (Members)
        </h2>
      )}

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex gap-2">
            <div className={`flex-1 flex items-center bg-white dark:bg-slate-800 border-2 ${compact ? 'border-teal-400 ring-4 ring-teal-50 dark:ring-teal-900/20' : 'border-gray-200 dark:border-slate-700'} rounded-2xl px-4 transition-all focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-50 dark:focus-within:ring-teal-900/40`}>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ชื่อเพื่อน (เช่น นัท, บีม)..."
                    className="flex-1 py-3.5 text-base bg-transparent focus:outline-none placeholder:text-gray-300 dark:placeholder:slate-600 text-slate-900 dark:text-white"
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
            </div>
            
          <button
            onClick={handleAdd}
            disabled={!name.trim()}
            className={`px-5 rounded-2xl font-bold text-white transition-all shadow-md flex items-center justify-center min-w-[3.5rem] ${!name.trim() ? 'bg-gray-300 dark:bg-slate-700 cursor-not-allowed opacity-50' : 'bg-teal-500 hover:bg-teal-600 active:scale-95 shadow-teal-200 dark:shadow-none'}`}
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
        
        {members.length === 0 && (
          <div className="text-sm text-gray-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm animate-fade-in">
             <div className="flex items-center gap-2 mb-2 text-teal-700 dark:text-teal-400 font-bold text-base">
                <CreditCard size={20} /> คนแรกคือ "คนจ่ายหลัก"
             </div>
             <p className="text-xs text-gray-500 dark:text-slate-500 mb-4 leading-relaxed">
                 รายการที่เพิ่มใหม่จะถูกตั้งให้คนนี้จ่ายก่อน (ตั้งค่าบัญชีรับเงินไว้เลยก็ได้นะ)
             </p>
             
             {/* Add Payment Input (New Mode) */}
             {renderPaymentInput(selectedBank, accNumber, setSelectedBank, setAccNumber)}

          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2.5">
        {members.map((member) => (
          <div
            key={member.id}
            className={`flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full border shadow-sm transition-all animate-scale-up ${
              member.isPayer
                ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 ring-2 ring-teal-100 dark:ring-teal-900/40 ring-offset-1 dark:ring-offset-slate-900'
                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300'
            }`}
          >
            <span className="font-semibold text-sm">
                {member.name} {member.isPayer && <span className="text-[10px] ml-1">👑</span>}
            </span>
            <button
              onClick={() => onRemoveMember(member.id)}
              className="w-7 h-7 flex items-center justify-center rounded-full text-gray-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>
        ))}
        {members.length === 0 && compact && (
          <div className="w-full text-center py-8 opacity-50">
             <div className="inline-block p-4 bg-gray-100 dark:bg-slate-800 rounded-full mb-2 text-gray-400 dark:text-slate-600">
                <User size={32} />
             </div>
             <p className="text-gray-400 dark:text-slate-600 text-sm">ยังไม่มีสมาชิก...</p>
          </div>
        )}
      </div>

      {payer && onUpdatePayerPromptPay && (
        <div className={`mt-5 pt-4 border-t border-dashed border-gray-200 dark:border-slate-800/50 ${compact ? 'mx-2' : ''}`}>
            <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                   <QrCode size={12} className="text-teal-500" /> ช่องทางรับเงินของ {payer.name}
                </label>
                
                {/* Update Payment Input (Edit Mode) */}
                {renderPaymentInput(
                    payerBank, 
                    payerAccNumber, 
                    (val) => handlePayerUpdate(val, payerAccNumber),
                    (val) => handlePayerUpdate(payerBank, val)
                )}

            </div>
        </div>
      )}
    </div>
  );
};
