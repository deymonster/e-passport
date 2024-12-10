'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface SearchFormProps {
  onSearch: (sn: string, orderNumber: string) => Promise<void>;
}

export function SearchForm({ onSearch }: SearchFormProps) {
  const [serialNumber, setSerialNumber] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSearch(serialNumber, orderNumber);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <h2 className="text-2xl font-semibold text-center">Проверка электронного паспорта</h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="sn" className="text-sm font-medium">
              Серийный номер
            </label>
            <Input
              id="sn"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="Введите серийный номер"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="orderNumber" className="text-sm font-medium">
              Номер партии (PIN)
            </label>
            <Input
              id="orderNumber"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Введите номер партии"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Проверить
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
