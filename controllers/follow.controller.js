import prisma from '../config/prisma.config.js';
import { MESSAGES } from '../constants/messages.js';
import { STATUS } from '../constants/statusCodes.js';

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
