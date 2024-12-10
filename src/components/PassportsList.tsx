'use client';

import { useState, useEffect } from 'react';
import PassportTable from './PassportTable';
import PassportModal from './PassportModal';
import DeletePassportModal from './DeletePassportModal';
import Filters from './Filters';

// Тип интерфейсов для Passport
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

export default function PassportsList() {
  const [passports, setPassports] = useState<Passport[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(20); // Количество элементов на страницу
  const [hasMore, setHasMore] = useState(true);

  // Filter states
  const [search, setSearch] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [selectedPassport, setSelectedPassport] = useState<Passport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchPassports = async (reset = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        offset: reset ? '0' : offset.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(orderNumber && { orderNumber }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });

      const response = await fetch(`/api/passport?${params}`);
      const { passports: newPassports, totalCount } = await response.json();

      if (reset) {
        setPassports(newPassports);
        setOffset(newPassports.length);
      } else {
        setPassports((prev) => [...prev, ...newPassports]);
        setOffset((prev) => prev + newPassports.length);
      }

      setHasMore(offset + newPassports.length < totalCount);
    } catch (error) {
      console.error('Ошибка загрузки паспортов:', error);
      setPassports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPassports(true);
  }, [search, orderNumber, dateFrom, dateTo]);

  const handleRowClick = (passport: Passport) => {
    setSelectedPassport(passport);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleEdit = (passport: Passport) => {
    setSelectedPassport(passport);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = (passport: Passport) => {
    setSelectedPassport(passport);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async (updatedPassport: Passport) => {
    try {
      if (!updatedPassport.id) {
        throw new Error('ID паспорта не определен');
      }

      const response = await fetch(`/api/passport/${updatedPassport.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPassport),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка сохранения паспорта');
      }

      const savedPassport = await response.json();
      setPassports((prev) =>
        prev.map((p) => (p.id === savedPassport.id ? savedPassport : p))
      );
      setIsModalOpen(false);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      // Показываем ошибку пользователю
      alert(error instanceof Error ? error.message : 'Произошла ошибка при сохранении');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPassport) return;

    try {
      const response = await fetch(`/api/passport/${selectedPassport.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Ошибка удаления паспорта');
      }

      setPassports((prev) => prev.filter((p) => p.id !== selectedPassport.id));
    } catch (error) {
      console.error('Ошибка удаления:', error);
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedPassport(null);
    }
  };

  return (
    <div className="space-y-6 max-w-[98%] mx-auto mt-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Список паспортов</h2>
        <p className="text-sm text-muted-foreground">
          Управление паспортами устройств
        </p>
      </div>

      <div className="space-y-4">
        <Filters
          search={search}
          orderNumber={orderNumber}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onSearchChange={(value) => {
            setSearch(value);
            setOffset(0);
          }}
          onOrderNumberChange={(value) => {
            setOrderNumber(value);
            setOffset(0);
          }}
          onDateFromChange={(value) => {
            setDateFrom(value);
            setOffset(0);
          }}
          onDateToChange={(value) => {
            setDateTo(value);
            setOffset(0);
          }}
        />

        <PassportTable
          passports={passports}
          loading={loading}
          onRowClick={handleRowClick}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onShowMore={fetchPassports}
          hasMore={hasMore}
        />

        {selectedPassport && (
          <PassportModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            passport={selectedPassport}
            isEditMode={isEditMode}
            onSave={handleSave}
          />
        )}

        <DeletePassportModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onDelete={handleDeleteConfirm}
          passportSN={selectedPassport?.sn || ''}
        />
      </div>
    </div>
  );
}
