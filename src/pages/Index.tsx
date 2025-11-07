import { useState, useEffect } from "react";
import { Whiteboard } from "@/components/Whiteboard";
import { Toolbar } from "@/components/Toolbar";
import { UserPresence } from "@/components/UserPresence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy } from "lucide-react";

const ROOM_ID = "main-room"; // In production, this would be dynamic

const COLORS = [
  "#06b6d4", "#f43f5e", "#22c55e", "#f59e0b", 
  "#8b5cf6", "#ec4899", "#3b82f6", "#ef4444"
];

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];
const generateUserId = () => `user-${Math.random().toString(36).substr(2, 9)}`;

interface User {
  id: string;
  name: string;
  color: string;
}

const Index = () => {
  const [userName, setUserName] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [userId] = useState(generateUserId());
  const [userColor] = useState(getRandomColor());
  
  const [currentTool, setCurrentTool] = useState("pen");
  const [currentColor, setCurrentColor] = useState("#06b6d4");
  const [brushSize, setBrushSize] = useState(4);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);

  const presenceChannel = supabase.channel(`presence:${ROOM_ID}`);

  useEffect(() => {
    if (!isJoined) return;

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const users: User[] = [];
        
        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[];
          if (presences && presences.length > 0) {
            const presence = presences[0] as any;
            if (presence.user_id) {
              users.push({
                id: presence.user_id,
                name: presence.user_name,
                color: presence.user_color,
              });
            }
          }
        });
        
        setActiveUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
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
      supabase.removeChannel(presenceChannel);
    };
  }, [isJoined, userId, userName, userColor]);

  const handleJoin = () => {
    if (!userName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setIsJoined(true);
    toast.success(`Welcome, ${userName}!`);
  };

  const handleClear = async () => {
    const { error } = await supabase
      .from("whiteboard_strokes")
      .delete()
      .eq("room_id", ROOM_ID);

    if (error) {
      toast.error("Failed to clear canvas");
      console.error(error);
    } else {
      toast.success("Canvas cleared");
    }
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Room link copied!");
  };

  if (!isJoined) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                IdeaFlame🔥
              </h1>
              <p className="text-muted-foreground">
                Real-time collaborative whiteboard
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Enter your name
                </label>
                <Input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your name..."
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  className="text-lg"
                  autoFocus
                />
              </div>
              
              <Button 
                onClick={handleJoin} 
                className="w-full text-lg h-12"
              >
                Join Room
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            IdeaFlame
          </h1>
          <p className="text-sm text-muted-foreground">Room: {ROOM_ID}</p>
        </div>
        
        <Button variant="outline" size="sm" onClick={copyRoomLink}>
          <Copy className="w-4 h-4 mr-2" />
          Copy Link
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-4">
        {/* Left Sidebar - Toolbar */}
        <div className="order-2 lg:order-1">
          <Toolbar
            currentTool={currentTool}
            onToolChange={setCurrentTool}
            currentColor={currentColor}
            onColorChange={setCurrentColor}
            brushSize={brushSize}
            onBrushSizeChange={setBrushSize}
            onClear={handleClear}
          />
        </div>

        {/* Canvas */}
        <div className="order-1 lg:order-2 bg-card border border-border rounded-lg p-4 shadow-lg overflow-hidden">
          <div className="w-full h-[600px]">
            <Whiteboard
              roomId={ROOM_ID}
              userId={userId}
              userName={userName}
              userColor={userColor}
              currentTool={currentTool}
              currentColor={currentColor}
              brushSize={brushSize}
              onClear={handleClear}
            />
          </div>
        </div>

        {/* Right Sidebar - Users */}
        <div className="order-3">
          <UserPresence users={activeUsers} currentUserId={userId} />
        </div>
      </div>
    </div>
  );
};

export default Index;
