import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscriptions.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.query;

  //check channel exist or not
  const channel = await User.findById(new mongoose.Types.ObjectId(channelId));
  if (!channel) {
    throw new ApiError(404, "channel not found");
  }

  //check channel owner and user same or not
  if (req.user._id.equals(new mongoose.Types.ObjectId(channelId))) {
    throw new ApiError(400, "channel owner and user same");
  }

  const checkSubscription = await Subscription.find({
    subscriber: req.user._id,
    channel: new mongoose.Types.ObjectId(channelId),
  });

  console.log(checkSubscription);
  if (checkSubscription?.length) {
    const unsubscribe = await Subscription.findByIdAndDelete(
      checkSubscription[0]._id
    );
    if (!unsubscribe) {
      throw new ApiError(500, "failed to unsubscribe the channel");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { isSubscribed: false }, "unsubscribed"));
  } else {
    const subscribe = await Subscription.create({
      subscriber: req.user._id,
      channel: new mongoose.Types.ObjectId(channelId),
    });
    if (!subscribe) {
      throw new ApiError(500, "failed to subscribe the channel");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { isSubscribed: true }, "subscribed"));
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {

    //check channel exist or not
  const channel = await User.findById(req.user._id);
  if (!channel) {
    throw new ApiError(404, "channel not found");
  }

  const subscriber = await Subscription.aggregate([
    {
      $match: {
        channel: req.user._id,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscribers",
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
      $addFields: {
        subscriber: { $arrayElemAt: ["$subscribers", 0] },
      },
    },
    {
      $project: {
        subscriber: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, subscriber, "all subscriber"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.query;

  const subscribeTo = await Subscription.aggregate([
    {
      $match: {
        subscriber:new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribeTo",
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
      $addFields: {
        subscribeTo: { $arrayElemAt: ["$subscribeTo", 0] },
      },
    },
    {
      $project: {
        subscribeTo: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, subscribeTo, "all subscription"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
