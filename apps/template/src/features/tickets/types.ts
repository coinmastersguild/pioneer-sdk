export type TicketPriority = 'low' | 'medium' | 'high'
export type TicketStatus = 'open' | 'in-progress' | 'closed'

export interface Ticket {
  id: string
  title: string
  description: string
  priority: TicketPriority
  status: TicketStatus
  assigneeId?: string
  createdBy: string
  createdAt: string
  updatedAt?: string
}

export interface CreateTicketInput {
  title: string
  description: string
  priority: TicketPriority
}

export interface UpdateTicketInput {
  id: string
  title?: string
  description?: string
  priority?: TicketPriority
  status?: TicketStatus
  assigneeId?: string
} 