'use client';

import React from 'react';
import { TicketDetail } from '@/components/tickets/ticket-detail';

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { id } = await params;
  
  return (
    <div className="container mx-auto py-6">
      <TicketDetail ticketId={id} />
    </div>
  );
}
