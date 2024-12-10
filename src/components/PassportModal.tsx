'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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
  name: string;
  orderNumber: string;
  productionDate: string;
  warrantyPeriod: 'MONTHS_12' | 'MONTHS_24' | 'MONTHS_36';
  documents: Document[];
  type: 'ARM' | 'PC';
  registryRecord?: RegistryRecord;
}

const formSchema = z.object({
  sn: z.string().min(1, "Введите серийный номер"),
  name: z.string().min(1, "Введите название"),
  warrantyPeriod: z.enum(['MONTHS_12', 'MONTHS_24', 'MONTHS_36']),
  type: z.enum(['ARM', 'PC']),
  productionDate: z.date({
    required_error: "Укажите дату производства",
  }),
  orderNumber: z.string().min(1, "Введите номер заказа"),
  registryRecordId: z.number().nullable(),
  documents: z.array(z.number()).default([]),
});

interface PassportModalProps {
  passport: Passport | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  isEditMode?: boolean;
}

const PassportModal = ({
  isOpen,
  onClose,
  passport,
  onSave,
  isEditMode = true,
}: PassportModalProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [registryRecords, setRegistryRecords] = useState<RegistryRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRegistryRecord, setSelectedRegistryRecord] = useState<RegistryRecord | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sn: "",
      name: "",
      warrantyPeriod: "MONTHS_12" as const,
      type: "PC" as const,
      productionDate: new Date(),
      orderNumber: "",
      registryRecordId: null,
      documents: [],
    },
  });

  useEffect(() => {
    if (isOpen && passport) {
      form.reset({
        sn: passport.sn || "",
        name: passport.name || "",
        warrantyPeriod: passport.warrantyPeriod,
        type: passport.type,
        productionDate: new Date(passport.productionDate),
        orderNumber: passport.orderNumber || "",
        registryRecordId: passport.registryRecord?.id || null,
        documents: passport.documents.map(d => d.id),
      });
      setSelectedRegistryRecord(passport.registryRecord || null);
    }
  }, [isOpen, passport, form]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docsResponse, registryResponse] = await Promise.all([
          fetch('/api/documents'),
          fetch('/api/registry')
        ]);
        
        if (!docsResponse.ok || !registryResponse.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const docsData = await docsResponse.json();
        const registryData = await registryResponse.json();
        
        setDocuments(docsData);
        setRegistryRecords(registryData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!passport || !passport.id) {
      console.error('No passport ID provided');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedData = {
        sn: values.sn,
        orderNumber: values.orderNumber,
        name: values.name,
        type: values.type,
        productionDate: values.productionDate.toISOString(),
        warrantyPeriod: values.warrantyPeriod,
        registryRecordId: values.registryRecordId || null,
        batchId: values.batchId || null,
        documentIds: values.documents || [],
      };

      const response = await fetch(`/api/passport/${passport.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update passport');
      }

      const updatedPassport = await response.json();
      onSave(updatedPassport);
      onClose();
    } catch (error) {
      console.error('Error updating passport:', error);
      throw error; // Пробрасываем ошибку для обработки в родительском компоненте
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDocumentTypeName = (type: Document['type']) => {
    switch (type) {
      case 'USER_MANUAL':
        return 'Руководство пользователя';
      case 'PRODUCT_IMAGE':
        return 'Изображение продукта';
      case 'TECHNICAL_SPEC':
        return 'Техническая спецификация';
      case 'OTHER':
        return 'Прочее';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Редактировать паспорт' : 'Просмотр паспорта'}</DialogTitle>
        </DialogHeader>
        {isEditMode ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Серийный номер</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="warrantyPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Гарантийный период</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите период" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MONTHS_12">12 месяцев</SelectItem>
                          <SelectItem value="MONTHS_24">24 месяца</SelectItem>
                          <SelectItem value="MONTHS_36">36 месяцев</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тип</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите тип" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ARM">АРМ</SelectItem>
                          <SelectItem value="PC">ПК</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="registryRecordId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Запись в реестре</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          const id = value === "null" ? null : parseInt(value);
                          field.onChange(id);
                          setSelectedRegistryRecord(
                            id ? registryRecords.find(r => r.id === id) || null : null
                          );
                        }}
                        value={field.value?.toString() || "null"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите запись реестра" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="null">Нет записи</SelectItem>
                          {registryRecords.map((record) => (
                            <SelectItem key={record.id} value={record.id.toString()}>
                              {record.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedRegistryRecord && (
                        <div className="mt-2 text-sm">
                          <a
                            href={selectedRegistryRecord.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Открыть ссылку на реестр
                          </a>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="orderNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Номер заказа</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="productionDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Дата производства</FormLabel>
                      <FormControl>
                        <DatePicker
                          selected={field.value}
                          onChange={(date: Date | null, event?: MouseEvent | KeyboardEvent) => field.onChange(date)}
                          dateFormat="dd.MM.yyyy"
                          className="w-full p-2 border rounded-md"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="documents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Документы</FormLabel>
                    <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center gap-2 p-2 hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            id={`doc-${doc.id}`}
                            checked={field.value?.includes(doc.id)}
                            onChange={(e) => {
                              const newValue = e.target.checked
                                ? [...(field.value || []), doc.id]
                                : (field.value || []).filter((id) => id !== doc.id);
                              field.onChange(newValue);
                            }}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor={`doc-${doc.id}`}
                            className="text-sm text-gray-700 flex flex-col"
                          >
                            <span className="font-medium">{doc.name}</span>
                            <span className="text-xs text-gray-500">
                              {getDocumentTypeName(doc.type)}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Сохранение..." : "Сохранить"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Серийный номер</span>
                <p className="mt-1">{passport?.sn}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Название</span>
                <p className="mt-1">{passport?.name || 'Нет данных'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Номер партии</span>
                <p className="mt-1">{passport?.orderNumber}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Дата производства</span>
                <p className="mt-1">
                  {passport?.productionDate
                    ? new Date(passport.productionDate).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Нет данных'}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Гарантийный период</span>
                <p className="mt-1">
                  {passport?.warrantyPeriod?.replace('MONTHS_', '') || ''} месяцев
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Тип устройства</span>
                <p className="mt-1">{passport?.type === 'ARM' ? 'АРМ' : 'ПК'}</p>
              </div>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-500">Документы</span>
              {passport?.documents?.length ? (
                <div className="mt-2 space-y-2">
                  {passport.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded"
                    >
                      <div>
                        <span className="font-medium">{doc.name}</span>
                        <span className="ml-2 text-sm text-gray-500">
                          ({getDocumentTypeName(doc.type)})
                        </span>
                      </div>
                      <a
                        href={doc.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-900 text-sm"
                      >
                        Открыть
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-1">Нет документов</p>
              )}
            </div>

            <div>
              <span className="text-sm font-medium text-gray-500">Реестровая запись</span>
              {passport?.registryRecord ? (
                <p className="mt-1">
                  <a
                    href={passport.registryRecord.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    {passport.registryRecord.name}
                  </a>
                </p>
              ) : (
                <p className="mt-1">Нет записи</p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PassportModal;
