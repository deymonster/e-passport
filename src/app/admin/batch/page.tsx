'use client';

import { useState, useEffect } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotification } from '@/hooks/useNotification';

import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface RegistryEntry {
  id: number;
  name: string;
  url: string;
}

interface Document {
  id: number;
  name: string;
  filePath: string;
}

interface Batch {
  id: number;
  orderNumber: string;
  name: string;
  registryRecordId: number | null;
  warrantyPeriod: number;
  type: string;
  productionDate: string;
  passportsCount: number;
}

const formSchema = z.object({
  computerCount: z.number().min(1, "Количество должно быть больше 0"),
  name: z.string().min(1, "Введите название"),
  registryRecordId: z.number({
    required_error: "Выберите реестровую запись",
  }),
  warrantyPeriod: z.number(),
  computerType: z.string(),
  productionDate: z.date({
    required_error: "Укажите дату производства",
  }),
  orderNumber: z.string().min(1, "Введите номер заказа"),
  documents: z.array(z.number()).min(1, "Необходимо выбрать хотя бы один документ"),
});



export default function ManageBatchesPage() {
  const [registryEntries, setRegistryEntries] = useState<RegistryEntry[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [attachedDocuments, setAttachedDocuments] = useState<Document[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showNotification } = useNotification();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      computerCount: 1,
      name: '',
      registryRecordId: 0,
      warrantyPeriod: 12,
      computerType: '1',
      productionDate: new Date(),
      orderNumber: '',
      documents: [],
    },
  });

  useEffect(() => {
    const fetchRegistryEntries = async () => {
      try {
        const response = await fetch('/api/registry');
        const data: RegistryEntry[] = await response.json();
        setRegistryEntries(data);
      } catch (error) {
        console.error('Failed to fetch registry entries:', error);
        showNotification({
          type: 'error',
          message: 'Ошибка загрузки реестровых записей',
        });
      }
    };

    const fetchDocuments = async () => {
      try {
        const response = await fetch('/api/documents');
        const data: Document[] = await response.json();
        setDocuments(data);
      } catch (error) {
        console.error('Failed to fetch documents:', error);
        showNotification({
          type: 'error',
          message: 'Ошибка загрузки документов',
        });
      }
    };

    const fetchBatches = async () => {
      try {
        const response = await fetch('/api/batch');
        const data: Batch[] = await response.json();
        setBatches(data);
      } catch (error) {
        console.error('Failed to fetch batches:', error);
        showNotification({
          type: 'error',
          message: 'Ошибка загрузки партий',
        });
      }
    };

    fetchRegistryEntries();
    fetchDocuments();
    fetchBatches();
  }, []);

  const attachDocument = (doc: Document) => {
    if (!attachedDocuments.find((d) => d.id === doc.id)) {
      setAttachedDocuments((prev) => [...prev, doc]);
      form.setValue("documents", [...form.getValues("documents"), doc.id]);
    }
  };

  const removeDocument = (docId: number) => {
    setAttachedDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    form.setValue(
      "documents",
      form.getValues("documents").filter((id) => id !== docId)
    );
  };

  const handleBatchDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/batch/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setBatches((prev) => prev.filter((batch) => batch.id !== id));
        showNotification({
          type: 'success',
          message: 'Партия успешно удалена',
        });
      } else {
        throw new Error('Failed to delete batch');
      }
    } catch (error) {
      console.error('Error deleting batch:', error);
      showNotification({
        type: 'error',
        message: 'Ошибка удаления партии',
      });
    }
  };

  
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    const formattedData = {
      ...data,
      type: data.computerType,
      productionDate: data.productionDate.toISOString().split('T')[0], 
      documents: data.documents,
    };
    
    try {
      const response = await fetch('/api/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData),
      });

      if (response.ok) {
        const newBatch = await response.json();
        setBatches((prev) => [newBatch, ...prev]);
        form.reset();
        setDocuments([]);
        showNotification({
          type: 'success',
          message: 'Партия успешно создана',
        });
      } else {
        throw new Error('Failed to create batch');
      }
    } catch (error) {
      console.error('Error creating batch:', error);
      showNotification({
        type: 'error',
        message: 'Ошибка создания партии',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
          <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Управление партиями</h1>

              <Tabs defaultValue="create">
                <TabsList>
                  <TabsTrigger value="create">Создать партию</TabsTrigger>
                  <TabsTrigger value="manage">Управление партиями</TabsTrigger>
                </TabsList>

                <TabsContent value="create">
                  <Form {...form}>
                    <form onSubmit={(event) => {
                        event.preventDefault();
                        form.handleSubmit(
                          (data) => {
                            console.log('Валидация успешна. Отправляем данные:', data);
                            onSubmit(data); // вызываем оригинальный onSubmit
                          },
                          (errors) => {
                            console.error('Ошибки валидации:', errors);
                          }
                        )();
                      }} className="space-y-6">

                      <div className="grid grid-cols-2 gap-4">
                        {/* Название партии */}
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Название</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Введите название" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Количество компьютеров */}
                        <FormField
                          control={form.control}
                          name="computerCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Количество</FormLabel>
                              <FormControl>
                              <Input
                                    type="number"
                                    value={field.value || ''}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      // Проверяем, является ли значение числом и убираем ведущие нули
                                      if (/^\d*$/.test(value)) {
                                        field.onChange(Number(value.replace(/^0+(?=\d)/, '')));
                                      }
                                    }}
                                    min="1"
                                    placeholder="Введите количество"
                                  />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Реестровая запись */}
                        <FormField
                          control={form.control}
                          name="registryRecordId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Реестровая запись</FormLabel>
                              <Select
                                value={field.value?.toString()}
                                onValueChange={(value) => field.onChange(Number(value))}
                              >
                                <FormControl>
                                
                                    <SelectTrigger className="whitespace-normal h-auto py-2">
                                      <FormControl>
                                        <span className="block">
                                          {(() => {
                                            const selectedEntry = registryEntries.find(
                                              (entry) => entry.id.toString() === form.getValues("registryRecordId")?.toString()
                                            );

                                            return selectedEntry ? selectedEntry.name : "Выберите реестровую запись";
                                          })()}
                                        </span>
                                      </FormControl>
                                    </SelectTrigger>

                                  </FormControl>
                                <SelectContent>
                                  {registryEntries.map((entry) => (
                                    <SelectItem key={entry.id} value={entry.id.toString()}>
                                      {entry.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {(() => {
                                  const selectedEntry = registryEntries.find(
                                    (entry) => entry.id.toString() === field.value?.toString()
                                  );

                                  return selectedEntry ? (
                                    <p className="text-sm text-gray-500 flex justify-center mt-2">
                                      <a href={selectedEntry.url} target="_blank" rel="noopener noreferrer" className="underline">
                                        {selectedEntry.url}
                                      </a>
                                    </p>
                                  ) : null;
                                })()}

                              <FormMessage />
                            </FormItem>
                          )}
                        />                        

                        {/* Срок гарантии */}
                        <FormField
                          control={form.control}
                          name="warrantyPeriod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Срок гарантии</FormLabel>
                              <Select
                                value={field.value?.toString()}
                                onValueChange={(value) => field.onChange(Number(value))}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Выберите срок гарантии" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="12">12 месяцев</SelectItem>
                                  <SelectItem value="24">24 месяца</SelectItem>
                                  <SelectItem value="36">36 месяцев</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {/* Тип устройства */}
                        <FormField
                          control={form.control}
                          name="computerType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Тип устройства</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Выберите тип устройства" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="1">АРМ</SelectItem>
                                  <SelectItem value="2">Системный блок</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {/* Дата производства */}
                        <FormField
                          control={form.control}
                          name="productionDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Дата производства</FormLabel>
                              <FormControl>
                                {/* <Input
                                  type="date"
                                  {...field}
                                  value={field.value ? field.value.toISOString().split('T')[0] : ''}
                                  onChange={(e) => field.onChange(new Date(e.target.value))}
                                /> */}
                                <DatePicker
                                  selected={field.value}
                                  onChange={(date) => field.onChange(date)}
                                  dateFormat="MM/yyyy"
                                  showMonthYearPicker
                                  className="w-full border rounded-md p-2"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {/* Номер заказа */}
                        <FormField
                          control={form.control}
                          name="orderNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Номер заказа</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Введите номер заказа" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Документы */}
                        {/* Прикрепленные документы */}
                        <div className="col-span-2">
                          <FormLabel>Прикрепленные документы</FormLabel>
                          <div className="space-y-2">
                            {attachedDocuments.map((doc) => (
                              <div key={doc.id} className="flex justify-between items-center border p-2 rounded">
                                <span>{doc.name}</span>
                                <Button
                                  variant="destructive"
                                  onClick={() => removeDocument(doc.id)}
                                  size="sm"
                                >
                                  Удалить
                                </Button>
                              </div>
                            ))}
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              {/* Внешний контейнер вместо кнопки */}
                                <div className="mt-2">
                                  <Button type="button">Добавить документ</Button>
                                </div>
                            </DialogTrigger>
                            <DialogContent>
                            <DialogTitle>Добавить документ</DialogTitle>
                              <DialogDescription>
                                Выберите документ из списка ниже, чтобы прикрепить его к партии.
                              </DialogDescription>
                              <div className="space-y-2">
                                {documents.map((doc) => (
                                  <div
                                    key={doc.id}
                                    className="flex justify-between items-center border p-2 rounded"
                                  >
                                    <span>{doc.name}</span>
                                    <Button
                                      onClick={() => attachDocument(doc)}
                                      size="sm"
                                    >
                                      Добавить
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>


                      </div>
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                          'Создать партию'
                        )}
                      </Button>

                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="manage">
                    <div className="space-y-4">
                      {batches.map((batch) => (
                        <div key={batch.id} className="p-4 border rounded-lg shadow-md bg-white">
                          <h2 className="font-bold text-lg mb-2">Партия: {batch.name}</h2>
                          <div className="space-y-1">
                            <p>
                              <span className="font-medium">Номер заказа:</span> {batch.orderNumber}
                            </p>
                            <p>
                              <span className="font-medium">Дата производства:</span>{' '}
                              {format(new Date(batch.productionDate), 'MMMM yyyy', { locale: ru })}
                            </p>
                            <p>
                              <span className="font-medium">Количество компьютеров:</span> {batch.passportsCount || 'Нет данных'}
                            </p>
                          </div>
                          <Button variant="destructive" onClick={() => handleBatchDelete(batch.id)} className="mt-3">
                            Удалить
                          </Button>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

              </Tabs>
        </div>
      );
}
