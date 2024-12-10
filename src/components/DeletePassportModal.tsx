import { FC } from 'react';

interface DeletePassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  passportSN: string;
}

const DeletePassportModal: FC<DeletePassportModalProps> = ({
  isOpen,
  onClose,
  onDelete,
  passportSN,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium text-gray-900">Подтвердите удаление</h3>
        <p className="mt-2 text-sm">
          Вы уверены, что хотите удалить паспорт с серийным номером: <strong>{passportSN}</strong>?
        </p>
        <div className="mt-4 flex justify-end gap-4">
        <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Отмена
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeletePassportModal;

