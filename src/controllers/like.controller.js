import { Like } from "../models/like.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const videoLike = await Like.find({ video: videoId, likedBy: req.user._id });

  if (videoLike) {
    const videoDislike = await Like.findByIdAndDelete(videoLike._id);
    if (!videoDislike) {
      throw new ApiError(500, "falied to dislike the video");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, false, "like status updated"));
  } else {
    const videoLiked = await Like.create({
      video: videoId,
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
  const { commentId } = req.params;

  const commentLike = await Like.find({
    comment: commentId,
    likedBy: req.user._id,
  });

  if (commentLike) {
    const dislike = await Like.findByIdAndDelete(commentLike._id);
    if (!dislike) {
      throw new ApiError(500, "failed to dislike this comment");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, false, "like status updated"));
  } else {
    const like = await Like.create({
      comment: commentId,
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
  const { tweetId } = req.params;

  const tweetLike = await Like.find({
    tweet: tweetId,
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
      tweet: tweetId,
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
        from: "users",
        localField: "video",
        foreignField: "_id",
        as: "likedVideos",
        pipeline: [
          {
            $project: {
              _id: 1,
              thumbnail: 1,
              title: 1,
              description: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        video: "$likedVideos[0]",
      },
    },
    {
      $project: {
        video: 1,
      },
    },
  ]);

  if(!likedVideos){
    throw new ApiError(500,"failed to get liked videos")
  }
  
  return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "liked video get successfully"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
