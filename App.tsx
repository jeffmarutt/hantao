import React, { useState, useEffect } from 'react';
import { Calculator, ChevronRight, HelpCircle, FileText, PenLine, ArrowLeft, Sun, Moon } from 'lucide-react';
import { MemberSection } from './components/MemberSection';
import { ItemSection } from './components/ItemSection';
import { SummarySection } from './components/SummarySection';
import { HelpModal } from './components/HelpModal';
import { TableSummary } from './components/TableSummary';
import { LandingPage } from './components/LandingPage';
import { HistoryView } from './components/HistoryView';
import { ManualWizard } from './components/ManualWizard';
import { Member, Item, BillConfig, SavedBill, Receipt } from './types';
import { calculateSummary, formatCurrency } from './utils/calculations';

type AppView = 'landing' | 'calculator' | 'history' | 'wizard';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('landing');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('easySplit_theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('easySplit_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('easySplit_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  const [members, setMembers] = useState<Member[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([
      { id: 'manual-default', name: 'บิล / ร้านค้า', scRate: 0, vatRate: 0 }
  ]);

  const [config, setConfig] = useState<BillConfig>({
    vatRate: 0,
    serviceChargeRate: 0,
    finalBillTotal: null,
    roundingMethod: 'payer'
  });
  
  const [billName, setBillName] = useState(() => {
    const date = new Date();
    const dateStr = date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    const timeStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    return `บิล ${dateStr} ${timeStr}`;
  });

  const [showHelp, setShowHelp] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [history, setHistory] = useState<SavedBill[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('easySplit_history');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) { console.error("Failed to parse history"); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('easySplit_history', JSON.stringify(history));
  }, [history]);

  const handleStart = () => setView('wizard');
  const handleFinishWizard = () => {
    setView('calculator');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  const handleSaveToHistory = () => {
    const { summaries } = calculateSummary(members, items, receipts, config);
    const total = summaries.reduce((acc, curr) => acc + curr.totalConsumption, 0);
    const newBill: SavedBill = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        name: billName,
        members,
        items,
        receipts,
        config,
        total
    };
    setHistory(prev => [newBill, ...prev]);
  };

  const handleLoadBill = (bill: SavedBill) => {
      setBillName(bill.name);
      setMembers(bill.members);
      setItems(bill.items.map(i => ({ ...i, quantity: i.quantity || 1 })));
      setConfig(bill.config);
      setReceipts(bill.receipts && bill.receipts.length > 0 
        ? bill.receipts 
        : [{ id: 'manual-default', name: 'บิล / ร้านค้า', scRate: 0, vatRate: 0 }]
      );
      if (!bill.receipts) {
          setItems(prevItems => prevItems.map(i => ({ ...i, receiptId: 'manual-default' })));
      }
      setView('calculator');
  };

  const handleDeleteBill = (id: string) => setHistory(prev => prev.filter(b => b.id !== id));

  const { summaries } = calculateSummary(members, items, receipts, config);
  const grandTotal = summaries.reduce((acc, curr) => acc + curr.totalConsumption, 0);

  const handleAddMember = (name: string, promptPay?: string) => {
    const newMember: Member = {
      id: crypto.randomUUID(),
      name,
      isPayer: members.length === 0,
      promptPayId: promptPay
    };
    setMembers([...members, newMember]);
  };

  const handleRemoveMember = (id: string) => {
    const isRemovingPayer = members.find(m => m.id === id)?.isPayer;
    let newMembers = members.filter((m) => m.id !== id);
    if (isRemovingPayer && newMembers.length > 0) {
        newMembers[0] = { ...newMembers[0], isPayer: true };
    }
    setMembers(newMembers);
    setItems(items.map(item => ({
      ...item,
      assignedMemberIds: item.assignedMemberIds.filter(mId => mId !== id),
      paidBy: item.paidBy === id ? (newMembers[0]?.id || '') : item.paidBy
    })));
  };

  const handleUpdatePayerPromptPay = (promptPayId: string) => {
    setMembers(members.map(m => m.isPayer ? { ...m, promptPayId } : m));
  };

  const handleAddItem = (name: string, price: number, quantity: number, paidBy: string, receiptId: string, description?: string, assignedMemberIds?: string[]) => {
    const newItem: Item = {
      id: crypto.randomUUID(),
      name,
      price,
      quantity,
      assignedMemberIds: assignedMemberIds || [],
      paidBy,
      description,
      receiptId
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => setItems(items.filter((item) => item.id !== id));

  const handleUpdateItem = (id: string, name: string, price: number, paidBy: string, description?: string, excludeServiceCharge?: boolean, excludeVat?: boolean) => {
    setItems(items.map(item => item.id === id ? { ...item, name, price, paidBy, description, excludeServiceCharge, excludeVat } : item));
  };
  
  const handleUpdateItemAdjustments = (itemId: string, memberId: string, amount: number) => {
      setItems(items.map(item => {
          if (item.id === itemId) {
              const prevDeductions = item.fixedDeductions || [];
              const otherDeductions = prevDeductions.filter(d => d.memberId !== memberId);
              if (amount > 0) {
                  return { ...item, fixedDeductions: [...otherDeductions, { memberId, amount }] };
              } else {
                  return { ...item, fixedDeductions: otherDeductions };
              }
          }
          return item;
      }));
  };
  
  const handleUpdateReceiptName = (id: string, name: string) => setReceipts(prev => prev.map(r => r.id === id ? { ...r, name } : r));
  const handleUpdateReceiptRates = (id: string, scRate: number, vatRate: number) => setReceipts(prev => prev.map(r => r.id === id ? { ...r, scRate, vatRate } : r));
  const handleUpdateReceiptDiscount = (id: string, type: 'percent' | 'amount', value: number) => setReceipts(prev => prev.map(r => r.id === id ? { ...r, discountType: type, discountValue: value } : r));
  
  const handleUpdateReceiptSettings = (id: string, excludeSC: boolean, excludeVat: boolean) => {
    setReceipts(prev => prev.map(r => {
      if (r.id === id) {
        const newScRate = (!excludeSC && r.scRate === 0) ? 10 : r.scRate;
        const newVatRate = (!excludeVat && r.vatRate === 0) ? 7 : r.vatRate;
        
        return { 
          ...r, 
          excludeServiceCharge: excludeSC, 
          excludeVat: excludeVat, 
          scRate: newScRate, 
          vatRate: newVatRate,
          manualTotal: null 
        };
      }
      return r;
    }));
  };
  
  const handleUpdateReceiptTotal = (id: string, total: number | null) => setReceipts(prev => prev.map(r => r.id === id ? { ...r, manualTotal: total } : r));

  const handleAddReceipt = (name: string) => {
    const newReceipt: Receipt = { id: crypto.randomUUID(), name, scRate: 0, vatRate: 0, discountType: 'percent', discountValue: 0 };
    setReceipts(prev => [...prev, newReceipt]);
    return newReceipt.id;
  };

  const handleRemoveReceipt = (id: string) => {
      setReceipts(prev => prev.filter(r => r.id !== id));
      setItems(prev => prev.filter(i => i.receiptId !== id));
  };

  const handleToggleAssignment = (itemId: string, memberId: string, operation: 'add' | 'remove') => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        if (operation === 'add') {
           return { ...item, assignedMemberIds: [...item.assignedMemberIds, memberId] };
        } else {
          const idx = item.assignedMemberIds.lastIndexOf(memberId);
          if (idx !== -1) {
            const newList = [...item.assignedMemberIds];
            newList.splice(idx, 1);
            return { ...item, assignedMemberIds: newList };
          }
        }
      }
      return item;
    }));
  };

  const handleAssignAll = (itemId: string) => {
      setItems(items.map(item => {
          if (item.id === itemId) {
              const allMemberIds = members.map(m => m.id);
              return { ...item, assignedMemberIds: allMemberIds };
          }
          return item;
      }));
  }

  const handleLoadMockData = () => {
    const id1 = crypto.randomUUID();
    const id2 = crypto.randomUUID();
    const id3 = crypto.randomUUID();
    const id4 = crypto.randomUUID();
    const id5 = crypto.randomUUID();

    const newMembers: Member[] = [
        { id: id1, name: 'นัท (คนจ่าย)', isPayer: true, promptPayId: '081-234-5678' },
        { id: id2, name: 'บีม', isPayer: false },
        { id: id3, name: 'เอก', isPayer: false },
        { id: id4, name: 'จอย', isPayer: false },
        { id: id5, name: 'ไหม', isPayer: false },
    ];

    const r1 = crypto.randomUUID();
    const r2 = crypto.randomUUID();
    const r3 = crypto.randomUUID();

    const newReceipts: Receipt[] = [
        { id: r1, name: 'MK Suki (SC 10% + VAT 7%)', scRate: 10, vatRate: 7 },
        { id: r2, name: 'After You (No SC, จอยจ่าย)', scRate: 0, vatRate: 7 },
        { id: r3, name: 'Rooftop Bar (ลด 10%)', scRate: 10, vatRate: 7, discountType: 'percent', discountValue: 10 }
    ];

    const newItems: Item[] = [
        { id: crypto.randomUUID(), name: 'ชุดผักรวม', price: 450, quantity: 1, assignedMemberIds: [id1, id2, id3, id4, id5], paidBy: id1, receiptId: r1 },
        { id: crypto.randomUUID(), name: 'เป็ดย่างจานใหญ่', price: 350, quantity: 1, assignedMemberIds: [id1, id2, id3], paidBy: id1, receiptId: r1 },
        { id: crypto.randomUUID(), name: 'บะหมี่หยก', price: 50, quantity: 4, assignedMemberIds: [id1, id2, id3, id4], paidBy: id1, receiptId: r1 },
        { id: crypto.randomUUID(), name: 'Shibuya Honey Toast', price: 285, quantity: 1, assignedMemberIds: [id4, id5], paidBy: id4, receiptId: r2 },
        { id: crypto.randomUUID(), name: 'Strawberry Kakigori', price: 325, quantity: 1, assignedMemberIds: [id1, id2, id3], paidBy: id4, receiptId: r2 },
        { id: crypto.randomUUID(), name: 'น้ำแร่', price: 40, quantity: 1, assignedMemberIds: [id1, id2, id3, id4, id5], paidBy: id4, receiptId: r2 },
        { id: crypto.randomUUID(), name: 'Signature Cocktail', price: 380, quantity: 2, assignedMemberIds: [id2, id5], paidBy: id1, receiptId: r3 },
        { id: crypto.randomUUID(), name: 'Craft Beer Tower', price: 1200, quantity: 1, assignedMemberIds: [id1, id3, id4], paidBy: id1, receiptId: r3 },
        { id: crypto.randomUUID(), name: 'French Fries', price: 150, quantity: 1, assignedMemberIds: [id1, id2, id3, id4, id5], paidBy: id1, receiptId: r3 },
    ];

    setMembers(newMembers);
    setReceipts(newReceipts);
    setItems(newItems);
    setBillName('ปาร์ตี้วันเกิดเอก 🎂');
    setView('calculator');
  };

  const handleScanReceipts = async (files: File[], overridePayerId?: string) => {
    setIsScanning(true);
    let targetPayerId = overridePayerId || members.find(m => m.isPayer)?.id || members[0]?.id || '';
    
    try {
      const genaiModule = await import("@google/generative-ai");
      const { GoogleGenerativeAI, SchemaType } = genaiModule;
      
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        alert("Error: API Key is missing. Please check your Environment Variables.");
        setIsScanning(false);
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const allNewItems: Item[] = [];
      const newReceipts: Receipt[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const receiptId = crypto.randomUUID();
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        });

        const model = genAI.getGenerativeModel({ 
          model: "gemini-1.5-flash",
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: SchemaType.OBJECT,
              properties: {
                items: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      name: { type: SchemaType.STRING },
                      price: { type: SchemaType.NUMBER },
                      quantity: { type: SchemaType.NUMBER }
                    }
                  }
                },
                grandTotal: { type: SchemaType.NUMBER },
                vatRate: { type: SchemaType.NUMBER },
                serviceChargeRate: { type: SchemaType.NUMBER }
              }
            }
          }
        });

        const result = await model.generateContent([
          { inlineData: { mimeType: file.type, data: base64Data } },
          { text: "Extract food items with quantity and unit price. Return JSON format." }
        ]);

        const response = await result.response;
        const data = JSON.parse(response.text());
        
        const detectedVat = data.vatRate ?? 7;
        const detectedSc = data.serviceChargeRate ?? 0;
        
        newReceipts.push({ 
          id: receiptId, 
          name: `ใบเสร็จที่ ${i+1}`, 
          scRate: detectedSc, 
          vatRate: detectedVat, 
          excludeVat: detectedVat === 0,
          excludeServiceCharge: detectedSc === 0,
          manualTotal: data.grandTotal 
        });

        if (Array.isArray(data.items)) {
          allNewItems.push(...data.items.map((item: any) => ({
            id: crypto.randomUUID(),
            name: item.name,
            price: item.price,
            quantity: item.quantity || 1,
            assignedMemberIds: [],
            paidBy: targetPayerId,
            receiptId: receiptId
          })));
        }
      }

      setReceipts(prev => (prev.length === 1 && prev[0].id === 'manual-default' && items.length === 0) ? [...newReceipts] : [...prev, ...newReceipts]);
      setItems(prev => [...prev, ...allNewItems]);

    } catch (error) { 
      console.error('Error scanning receipt:', error);
      alert('Scanning failed. Please check your internet or API key.');
    } finally { 
      setIsScanning(false); 
    }
  };

  const scrollToSummary = () => document.getElementById('summary-section')?.scrollIntoView({ behavior: 'smooth' });

  if (view === 'landing') return <><LandingPage onStart={handleStart} onShowHelp={() => setShowHelp(true)} onLoadDemo={handleLoadMockData} isDarkMode={isDarkMode} onToggleTheme={toggleTheme} /><HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} /></>;
  if (view === 'history') return <HistoryView history={history} onBack={() => setView(members.length > 0 ? 'calculator' : 'landing')} onLoadBill={handleLoadBill} onDeleteBill={handleDeleteBill} isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />;
  if (view === 'wizard') return <ManualWizard onFinish={handleFinishWizard} onBack={() => setView('landing')} billName={billName} setBillName={setBillName} members={members} onAddMember={handleAddMember} onRemoveMember={handleRemoveMember} items={items} receipts={receipts} config={config} onAddItem={handleAddItem} onRemoveItem={handleRemoveItem} onUpdateItem={handleUpdateItem} onUpdateReceiptName={handleUpdateReceiptName} onUpdateReceiptSettings={handleUpdateReceiptSettings} onUpdateReceiptRates={handleUpdateReceiptRates} onUpdateReceiptDiscount={handleUpdateReceiptDiscount} onUpdateReceiptTotal={handleUpdateReceiptTotal} onRemoveReceipt={handleRemoveReceipt} onUpdatePayerPromptPay={handleUpdatePayerPromptPay} onAddReceipt={handleAddReceipt} onToggleAssignment={handleToggleAssignment} onAssignAll={handleAssignAll} onScanReceipt={handleScanReceipts} isScanning={isScanning} isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300 pb-40">
      <header className="bg-teal-700 dark:bg-teal-900 text-white p-4 shadow-md sticky top-0 z-20 transition-colors">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setView('landing')} className="p-1 hover:bg-teal-600 dark:hover:bg-teal-800 rounded-lg transition-colors -ml-2"><ArrowLeft size={24} /></button>
            <h1 className="text-xl font-bold tracking-tight text-white">HanTao</h1>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={toggleTheme} className="p-2 text-teal-100 hover:text-white bg-teal-800/40 rounded-full transition-all">{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
            <button onClick={() => setShowHelp(true)} className="p-1.5 text-teal-100 hover:text-white"><HelpCircle size={22} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6 mt-2">
        <section className="animate-fade-in-up">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-3 transition-colors">
            <div className="bg-orange-100 dark:bg-orange-900/30 p-2.5 rounded-xl text-orange-600 dark:text-orange-400 shadow-sm"><FileText size={22} /></div>
            <div className="flex-1 relative group">
              <label className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider block mb-0.5">ชื่อบิล</label>
              <input type="text" value={billName} onChange={(e) => setBillName(e.target.value)} className="w-full font-bold text-gray-800 dark:text-white text-lg bg-transparent border-b border-transparent hover:border-gray-200 dark:hover:border-slate-700 focus:border-teal-500 focus:outline-none py-0.5 transition-all" placeholder="ตั้งชื่อบิล..." />
            </div>
          </div>
        </section>
        <section className="animate-fade-in-up"><MemberSection members={members} onAddMember={handleAddMember} onRemoveMember={handleRemoveMember} onUpdatePayerPromptPay={handleUpdatePayerPromptPay} /></section>
        <section className="animate-fade-in-up"><ItemSection items={items} members={members} receipts={receipts} config={config} onAddItem={handleAddItem} onRemoveItem={handleRemoveItem} onUpdateItem={handleUpdateItem} onUpdateReceiptName={handleUpdateReceiptName} onUpdateReceiptSettings={handleUpdateReceiptSettings} onUpdateReceiptRates={handleUpdateReceiptRates} onUpdateReceiptDiscount={handleUpdateReceiptDiscount} onUpdateReceiptTotal={handleUpdateReceiptTotal} onRemoveReceipt={handleRemoveReceipt} onAddReceipt={handleAddReceipt} onToggleAssignment={handleToggleAssignment} onAssignAll={handleAssignAll} onScanReceipt={handleScanReceipts} isScanning={isScanning} onUpdateItemAdjustments={handleUpdateItemAdjustments} /></section>
        <section id="summary-section" className="animate-fade-in-up"><SummarySection members={members} items={items} receipts={receipts} config={config} setConfig={setConfig} billName={billName} onViewTable={() => setShowTable(true)} onUpdatePromptPay={handleUpdatePayerPromptPay} onSaveHistory={handleSaveToHistory} /></section>
      </main>
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <TableSummary isOpen={showTable} onClose={() => setShowTable(false)} members={members} items={items} config={config} billName={billName} receipts={receipts} />
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white border-t border-slate-800 p-5 z-30 pb-safe transition-all">
        <div className="max-w-2xl mx-auto flex justify-between items-center gap-4">
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] mb-1">ยอดรวมทั้งหมด</p>
            <p className="text-3xl font-black text-teal-400 leading-none">{formatCurrency(grandTotal)}</p>
          </div>
          <button onClick={scrollToSummary} className="bg-teal-600 hover:bg-teal-500 px-7 py-4 rounded-[1.25rem] font-black text-xl active:scale-90 transition-all flex items-center gap-2">ดูสรุป <ChevronRight size={22} strokeWidth={3} /></button>
        </div>
      </div>
    </div>
  );
};

export default App;
