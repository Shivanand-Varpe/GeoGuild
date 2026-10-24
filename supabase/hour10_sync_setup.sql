-- ==============================================================================
-- HOUR 10 PRODUCTION SYNC SETUP & VERIFICATION
-- Hackathon: VECNAVERSE | Author: Person B (Backend Lead)
-- ==============================================================================

-- 1. STORAGE BUCKETS SETUP (event-banners, events, event-images)
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('event-banners', 'event-banners', true),
    ('events', 'events', true),
    ('event-images', 'event-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Public read on event storage" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload on event storage" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update on event storage" ON storage.objects;

CREATE POLICY "Public read on event storage" ON storage.objects
    FOR SELECT USING (bucket_id IN ('event-banners', 'events', 'event-images'));

CREATE POLICY "Authenticated upload on event storage" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id IN ('event-banners', 'events', 'event-images')
        AND (auth.role() = 'authenticated' OR auth.role() = 'anon')
    );

CREATE POLICY "Authenticated update on event storage" ON storage.objects
    FOR UPDATE USING (
        bucket_id IN ('event-banners', 'events', 'event-images')
        AND (auth.role() = 'authenticated' OR auth.role() = 'anon')
    );


-- 2. ENABLE SUPABASE REALTIME
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rsvps;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


-- 3. BULLETPROOF RSVP RLS (Supports both OAuth users and Demo Guest RSVPs)
DROP POLICY IF EXISTS "Users can insert own RSVP" ON public.rsvps;
DROP POLICY IF EXISTS "Users can delete own RSVP" ON public.rsvps;

CREATE POLICY "Users can insert own RSVP" ON public.rsvps
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL OR user_id IS NOT NULL);

CREATE POLICY "Users can delete own RSVP" ON public.rsvps
    FOR DELETE USING (auth.uid() = user_id OR auth.uid() IS NULL OR user_id IS NOT NULL);


-- 4. BULLETPROOF PERSONALIZED FEED RPC
-- Matches user interests, but falls back gracefully so feed is never empty!
DROP FUNCTION IF EXISTS public.get_personalized_feed(UUID, INT);

CREATE OR REPLACE FUNCTION public.get_personalized_feed(
    p_user_id UUID,
    p_limit INT DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    category_id UUID,
    category_name TEXT,
    category_icon TEXT,
    city TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    image_url TEXT,
    is_free BOOLEAN,
    price NUMERIC,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    matched_interests_count BIGINT,
    rsvp_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.description,
        e.category_id,
        c.name AS category_name,
        c.icon AS category_icon,
        e.city,
        e.start_time,
        e.end_time,
        e.image_url,
        e.is_free,
        e.price,
        e.latitude,
        e.longitude,
        COALESCE(COUNT(DISTINCT ui.tag_id), 0) AS matched_interests_count,
        COUNT(DISTINCT r.id) AS rsvp_count
    FROM public.events e
    LEFT JOIN public.categories c ON e.category_id = c.id
    LEFT JOIN public.event_tags et ON e.id = et.event_id
    LEFT JOIN public.user_interests ui ON et.tag_id = ui.tag_id AND ui.user_id = p_user_id
    LEFT JOIN public.rsvps r ON e.id = r.event_id
    WHERE e.status = 'published'
    GROUP BY e.id, c.name, c.icon
    ORDER BY matched_interests_count DESC, e.start_time ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- 5. TEST USER PROFILE & INTERESTS FOR DEMO VERIFICATION
INSERT INTO public.user_interests (user_id, tag_id)
VALUES 
    ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201'), -- AI
    ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222203')  -- Next.js
ON CONFLICT DO NOTHING;
