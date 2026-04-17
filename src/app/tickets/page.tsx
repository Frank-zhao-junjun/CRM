'use client';

import React, { useState } from 'react';
import { TicketList } from '@/components/tickets/ticket-list';
import { CreateTicketForm } from '@/components/tickets/create-ticket-form';

export default function TicketsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <div className="container mx-auto py-6">
      <TicketList onCreateTicket={() => setCreateDialogOpen(true)} />
      
      <CreateTicketForm
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </div>
  );
}
