-- ==============================================================================
-- EVENTRADAR: COMPLETE SUPABASE BACKEND SETUP
-- Hackathon: VECNAVERSE (24-Hour National Hackathon)
-- Project: Hyperlocal Event Discovery & Community Engagement
-- Author: Person B (Backend Lead & Database Architect)
-- ==============================================================================
-- Instructions: Copy and paste this ENTIRE script into the Supabase SQL Editor
-- (Dashboard -> SQL Editor -> New Query -> Run)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. PROFILES (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    email TEXT,
    name TEXT,
    avatar_url TEXT,
    city TEXT DEFAULT 'Mumbai',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    radius_km INT DEFAULT 25,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
-- Ensure foreign key does not block mock/seed organizers
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 3. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT NOT NULL, -- Lucide icon name (e.g. 'Code', 'Wrench', 'Trophy', 'Users')
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. TAGS
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. EVENTS TABLE (With PostGIS Generated Geography Column)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    event_type TEXT DEFAULT 'in-person', -- 'in-person', 'hybrid', 'virtual'
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT NOT NULL,
    venue_name TEXT,
    city TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    max_capacity INT DEFAULT 100,
    image_url TEXT,
    is_free BOOLEAN DEFAULT true,
    price NUMERIC(10, 2) DEFAULT 0.00,
    registration_link TEXT,
    status TEXT DEFAULT 'published', -- 'draft', 'published', 'cancelled'
    view_count INT DEFAULT 0,
    location geography(POINT, 4326) GENERATED ALWAYS AS (
        ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
    ) STORED,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. EVENT TAGS (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.event_tags (
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, tag_id)
);

-- 7. USER INTERESTS (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.user_interests (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, tag_id)
);

-- 8. RSVPS TABLE
CREATE TABLE IF NOT EXISTS public.rsvps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'going', -- 'going', 'interested'
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (user_id, event_id)
);

-- 9. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    rating INT CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (user_id, event_id)
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY SPEED & SPATIAL SEARCH
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_events_location ON public.events USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON public.events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_city ON public.events(city);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_event_id ON public.rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_user_id ON public.rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_event_tags_tag ON public.event_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_user ON public.user_interests(user_id);

-- Full-text search index for fast keyword matching
CREATE INDEX IF NOT EXISTS idx_events_fts ON public.events USING gin(to_tsvector('english', title || ' ' || description));

-- ==============================================================================
-- AUTOMATIC USER PROFILE TRIGGER
-- Whenever a user signs up via Google / GitHub OAuth or Email, create their profile!
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, public.profiles.name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Profiles: Public can view, only owner can update
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Categories & Tags: Viewable by everyone, insertable by authenticated users
CREATE POLICY "Categories viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Categories manageable by auth users" ON public.categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Tags viewable by everyone" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Tags manageable by auth users" ON public.tags FOR ALL USING (auth.role() = 'authenticated');

-- Events: Anyone can view published events
CREATE POLICY "Published events are viewable by everyone" ON public.events
    FOR SELECT USING (status = 'published' OR auth.uid() = organizer_id);
CREATE POLICY "Authenticated users can create events" ON public.events
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND (organizer_id = auth.uid() OR organizer_id IS NULL));
CREATE POLICY "Organizers can update own events" ON public.events
    FOR UPDATE USING (auth.uid() = organizer_id);
CREATE POLICY "Organizers can delete own events" ON public.events
    FOR DELETE USING (auth.uid() = organizer_id);

-- Event Tags: Viewable by everyone, manageable by event organizer
CREATE POLICY "Event tags are viewable by everyone" ON public.event_tags FOR SELECT USING (true);
CREATE POLICY "Event tags manageable by authenticated users" ON public.event_tags FOR ALL USING (auth.role() = 'authenticated');

-- User Interests: Users can manage their own interests
CREATE POLICY "User interests are viewable by everyone" ON public.user_interests FOR SELECT USING (true);
CREATE POLICY "Users can manage own interests" ON public.user_interests FOR ALL USING (auth.uid() = user_id);

