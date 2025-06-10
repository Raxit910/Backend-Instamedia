import { deleteFromCloudinary, getPublicIdFromUrl } from '../config/cloudinary.config.js';
import prisma from '../config/prisma.config.js';
import { MESSAGES } from '../constants/messages.js';
import { STATUS } from '../constants/statusCodes.js';

// Create Post
export const createPost = async (req, res) => {
  const userId = req.user.id;
  const { content } = req.body;
  const imageUrls = req.files?.map((file) => file.path) || [];

  try {
    const post = await prisma.post.create({
      data: {
        content,
        userId,
        images: {
          createMany: {
            data: imageUrls.map((url) => ({ url })),
          },
        },
      },
      include: {
        images: true,
      },
    });

    res.status(STATUS.CREATED).json({
      success: true,
      message: MESSAGES.POST.CREATED,
      post,
    });
  } catch (err) {
    console.error('Create post error:', err);
    res.status(STATUS.SERVER_ERROR).json({
      success: false,
      message: MESSAGES.COMMON.SERVER_ERROR,
    });
  }
};

// Get Posts by Username
export const getPostsByUsername = async (req, res) => {
  const { username } = req.params;

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
      orderBy: { createdAt: 'desc' },
      include: {
        images: true,
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });

    // console.log(posts)
    res.status(STATUS.OK).json({
      success: true,
      posts,
    });
  } catch (err) {
    console.error('Get user posts error:', err);
    res.status(STATUS.SERVER_ERROR).json({
      success: false,
      message: MESSAGES.COMMON.SERVER_ERROR,
    });
  }
};

// Get Single Post
export const getPostById = async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
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
    });

    if (!post) {
      return res.status(STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.POST.POST_NOT_FOUND,
      });
    }

    res.status(STATUS.OK).json({
      success: true,
      post,
    });
  } catch (err) {
    console.error('Get post error:', err);
    res.status(STATUS.SERVER_ERROR).json({
      success: false,
      message: MESSAGES.COMMON.SERVER_ERROR,
    });
  }
};

// Update Post
export const updatePost = async (req, res) => {
  const userId = req.user.id;
  const { postId } = req.params;
  const { content } = req.body;

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.authorId !== userId) {
      return res.status(STATUS.FORBIDDEN).json({
        success: false,
        message: MESSAGES.COMMON.UNAUTHORIZED,
      });
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { content },
    });

    res.status(STATUS.OK).json({
      success: true,
      message: MESSAGES.POST.POST_UPDATED,
      post: updatedPost,
    });
  } catch (err) {
    console.error('Update post error:', err);
    res.status(STATUS.SERVER_ERROR).json({
      success: false,
      message: MESSAGES.COMMON.SERVER_ERROR,
    });
  }
};

// Delete Post
export const deletePost = async (req, res) => {
  const userId = req.user.id;
  const { postId } = req.params;

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { images: true },
    });

    if (!post || post.userId !== userId) {
      return res.status(STATUS.FORBIDDEN).json({
        success: false,
        message: MESSAGES.COMMON.UNAUTHORIZED,
      });
    }

    // 1. Delete images from Cloudinary
    for (const image of post.images) {
      const publicId = getPublicIdFromUrl(image.url);
      if (publicId) await deleteFromCloudinary(publicId);
    }

    // 2. Delete images from Image table in DB
    await prisma.image.deleteMany({
      where: { postId },
    });

    // 3. Delete post from Post table
    await prisma.post.delete({
      where: { id: postId },
    });
    res.status(STATUS.OK).json({
      success: true,
      message: MESSAGES.POST.POST_DELETED,
    });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(STATUS.SERVER_ERROR).json({
      success: false,
      message: MESSAGES.COMMON.SERVER_ERROR,
    });
  }
};
