import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscriptions.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const checkSubscription = await Subscription.find({
    subscriber: req.user._id,
    channel: channelId,
  });

  if (checkSubscription) {
    await Subscription.findByIdAndDelete(checkSubscription._id);

    return res
      .status(200)
      .json(new ApiResponse(200, { isSubscribed: false }, "unsubscribed"));
  } else {
    await Subscription.create({
      subscriber: req.user_id,
      channel: channelId,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, { isSubscribed: true }, "subscribed"));
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const subscriber = await Subscription.aggregate([
    {
      $match: {
        channel: mongoose.Types.ObjectId(channelId),
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
        subscriber: "$subscribers[0]",
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
    .json(new ApiResponse(200, subscriber[0], "all subscriber"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  const subscribeTo = await Subscription.aggregate([
    {
      $match: {
        subscriber: mongoose.Types.ObjectId(subscriberId),
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
        subscribeTo: "$subscriberedTo[0]",
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
    .json(new ApiResponse(200, subscribeTo[0], "all subscription"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
