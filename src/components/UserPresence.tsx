import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface User {
  id: string;
  name: string;
  color: string;
}

interface UserPresenceProps {
  users: User[];
  currentUserId: string;
}

export const UserPresence = ({ users, currentUserId }: UserPresenceProps) => {
  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Active Users
        </span>
        <Badge variant="secondary" className="ml-auto">
          {users.length}
        </Badge>
      </div>
      
      <div className="flex flex-col gap-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary/50 transition-colors"
          >
            <Avatar className="w-8 h-8 border-2" style={{ borderColor: user.color }}>
              <AvatarFallback style={{ backgroundColor: user.color }}>
                {user.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">
              {user.name}
              {user.id === currentUserId && (
                <span className="text-xs text-muted-foreground ml-2">(You)</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
