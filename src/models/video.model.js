import mongoose, { Schema } from "mongoose";

const videoSchema = new Schema(
  {
    videoFile: {
      type: String, //FIXME: cloudinary image
      required: true,
    },
    Thumbnail: {
      type: String, //FIXME: cloudinary image
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublised: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

//TODO: paginate

export const Video = mongoose.model("Video", videoSchema);
