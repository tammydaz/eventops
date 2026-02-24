import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { type MenuCategoryKey } from '../constants/menuCategories';

export interface MenuItemRecord {
  id: string;
  name: string;
  category?: string | null;
}

interface MenuPickerModalProps {
  isOpen: boolean;
  categoryKey: MenuCategoryKey | null;
  label: string;
  menuItems: MenuItemRecord[];
  currentlySelected: MenuItemRecord[];
  onSelect: (item: MenuItemRecord) => void;
  onClose: () => void;
}

export const MenuPickerModal: React.FC<MenuPickerModalProps> = ({
  isOpen,
  categoryKey,
  label,
  menuItems,
  currentlySelected,
  onSelect,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  // TEMP HARD FIX — DO NOT FILTER
  const filteredItems = Array.isArray(menuItems)
    ? menuItems
    : [];

  const selectedIds = useMemo(
    () => new Set(currentlySelected.map((item) => item.id)),
    [currentlySelected]
  );

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99998] bg-black bg-opacity-70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border-2 border-red-600"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-red-600 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-300">{label}</h3>
            <button
              onClick={onClose}
              className="text-red-400 hover:text-red-600 text-xl font-bold"
            >
              ✕
            </button>
          </div>
          <div className="relative">
            <svg
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#ff3333',
              }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 rounded-md bg-gray-800 border border-gray-700 text-gray-300 px-3 py-2"
              autoFocus
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {filteredItems.length} of {menuItems.length} items
          </p>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredItems.map((item) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-md cursor-pointer transition ${
                  isSelected
                    ? 'bg-red-900 border-2 border-red-600'
                    : 'bg-gray-800 border border-gray-700 hover:bg-red-900 hover:border-red-600'
                }`}
              >
                <span className="text-gray-300">{item.name}</span>
                {item.category && (
                  <span className="text-xs text-gray-500 ml-auto">{item.category}</span>
                )}
              </div>
            );
          })}
          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p>No items found</p>
              <p className="text-xs mt-2">Check browser console for debug output</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-red-600 p-4 flex items-center justify-between">
          <span className="text-sm text-gray-400">
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} available
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-600 text-gray-300 hover:bg-gray-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
