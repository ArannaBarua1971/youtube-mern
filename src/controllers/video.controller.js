import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const deleteOnCloudinary = async (id) => {
  await cloudinary.v2.api
    .delete_resources(id)
    .then((result) => true)
    .catch((err) => false);
};

const getVideoById = asyncHandler(async (req, res) => {
  const videoId = req.params;

  if (!videoId) {
    throw new ApiError(404, "video not found");
  }

  //delete old one
  await User.findByIdAndUpdate(req.user._id, {
    $pull: {
      watchHistory: videoId,
    },
  });
  //update new one
  await User.findByIdAndUpdate(req.user._id, {
    $push: {
      watchHistory: videoId,
    },
  });

  const resData = await Video.aggregate([
    {
      $match: {
        _id: videoId,
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
              fullName: 1,
              avatar: 1,
            },
          },
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: "$owner[0]",
        isSubscribed: {
          $cond: {
            $if: { $in: [req.user._id, "$subscribers.subscriber"] },
            $then: true,
            $else: false,
          },
        },
      },
    },
    {
      $project: {
        videoFile: 1,
        Thumbnail: 1,
        owner: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        isSubscribed: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, resData[0], "video get successfully"));
});

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  let filter = {};
  let sortQurey;
  const skipVideo = (Number(page) - 1) * Number(limit);
  //get specific user video
  if (userId) {
    filter.owner = userId;
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


  const videoData=await Video.aggregate([
    {
      $match: filter
    },
    {
      $lookup:{
        from:"users",
        localField:"owner",
        foreignField:"_id",
        as:"owner",
        pipeline:[
          {
            $project:{
              avatar:1,
              username:1,
              fullName:1
            }
          }
        ]
      }
    },
    {
      $addFields:{
        owner:"$owner[0]"
      }
    }
    ,
    {
      $project:{
        _id:1,
        owner:1,
        videoFile:1,
        thumbnail:1,
        title:1
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
    throw new ApiError(50, "video and thumbnail file not able upload");
  }

  const uploadVideo = await Video.create({
    title,
    description,
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    owner: req.user._id,
    duration: thumbnail.duration,
  });
  if (!uploadVideo) {
    throw new ApiError(500, "video not avail to publish");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "video uploaded successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  //check video owner update video or not
  const video = await Video.findById(videoId);
  if (video.owner !== req.user._id) {
    throw new ApiError(400, "you are not able to update this video");
  }

  //delete video on cloudinary
  const deleteVideoOnCloudianry = await deleteOnCloudinary([video.videoFile]);
  if (!deleteOnCloudinary) {
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
  const {videoId} = req.params;

  //check video owner delete video or not
  const video = await Video.findById(videoId);
  if (video.owner !== req.user._id) {
    throw new ApiError(400, "you are not able to delete this video");
  }

  //delete video on cloudinary
  const deleteVideoOnCloudianry = await deleteOnCloudinary([
    video.videoFile,
    video.thumbnail,
  ]);
  if (!deleteOnCloudinary) {
    throw new ApiError(500, "failed to delete file from cloudianry");
  }

  //delete video from database
  const deleteVideo = await Video.deleteOne({ _id: videoId });
  if (!deleteVideo) {
    throw new ApiError(400, "unable to delete video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const {videoId} = req.params;

  //check video owner delete video or not
  const video = await Video.findById(videoId);
  if (video.owner !== req.user._id) {
    throw new ApiError(400, "you are not able to toggle this video status");
  }

  video.isPublised = !video.isPublised;
  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video.isPublised, "status of video is updated"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
