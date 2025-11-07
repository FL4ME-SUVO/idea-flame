-- Enable realtime for the whiteboard
CREATE TABLE IF NOT EXISTS public.whiteboard_strokes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_color TEXT NOT NULL,
  points JSONB NOT NULL,
  color TEXT NOT NULL,
  size INTEGER NOT NULL,
  tool TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whiteboard_strokes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read strokes (public whiteboard)
CREATE POLICY "Anyone can view strokes"
  ON public.whiteboard_strokes
  FOR SELECT
  USING (true);

-- Allow anyone to insert strokes (public whiteboard)
CREATE POLICY "Anyone can create strokes"
  ON public.whiteboard_strokes
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to delete strokes (for clear canvas)
CREATE POLICY "Anyone can delete strokes"
  ON public.whiteboard_strokes
  FOR DELETE
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.whiteboard_strokes;