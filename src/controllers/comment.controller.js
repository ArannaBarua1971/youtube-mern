import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Comment } from "../models/comment.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const skipComment = (Number(page) - 1) * Number(limit);

  const videoComments = await Comment.aggregate([
    {
      $match:{
        video:mongoose.Types.ObjectId(videoId)
      }
    },
    {
      $lookup:{
        form:"users",
        localField:"owner",
        foreignField:"_id",
        as:"owner",
        pipeline:[
          {
            $project:{
              avatar:1,
              userName:1,
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
  ]).skip(skipComment).limit(Number(limit))

  const totalComment = await Comment.countDocuments({ video: videoId });

  return res
    .status(200)
    .json(
      new ApiResponse(200, {
        currentPage: 1,
        totalPages: Math.ceil(totalComment / Number(limit)),
        videoComments
      })
    );
});

const addComment = asyncHandler(async (req, res) => {
  const { content, videoId } = req.body;

  if (!content) {
    throw new ApiError(400, "give the content in the comment");
  }

  const comment = new Comment.create({
    content,
    video: videoId,
    owner: req.user._id,
  });

  if (!comment) {
    throw new ApiError(500, "unable to add comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "add comment successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { content, commentId } = req.body;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(400, "comment not found");
  }
  if (comment.owner !== req.user._id) {
    throw new ApiError(400, "you can not update this comment");
  }

  const updateComment = await Comment.findByIdAndUpdate(
    commentId,
    { $set: { content } },
    { $new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updateComment, "cmment is updated"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if (comment.owner !== req.user._id) {
    throw new ApiError(400, "you unable to delete this comment");
  }

  const deleteComment = await Comment.findByIdAndDelete(commentId);
  if (!deleteComment) {
    throw new ApiError(500, "unable to delete this comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "comment delete successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
