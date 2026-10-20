import HomepageLayout from "../models/HomepageLayout.js";

export const getPublicHomepageLayout = async (req, res) => {
  try {
    const layout = await HomepageLayout.getSingleton();
    res.set("Cache-Control", "public, max-age=5, stale-while-revalidate=30");
    res.json(layout);
  } catch (error) {
    console.error("Get public homepage layout error:", error);
    res.status(500).json({ message: error.message || "Failed to load homepage layout" });
  }
};

export const getHomepageLayout = async (req, res) => {
  try {
    const layout = await HomepageLayout.getSingleton();
    res.json(layout);
  } catch (error) {
    console.error("Get homepage layout error:", error);
    res.status(500).json({ message: error.message || "Failed to load homepage layout" });
  }
};

export const updateHomepageLayout = async (req, res) => {
  try {
    const { sections } = req.body;
    if (!Array.isArray(sections)) {
      return res.status(400).json({ message: "Sections must be an array" });
    }

    const layout = await HomepageLayout.getSingleton();
    layout.sections = sections.map((s, index) => ({
      id: String(s.id || `section-${index}`).trim(),
      type: String(s.type || "banner").trim(),
      title: String(s.title || "").trim(),
      subtitle: String(s.subtitle || "").trim(),
      visible: Boolean(s.visible ?? true),
      order: Number.isFinite(Number(s.order)) ? Number(s.order) : index,
      config: s.config && typeof s.config === "object" ? s.config : {},
    }));

    await layout.save();
    res.json(layout);
  } catch (error) {
    console.error("Update homepage layout error:", error);
    res.status(500).json({ message: error.message || "Failed to update homepage layout" });
  }
};
