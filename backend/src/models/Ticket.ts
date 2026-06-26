import { DataTypes, Model, Sequelize, Optional } from 'sequelize';

interface TicketAttributes {
  id: string;
  ticketNumber: string;
  userId: string;
  type: 'general' | 'technical' | 'billing' | 'feature-request' | 'bug-report' | 'other';
  subject: string;
  message: string;
  status: 'received' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TicketCreationAttributes extends Optional<TicketAttributes, 'id' | 'ticketNumber' | 'status' | 'createdAt' | 'updatedAt'> {}

class Ticket extends Model<TicketAttributes, TicketCreationAttributes> implements TicketAttributes {
  public id!: string;
  public ticketNumber!: string;
  public userId!: string;
  public type!: 'general' | 'technical' | 'billing' | 'feature-request' | 'bug-report' | 'other';
  public subject!: string;
  public message!: string;
  public status!: 'received' | 'in-progress' | 'resolved' | 'closed';
  public priority!: 'low' | 'medium' | 'high' | 'urgent';
  public adminNotes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initModel = (sequelize: Sequelize) => {
  Ticket.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      ticketNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      type: {
        type: DataTypes.ENUM('general', 'technical', 'billing', 'feature-request', 'bug-report', 'other'),
        allowNull: false,
        defaultValue: 'general',
      },
      subject: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('received', 'in-progress', 'resolved', 'closed'),
        allowNull: false,
        defaultValue: 'received',
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium',
      },
      adminNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'Ticket',
      tableName: 'tickets',
      timestamps: true,
    }
  );
  return Ticket;
};

export default Ticket;

