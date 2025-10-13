import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscriptions.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  const videoStats = await Video.aggregate([
    {
      $match: {
        owner: mongoose.Types.ObjectId(req.user_id),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
      },
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: { $ifNull: ["$views", 0] } },
        totalLikes: { $sum: { $ifNull: ["$likesCount", 0] } },
        totalVideos: { $sum: 1 }, //count all documents only one time
      },
    },
  ]);

  const tweetStats = await Tweet.aggregate([
    {
      $match: {
        owner: req.user._id,
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "tweetLikes",
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$tweetLikes",
        },
      },
    },
    {
      $group: {
        _id: null,
        totalLikes: { $sum: { $ifNull: ["$likesCount", 0] } },
      },
    },
  ]);

  const totalSubscriber = await Subscription.countDocuments({
    channel: req.user._id,
  });

  if (!videoStats || !tweetStats || !totalSubscriber) {
    throw new ApiError(500, "failed to get data");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videoStats: videoStats[0],
        tweetStats: tweetStats[0],
        totalSubscriber: totalSubscriber[0],
      },
      "all data get successfully"
    )
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
    
   const { page = 1, limit = 10, query, sortBy, sortType } = req.query;

  let filter = {owner:req.user._id};
  let sortQurey;
  const skipVideo = (Number(page) - 1) * Number(limit);

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


  const videoData=await Video.aggregate([
    {
      $match: filter
    },
    {
      $project:{
        _id:1,
        videoFile:1,
        thumbnail:1,
        title:1,
        isPublished:1
      }
    },
    {
      $sort:sortQurey
    },
    {
      $skip:skipVideo
    },
    {
      $limit:Number(limit)
    }
  ])

  const totalVideo = await Video.countDocuments(filter);

  return (
    res.status(200),
    json(
      new ApiResponse(
        200,
        {
          video:videoData[0],
          currentPage: Number(page),
          totalPages: Math.ceil(totalVideo / Number(limit)),
        },
        "video get succesfully"
      )
    )
  );
});

export { getChannelStats, getChannelVideos };
