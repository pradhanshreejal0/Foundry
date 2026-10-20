import mongoose from "mongoose";

const homepageSectionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true }, // hero, categories, bestsellers, featured, promo, trust, ads
    title: { type: String, default: "", trim: true },
    subtitle: { type: String, default: "", trim: true },
    visible: { type: Boolean, default: true },
    order: { type: Number, required: true, default: 0 },
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const homepageLayoutSchema = new mongoose.Schema(
  {
    sections: {
      type: [homepageSectionSchema],
      default: [
        { id: "hero", type: "hero", title: "Hero Banner", visible: true, order: 0, config: {} },
        { id: "trust", type: "trust", title: "Trust Strip", visible: true, order: 1, config: {} },
        { id: "categories", type: "categories", title: "Browse by mood", visible: true, order: 2, config: {} },
        { id: "featured", type: "featured", title: "Worth a closer look", visible: true, order: 3, config: {} },
        { id: "promo", type: "promo", title: "Promo Band", visible: true, order: 4, config: {} },
        { id: "bestsellers", type: "bestsellers", title: "Fresh to the shelves", visible: true, order: 5, config: {} },
      ],
    },
  },
  { timestamps: true }
);

homepageLayoutSchema.statics.getSingleton = async function () {
  let layout = await this.findOne();
  if (!layout) {
    layout = await this.create({});
  }
  return layout;
};

export default mongoose.model("HomepageLayout", homepageLayoutSchema);
