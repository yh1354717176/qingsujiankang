import React, { useState } from 'react';
import { MealType, FoodItem } from '../types';
import { Icons } from './Icons';

interface MealCardProps {
  type: MealType;
  items: FoodItem[];
  onAdd: () => void;
  onRemove: (ids: string[]) => void;
  onViewImage?: (images: string[]) => void;
}

const MealIcon = ({ type }: { type: MealType }) => {
  switch (type) {
    case MealType.BREAKFAST: return <Icons.Breakfast className="w-5 h-5 text-orange-500" />;
    case MealType.LUNCH: return <Icons.Lunch className="w-5 h-5 text-yellow-500" />;
    case MealType.DINNER: return <Icons.Dinner className="w-5 h-5 text-indigo-500" />;
    case MealType.SNACK: return <Icons.Snack className="w-5 h-5 text-green-500" />;
    default: return <Icons.Utensils className="w-5 h-5 text-gray-500" />;
  }
};

export const MealCard: React.FC<MealCardProps> = ({ type, items, onAdd, onRemove, onViewImage }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleDeleteSelected = () => {
    onRemove(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsEditing(false);
  };

  const handleToggleEdit = () => {
    setIsEditing(!isEditing);
    setSelectedIds(new Set());
  };

  return (
    <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gray-50 rounded-full">
            <MealIcon type={type} />
          </div>
          <h3 className="font-bold text-gray-800 text-lg">{type}</h3>
        </div>
        
        <div className="flex gap-2">
           {items.length > 0 && (
             isEditing ? (
               <button 
                  onClick={handleDeleteSelected}
                  disabled={selectedIds.size === 0}
                  className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-full font-medium disabled:opacity-50"
               >
                 删除 ({selectedIds.size})
               </button>
             ) : (
                <button 
                  onClick={handleToggleEdit}
                  className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full font-medium"
               >
                 管理
               </button>
             )
           )}
           
           {isEditing ? (
             <button 
                onClick={handleToggleEdit}
                className="text-blue-600 p-2 hover:bg-blue-50 rounded-full transition-colors"
             >
               <span className="text-xs font-bold">完成</span>
             </button>
           ) : (
             <button 
                onClick={onAdd}
                className="text-blue-600 p-2 hover:bg-blue-50 rounded-full transition-colors"
             >
               <Icons.Plus className="w-5 h-5" />
             </button>
           )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-gray-400 text-sm italic py-2 pl-2">
          还没有记录...
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li 
              key={item.id} 
              onClick={() => isEditing && toggleSelection(item.id)}
              className={`flex justify-between items-center p-2 rounded-lg transition-all ${isEditing ? 'cursor-pointer hover:bg-gray-100' : 'bg-gray-50'}`}
            >
              <div className="flex items-center gap-3 w-full">
                {isEditing && (
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${selectedIds.has(item.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'}`}>
                     {selectedIds.has(item.id) && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                )}
                
                {item.images && item.images.length > 0 && (
                   <div 
                      className="w-10 h-10 rounded-lg overflow-hidden shrink-0 cursor-zoom-in border border-gray-100"
                      onClick={(e) => {
                          e.stopPropagation();
                          if (!isEditing && onViewImage && item.images) onViewImage(item.images);
                      }}
                   >
                       <img src={item.images[0]} className="w-full h-full object-cover" />
                   </div>
                )}

                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-800 break-words">{item.name}</span>
                  {item.description && (
                    <span className="text-xs text-gray-500 block">{item.description}</span>
                  )}
                </div>

                {item.images && item.images.length > 1 && !isEditing && (
                    <div className="text-xs text-gray-400 flex items-center gap-0.5 shrink-0">
                        <Icons.Camera className="w-3 h-3" />
                        {item.images.length}
                    </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};