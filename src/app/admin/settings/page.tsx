'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash, Edit2 } from 'lucide-react';
import DocumentList from '@/components/DocumentList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface RegistryRecord {
    id: number;
    name: string;
    url: string;
}

export default function SettingsPage() {
    const [records, setRecords] = useState<RegistryRecord[]>([]);
    const [newRecord, setNewRecord] = useState({ name: '', url: '' });
    const [loading, setLoading] = useState(false);
    const [editRecord, setEditRecord] = useState<RegistryRecord | null>(null);

    const fetchRecords = async () => {
        const response = await fetch('/api/registry');
        const data = await response.json();
        setRecords(data);
    };

    const createRecord = async () => {
        if (!newRecord.name.trim() || !newRecord.url.trim()) return alert('Both name and URL are required');
        setLoading(true);

        try {
            const response = await fetch('/api/registry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRecord),
            });

            if (response.ok) {
                const newRecordData = await response.json();
                setRecords((prev) => [newRecordData, ...prev]);
                setNewRecord({ name: '', url: '' });
            } else {
                const { error } = await response.json();
                alert(error || 'Failed to create record');
            }
        } catch (error) {
            console.error(error);
            alert('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const deleteRecord = async (id: number) => {
        if (!confirm('Are you sure you want to delete this record?')) return;

        try {
            const response = await fetch(`/api/registry/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setRecords((prev) => prev.filter((record) => record.id !== id));
            } else {
                alert('Failed to delete record');
            }
        } catch (error) {
            console.error(error);
            alert('Something went wrong');
        }
    };

    const updateRecord = async () => {
        if (!editRecord?.name.trim() || !editRecord?.url.trim()) return alert('Both name and URL are required');
        setLoading(true);

        try {
            const response = await fetch(`/api/registry/${editRecord.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editRecord.name, url: editRecord.url }),
            });

            if (response.ok) {
                const updatedRecord = await response.json();
                setRecords((prev) =>
                    prev.map((record) =>
                        record.id === updatedRecord.id ? updatedRecord : record
                    )
                );
                setEditRecord(null);
            } else {
                const { error } = await response.json();
                alert(error || 'Failed to update record');
            }
        } catch (error) {
            console.error(error);
            alert('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Настройки</h1>
            <Tabs defaultValue="registry" className="w-full">
                <TabsList>
                    <TabsTrigger value="registry">Реестровые записи</TabsTrigger>
                    <TabsTrigger value="documents">Документы</TabsTrigger>
                </TabsList>
                <TabsContent value="registry">
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Управление реестровыми записями</h2>
                        <div className="mb-4 flex gap-2">
                            <Input
                                value={newRecord.name}
                                onChange={(e) => setNewRecord((prev) => ({ ...prev, name: e.target.value }))}
                                placeholder="Название реестровой записи"
                            />
                            <Input
                                value={newRecord.url}
                                onChange={(e) => setNewRecord((prev) => ({ ...prev, url: e.target.value }))}
                                placeholder="URL реестровой записи"
                            />
                            <Button onClick={createRecord} disabled={loading}>
                                {loading ? 'Добавление...' : 'Добавить'}
                            </Button>
                        </div>
                        <ul className="space-y-2">
                            {records.map((record) => (
                                <li
                                    key={record.id}
                                    className="flex justify-between items-center p-4 border rounded-lg"
                                >
                                    <div>
                                        <p>{record.name}</p>
                                        <a href={record.url} target="_blank" className="text-blue-500 text-sm">
                                            {record.url}
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" onClick={() => setEditRecord(record)}>
                                            <Edit2 className="w-4 h-4 text-gray-500" />
                                        </Button>
                                        <Button variant="ghost" onClick={() => deleteRecord(record.id)}>
                                            <Trash className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </TabsContent>
                <TabsContent value="documents">
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Управление документами</h2>
                        <DocumentList />
                    </div>
                </TabsContent>
            </Tabs>

            {/* Dialog for editing record */}
            {editRecord && (
                <Dialog open={!!editRecord} onOpenChange={() => setEditRecord(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Редактирование реестровой записи</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <Input
                                value={editRecord.name}
                                onChange={(e) =>
                                    setEditRecord((prev) => (prev ? { ...prev, name: e.target.value } : null))
                                }
                                placeholder="Название реестровой записи"
                            />
                            <Input
                                value={editRecord.url}
                                onChange={(e) =>
                                    setEditRecord((prev) => (prev ? { ...prev, url: e.target.value } : null))
                                }
                                placeholder="URL реестровой записи"
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="secondary" onClick={() => setEditRecord(null)}>
                                Отмена
                            </Button>
                            <Button onClick={updateRecord} disabled={loading}>
                                {loading ? 'Сохранение...' : 'Сохранить'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
