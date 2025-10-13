import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.query;

  //check video exist or not
  const video = await Video.findById(new mongoose.Types.ObjectId(videoId));
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const videoLike = await Like.find({
    video: new mongoose.Types.ObjectId(videoId),
    likedBy: req.user._id,
  });

  if (videoLike?.length) {
    const videoDislike = await Like.findByIdAndDelete(videoLike[0]._id);
    if (!videoDislike) {
      throw new ApiError(500, "falied to dislike the video");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, false, "like status updated"));
  } else {
    const videoLiked = await Like.create({
      video: new mongoose.Types.ObjectId(videoId),
      likedBy: req.user._id,
    });
    if (!videoLiked) {
      throw new ApiError(500, "falied to like the video");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, true, "like status updated"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.query;

  //check comment exist or not
  const comment = await Comment.findById(
    new mongoose.Types.ObjectId(commentId)
  );
  if (!comment) {
    throw new ApiError(404, "comment not found");
  }

  const commentLike = await Like.find({
    comment: new mongoose.Types.ObjectId(commentId),
    likedBy: req.user._id,
  });

  if (commentLike?.length) {
    const dislike = await Like.findByIdAndDelete(commentLike[0]._id);

    if (!dislike) {
      throw new ApiError(500, "failed to dislike this comment");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, false, "like status updated"));
  } else {
    const like = await Like.create({
      comment: new mongoose.Types.ObjectId(commentId),
      likedBy: req.user._id,
    });
    if (!like) {
      throw new ApiError(500, "failed to like this comment");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, true, "like status updated"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.query;

  const tweetLike = await Like.find({
    tweet: new mongoose.Types.ObjectId(tweetId),
    likedBy: req.user._id,
  });

  if (tweetLike) {
    const dislike = await Like.findByIdAndDelete(tweetLike._id);
    if (!dislike) {
      throw new ApiError(500, "failed to dislike this tweet");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, false, "like status updated"));
  } else {
    const like = await Like.create({
      tweet: new mongoose.Types.ObjectId(tweetId),
      likedBy: req.user._id,
    });
    if (!like) {
      throw new ApiError(500, "failed to dislike this tweet");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, true, "like status updated"));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: req.user._id,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideos",
        pipeline: [
          {
            $match: {
              isPublished: true,
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: { $arrayElemAt: ["$owner", 0] },
            },
          },
          {
            $project: {
              _id: 1,
              thumbnail: 1,
              title: 1,
              description: 1,
              owner: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        videos: "$likedVideos",
      },
    },
    {
      $project: {
        videos: 1,
      },
    },
  ]);

  if (!likedVideos) {
    throw new ApiError(500, "failed to get liked videos");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "liked video get successfully"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
