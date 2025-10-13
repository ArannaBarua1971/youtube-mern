import { Tweet } from "../models/tweet.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  const tweet = await Tweet.create({
    content,
    owner: req.user._id,
  });

  if (!tweet) {
    throw new ApiError(500, "failed to create tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.query;
  //check user exist or not
  if (userId) {
    const user = await User.findById(new mongoose.Types.ObjectId(userId));
    if (!user) {
      throw new ApiError(404, "user not found");
    }
  }
  console.log(userId);

  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: userId ? new mongoose.Types.ObjectId(userId) : req.user._id,
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
              avatar: 1,
              fullName: 1,
            },
          },
        ],
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
        tweetLikes: { $size: "$tweetLikes" },
        owner: { $arrayElemAt: ["$owner", 0] },
      },
    },
  ]);

  if (!tweets) {
    throw new ApiError(500, "failed to get user tweets");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "tweets are successfully get"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { content, tweetId } = req.body;

  const tweet = await Tweet.findById(new mongoose.Types.ObjectId(tweetId));
  if (!tweet) {
    throw new ApiError(500, "tweet not found");
  }

  if (!tweet.owner.equals(req.user._id)) {
    throw new ApiError(400, "you are not able to update this video");
  }

  const updateTweet = await Tweet.findByIdAndUpdate(
    new mongoose.Types.ObjectId(tweetId),
    {
      $set: { content },
    }
  );
  if (!updateTweet) {
    throw new ApiError(500, "failed to delete this tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.query;

  const tweet = await Tweet.findById(new mongoose.Types.ObjectId(tweetId));
  if (!tweet) {
    throw new ApiError(500, "tweet not found");
  }

  if (!tweet.owner.equals(req.user._id)) {
    throw new ApiError(400, "you are not able to delete this video");
  }

  const deleteTweet = await Tweet.findByIdAndDelete(
    new mongoose.Types.ObjectId(tweetId)
  );
  if (!deleteTweet) {
    throw new ApiError(500, "failed to delete this tweet");
  }

  //delete all tweet like
  const deleteTweetLikes = await Like.deleteMany({
    tweet: new mongoose.Types.ObjectId(tweetId),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
