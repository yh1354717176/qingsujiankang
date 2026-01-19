import React from 'react';
import { Icons } from './Icons';

interface CalendarStripProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
}

export const CalendarStrip: React.FC<CalendarStripProps> = ({ selectedDate, onSelectDate }) => {
  // Generate dates: Today and previous 4 days
  const generateDays = () => {
    const dates = [];
    // Show 5 days ending today
    for (let i = 4; i >= 0; i--) {
       const d = new Date();
       d.setDate(d.getDate() - i);
       dates.push(d);
    }
    return dates;
  };

  const days = generateDays();
  const today = new Date().toISOString().split('T')[0];
  
  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  const formatDisplay = (date: Date) => {
      const dStr = formatDate(date);
      if (dStr === today) return '今天';
      return `${date.getMonth() + 1}.${date.getDate()}`;
  };

  const getDayName = (date: Date) => ['日','一','二','三','四','五','六'][date.getDay()];

  // Check if selected date is in the visual strip list
  const isSelectedInStrip = days.some(d => formatDate(d) === selectedDate);

  return (
    <div className="flex items-center gap-2 bg-white p-3 rounded-2xl shadow-sm mb-4 mx-4 mt-[-20px] relative z-10 border border-gray-100">
       {days.map(date => {
           const dStr = formatDate(date);
           const isSelected = dStr === selectedDate;
           return (
               <button 
                 key={dStr}
                 onClick={() => onSelectDate(dStr)}
                 className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all ${isSelected ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
               >
                   <span className={`text-[10px] font-medium ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>{getDayName(date)}</span>
                   <span className="text-sm font-bold">{formatDisplay(date)}</span>
               </button>
           )
       })}
       
       <div className="w-[1px] h-8 bg-gray-200 mx-1"></div>
       
       <div className="relative">
           <input 
             type="date" 
             value={selectedDate}
             max={today}
             onChange={(e) => onSelectDate(e.target.value)}
             className="absolute inset-0 opacity-0 z-10 w-full h-full cursor-pointer"
           />
           <button className={`flex flex-col items-center justify-center w-10 h-10 rounded-full transition-colors ${!isSelectedInStrip ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
               <Icons.Calendar className="w-5 h-5" />
           </button>
       </div>
    </div>
  );
};