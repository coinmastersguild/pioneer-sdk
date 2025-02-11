import { v4 as uuidv4 } from 'uuid'
import * as mocks from '../mocks'
import { CreateTicketInput, Ticket, UpdateTicketInput } from '../features/tickets/types'
import { getSession } from 'next-auth/react'

export const getTickets = async () => {
  const tickets = mocks.getTickets()
  return {
    tickets,
  }
}

export const getTicket = async (variables: { id: string }) => {
  if (!variables.id) {
    throw new Error('Invalid ticket id')
  }

  const ticket = mocks.getTicket(variables.id)

  if (!ticket) {
    throw new Error('Ticket not found')
  }

  return {
    ticket,
  }
}

export const createTicket = async (variables: CreateTicketInput) => {
  const session = await getSession()
  
  const ticket: Ticket = {
    id: uuidv4(),
    ...variables,
    status: 'open',
    createdBy: session?.user?.email || 'anonymous',
    createdAt: new Date().toISOString(),
  }

  mocks.addTicket(ticket)

  return {
    ticket,
  }
}

export const updateTicket = async (variables: UpdateTicketInput) => {
  const { id, ...updates } = variables

  const ticket = mocks.getTicket(id)

  if (!ticket) {
    throw new Error('Ticket not found')
  }

  const updatedTicket = {
    ...ticket,
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  mocks.updateTicket(updatedTicket)

  return {
    ticket: updatedTicket,
  }
} 