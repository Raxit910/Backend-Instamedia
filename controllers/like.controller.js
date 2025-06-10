import prisma from '../config/prisma.config.js';
import { MESSAGES } from '../constants/messages.js';
import { STATUS } from '../constants/statusCodes.js';

// Toggle Like / Unlike a post
export const toggleLike = async (req, res) => {
  const userId = req.user.id;
  const { postId } = req.params;

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      return res.status(STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.POST.POST_NOT_FOUND,
      });
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });

      return res.status(STATUS.OK).json({
        success: true,
        message: MESSAGES.POST.REMOVED_LIKE,
        isLiked: false,
      });
    }

    // Like
    await prisma.like.create({
      data: {
        userId,
        postId,
      },
    });

    res.status(STATUS.OK).json({
      success: true,
      message: MESSAGES.POST.ADDED_LIKE,
      isLiked: true,
    });
  } catch (err) {
    console.error('Toggle like error:', err);
    res.status(STATUS.SERVER_ERROR).json({
      success: false,
      message: MESSAGES.COMMON.SERVER_ERROR,
    });
  }
};

// Get all users who liked a post
export const getPostLikes = async (req, res) => {
  const { postId } = req.params;

  try {
    const likes = await prisma.like.findMany({
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
    });

    // console.log(likes);
    res.status(STATUS.OK).json({
      success: true,
      likes: likes.map((like) => like.user),
    });
  } catch (err) {
    console.error('Get post likes error:', err);
    res.status(STATUS.SERVER_ERROR).json({
      success: false,
      message: MESSAGES.COMMON.SERVER_ERROR,
    });
  }
};
