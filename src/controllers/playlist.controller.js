import mongoose from "mongoose";
import { PlayList } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const createdPlaylist = await PlayList.create({
    name,
    description,
    owner: req.user._id,
  });

  if (!createdPlaylist) {
    throw new ApiError(500, "unable to create palylist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.query;

  const user = await User.findById(new mongoose.Types.ObjectId(userId));
  if (!user) {
    throw new ApiError(404, "user id not found");
  }

  const playlist = await PlayList.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $project:{
        _id:1,
        name:1,
        description:1,
        createdAt:1,
        updatedAt:1
      }
    }
  ]);

  if (!playlist) {
    throw new ApiError(404, "playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist get successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.query;

  const playlistExistenceCheck=await PlayList.findById(new mongoose.Types.ObjectId(playlistId))
  if (!playlistExistenceCheck) {
    throw new ApiError(404, "playlist not found");
  }

  const playlist = await PlayList.aggregate([
    {
      $match: {
        _id:new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "playlistVideos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "videoOwner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    avatar: 1,
                    fullName:1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner:{ $arrayElemAt:["$videoOwner",0]},
            },
          },
          {
            $project: {
              _id: 1,
              thumbnail: 1,
              title: 1,
              description:1,
              owner: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "playlistOwner",
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
        owner: { $arrayElemAt:["$playlistOwner",0]},
        videos: "$playlistVideos",
      },
    },
    {
      $project:{
        name:1,
        description:1,
        owner:1,
        videos:1
      }
    }
  ]);

  if (!playlist) {
    throw new ApiError(404, "playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist[0], "playlist get successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.body;

  const checkPlaylist = await PlayList.findById(
    new mongoose.Types.ObjectId(playlistId)
  );
  const checkVideo = await Video.findById(new mongoose.Types.ObjectId(videoId));

  if (!checkPlaylist || !checkVideo) {
    throw new ApiError(404, "play list or video not found");
  }

  if (!checkPlaylist.owner.equals(req.user._id)) {
    throw new ApiError(400, "you are not able to add video in this playlist");
  }

  const addVideoInPlaylist = await PlayList.findByIdAndUpdate(
    new mongoose.Types.ObjectId(playlistId),
    {
      $push: {
        videos: new mongoose.Types.ObjectId(videoId),
      },
    }
  );

  if (!addVideoInPlaylist) {
    throw new ApiError(500, "failed to add video in this playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "video added successfully"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.body;

  const checkPlaylist = await PlayList.findById(new mongoose.Types.ObjectId(playlistId));
  const checkVideo = await Video.findById(new mongoose.Types.ObjectId(videoId));

  if (!checkPlaylist || !checkVideo) {
    throw new ApiError(404, "play list or video not found");
  }

  if (!checkPlaylist.owner.equals(req.user._id) ){
    throw new ApiError(400, "you are not able to add video in this playlist");
  }

  const deleteVideoFromPlaylist = await PlayList.findByIdAndUpdate(new mongoose.Types.ObjectId(playlistId), {
    $pull: {
      videos: new mongoose.Types.ObjectId(videoId),
    },
  });

  if (!deleteVideoFromPlaylist) {
    throw new ApiError(500, "failed to delete this video from this playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "video deleted successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.query;
  const checkPlaylist = await PlayList.findById(new mongoose.Types.ObjectId(playlistId));

  if (!checkPlaylist) {
    throw new ApiError(404, "play list  not found");
  }

  if (!checkPlaylist.owner.equals(req.user._id)){
    throw new ApiError(400, "you are not able to add video in this playlist");
  }

  const deletePlaylist = await PlayList.findByIdAndDelete(new mongoose.Types.ObjectId(playlistId));

  if (!deletePlaylist) {
    throw new ApiError(500, "failed to delete this playlist");
  }

  return res.status(200).json(new ApiResponse(200, {}, "playlist is deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.query;
  const { name, description } = req.body;

  const checkPlaylist = await PlayList.findById(new mongoose.Types.ObjectId(playlistId));

  if (!checkPlaylist) {
    throw new ApiError(404, "play list  not found");
  }

  if (!checkPlaylist.owner.equals(req.user._id)) {
    throw new ApiError(400, "you are not able to add video in this playlist");
  }

  const updatePlaylist = await PlayList.findByIdAndUpdate(new mongoose.Types.ObjectId(playlistId), {
    $set: {
      name,
      description,
    },
  });

  if (!updatePlaylist) {
    throw new ApiError(500, "failed to update this playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "playlist updated successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
