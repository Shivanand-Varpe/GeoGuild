-- ==============================================================================
-- PHASE 3: ORGANIZER DASHBOARD, REVIEWS, AND TRENDING ALGORITHM
-- Author: Person B (Backend Lead)
-- Project: EventRadar
-- ==============================================================================

-- 1. ORGANIZER EVENTS (All events by host with view count, rsvp count, revenue)
CREATE OR REPLACE FUNCTION public.get_organizer_events(p_organizer_id UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    category_name TEXT,
    city TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    max_capacity INT,
    image_url TEXT,
    is_free BOOLEAN,
    price NUMERIC,
    status TEXT,
    view_count INT,
    rsvp_count BIGINT,
    total_revenue NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.description,
        c.name AS category_name,
        e.city,
        e.start_time,
        e.end_time,
        e.max_capacity,
        e.image_url,
        e.is_free,
        e.price,
        e.status,
        e.view_count,
        COUNT(r.id) AS rsvp_count,
        COALESCE(COUNT(r.id) * CASE WHEN e.is_free THEN 0 ELSE e.price END, 0)::NUMERIC AS total_revenue
    FROM public.events e
    LEFT JOIN public.categories c ON e.category_id = c.id
    LEFT JOIN public.rsvps r ON e.id = r.event_id
    WHERE e.organizer_id = p_organizer_id
    GROUP BY e.id, c.name
    ORDER BY e.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- 2. EVENT ATTENDEES LIST (For organizer guest-list view)
CREATE OR REPLACE FUNCTION public.get_event_rsvp_list(p_event_id UUID)
RETURNS TABLE (
    rsvp_id UUID,
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    user_avatar TEXT,
    rsvp_status TEXT,
    rsvp_created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id AS rsvp_id,
        p.id AS user_id,
        COALESCE(p.name, 'Attendee') AS user_name,
        COALESCE(p.email, '') AS user_email,
        COALESCE(p.avatar_url, '') AS user_avatar,
        r.status AS rsvp_status,
        r.created_at AS rsvp_created_at
    FROM public.rsvps r
    JOIN public.profiles p ON r.user_id = p.id
    WHERE r.event_id = p_event_id
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- 3. TRENDING ALGORITHM (Score = views * 0.3 + rsvps * 0.7)
CREATE OR REPLACE FUNCTION public.get_trending_events(
    p_city TEXT DEFAULT NULL,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
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
    view_count INT,
    rsvp_count BIGINT,
    trending_score DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.description,
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
        e.view_count,
        COUNT(r.id) AS rsvp_count,
        ROUND(((e.view_count * 0.3) + (COUNT(r.id) * 0.7))::numeric, 2)::DOUBLE PRECISION AS trending_score
    FROM public.events e
    LEFT JOIN public.categories c ON e.category_id = c.id
    LEFT JOIN public.rsvps r ON e.id = r.event_id
    WHERE 
        e.status = 'published'
        AND e.start_time >= NOW() - INTERVAL '1 day'
        AND (p_city IS NULL OR p_city = '' OR e.city ILIKE p_city)
    GROUP BY e.id, c.name, c.icon
    ORDER BY trending_score DESC, e.start_time ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- 4. ADD / UPDATE EVENT REVIEW (Rating 1-5 + comment)
CREATE OR REPLACE FUNCTION public.add_review(
    p_event_id UUID,
    p_rating INT,
    p_comment TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_new_avg DOUBLE PRECISION;
    v_total_reviews INT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to post a review';
    END IF;

    IF p_rating < 1 OR p_rating > 5 THEN
        RAISE EXCEPTION 'Rating must be between 1 and 5';
    END IF;

    INSERT INTO public.reviews (user_id, event_id, rating, comment)
    VALUES (v_user_id, p_event_id, p_rating, p_comment)
    ON CONFLICT (user_id, event_id) 
    DO UPDATE SET 
        rating = EXCLUDED.rating,
        comment = EXCLUDED.comment,
        created_at = NOW();

    SELECT 
        ROUND(AVG(rating)::numeric, 1)::DOUBLE PRECISION,
        COUNT(*)
    INTO v_new_avg, v_total_reviews
    FROM public.reviews
    WHERE event_id = p_event_id;

    RETURN json_build_object(
        'success', true,
        'average_rating', v_new_avg,
        'total_reviews', v_total_reviews
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. GET EVENT REVIEWS WITH REVIEWER PROFILES
CREATE OR REPLACE FUNCTION public.get_event_reviews(p_event_id UUID)
RETURNS TABLE (
    id UUID,
    rating INT,
    comment TEXT,
    created_at TIMESTAMPTZ,
    user_id UUID,
    user_name TEXT,
    user_avatar TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        p.id AS user_id,
        COALESCE(p.name, 'Community Member') AS user_name,
        COALESCE(p.avatar_url, '') AS user_avatar
    FROM public.reviews r
    JOIN public.profiles p ON r.user_id = p.id
    WHERE r.event_id = p_event_id
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
