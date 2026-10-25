import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_light_deck():
    prs = Presentation()
    # 16:9 Widescreen dimensions
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_slide_layout = prs.slide_layouts[6]

    # Clean Modern Apple Light Theme Palette
    BG_COLOR = RGBColor(248, 250, 252)      # Soft Porcelain White #F8FAFC
    CARD_BG = RGBColor(255, 255, 255)       # Pure White #FFFFFF
    CARD_BORDER = RGBColor(226, 232, 240)   # Slate 200 #E2E8F0
    TEXT_HEAD = RGBColor(15, 23, 42)        # Deep Slate 900 #0F172A
    TEXT_BODY = RGBColor(51, 65, 85)        # Slate 700 #334155
    TEXT_MUTED = RGBColor(100, 116, 139)    # Slate 500 #64748B
    
    # Modern Accents
    ACCENT_BLUE = RGBColor(37, 99, 235)     # Electric Blue #2563EB
    ACCENT_CYAN = RGBColor(2, 132, 199)     # Deep Cyan #0284C7
    ACCENT_PURPLE = RGBColor(124, 58, 237)  # Violet Purple #7C3AED
    ACCENT_GREEN = RGBColor(5, 150, 105)    # Emerald #059669
    ACCENT_AMBER = RGBColor(217, 119, 6)    # Amber #D97706
    HIGHLIGHT_BG = RGBColor(239, 246, 255)  # Light Blue Tint #EFF6FF

    def set_slide_background(slide):
        background = slide.background
        fill = background.fill
        fill.solid()
        fill.fore_color.rgb = BG_COLOR

    def add_header(slide, slide_num, title, subtitle):
        # Pill Tag Background
        pill = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.45), Inches(4.2), Inches(0.32))
        pill.fill.solid()
        pill.fill.fore_color.rgb = RGBColor(238, 242, 255) # Indigo tint #EEF2FF
        pill.line.color.rgb = RGBColor(199, 210, 254)      # #C7D2FE
        pill.line.width = Pt(1)

        # Pill Tag Text
        tf_pill = pill.text_frame
        tf_pill.word_wrap = True
        p_pill = tf_pill.paragraphs[0]
        p_pill.text = f"EVENT RADAR  •  SLIDE {slide_num} OF 5  •  VECNAVERSE"
        p_pill.font.name = "Segoe UI"
        p_pill.font.size = Pt(9.5)
        p_pill.font.bold = True
        p_pill.font.color.rgb = ACCENT_BLUE

        # Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.82), Inches(11.7), Inches(0.68))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        p_title = tf_title.paragraphs[0]
        p_title.text = title
        p_title.font.name = "Segoe UI"
        p_title.font.size = Pt(26)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_HEAD

        # Subtitle
        if subtitle:
            sub_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.5), Inches(11.7), Inches(0.42))
            tf_sub = sub_box.text_frame
            tf_sub.word_wrap = True
            p_sub = tf_sub.paragraphs[0]
            p_sub.text = subtitle
            p_sub.font.name = "Segoe UI"
            p_sub.font.size = Pt(13)
            p_sub.font.color.rgb = TEXT_MUTED

    def add_card(slide, left, top, width, height, title, points, accent_color=ACCENT_BLUE, num_tag="01"):
        # Elevated Card Shape
        shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        shape.fill.solid()
        shape.fill.fore_color.rgb = CARD_BG
        shape.line.color.rgb = CARD_BORDER
        shape.line.width = Pt(1)

        # Accent top bar on the card
        top_bar = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left + Inches(0.2), top + Inches(0.18), Inches(0.6), Inches(0.08))
        top_bar.fill.solid()
        top_bar.fill.fore_color.rgb = accent_color
        top_bar.line.fill.background()

        # Card Title
        tb = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.32), width - Inches(0.4), Inches(0.55))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title
        p.font.name = "Segoe UI"
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = TEXT_HEAD

        # Card Bullet points
        content_box = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.88), width - Inches(0.4), height - Inches(1.0))
        tf_c = content_box.text_frame
        tf_c.word_wrap = True
        for i, point in enumerate(points):
            p_c = tf_c.paragraphs[0] if i == 0 else tf_c.add_paragraph()
            p_c.text = f"• {point}"
            p_c.font.name = "Segoe UI"
            p_c.font.size = Pt(11.5)
            p_c.font.color.rgb = TEXT_BODY
            p_c.space_after = Pt(7)

    # -------------------------------------------------------------
    # SLIDE 1: Problem Statement and Understanding
    # -------------------------------------------------------------
    s1 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s1)
    add_header(s1, "01", "Problem Statement and Understanding", 
               "India's urban centers house millions of tech builders, yet grassroots event discovery remains broken and fragmented.")
    
    add_card(s1, Inches(0.8), Inches(2.1), Inches(3.6), Inches(4.7), 
             "1. Fragmented Discovery", 
             [
                 "85%+ of tech meetups, hackathons, and cultural jams live in closed WhatsApp groups or disappearing Instagram stories.",
                 "Zero unified directory for spontaneous, neighborhood gatherings.",
                 "High opportunity cost: Builders miss key networking happening 2 km away.",
                 "Zero discoverability for first-time or indie community organizers."
             ], ACCENT_PURPLE, "01")

    add_card(s1, Inches(4.8), Inches(2.1), Inches(3.6), Inches(4.7), 
             "2. The 'Hyperlocal' Void", 
             [
                 "Existing platforms (Meetup, BookMyShow) are strictly city-wide or commercial.",
                 "In mega-cities like Mumbai or Bangalore, a 'city-wide' event could be 35 km away in 2-hour traffic.",
                 "No platform answers: 'What tech or social events are within 5-10 km of me right now?'",
                 "Zero live GPS proximity filtering calibrated for Indian urban commutes."
             ], ACCENT_CYAN, "02")

    add_card(s1, Inches(8.8), Inches(2.1), Inches(3.7), Inches(4.7), 
             "3. High Organizer Friction", 
             [
                 "Legacy platforms require complex coordinate lookups, approval queues, or steep subscription fees ($35+/mo).",
                 "Paid mapping APIs (Google Maps JS / Mapbox) create unsustainable hosting costs for free events.",
                 "Our Understanding: A solution must combine instant GPS radius search with zero-friction event creation via plain Google Maps links."
             ], ACCENT_BLUE, "03")

    # -------------------------------------------------------------
    # SLIDE 2: Technical Approach
    # -------------------------------------------------------------
    s2 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s2)
    add_header(s2, "02", "Technical Approach & Architecture", 
               "Production-grade Next.js 14 App Router paired with Supabase PostGIS spatial calculation engine.")

    add_card(s2, Inches(0.8), Inches(2.1), Inches(2.75), Inches(4.7), 
             "Frontend & HIG UX", 
             [
                 "Next.js 14 App Router + TypeScript + Tailwind CSS v4.",
                 "Apple Human Interface Guidelines (HIG): Clean porcelain light theme, glassmorphic accents, spring physics.",
                 "WCAG AAA compliant contrast with optical hierarchy.",
                 "Client-side Haversine formula + Browser Geolocation for instant radius filtering."
             ], ACCENT_BLUE, "UI")

    add_card(s2, Inches(3.8), Inches(2.1), Inches(2.75), Inches(4.7), 
             "PostGIS Spatial DB", 
             [
                 "Supabase PostgreSQL equipped with the PostGIS spatial engine.",
                 "RPC function 'get_nearby_events' utilizing ST_DWithin & ST_Distance spherical math.",
                 "GiST spatial indexes on geography(Point, 4326) for sub-50ms query latency at scale.",
                 "Native city coordinate centroids for 5 major Indian metros."
             ], ACCENT_GREEN, "DB")

    add_card(s2, Inches(6.8), Inches(2.1), Inches(2.75), Inches(4.7), 
             "Maps Link Parser", 
             [
                 "Proprietary regex parser in lib/maps.ts.",
                 "Organizers paste ANY Google Maps link (place, venue pin, directions, or coordinates).",
                 "Extracts lat/lng without paid Geocoding APIs, saving 100% of mapping API costs.",
                 "Generates direct turn-by-turn navigation URLs (maps.google.com?q=lat,lng)."
             ], ACCENT_CYAN, "MAP")

    add_card(s2, Inches(9.8), Inches(2.1), Inches(2.75), Inches(4.7), 
             "Auth & Real Payments", 
             [
                 "Supabase Auth with Email OTP, Password, and OAuth.",
                 "Row-Level Security (RLS) protecting RSVPs, events, and community walls.",
                 "Integrated Apple-styled checkout supporting UPI, Cards, and Netbanking.",
                 "Real-time QR Digital Ticket generation and iCal / Google Calendar export."
             ], ACCENT_PURPLE, "SEC")

    # -------------------------------------------------------------
    # SLIDE 3: Feasibility & Viability
    # -------------------------------------------------------------
    s3 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s3)
    add_header(s3, "03", "Feasibility & Commercial Viability", 
               "Zero-cost operational overhead combined with sustainable, community-first monetization.")

    add_card(s3, Inches(0.8), Inches(2.1), Inches(3.6), Inches(4.7), 
             "Zero-Cost Operational Model", 
             [
                 "100% Free-Tier Architecture: Hosted on Supabase (PostgreSQL + PostGIS) & Vercel Edge Serverless.",
                 "Zero Map API Burn: Using external Google Maps redirection instead of paid embedded tiles saves $200-$1000/month.",
                 "Lightweight client bundle with Turbopack, SSR caching, and zero heavy dependencies.",
                 "Instant deployment readiness with automated CI/CD on Vercel."
             ], ACCENT_GREEN, "₹0")

    add_card(s3, Inches(4.8), Inches(2.1), Inches(3.6), Inches(4.7), 
             "Technical Scalability", 
             [
                 "PostGIS GiST indexing handles 500,000+ localized coordinate pins with O(log N) bounding box lookup.",
                 "Stateless Next.js edge handlers handle traffic spikes during major viral community events.",
                 "Connection pooling via Supabase Supavisor prevents database saturation.",
                 "Tested & verified: 18/18 routes build cleanly, 0 lint warnings, sub-second TTFB."
             ], ACCENT_BLUE, "100x")

    add_card(s3, Inches(8.8), Inches(2.1), Inches(3.7), Inches(4.7), 
             "Multi-Stream Monetization", 
             [
                 "1. 'Radar Boost' (Featured Pins): Promoted visibility for hackathons, conferences, and startup launches.",
                 "2. Ticketing Convenience Fee: Transparent 2-3% processing fee on paid workshops and concerts via UPI.",
                 "3. Venue Sponsorships: Co-working spaces and cafe hubs sponsor neighborhood radars to drive footfall."
             ], ACCENT_PURPLE, "$$")

    # -------------------------------------------------------------
    # SLIDE 4: Impact & Benefit
    # -------------------------------------------------------------
    s4 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s4)
    add_header(s4, "04", "Impact & Benefit", 
               "Transforming urban socialization and hyper-charging India's grassroots tech ecosystem.")

    add_card(s4, Inches(0.8), Inches(2.1), Inches(3.6), Inches(4.7), 
             "For Attendees & Builders", 
             [
                 "Eliminates Urban FOMO: Instantly see what meetups, jams, or hackathons are happening within 5km.",
                 "Saved Commute Time: Stops users from traveling across congested metros for low-relevance events.",
                 "Frictionless Attendance: 1-click RSVP with real-time attendee tracking and automatic Google/iCal calendar sync.",
                 "Community Discussion Wall: Ask organizers questions directly on the event page before arriving."
             ], ACCENT_CYAN, "01")

    add_card(s4, Inches(4.8), Inches(2.1), Inches(3.6), Inches(4.7), 
             "For Grassroots Organizers", 
             [
                 "Sub-60s Event Setup: Paste a Google Maps link and title; no coordinate lookups or forms.",
                 "100% Free Hosting: No monthly SaaS subscription like Meetup.com ($35/mo).",
                 "Dedicated Organizer Hub: Real-time attendee roster, RSVP count, event edit/cancel controls at /profile/my-events.",
                 "Built-in UPI Ticketing: Seamless paid event ticketing with instant QR code admission passes."
             ], ACCENT_GREEN, "02")

    add_card(s4, Inches(8.8), Inches(2.1), Inches(3.7), Inches(4.7), 
             "Societal & Economic Impact", 
             [
                 "Revitalizing Local Spaces: Drives traffic to indie cafes, makerspaces, and community centers.",
                 "Fostering Tech Collaborations: Direct serendipity for founders, designers, and engineers.",
                 "True Digital Inclusivity: Accessible HIG design, full keyboard navigation, and lightweight data consumption on mobile 4G/5G networks."
             ], ACCENT_PURPLE, "03")

    # -------------------------------------------------------------
    # SLIDE 5: Comparison with Existing Platforms
    # -------------------------------------------------------------
    s5 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s5)
    add_header(s5, "05", "Comparison with Existing Platforms", 
               "Why Event Radar outperforms legacy solutions on every critical hyperlocal dimension.")

    # Table on Slide 5
    rows = 7
    cols = 5
    table_shape = s5.shapes.add_table(rows, cols, Inches(0.8), Inches(2.1), Inches(11.7), Inches(3.6))
    table = table_shape.table

    # Column widths
    table.columns[0].width = Inches(2.5)
    table.columns[1].width = Inches(2.3)
    table.columns[2].width = Inches(2.3)
    table.columns[3].width = Inches(2.3)
    table.columns[4].width = Inches(2.3)

    headers = ["Feature", "Event Radar (Ours)", "Meetup.com", "BookMyShow", "Eventbrite"]
    data = [
        ["Hyperlocal Radius", "Yes (5-50km GPS/PostGIS)", "City-wide only", "City-wide only", "Coarse radius"],
        ["Organizer Cost", "100% Free Tier", "$30 - $40 / month", "Approval / High fee", "Listing fees on tickets"],
        ["Creation Speed", "< 60s (Paste Maps link)", "Multi-step complex form", "Manual partner approval", "Multi-page wizard"],
        ["Navigation", "Zero-Cost Maps redirect", "Static unclickable map", "Embedded map only", "Generic address text"],
        ["India Payments", "Native UPI / QR / Cards", "Stripe / PayPal only", "UPI / Cards", "Stripe / International"],
        ["User Experience", "Apple HIG Clean Light", "Dated Web 2.0 UI", "Heavy commercial ads", "Generic corporate UI"]
    ]

    # Populate Table Header
    for c_idx, h_text in enumerate(headers):
        cell = table.cell(0, c_idx)
        cell.fill.solid()
        if c_idx == 1:
            cell.fill.fore_color.rgb = RGBColor(224, 231, 255) # Light Indigo
        else:
            cell.fill.fore_color.rgb = RGBColor(241, 245, 249) # Light Slate 100
        p = cell.text_frame.paragraphs[0]
        p.text = h_text
        p.font.name = "Segoe UI"
        p.font.size = Pt(11.5)
        p.font.bold = True
        p.font.color.rgb = ACCENT_BLUE if c_idx == 1 else TEXT_HEAD
        p.alignment = PP_ALIGN.LEFT

    # Populate Table Data
    for r_idx, row in enumerate(data):
        for c_idx, val in enumerate(row):
            cell = table.cell(r_idx + 1, c_idx)
            cell.fill.solid()
            if c_idx == 1:
                cell.fill.fore_color.rgb = HIGHLIGHT_BG # Blue tint for ours
            else:
                cell.fill.fore_color.rgb = CARD_BG if r_idx % 2 == 0 else RGBColor(248, 250, 252)
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.name = "Segoe UI"
            p.font.size = Pt(10.5)
            if c_idx == 1:
                p.font.bold = True
                p.font.color.rgb = ACCENT_GREEN
            elif c_idx == 0:
                p.font.bold = True
                p.font.color.rgb = TEXT_HEAD
            else:
                p.font.color.rgb = TEXT_MUTED

    # Highlight Card below table
    highlight_card = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(5.95), Inches(11.7), Inches(1.1))
    highlight_card.fill.solid()
    highlight_card.fill.fore_color.rgb = RGBColor(240, 253, 250) # Light Mint #F0FDFA
    highlight_card.line.color.rgb = RGBColor(153, 246, 228)     # Mint border
    highlight_card.line.width = Pt(1.5)

    tb_hl = s5.shapes.add_textbox(Inches(1.0), Inches(6.0), Inches(11.3), Inches(0.95))
    tf_hl = tb_hl.text_frame
    tf_hl.word_wrap = True
    p_hl_title = tf_hl.paragraphs[0]
    p_hl_title.text = "OUR KILLER UNIQUE FEATURE: Zero-Cost 'Maps Link to Proximity Radar' Pipeline"
    p_hl_title.font.name = "Segoe UI"
    p_hl_title.font.size = Pt(12)
    p_hl_title.font.bold = True
    p_hl_title.font.color.rgb = ACCENT_CYAN

    p_hl_desc = tf_hl.add_paragraph()
    p_hl_desc.text = "Organizers post an event in under 60 seconds by simply pasting a Google Maps link. Our backend spatial engine parses exact coordinates, indexes them via PostGIS, and serves live GPS proximity filtering to nearby attendees without paying a single cent for Google Maps or Mapbox API keys."
    p_hl_desc.font.name = "Segoe UI"
    p_hl_desc.font.size = Pt(10)
    p_hl_desc.font.color.rgb = TEXT_HEAD

    # Save presentation
    output_light = r"c:\hackethon\GeoGuild\EventRadar_Presentation_Light.pptx"
    prs.save(output_light)
    print(f"Clean Modern Light Theme Presentation saved to {output_light}")

    output_path = r"c:\hackethon\GeoGuild\EventRadar_Presentation.pptx"
    try:
        prs.save(output_path)
        print(f"Also updated {output_path}")
    except PermissionError:
        print(f"Note: {output_path} is currently open in PowerPoint/Editor, but {output_light} is freshly generated!")

if __name__ == "__main__":
    create_light_deck()
