-- ==============================================================================
-- EVENTRADAR: REALISTIC SEED DATA FOR DEMO & TESTING
-- Hackathon: VECNAVERSE
-- Author: Person B (Backend Lead)
-- ==============================================================================

-- 0. Ensure profiles can hold demo/seed organizers without requiring mock auth.users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 1. Insert Categories
INSERT INTO public.categories (id, name, slug, icon) VALUES
    ('11111111-1111-1111-1111-111111111101', 'Tech & AI', 'tech-ai', 'Cpu'),
    ('11111111-1111-1111-1111-111111111102', 'Hackathons', 'hackathons', 'Trophy'),
    ('11111111-1111-1111-1111-111111111103', 'Workshops', 'workshops', 'BookOpen'),
    ('11111111-1111-1111-1111-111111111104', 'Meetups & Community', 'community', 'Users'),
    ('11111111-1111-1111-1111-111111111105', 'Startup & Pitch', 'startups', 'Rocket')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, icon = EXCLUDED.icon;

-- 2. Insert Tags
INSERT INTO public.tags (id, name) VALUES
    ('22222222-2222-2222-2222-222222222201', 'Artificial Intelligence'),
    ('22222222-2222-2222-2222-222222222202', 'Web Development'),
    ('22222222-2222-2222-2222-222222222203', 'Next.js & React'),
    ('22222222-2222-2222-2222-222222222204', 'Cloud & DevOps'),
    ('22222222-2222-2222-2222-222222222205', 'UI/UX Design'),
    ('22222222-2222-2222-2222-222222222206', 'Founders & Startups'),
    ('22222222-2222-2222-2222-222222222207', 'Open Source'),
    ('22222222-2222-2222-2222-222222222208', 'Cybersecurity'),
    ('22222222-2222-2222-2222-222222222209', 'Data Science & Python')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 3. Insert Demo Community Organizers into profiles
