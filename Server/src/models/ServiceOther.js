import mongoose from 'mongoose';

const serviceOtherSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    type: String,
    isActive: { type: Boolean, default: true },
    placeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Place',
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('ServiceOther', serviceOtherSchema);
