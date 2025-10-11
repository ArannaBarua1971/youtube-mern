import { Tweet } from "../models/tweet.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  const tweet = await Tweet.create({
    content,
    owner: req.user._id,
  });

  if (!tweet) {
    throw new ApiError(500, "unable to create tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const tweets=await Tweet.aggregate([
    {
        $match:{
            owner:req.user._id
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
                        username:1,
                        avatar:1,
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
  ])

  if(!tweets){
    //FIXME:
    throw new ApiError(500,"failed to get user tweets")
  }

  return res.status(200).json(200,tweets,"tweets are successfully get")
 
});

const updateTweet = asyncHandler(async (req, res) => {
  const {content,tweetId}=req.body

  const tweet=await Tweet.findById(tweetId)
  if(!tweet){
    throw new ApiError(500,"tweet not found")
  }

  if(tweet.owner!==req.user._id){
    throw new ApiError(400,"you are not able to update this video")
  }

  const updateTweet=await Tweet.findByIdAndUpdate(
    tweetId,
    {
        $set:{content}
    }
  )
  if(!updateTweet){
    throw new ApiError(500,"failed to delete this tweet")
  }

  return res.status(200).json(new ApiResponse(200,{},"tweet updated successfully"))
});

const deleteTweet = asyncHandler(async (req, res) => {
  const {tweetId}=req.params

  const tweet=await Tweet.findById(tweetId)
  if(!tweet){
    throw new ApiError(500,"tweet not found")
  }

  if(tweet.owner!==req.user._id){
    throw new ApiError(400,"you are not able to delete this video")
  }

  const deleteTweet=await Tweet.findByIdAndDelete(tweetId)
  if(!deleteTweet){
    throw new ApiError(500,"failed to delete this tweet")
  }

  return res.status(200).json(new ApiResponse(200,{},"tweet deleted successfully"))
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
