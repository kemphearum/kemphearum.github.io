import React from 'react';
import { Dialog, Button } from '../ui';

const DeleteConfirmDialog = ({ open, onOpenChange, onConfirm, loading, title, message }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="400px">
        <Dialog.Header>
          <Dialog.Title style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {title || 'Confirm Deletion'}
          </Dialog.Title>
          <Dialog.Close />
        </Dialog.Header>
        
        <Dialog.Body>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            {message || 'Are you sure you want to delete this item? This action cannot be undone.'}
          </p>
        </Dialog.Body>
        
        <Dialog.Footer>
          <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={onConfirm} 
            isLoading={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

export default DeleteConfirmDialog;
