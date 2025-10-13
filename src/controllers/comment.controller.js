import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Comment } from "../models/comment.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.query;
  const { page = 1, limit = 10 } = req.query;

  const skipComment = (Number(page) - 1) * Number(limit);

  const videoComments = await Comment.aggregate([
    {
      $match:{
        video:new mongoose.Types.ObjectId(videoId)
      }
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
              userName:1,
              fullName:1
            }
          }
        ]
      }
    },
    {
      $lookup:{
        from:"likes",
        localField:"_id",
        foreignField:"comment",
        as:"commentlikes"
      }
    },
    {
      $addFields:{
        commentLikes:{$size:"$commentlikes"},
        owner:{ $arrayElemAt: ["$owner", 0] },
      }
    },
    {
      $project:{
        owner:1,
        commentLikes:1,
        content:1
      }
    },
    {
      $skip:skipComment
    },
    {
      $limit:Number(limit)
    }
  ])

  if(!videoComments){
    throw new ApiError(500,"faild to get video comments")
  }
  const totalComment = await Comment.countDocuments({ video: videoId });

  return res
    .status(200)
    .json(
      new ApiResponse(200, {
        currentPage: 1,
        totalPages: Math.ceil(totalComment / Number(limit)),
        comment:videoComments
      })
    );
});

const addComment = asyncHandler(async (req, res) => {
  const { content, videoId } = req.body;

  //check video exist or not
  const video=await Video.findById(new mongoose.Types.ObjectId(videoId))
  if(!video){
    throw new ApiError(404,"video not found")
  }

  if (!content) {
    throw new ApiError(400, "give the content in the comment");
  }
  
    const comment = await Comment.create({
      content,
      video: new mongoose.Types.ObjectId(videoId),
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

  const comment = await Comment.findById(new mongoose.Types.ObjectId(commentId));

  if (!comment) {
    throw new ApiError(400, "comment not found");
  }
  if (!comment.owner.equals(req.user._id)) {
    throw new ApiError(400, "you can not update this comment");
  }

  const updateComment = await Comment.findByIdAndUpdate(
    new mongoose.Types.ObjectId(commentId),
    { $set: { content } },
    { $new: true }
  );

  if(!updateComment){
    throw new ApiError(500,"falied to update this comment")
  }
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "cmment is updated"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.query;

  const comment = await Comment.findById(new mongoose.Types.ObjectId(commentId));
  if(!comment){
    throw new ApiError(500,"comment not found")
  }

  if (!comment.owner.equals(req.user._id)) {
    throw new ApiError(400, "you unable to delete this comment");
  }

  const deleteComment = await Comment.findByIdAndDelete(new mongoose.Types.ObjectId(commentId));
  if (!deleteComment) {
    throw new ApiError(500, "unable to delete this comment");
  }

  //delete like of deleted comment
  const deleteLikeInComment= await Like.deleteMany({comment:new mongoose.Types.ObjectId(commentId)})
  if(!deleteLikeInComment){
    throw new ApiError(500,"unable to delete this comment")
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
