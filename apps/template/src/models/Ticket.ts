import mongoose from 'mongoose';

export interface ITicket {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: string;
  assigneeId?: string;
  createdBy: string;
  email?: string;
  createdAt: string;
  updatedAt?: string;
}

const ticketSchema = new mongoose.Schema<ITicket>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      default: 'open',
    },
    assigneeId: String,
    createdBy: {
      type: String,
      required: true,
    },
    email: String,
    createdAt: {
      type: String,
      required: true,
    },
    updatedAt: String,
  },
  {
    timestamps: true,
  }
);

// This function ensures we have a valid model even if it wasn't ready at first import
export function getTicketModel() {
  // Try to get the existing model first
  if (mongoose.models && mongoose.models.Ticket) {
    return mongoose.models.Ticket as mongoose.Model<ITicket>;
  }

  // If no existing model and mongoose is connected, create a new one
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    return mongoose.model<ITicket>('Ticket', ticketSchema);
  }

  // If mongoose isn't connected yet, create the model without checking connection
  return mongoose.model<ITicket>('Ticket', ticketSchema);
} 