INSERT INTO public.profiles (id, email, name, avatar_url, city, latitude, longitude) VALUES
    ('33333333-3333-3333-3333-333333333301', 'vecnaverse.lead@gmail.com', 'VecnaVerse Community', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'Mumbai', 19.0760, 72.8777),
    ('33333333-3333-3333-3333-333333333302', 'bangalore.devs@gmail.com', 'Namma Tech Hub', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'Bangalore', 12.9716, 77.5946),
    ('33333333-3333-3333-3333-333333333303', 'delhi.founders@gmail.com', 'Capital Builders', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150', 'Delhi NCR', 28.6139, 77.2090),
    ('33333333-3333-3333-3333-333333333304', 'pune.foss@gmail.com', 'Pune Open Tech', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', 'Pune', 18.5204, 73.8567)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, city = EXCLUDED.city;

-- 4. Insert Realistic Events with Precise Coordinates (Directly navigates on Google Maps!)
INSERT INTO public.events (
    id, organizer_id, title, description, event_type, category_id,
    latitude, longitude, address, venue_name, city,
    start_time, end_time, max_capacity, image_url, is_free, price, view_count, status
) VALUES
-- Event 1: Mumbai Powai AI Summit
(
    '44444444-4444-4444-4444-444444444401',
    '33333333-3333-3333-3333-333333333301',
    'Mumbai AI Builders & LLM Engineers Summit',
    'Join 200+ AI engineers, researchers, and builders for hands-on deep-dives into Agentic Workflows, fine-tuning open source models, and deploying high-throughput inference on Edge.',
    'in-person',
    '11111111-1111-1111-1111-111111111101',
    19.1334, 72.9133,
    'IIT Bombay Campus, Main Auditorium, Powai',
    'IIT Bombay Powai',
    'Mumbai',
    NOW() + INTERVAL '2 days' + INTERVAL '10 hours',
    NOW() + INTERVAL '2 days' + INTERVAL '17 hours',
    250,
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    true,
    0.00,
    142,
    'published'
),
-- Event 2: Mumbai BKC Startup Mixer
(
    '44444444-4444-4444-4444-444444444402',
    '33333333-3333-3333-3333-333333333301',
    'FinTech & Founder Breakfast Mixer',
    'Casual networking morning with early-stage founders, angel investors, and product leaders in Mumbai BKC financial hub. Coffee and croissants included.',
    'in-person',
    '11111111-1111-1111-1111-111111111105',
    19.0657, 72.8687,
    'WeWork Enam Sambhav, G Block BKC, Bandra Kurla Complex',
    'WeWork BKC G-Block',
    'Mumbai',
    NOW() + INTERVAL '4 days' + INTERVAL '9 hours',
    NOW() + INTERVAL '4 days' + INTERVAL '12 hours',
    60,
    'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800',
    false,
    299.00,
    88,
    'published'
),
-- Event 3: Bangalore Koramangala Full-Stack Masterclass
(
    '44444444-4444-4444-4444-444444444403',
    '33333333-3333-3333-3333-333333333302',
    'Next.js 15 & Supabase Full-Stack Masterclass',
    'Live coding session on building ultra-low-latency web applications with Server Actions, Supabase Realtime, and Tailwind v4. Bring your laptops ready to ship.',
    'in-person',
    '11111111-1111-1111-1111-111111111103',
    12.9352, 77.6245,
    'Third Wave Coffee Roasters, 80 Feet Rd, 4th Block, Koramangala',
    'Third Wave Koramangala',
    'Bangalore',
    NOW() + INTERVAL '1 day' + INTERVAL '15 hours',
    NOW() + INTERVAL '1 day' + INTERVAL '19 hours',
    50,
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800',
    true,
    0.00,
    310,
    'published'
),
-- Event 4: Bangalore HSR Layout 24h Hackathon
(
    '44444444-4444-4444-4444-444444444404',
    '33333333-3333-3333-3333-333333333302',
    'HSR Midnight Codefest: Autonomous Agents Hackathon',
    '24 hours of non-stop hacking. Teams compete for 1.5L prize pool by building AI agent systems for real-world enterprise automation. Mentors from top unicorn startups.',
    'in-person',
    '11111111-1111-1111-1111-111111111102',
    12.9121, 77.6446,
    'The Bohemian House, 27th Main Rd, Sector 1, HSR Layout',
    'HSR Tech Innovation Loft',
    'Bangalore',
    NOW() + INTERVAL '5 days' + INTERVAL '11 hours',
    NOW() + INTERVAL '6 days' + INTERVAL '11 hours',
    120,
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
    true,
    0.00,
    520,
    'published'
),
-- Event 5: Delhi Cyber Hub DevFest
(
    '44444444-4444-4444-4444-444444444405',
    '33333333-3333-3333-3333-333333333303',
    'NCR Cloud Native & DevOps Community Day',
    'Learn Kubernetes in production, zero-trust infrastructure, and multi-cloud resilience with engineers from Zomato, Swiggy, and Microsoft.',
    'in-person',
    '11111111-1111-1111-1111-111111111104',
    28.4950, 77.0895,
    'DLF Cyber City, Tower 10 Amphitheatre, DLF Phase 2',
    'Cyber Hub DLF Arena',
    'Delhi NCR',
    NOW() + INTERVAL '3 days' + INTERVAL '14 hours',
    NOW() + INTERVAL '3 days' + INTERVAL '18 hours',
    180,
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800',
    true,
    0.00,
    215,
    'published'
),
-- Event 6: Pune Koregaon Park UI/UX Design Jam
(
    '44444444-4444-4444-4444-444444444406',
    '33333333-3333-3333-3333-333333333304',
    'Figma to Production: Micro-Interactions & Design Systems',
    'Designers and front-end devs team up for a fast-paced sprint on crafting delight-driven micro-interactions, responsive typography, and design tokens.',
    'in-person',
    '11111111-1111-1111-1111-111111111103',
    18.5362, 73.8940,
    'Innov8 Coworking, North Main Road, Koregaon Park',
    'Innov8 Koregaon Park',
    'Pune',
    NOW() + INTERVAL '3 days' + INTERVAL '11 hours',
    NOW() + INTERVAL '3 days' + INTERVAL '16 hours',
    75,
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800',
    false,
    199.00,
    174,
    'published'
),
-- Event 7: Hyderabad HITEC City Web3 & Open Source
(
    '44444444-4444-4444-4444-444444444407',
    '33333333-3333-3333-3333-333333333302',
    'Hyderabad Open Source Showcase & Lightning Talks',
    'Show off what you built! 5-minute lightning talks from local creators, followed by beer & pizza networking. First-time speakers warmly welcomed.',
    'in-person',
    '11111111-1111-1111-1111-111111111104',
    17.4474, 78.3762,
    'T-Hub 2.0 Catalyst Building, Knowledge City, Madhapur',
    'T-Hub 2.0 Main Hall',
    'Hyderabad',
    NOW() + INTERVAL '6 days' + INTERVAL '17 hours',
    NOW() + INTERVAL '6 days' + INTERVAL '21 hours',
    150,
    'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
    true,
    0.00,
    198,
    'published'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, view_count = EXCLUDED.view_count;

-- 5. Attach Tags to Events
INSERT INTO public.event_tags (event_id, tag_id) VALUES
    ('44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222201'),
    ('44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222209'),
    ('44444444-4444-4444-4444-444444444402', '22222222-2222-2222-2222-222222222206'),
    ('44444444-4444-4444-4444-444444444403', '22222222-2222-2222-2222-222222222202'),
    ('44444444-4444-4444-4444-444444444403', '22222222-2222-2222-2222-222222222203'),
    ('44444444-4444-4444-4444-444444444404', '22222222-2222-2222-2222-222222222201'),
    ('44444444-4444-4444-4444-444444444404', '22222222-2222-2222-2222-222222222202'),
    ('44444444-4444-4444-4444-444444444405', '22222222-2222-2222-2222-222222222204'),
    ('44444444-4444-4444-4444-444444444406', '22222222-2222-2222-2222-222222222205'),
    ('44444444-4444-4444-4444-444444444407', '22222222-2222-2222-2222-222222222207')
ON CONFLICT DO NOTHING;

-- 6. Add Initial Demo RSVPs so counters show lively participation
INSERT INTO public.rsvps (user_id, event_id, status) VALUES
    ('33333333-3333-3333-3333-333333333301', '44444444-4444-4444-4444-444444444403', 'going'),
    ('33333333-3333-3333-3333-333333333302', '44444444-4444-4444-4444-444444444401', 'going'),
    ('33333333-3333-3333-3333-333333333303', '44444444-4444-4444-4444-444444444401', 'going'),
    ('33333333-3333-3333-3333-333333333304', '44444444-4444-4444-4444-444444444404', 'going')
ON CONFLICT DO NOTHING;
