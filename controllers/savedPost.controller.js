import prisma from '../config/prisma.config.js';
import { MESSAGES } from '../constants/messages.js';
import { STATUS } from '../constants/statusCodes.js';

// Toggle save/unsave post
export const toggleSavePost = async (req, res) => {
  const userId = req.user.id;
  const { postId } = req.params;

  try {
    const existingSave = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingSave) {
      // Unsave the post
      await prisma.savedPost.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });

      return res.status(STATUS.OK).json({
        success: true,
        message: MESSAGES.POST.UNSAVED_POST_SUCCESS,
        isSaved: false,
      });
    }

    // Save the post
    await prisma.savedPost.create({
      data: {
        userId,
        postId,
      },
    });

    res.status(STATUS.OK).json({
      success: true,
      message: MESSAGES.POST.SAVED_POST_SUCCESS,
      isSaved: true,
    });
  } catch (error) {
    console.error('toggleSavePost error:', error);
    res.status(STATUS.SERVER_ERROR).json({
      success: false,
      message: MESSAGES.COMMON.SERVER_ERROR,
    });
  }
};

// Get all saved posts for the current user
export const getSavedPosts = async (req, res) => {
  const userId = req.user.id;

  try {
    const savedPosts = await prisma.savedPost.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            images: { select: { id: true, url: true } },
            user: { select: { id: true, username: true, avatarUrl: true } },
            likes: { where: { userId }, select: { id: true } }, // to check if user liked
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedPosts = savedPosts.map(({ post }) => ({
      id: post.id,
      content: post.content,
      createdAt: post.createdAt,
      user: post.user,
      images: post.images.map((img) => img.url),
      commentsCount: post._count.comments,
      likesCount: post._count.likes,
      isLikedByCurrentUser: post.likes.length > 0,
      isSavedByCurrentUser: true, // always true from this route
    }));

    res.status(STATUS.OK).json({
      success: true,
      posts: formattedPosts,
    });
  } catch (error) {
    console.error('getSavedPosts error:', error);
    res.status(STATUS.SERVER_ERROR).json({
      success: false,
      message: MESSAGES.COMMON.SERVER_ERROR,
    });
  }
};
