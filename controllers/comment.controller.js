import prisma from '../config/prisma.config.js';
import { MESSAGES } from '../constants/messages.js';
import { STATUS } from '../constants/statusCodes.js';

// Add a comment to a post
export const addComment = async (req, res) => {
  const userId = req.user.id;
  const { postId } = req.params;
  const { content } = req.body;

  if (!content || content.trim() === '') {
    return res.status(STATUS.BAD_REQUEST).json({
      success: false,
      message: MESSAGES.COMMENT.EMPTY_COMMENT,
    });
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.POST.POST_NOT_FOUND,
      });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        userId,
        postId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    // console.log(comment);

    res.status(STATUS.CREATED).json({
      success: true,
      message: MESSAGES.COMMENT.COMMENT_ADDED,
      comment,
    });
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(STATUS.SERVER_ERROR).json({
      success: false,
      message: MESSAGES.COMMON.SERVER_ERROR,
    });
  }
};

// Get comments for a post
export const getPostComments = async (req, res) => {
  const { postId } = req.params;

  try {
    const comments = await prisma.comment.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(STATUS.OK).json({
      success: true,
      comments,
    });
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(STATUS.SERVER_ERROR).json({
      success: false,
      message: MESSAGES.COMMON.SERVER_ERROR,
    });
  }
};

// Delete a comment (only owner or post owner can delete)
export const deleteComment = async (req, res) => {
  const userId = req.user.id;
  const { commentId } = req.params;

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        user: true,
        post: {
          select: { userId: true },
        },
      },
    });

    if (!comment) {
      return res.status(STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.COMMENT.COMMENT_NOT_FOUND,
      });
    }

    const isCommentOwner = comment.userId === userId;
    const isPostOwner = comment.post.userId === userId;

    if (!isCommentOwner && !isPostOwner) {
      return res.status(STATUS.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.COMMON.UNAUTHORIZED,
      });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    res.status(STATUS.OK).json({
      success: true,
      message: MESSAGES.COMMENT.COMMENT_DELETED,
    });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(STATUS.SERVER_ERROR).json({
      success: false,
      message: MESSAGES.COMMON.SERVER_ERROR,
    });
  }
};
