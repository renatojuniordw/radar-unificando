'use client';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  severity?: 'error' | 'warning' | 'info';
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', onConfirm, onCancel, severity = 'error' }: Props) {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{cancelLabel}</Button>
        <Button onClick={onConfirm} color={severity} variant="contained">{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}
