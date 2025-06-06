import { deleteFromCloudinary, getPublicIdFromUrl } from '../config/cloudinary.config.js';
import prisma from '../config/prisma.config.js';
import { MESSAGES } from '../constants/messages.js';
import { STATUS } from '../constants/statusCodes.js';

export const getUserProfile = async (req, res) => {
  const { username } = req.params;
  const currentUserId = req.user?.id; // From optional auth middleware

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
        // Check if current user follows this profile
        followers: currentUserId
          ? {
              where: { followerId: currentUserId },
              select: { id: true },
            }
          : false,
        posts: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            images: {
              select: {
                id: true,
                url: true,
              },
            },
            _count: {
              select: { likes: true, comments: true },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.USER.USER_NOT_FOUND,
      });
    }

    // Add helpful flags for frontend
    const isFollowing = user.followers && user.followers.length > 0;
    const isOwnProfile = currentUserId === user.id;

    res.status(STATUS.OK).json({
      success: true,
      user: {
        ...user,
        isFollowing,
        isOwnProfile,
        followers: undefined, // Remove the followers array from response
      },
    });
  } catch {
    res.status(STATUS.SERVER_ERROR).json({
      success: false,
      message: MESSAGES.COMMON.SERVER_ERROR,
    });
  }
};

export const updateUserProfile = async (req, res) => {
  const userId = req.user.id; // From auth middleware
  const { username, bio } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username && { username }),
        ...(bio !== undefined && { bio }), // Allow empty string
      },
      select: {
        id: true,
        username: true,
        bio: true,
        avatarUrl: true,
        updatedAt: true,
      },
    });

    res.status(STATUS.OK).json({
      success: true,
      message: MESSAGES.USER.PROFILE_UPDATED,
      user: updatedUser,
    });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.AUTH.USERNAME_EXISTS,
      });
    }

    res.status(STATUS.SERVER_ERROR).json({
      success: false,
      message: MESSAGES.COMMON.SERVER_ERROR,
    });
  }
};

// New avatar upload endpoint
export const uploadAvatar = async (req, res) => {
  const userId = req.user.id;

  try {
    if (!req.file) {
      return res.status(STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.USER.NO_IMAGE_PROVIDED,
      });
    }

    // Get current user to check if they have an existing avatar
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    // Delete old avatar from Cloudinary if exists
    if (currentUser.avatarUrl) {
      try {
        const publicId = getPublicIdFromUrl(currentUser.avatarUrl);
        if (publicId) {
          await deleteFromCloudinary(publicId);
        }
      } catch (deleteError) {
        console.error('Error deleting old avatar:', deleteError);
        // Continue with upload even if delete fails
      }
    }

    // Update user with new avatar URL
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: req.file.path }, // Cloudinary URL
      select: {
        id: true,
        username: true,
        bio: true,
        avatarUrl: true,
        updatedAt: true,
      },
    });

    res.status(STATUS.OK).json({
      success: true,
      message: MESSAGES.USER.AVATAR_UPDATED,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(STATUS.SERVER_ERROR).json({
      success: false,
      message: MESSAGES.COMMON.SERVER_ERROR,
    });
  }
};

export const toggleFollowUser = async (req, res) => {
  const followerId = req.user.id;
  const { targetUserId } = req.params;

  if (followerId === targetUserId) {
    return res.status(STATUS.BAD_REQUEST).json({
      success: false,
      message: MESSAGES.USER.CANNOT_FOLLOW_SELF,
    });
  }

  try {
    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!targetUser) {
      return res.status(STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.USER.USER_NOT_FOUND,
      });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId: targetUserId,
          },
        },
      });

      return res.status(STATUS.OK).json({
        success: true,
        message: MESSAGES.USER.UNFOLLOW_SUCCESS,
        isFollowing: false,
      });
    }

    await prisma.follow.create({
      data: {
        followerId,
        followingId: targetUserId,
      },
    });

    res.status(STATUS.OK).json({
      success: true,
      message: MESSAGES.USER.FOLLOW_SUCCESS,
      isFollowing: true,
    });
  } catch {
    res.status(STATUS.SERVER_ERROR).json({
      success: false,
      message: MESSAGES.COMMON.SERVER_ERROR,
    });
  }
};

export const getFollowers = async (req, res) => {
  const { userId } = req.params;

  try {
    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(STATUS.OK).json({
      success: true,
      followers: followers.map((f) => f.follower),
    });
  } catch {
    res.status(STATUS.SERVER_ERROR).json({
      success: false,
      message: MESSAGES.COMMON.SERVER_ERROR,
    });
  }
};

export const getFollowing = async (req, res) => {
  const { userId } = req.params;

  try {
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(STATUS.OK).json({
      success: true,
      following: following.map((f) => f.following),
    });
  } catch {
    res.status(STATUS.SERVER_ERROR).json({
      success: false,
      message: MESSAGES.COMMON.SERVER_ERROR,
    });
  }
};

export const searchUsers = async (req, res) => {
  const { query = '', skip = 0, take = 10 } = req.query;
  const currentUserId = req.user?.id;

  // console.log('Search Users - Current User ID:', currentUserId);
  // console.log('Search Query:', query);

  try {
    // First, get the users
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              {
                username: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                bio: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        bio: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },
      skip: parseInt(skip),
      take: parseInt(take),
      orderBy: { username: 'asc' },
    });

    // If user is authenticated, check which users they're following
    let followingIds = [];
    if (currentUserId && users.length > 0) {
      const userIds = users.map((user) => user.id);
      const followRelations = await prisma.follow.findMany({
        where: {
          followerId: currentUserId,
          followingId: { in: userIds },
        },
        select: {
          followingId: true,
        },
      });
      followingIds = followRelations.map((f) => f.followingId);
      // console.log('Following IDs:', followingIds);
    }

    // Add isFollowing flag to each user
    const usersWithFollowStatus = users.map((user) => ({
      ...user,
      isFollowing: followingIds.includes(user.id),
    }));

    // console.log('Final users with follow status:', usersWithFollowStatus.map(u => ({
    //   username: u.username,
    //   id: u.id,
    //   isFollowing: u.isFollowing
    // })));

    const totalCount = await prisma.user.count({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              {
                username: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                bio: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
            ],
          },
        ],
      },
    });

    res.status(STATUS.OK).json({
      success: true,
      users: usersWithFollowStatus,
      totalCount,
      hasMore: parseInt(skip) + parseInt(take) < totalCount,
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(STATUS.SERVER_ERROR).json({
      success: false,
      message: MESSAGES.COMMON.SERVER_ERROR,
    });
  }
};

export const getUserPreviewById = async (req, res) => {
  const { username } = req.params;
  const currentUserId = req.user?.id;

  try {
    const user = await prisma.user.findUnique({
      where: { username: username },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
        following: currentUserId
          ? {
              where: { followerId: currentUserId },
              select: { id: true },
            }
          : false,
      },
    });

    if (!user) {
      return res.status(STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.USER.USER_NOT_FOUND,
      });
    }

    const isFollowing = user.following && user.following.length > 0;

    res.status(STATUS.OK).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        followersCount: user._count.followers,
        followingCount: user._count.following,
        postCount: user._count.posts,
        isFollowing,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('getUserPreviewById error:', error);
    res.status(STATUS.SERVER_ERROR).json({
      success: false,
      message: MESSAGES.COMMON.SERVER_ERROR,
    });
  }
};
