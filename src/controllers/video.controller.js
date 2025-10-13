import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { Like } from "../models/like.model.js";

const deleteOnCloudinary = async (files) => {//FIXME: it is not working
  const deleteFile = await cloudinary.api.delete_resources(files);

  if (!deleteFile) {
    throw new ApiError(500, "failed to delete file in cloudinary");
  }
  return true;
};

const getVideoById = asyncHandler(async (req, res) => {
  const videoId = req.params;

  if (!videoId) {
    throw new ApiError(404, "video not found");
  }

  //check video published or not
  const video = await Video.findById(new mongoose.Types.ObjectId(videoId));
  if (!video.isPublished && !video.owner.equals(req.user._id)) {
    throw new ApiError(404, "video not found anymore");
  }

  //delete old one
  await User.findByIdAndUpdate(req.user._id, {
    $pull: {
      watchHistory: new mongoose.Types.ObjectId(videoId),
    },
  });
  //update new one
  await User.findByIdAndUpdate(req.user._id, {
    $push: {
      watchHistory: new mongoose.Types.ObjectId(videoId),
    },
  });

  const resData = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
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
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscribers: {
                $size: "$subscribers",
              },
            },
          },
          {
            $project: {
              fullName: 1,
              avatar: 1,
              username: 1,
              subscribers: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "videolikes",
      },
    },
    {
      $addFields: {
        videoLikes: { $size: "$videolikes" },
        owner: { $arrayElemAt: ["$owner", 0] },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user._id, "$owner.subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        owner: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        isSubscribed: 1,
        videoLikes: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, resData[0], "video get successfully"));
});

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  let filter = { isPublished: true };
  let sortQurey = {};
  const skipVideo = (Number(page) - 1) * Number(limit);
  //get specific user video
  if (userId) {
    filter.owner = new mongoose.Types.ObjectId(userId);
  }

  //if given query
  if (query) {
    filter.$or = [
      { title: { $regax: query, $options: "i" } },
      { description: { $regax: query, $options: "i" } },
    ];
  }

  if (sortBy && sortType) {
    sortQurey = { sortBy: sortType === "asc" ? 1 : -1 };
  }

  const videoData = await Video.aggregate([
    {
      $match: filter,
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
              avatar: 1,
              username: 1,
              fullName: 1,
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
        owner: 1,
        videoFile: 1,
        thumbnail: 1,
        title: 1,
      },
    },
    {
      $sort: sortQurey,
    },
    {
      $skip: skipVideo,
    },
    {
      $limit: Number(limit),
    },
  ]);

  const totalVideo = await Video.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        video: videoData,
        currentPage: Number(page),
        totalPages: Math.ceil(totalVideo / Number(limit)),
      },
      "video get succesfully"
    )
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title) {
    throw new ApiError(400, "Give video title");
  }

  //get video and thumbnail file path
  const videoLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  if (!videoLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "video and thumbnail file requried");
  }

  //upload in cloudinary
  const videoFile = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!videoFile || !thumbnail) {
    throw new ApiError(500, "video and thumbnail file not able upload");
  }
  const uploadVideo = await Video.create({
    title,
    description,
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    owner: req.user._id,
    duration: videoFile.duration,
  });
  if (!uploadVideo) {
    throw new ApiError(500, "video not avail to publish");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "video uploaded successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.query;
  //check video owner update video or not
  const video = await Video.findById(new mongoose.Types.ObjectId(videoId));
  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(400, "you are not able to update this video");
  }

  //delete video on cloudinary
  const deleteVideoOnCloudianry = await deleteOnCloudinary([video.videoFile]);
  if (!deleteVideoOnCloudianry) {
    throw new ApiError(500, "failed to delete file from cloudianry");
  }

  const videoLocalPath = req.file?.path;
  const uploadVideoOnCloudinary = await uploadOnCloudinary(videoLocalPath);

  if (!uploadOnCloudinary) {
    throw new ApiError(500, "Failed to upload on cloudinary");
  }

  //delete video from database
  const updateVideo = await Video.findByIdAndUpdate(videoId, {
    $set: { videoFile: uploadVideoOnCloudinary.url },
  });

  if (!updateVideo) {
    throw new ApiError(500, "unable to update video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.query;

  //check video owner delete video or not
  const video = await Video.findById(new mongoose.Types.ObjectId(videoId));
  if (!video) {
    throw new ApiError(404, "video not found");
  }
  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(400, "you are not able to delete this video");
  }

  //delete video on cloudinary
  const deleteVideoOnCloudianry = await deleteOnCloudinary([
    video.videoFile,
    video.thumbnail,
  ]);
  if (!deleteVideoOnCloudianry) {
    throw new ApiError(500, "failed to delete file from cloudianry");
  }

  //delete video from database
  const deleteVideo = await Video.deleteOne({
    _id: new mongoose.Types.ObjectId(videoId),
  });
  if (!deleteVideo) {
    throw new ApiError(400, "unable to delete video");
  }


  //delete video related comments
  const deleteComment = await Comment.deleteMany({
    video: new mongoose.Types.ObjectId(videoId),
  });

  if (!deleteComment) {
    throw new ApiError(400, "unable to delete video comment");
  }

    // 1️⃣ Find all comments of this video
  const comments = await Comment.find({
    video: new mongoose.Types.ObjectId(videoId),
  });
  const commentIds = comments.map((c) => c._id);

  // 2️⃣ Delete all likes related to these comments
  const deleteCommentLikes = await Like.deleteMany({
    comment: { $in: commentIds },
  });

  if (!deleteCommentLikes) {
    throw new ApiError(400, "unable to delete video comment likes");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.query;

  //check video owner delete video or not
  const video = await Video.findById(new mongoose.Types.ObjectId(videoId));
  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(400, "you are not able to toggle this video status");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video.isPublished, "status of video is updated"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
