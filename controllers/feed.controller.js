import prisma from '../config/prisma.config.js';
import { MESSAGES } from '../constants/messages.js';
import { STATUS } from '../constants/statusCodes.js';

// Home Feed (posts from followed users)
export const getHomeFeed = async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 5;
  const cursor = req.query.cursor; // post ID (or createdAt) of the last item in the previous page

  try {
    const queryOptions = {
      where: {
        userId: {
          not: userId, // exclude logged-in user's own posts
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // Fetch 1 extra to check if more exists
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        images: { select: { url: true } },
        _count: { select: { comments: true, likes: true } },
        likes: { where: { userId }, select: { id: true } },
        savedBy: { where: { userId }, select: { id: true } },
      },
    };

    if (cursor) {
      queryOptions.cursor = { id: cursor };
      queryOptions.skip = 1;
    }

    const posts = await prisma.post.findMany(queryOptions);

    const hasMore = posts.length > limit;
    if (hasMore) posts.pop(); // Remove extra item

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      content: post.content,
      createdAt: post.createdAt,
      user: post.user,
      images: post.images.map((img) => img.url),
      commentsCount: post._count.comments,
      likesCount: post._count.likes,
      isLikedByCurrentUser: post.likes.length > 0,
      isSavedByCurrentUser: post.savedBy.length > 0,
    }));

    res.status(200).json({
      success: true,
      posts: formattedPosts,
      nextCursor: hasMore ? posts[posts.length - 1].id : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: MESSAGES.COMMENT.SERVER_ERROR });
  }
};

// User Feed (all posts from a user by username)
export const getUserFeed = async (req, res) => {
  const { username } = req.params;
  const { skip = 0, take = 10 } = req.query;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      return res.status(STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.USER.USER_NOT_FOUND,
      });
    }

    const posts = await prisma.post.findMany({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        images: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: parseInt(skip),
      take: parseInt(take),
    });

    res.status(STATUS.OK).json({
      success: true,
      posts,
    });
  } catch (err) {
    console.error('User feed error:', err);
    res.status(STATUS.SERVER_ERROR).json({
      success: false,
      message: MESSAGES.COMMON.SERVER_ERROR,
    });
  }
};
