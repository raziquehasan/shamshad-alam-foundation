import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}: ConfirmDialogProps) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getButtonVariant = (): 'primary' | 'secondary' | 'danger' => {
    if (variant === 'danger') return 'danger';
    if (variant === 'warning') return 'secondary';
    return 'primary';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-gray-700">{message}</p>
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            {cancelText}
          </Button>
          <Button variant={getButtonVariant()} onClick={handleConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};