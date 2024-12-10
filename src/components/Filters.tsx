import { FC } from 'react';

interface FiltersProps {
  search: string;
  orderNumber: string;
  dateFrom: string;
  dateTo: string;
  onSearchChange: (value: string) => void;
  onOrderNumberChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
}

const Filters: FC<FiltersProps> = ({
  search,
  orderNumber,
  dateFrom,
  dateTo,
  onSearchChange,
  onOrderNumberChange,
  onDateFromChange,
  onDateToChange,
}) => {
  return (
    <div className="rounded-lg border border-gray-200 shadow-sm bg-white p-4">
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">Поиск</label>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Поиск ..."
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div className="w-full sm:w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Партия</label>
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => onOrderNumberChange(e.target.value)}
            placeholder="Поиск ..."
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div className="w-full sm:w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Дата от</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div className="w-full sm:w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Дата до</label>
          <input
            type="date"
            value={dateTo}
            min={dateFrom}
            onChange={(e) => onDateToChange(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default Filters;
