import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Pencil, Eraser, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  currentTool: string;
  onToolChange: (tool: string) => void;
  currentColor: string;
  onColorChange: (color: string) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onClear: () => void;
}

const COLORS = [
  "#06b6d4", // cyan
  "#f43f5e", // rose
  "#22c55e", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#ffffff", // white
  "#000000", // black
];

const SIZES = [2, 4, 8, 16];

export const Toolbar = ({
  currentTool,
  onToolChange,
  currentColor,
  onColorChange,
  brushSize,
  onBrushSizeChange,
  onClear,
}: ToolbarProps) => {
  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-lg flex flex-col gap-4">
      {/* Tools */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Tools
        </span>
        <div className="flex flex-col gap-2">
          <Button
            variant={currentTool === "pen" ? "default" : "secondary"}
            size="sm"
            onClick={() => onToolChange("pen")}
            className="justify-start gap-2"
          >
            <Pencil className="w-4 h-4" />
            <span>Pen</span>
          </Button>
          <Button
            variant={currentTool === "eraser" ? "default" : "secondary"}
            size="sm"
            onClick={() => onToolChange("eraser")}
            className="justify-start gap-2"
          >
            <Eraser className="w-4 h-4" />
            <span>Eraser</span>
          </Button>
        </div>
      </div>

      <Separator />

      {/* Colors */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Colors
        </span>
        <div className="grid grid-cols-4 gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={cn(
                "w-8 h-8 rounded-md border-2 transition-all hover:scale-110",
                currentColor === color
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border"
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <Separator />

      {/* Brush Size */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Size
        </span>
        <div className="grid grid-cols-4 gap-2">
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() => onBrushSizeChange(size)}
              className={cn(
                "h-10 rounded-md border-2 transition-all hover:scale-105 flex items-center justify-center",
                brushSize === size
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary"
              )}
            >
              <div
                className="rounded-full bg-foreground"
                style={{ width: size * 2, height: size * 2 }}
              />
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Actions */}
      <Button
        variant="destructive"
        size="sm"
        onClick={onClear}
        className="justify-start gap-2"
      >
        <Trash2 className="w-4 h-4" />
        <span>Clear Canvas</span>
      </Button>
    </div>
  );
};
