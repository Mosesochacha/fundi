import { Response } from 'express';
import { Op } from 'sequelize';
import { AuthenticatedRequest } from '../middleware/verifyJWT';
import db from '../models';
import { sendSuccess, sendError, asyncHandler } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';
import { getIo } from '../middleware/websocket';

const SENDER_ATTRS = ['id', 'fullName', 'avatarUrl', 'username'];

class MessagesController {
  getConversations = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profileId = req.user?.profileId;
    if (!profileId) return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');

    const conversations = await (db as any).Conversation.findAll({
      where: {
        [Op.or]: [{ participant1Id: profileId }, { participant2Id: profileId }],
      },
      include: [
        { model: db.Profile, as: 'participant1', attributes: SENDER_ATTRS },
        { model: db.Profile, as: 'participant2', attributes: SENDER_ATTRS },
        {
          model: (db as any).Message,
          as: 'messages',
          limit: 1,
          order: [['createdAt', 'DESC']],
          attributes: ['id', 'content', 'senderId', 'readAt', 'createdAt'],
        },
      ],
      order: [['lastMessageAt', 'DESC NULLS LAST']],
    });

    const result = await Promise.all(
      (conversations as any[]).map(async (conv) => {
        const c = conv.get({ plain: true });
        const other = c.participant1Id === profileId ? c.participant2 : c.participant1;
        const lastMessage = c.messages?.[0] ?? null;
        const unreadCount = await (db as any).Message.count({
          where: { conversationId: c.id, senderId: { [Op.ne]: profileId }, readAt: null },
        });
        return { ...c, other, lastMessage, unreadCount };
      })
    );

    return sendSuccess(res, 'Conversations retrieved', result);
  });

  getMessages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profileId = req.user?.profileId;
    if (!profileId) return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    const { conversationId } = req.params;

    const conv: any = await (db as any).Conversation.findByPk(conversationId);
    if (!conv) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Conversation not found');
    if (conv.participant1Id !== profileId && conv.participant2Id !== profileId) {
      return sendError(res, HTTP_STATUS.FORBIDDEN, 'Not a participant');
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 40;
    const offset = (page - 1) * limit;

    const messages = await (db as any).Message.findAll({
      where: { conversationId },
      include: [{ model: db.Profile, as: 'sender', attributes: SENDER_ATTRS }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    // Mark unread messages from other party as read
    await (db as any).Message.update(
      { readAt: new Date() },
      { where: { conversationId, senderId: { [Op.ne]: profileId }, readAt: null } }
    );

    return sendSuccess(res, 'Messages retrieved', messages.reverse().map((m: any) => m.get({ plain: true })));
  });

  sendMessage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profileId = req.user?.profileId;
    if (!profileId) return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');

    const { recipientId, content, conversationId: existingConvId } = req.body;

    if (!content?.trim()) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Message content is required');
    if (content.trim().length > 2000) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Message too long');

    let conv: any;

    if (existingConvId) {
      conv = await (db as any).Conversation.findByPk(existingConvId);
      if (!conv || (conv.participant1Id !== profileId && conv.participant2Id !== profileId)) {
        return sendError(res, HTTP_STATUS.FORBIDDEN, 'Not a participant');
      }
    } else {
      if (!recipientId) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'recipientId is required');
      if (recipientId === profileId) return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Cannot message yourself');

      const recipient = await db.Profile.findByPk(recipientId);
      if (!recipient) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Recipient not found');

      // Find or create conversation (participants stored in canonical order)
      const [p1, p2] = [profileId, recipientId].sort();
      const [created] = await (db as any).Conversation.findOrCreate({
        where: { participant1Id: p1, participant2Id: p2 },
        defaults: { participant1Id: p1, participant2Id: p2 },
      });
      conv = created;
    }

    const message = await (db as any).Message.create({
      conversationId: conv.id,
      senderId: profileId,
      content: content.trim(),
    });

    await conv.update({ lastMessageAt: new Date() });

    const fullMessage = await (db as any).Message.findByPk(message.id, {
      include: [{ model: db.Profile, as: 'sender', attributes: SENDER_ATTRS }],
    });

    const plain = fullMessage.get({ plain: true });

    // Emit to other participant's room via Socket.IO
    const io = getIo();
    if (io) {
      const otherProfileId = conv.participant1Id === profileId ? conv.participant2Id : conv.participant1Id;
      const otherProfile = await db.Profile.findByPk(otherProfileId, { attributes: ['userId'] });
      if (otherProfile) {
        io.to(String((otherProfile as any).userId)).emit('new_message', {
          conversationId: conv.id,
          message: plain,
        });
      }
    }

    return sendSuccess(res, 'Message sent', { conversationId: conv.id, message: plain });
  });

  markRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profileId = req.user?.profileId;
    if (!profileId) return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    const { conversationId } = req.params;

    await (db as any).Message.update(
      { readAt: new Date() },
      { where: { conversationId, senderId: { [Op.ne]: profileId }, readAt: null } }
    );

    return sendSuccess(res, 'Marked as read');
  });
}

export default new MessagesController();
