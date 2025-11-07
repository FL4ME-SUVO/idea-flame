import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  id: string;
  points: Point[];
  color: string;
  size: number;
  tool: string;
  userId: string;
}

interface RemoteCursor {
  userId: string;
  userName: string;
  userColor: string;
  x: number;
  y: number;
  timestamp: number;
}

interface WhiteboardProps {
  roomId: string;
  userId: string;
  userName: string;
  userColor: string;
  currentTool: string;
  currentColor: string;
  brushSize: number;
  onClear: () => void;
}

export const Whiteboard = ({
  roomId,
  userId,
  userName,
  userColor,
  currentTool,
  currentColor,
  brushSize,
  onClear,
}: WhiteboardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<Map<string, RemoteCursor>>(new Map());
  const cursorChannel = useRef<any>(null);

  // Set canvas size to match container
  useEffect(() => {
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Load existing strokes
  useEffect(() => {
    loadStrokes();
  }, [roomId]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel(`whiteboard:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "whiteboard_strokes",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newStroke: Stroke = {
            id: payload.new.id,
            points: payload.new.points,
            color: payload.new.color,
            size: payload.new.size,
            tool: payload.new.tool,
            userId: payload.new.user_id,
          };
          setStrokes((prev) => [...prev, newStroke]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "whiteboard_strokes",
        },
        () => {
          setStrokes([]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // Cursor presence tracking
  useEffect(() => {
    cursorChannel.current = supabase.channel(`cursors:${roomId}`);

    cursorChannel.current
      .on("presence", { event: "sync" }, () => {
        const state = cursorChannel.current.presenceState();
        const cursors = new Map<string, RemoteCursor>();
        
        Object.keys(state).forEach((key) => {
          const presences = state[key];
          if (presences && presences.length > 0) {
            const presence = presences[0];
            if (presence.user_id !== userId) {
              cursors.set(presence.user_id, {
                userId: presence.user_id,
                userName: presence.user_name,
                userColor: presence.user_color,
                x: presence.x,
                y: presence.y,
                timestamp: presence.timestamp,
              });
            }
          }
        });
        
        setRemoteCursors(cursors);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await cursorChannel.current.track({
            user_id: userId,
            user_name: userName,
            user_color: userColor,
            x: 0,
            y: 0,
            timestamp: Date.now(),
          });
        }
      });

    return () => {
      if (cursorChannel.current) {
        supabase.removeChannel(cursorChannel.current);
      }
    };
  }, [roomId, userId, userName, userColor]);

  const loadStrokes = async () => {
    const { data, error } = await supabase
      .from("whiteboard_strokes")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading strokes:", error);
      return;
    }

    if (data) {
      setStrokes(
        data.map((s) => ({
          id: s.id,
          points: (s.points as unknown) as Point[],
          color: s.color,
          size: s.size,
          tool: s.tool,
          userId: s.user_id,
        }))
      );
    }
  };

  // Redraw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all strokes
    [...strokes, ...(currentPoints.length > 0 ? [{
      id: "temp",
      points: currentPoints,
      color: currentColor,
      size: brushSize,
      tool: currentTool,
      userId,
    }] : [])].forEach((stroke) => {
      if (stroke.points.length < 2) return;

      ctx.beginPath();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = stroke.size;
      
      if (stroke.tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = stroke.color;
      }

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    });

    // Draw remote cursors
    remoteCursors.forEach((cursor) => {
      ctx.fillStyle = cursor.userColor;
      ctx.beginPath();
      ctx.arc(cursor.x, cursor.y, 8, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.font = "12px Inter, sans-serif";
      ctx.fillText(cursor.userName, cursor.x + 12, cursor.y + 4);
    });
  }, [strokes, currentPoints, remoteCursors, currentColor, brushSize, currentTool, userId]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const point = getCoordinates(e);
    setCurrentPoints([point]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCoordinates(e);
    
    // Update cursor position
    if (cursorChannel.current) {
      cursorChannel.current.track({
        user_id: userId,
        user_name: userName,
        user_color: userColor,
        x: point.x,
        y: point.y,
        timestamp: Date.now(),
      });
    }

    if (!isDrawing) return;
    
    setCurrentPoints((prev) => [...prev, point]);
  };

  const handleMouseUp = async () => {
    if (!isDrawing || currentPoints.length === 0) {
      setIsDrawing(false);
      return;
    }

    setIsDrawing(false);

    // Save stroke to database
    const { error } = await supabase.from("whiteboard_strokes").insert([{
      room_id: roomId,
      user_id: userId,
      user_name: userName,
      user_color: userColor,
      points: currentPoints as any,
      color: currentColor,
      size: brushSize,
      tool: currentTool,
    }]);

    if (error) {
      console.error("Error saving stroke:", error);
    }

    setCurrentPoints([]);
  };

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas
        ref={canvasRef}
        className="border border-border rounded-lg cursor-crosshair w-full h-full"
        style={{ touchAction: "none" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
};
