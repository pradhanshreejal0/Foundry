import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GripVertical, ArrowUp, ArrowDown, Eye, EyeOff, Save, Plus, Trash2, Settings } from "lucide-react";

const AVAILABLE_TYPES = [
  { value: "hero", label: "Hero Banner" },
  { value: "trust", label: "Trust Strip" },
  { value: "categories", label: "Categories Grid (Browse by mood)" },
  { value: "featured", label: "Featured / Curated Products" },
  { value: "bestsellers", label: "Bestsellers / New Arrivals" },
  { value: "promo", label: "Promo / Banner Card" },
  { value: "ads", label: "Promotional Ad Slot" },
];

export default function HomepageLayoutEditor() {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sections, setSections] = useState([]);
  const [selectedType, setSelectedType] = useState("featured");

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    const loadLayout = async () => {
      try {
        const data = await api("/homepage", { accessToken });
        if (cancelled) return;
        const list = Array.isArray(data?.sections) ? data.sections : [];
        setSections(list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load homepage layout");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadLayout();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const moveSection = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= sections.length) return;
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setSections(updated.map((s, i) => ({ ...s, order: i })));
  };

  const toggleVisibility = (index) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, visible: !s.visible } : s))
    );
  };

  const handleFieldChange = (index, field, value) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const addSection = () => {
    const typeObj = AVAILABLE_TYPES.find((t) => t.value === selectedType) || AVAILABLE_TYPES[0];
    const newSection = {
      id: `${selectedType}-${Date.now().toString().slice(-4)}`,
      type: selectedType,
      title: typeObj.label,
      subtitle: "",
      visible: true,
      order: sections.length,
      config: {},
    };
    setSections((prev) => [...prev, newSection]);
  };

  const removeSection = (index) => {
    setSections((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await api("/homepage", {
        method: "PUT",
        accessToken,
        body: { sections },
      });
      const list = Array.isArray(res?.sections) ? res.sections : sections;
      setSections(list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      setMessage("Homepage building blocks saved successfully!");
    } catch (err) {
      setError(err.message || "Failed to save layout");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading building blocks...</p>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Homepage Builder (Building Blocks)</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add, remove, reorder, and configure modular blocks to construct your storefront homepage layout.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-dashed bg-muted/20">
          <CardHeader>
            <CardTitle className="text-base">Add Building Block</CardTitle>
            <CardDescription>Select a block type to append to your homepage structure.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select block type" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" onClick={addSection} className="gap-1.5">
              <Plus className="h-4 w-4" /> Add Block
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {sections.map((section, index) => (
            <div
              key={section.id || index}
              className={`flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm transition-all ${
                !section.visible ? "opacity-60 bg-muted/30 border-dashed" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                  <span className="text-xs font-mono uppercase bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold">
                    {section.type}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">#{index + 1}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => toggleVisibility(index)}
                    title={section.visible ? "Visible (Click to Hide)" : "Hidden (Click to Show)"}
                  >
                    {section.visible ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    disabled={index === 0}
                    onClick={() => moveSection(index, -1)}
                    title="Move Up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    disabled={index === sections.length - 1}
                    onClick={() => moveSection(index, 1)}
                    title="Move Down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => removeSection(index)}
                    title="Delete Block"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 pt-1 border-t">
                <div className="space-y-1">
                  <Label className="text-xs">Section Heading Title</Label>
                  <Input
                    value={section.title || ""}
                    onChange={(e) => handleFieldChange(index, "title", e.target.value)}
                    placeholder="e.g. Worth a closer look"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Subtitle / Note</Label>
                  <Input
                    value={section.subtitle || ""}
                    onChange={(e) => handleFieldChange(index, "subtitle", e.target.value)}
                    placeholder="e.g. Picked with intention"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-4">
          <Button type="submit" disabled={saving} size="lg" className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Saving Building Blocks..." : "Save Homepage Layout"}
          </Button>
          {message && <p className="text-sm text-green-600 font-medium">{message}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </form>
    </div>
  );
}