-- RSVPs: Anyone can see count, auth users can RSVP for themselves
CREATE POLICY "RSVPs viewable by everyone" ON public.rsvps FOR SELECT USING (true);
CREATE POLICY "Users can insert own RSVP" ON public.rsvps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own RSVP" ON public.rsvps FOR DELETE USING (auth.uid() = user_id);

-- Reviews: Anyone can read reviews, only authenticated attendees can create
CREATE POLICY "Reviews viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert own review" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own review" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

-- ==============================================================================
-- POSTGIS & RPC BACKEND FUNCTIONS
-- ==============================================================================

-- 1. HYPERLOCAL DISCOVERY: get_nearby_events
-- Returns events within radius_km, sorted by distance, with distance, category, and rsvp_count
DROP FUNCTION IF EXISTS public.get_nearby_events(DOUBLE PRECISION, DOUBLE PRECISION, INT, UUID, BOOLEAN);

CREATE OR REPLACE FUNCTION public.get_nearby_events(
    p_user_lat DOUBLE PRECISION,
    p_user_lng DOUBLE PRECISION,
    p_radius_km INT DEFAULT 50,
    p_filter_category_id UUID DEFAULT NULL,
    p_filter_is_free BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    event_type TEXT,
    category_id UUID,
    category_name TEXT,
    category_icon TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    address TEXT,
    venue_name TEXT,
    city TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    max_capacity INT,
    image_url TEXT,
    is_free BOOLEAN,
    price NUMERIC,
    registration_link TEXT,
    view_count INT,
    organizer_id UUID,
    organizer_name TEXT,
    distance_km DOUBLE PRECISION,
    rsvp_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.description,
        e.event_type,
        e.category_id,
        c.name AS category_name,
        c.icon AS category_icon,
        e.latitude,
        e.longitude,
        e.address,
        e.venue_name,
        e.city,
        e.start_time,
        e.end_time,
        e.max_capacity,
        e.image_url,
        e.is_free,
        e.price,
        e.registration_link,
        e.view_count,
        e.organizer_id,
        p.name AS organizer_name,
        ROUND((ST_Distance(e.location, ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography) / 1000.0)::numeric, 1)::DOUBLE PRECISION AS distance_km,
        COUNT(r.id) AS rsvp_count
    FROM public.events e
    LEFT JOIN public.categories c ON e.category_id = c.id
    LEFT JOIN public.profiles p ON e.organizer_id = p.id
    LEFT JOIN public.rsvps r ON e.id = r.event_id
    WHERE 
        e.status = 'published'
        AND ST_DWithin(
            e.location,
            ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography,
            p_radius_km * 1000.0
        )
        AND (p_filter_category_id IS NULL OR e.category_id = p_filter_category_id)
        AND (p_filter_is_free IS NULL OR e.is_free = p_filter_is_free)
    GROUP BY e.id, c.name, c.icon, p.name
    ORDER BY distance_km ASC, e.start_time ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- 2. TOGGLE RSVP (Instant one-click RSVP toggle)
CREATE OR REPLACE FUNCTION public.toggle_rsvp(p_event_id UUID)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_exists BOOLEAN;
    v_new_count BIGINT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to RSVP';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.rsvps 
        WHERE user_id = v_user_id AND event_id = p_event_id
    ) INTO v_exists;

    IF v_exists THEN
        DELETE FROM public.rsvps 
        WHERE user_id = v_user_id AND event_id = p_event_id;
    ELSE
        INSERT INTO public.rsvps (user_id, event_id, status)
        VALUES (v_user_id, p_event_id, 'going');
    END IF;

    SELECT COUNT(*) INTO v_new_count FROM public.rsvps WHERE event_id = p_event_id;

    RETURN json_build_object(
        'is_rsvped', NOT v_exists,
        'rsvp_count', v_new_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. PERSONALIZED FEED (Based on user interests)
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
        COUNT(DISTINCT et.tag_id) AS matched_interests_count,
        (SELECT COUNT(*) FROM public.rsvps r WHERE r.event_id = e.id) AS rsvp_count
    FROM public.events e
    LEFT JOIN public.categories c ON e.category_id = c.id
    LEFT JOIN public.event_tags et ON e.id = et.event_id
    INNER JOIN public.user_interests ui ON et.tag_id = ui.tag_id AND ui.user_id = p_user_id
    WHERE e.status = 'published' AND e.start_time >= NOW() - INTERVAL '1 day'
    GROUP BY e.id, c.name, c.icon
    ORDER BY matched_interests_count DESC, e.start_time ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- 4. SMART SEARCH & FILTER
CREATE OR REPLACE FUNCTION public.search_events(
    search_query TEXT DEFAULT NULL,
    filter_city TEXT DEFAULT NULL,
    filter_category_id UUID DEFAULT NULL,
    filter_is_free BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    event_type TEXT,
    category_id UUID,
    category_name TEXT,
    category_icon TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    address TEXT,
    venue_name TEXT,
    city TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    image_url TEXT,
    is_free BOOLEAN,
    price NUMERIC,
    view_count INT,
    rsvp_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.description,
        e.event_type,
        e.category_id,
        c.name AS category_name,
        c.icon AS category_icon,
        e.latitude,
        e.longitude,
        e.address,
        e.venue_name,
        e.city,
        e.start_time,
        e.end_time,
        e.image_url,
        e.is_free,
        e.price,
        e.view_count,
        COUNT(r.id) AS rsvp_count
    FROM public.events e
    LEFT JOIN public.categories c ON e.category_id = c.id
    LEFT JOIN public.rsvps r ON e.id = r.event_id
    WHERE 
        e.status = 'published'
        AND (
            search_query IS NULL 
            OR search_query = '' 
            OR e.title ILIKE '%' || search_query || '%'
            OR e.description ILIKE '%' || search_query || '%'
            OR e.venue_name ILIKE '%' || search_query || '%'
        )
        AND (filter_city IS NULL OR filter_city = '' OR e.city ILIKE filter_city)
        AND (filter_category_id IS NULL OR e.category_id = filter_category_id)
        AND (filter_is_free IS NULL OR e.is_free = filter_is_free)
    GROUP BY e.id, c.name, c.icon
    ORDER BY e.start_time ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- 5. INCREMENT EVENT VIEW COUNT
CREATE OR REPLACE FUNCTION public.increment_event_views(p_event_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.events 
    SET view_count = view_count + 1
    WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. ORGANIZER STATS (For organizer dashboard)
CREATE OR REPLACE FUNCTION public.get_organizer_stats(p_organizer_id UUID)
RETURNS JSON AS $$
DECLARE
    v_total_events INT;
    v_total_rsvps INT;
    v_total_views INT;
BEGIN
    SELECT COUNT(*), COALESCE(SUM(view_count), 0)
    INTO v_total_events, v_total_views
    FROM public.events
    WHERE organizer_id = p_organizer_id;

    SELECT COUNT(r.id)
    INTO v_total_rsvps
    FROM public.rsvps r
    INNER JOIN public.events e ON r.event_id = e.id
    WHERE e.organizer_id = p_organizer_id;

    RETURN json_build_object(
        'total_events', v_total_events,
        'total_rsvps', v_total_rsvps,
        'total_views', v_total_views
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ==============================================================================
-- ENABLE SUPABASE REALTIME
-- ==============================================================================
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rsvps;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ==============================================================================
-- STORAGE BUCKET CONFIGURATION FOR EVENT IMAGES
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Anyone can view images
CREATE POLICY "Public read for event images" ON storage.objects
    FOR SELECT USING (bucket_id = 'event-images');

-- Storage RLS: Authenticated users can upload event images
CREATE POLICY "Auth users can upload event images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'event-images' AND auth.role() = 'authenticated');
