import React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'; // Добавляем необходимые импорты
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

// Тип интерфейса для Passport
interface Document {
  id: number;
  name: string;
  filePath: string;
  type: 'USER_MANUAL' | 'PRODUCT_IMAGE' | 'TECHNICAL_SPEC' | 'OTHER';
}

interface RegistryRecord {
  id: number;
  name: string;
  url: string;
}

interface Passport {
  id: number;
  sn: string;
  name: string | null;
  orderNumber: string;
  productionDate: string;
  warrantyPeriod: 'MONTHS_12' | 'MONTHS_24' | 'MONTHS_36';
  documents: Document[];
  type: 'ARM' | 'PC';
  registryRecord?: RegistryRecord;
}

interface PassportTableProps {
  passports: Passport[];
  loading: boolean;
  onRowClick: (passport: Passport) => void;
  onEdit: (passport: Passport) => void;
  onDelete: (passport: Passport) => void;
  onShowMore: () => void;
  hasMore: boolean;
}

export default function PassportTable({
  passports,
  loading,
  onRowClick,
  onEdit,
  onDelete,
  onShowMore,
  hasMore,
}: PassportTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm mx-auto max-w-[98%]">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {[
              { key: 'sn', label: 'Серийный номер', className: 'w-[18%]' },
              { key: 'name', label: 'Название', className: 'w-[22%]' },
              { key: 'orderNumber', label: 'Номер заказа', className: 'w-[18%]' },
              { key: 'productionDate', label: 'Дата производства', className: 'w-[20%]' },
              { key: 'warrantyPeriod', label: 'Гарантия', className: 'w-[12%]' },
              { key: 'actions', label: 'Действия', className: 'w-[10%] text-center' },
            ].map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50 ${column.className || ''}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {passports.map((passport, index) => (
            <tr 
              key={passport.id} 
              className={`
                cursor-pointer transition-colors duration-150 ease-in-out
                ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                hover:bg-indigo-50
              `}
              onClick={() => onRowClick(passport)}
            >
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{passport.sn}</div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm text-gray-900">{passport.name || 'Нет данных'}</div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm text-gray-900">{passport.orderNumber}</div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {new Date(passport.productionDate).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                  })}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {passport.warrantyPeriod.replace('MONTHS_', '')} мес.
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(passport);
                    }}
                    className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150 ease-in-out p-1 rounded-full hover:bg-indigo-50"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(passport);
                    }}
                    className="text-red-600 hover:text-red-900 transition-colors duration-150 ease-in-out p-1 rounded-full hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {hasMore && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={(e) => {
              e.preventDefault();
              onShowMore();
            }}
            className="w-full text-center text-sm text-indigo-600 hover:text-indigo-900 font-medium transition-colors duration-150 ease-in-out"
          >
            Загрузить еще
          </button>
        </div>
      )}
    </div>
  );
}
