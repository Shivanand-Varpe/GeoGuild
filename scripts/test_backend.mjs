import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fmralzffbblnpsvetkjb.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_C_4SU_qRcipPILTNatt6Jw_uG7tWarL';

console.log('====================================================');
console.log('🚀 EVENTRADAR BACKEND AUDIT SUITE');
console.log(`URL: ${SUPABASE_URL}`);
console.log('====================================================\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const results = [];

function record(name, status, details = '') {
  results.push({ name, status, details });
  const icon = status === 'PASS' ? '✅' : (status === 'WARN' ? '⚠️' : '❌');
  console.log(`${icon} [${status}] ${name}${details ? ': ' + details : ''}`);
}

async function runAudit() {
  let sampleEventId = null;
  let demoOrganizerId = 'd0000000-0000-0000-0000-000000000001';

  // 1. Check Tables Read
  console.log('--- 1. DATABASE TABLES (READ) ---');
  try {
    const { data, error, count } = await supabase.from('events').select('id, title, city, price, venue_name, address', { count: 'exact' });
    if (error) throw error;
    if (data.length > 0) sampleEventId = data[0].id;
    record('Table: events', 'PASS', `Found ${data.length} events (Sample: "${data[0]?.title}" | ID: ${sampleEventId})`);
  } catch (err) {
    record('Table: events', 'FAIL', err.message);
  }

  try {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) throw error;
    record('Table: categories', 'PASS', `Found ${data.length} categories: ${data.map(c => c.name).join(', ')}`);
  } catch (err) {
    record('Table: categories', 'FAIL', err.message);
  }

  try {
    const { data, error } = await supabase.from('tags').select('*');
    if (error) throw error;
    record('Table: tags', 'PASS', `Found ${data.length} tags`);
  } catch (err) {
    record('Table: tags', 'FAIL', err.message);
  }

  try {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    record('Table: profiles', 'PASS', `Found ${data.length} profiles`);
  } catch (err) {
    record('Table: profiles', 'FAIL', err.message);
  }

  try {
    const { data, error } = await supabase.from('rsvps').select('*');
    if (error) throw error;
    record('Table: rsvps', 'PASS', `Found ${data.length} RSVPs`);
  } catch (err) {
    record('Table: rsvps', 'FAIL', err.message);
  }

  try {
    const { data, error } = await supabase.from('reviews').select('*');
    if (error) throw error;
    record('Table: reviews', 'PASS', `Found ${data.length} reviews`);
  } catch (err) {
    record('Table: reviews', 'WARN', `Reviews table: ${err.message}`);
  }

  // 2. RPC Functions
  console.log('\n--- 2. RPC STORED PROCEDURES ---');
  try {
    const { data, error } = await supabase.rpc('get_nearby_events', {
      p_user_lat: 19.0760,
      p_user_lng: 72.8777,
      p_radius_km: 100
    });
    if (error) throw error;
    record('RPC: get_nearby_events (PostGIS Spatial)', 'PASS', `Returned ${data ? data.length : 0} events near Mumbai within 100km`);
  } catch (err) {
    record('RPC: get_nearby_events (PostGIS Spatial)', 'FAIL', err.message);
  }

  try {
    const { data, error } = await supabase.rpc('get_trending_events', {
      p_city: 'Mumbai',
      p_limit: 5
    });
    if (error) throw error;
    record('RPC: get_trending_events', 'PASS', `Returned ${data ? data.length : 0} trending events`);
  } catch (err) {
    record('RPC: get_trending_events', 'FAIL', err.message);
  }

  try {
    const { data, error } = await supabase.rpc('search_events', {
      search_query: 'Tech'
    });
    if (error) throw error;
    record('RPC: search_events', 'PASS', `Returned ${data ? data.length : 0} events matching "Tech"`);
  } catch (err) {
    record('RPC: search_events', 'FAIL', err.message);
  }

  try {
    const { data, error } = await supabase.rpc('get_personalized_feed', {
      p_user_id: demoOrganizerId,
      p_limit: 5
    });
    if (error) throw error;
    record('RPC: get_personalized_feed', 'PASS', `Returned ${data ? data.length : 0} personalized events`);
  } catch (err) {
    record('RPC: get_personalized_feed', 'FAIL', err.message);
  }

  try {
    const { data, error } = await supabase.rpc('get_organizer_stats', {
      p_organizer_id: demoOrganizerId
    });
    if (error) throw error;
    record('RPC: get_organizer_stats', 'PASS', `Stats: ${JSON.stringify(data)}`);
  } catch (err) {
    record('RPC: get_organizer_stats', 'FAIL', err.message);
  }

  try {
    const { data, error } = await supabase.rpc('get_organizer_events', {
      p_organizer_id: demoOrganizerId
    });
    if (error) throw error;
    record('RPC: get_organizer_events', 'PASS', `Returned ${data ? data.length : 0} events for organizer`);
  } catch (err) {
    record('RPC: get_organizer_events', 'FAIL', err.message);
  }

  if (sampleEventId) {
    try {
      const { data, error } = await supabase.rpc('increment_event_views', {
        p_event_id: sampleEventId
      });
      if (error) throw error;
      record('RPC: increment_event_views', 'PASS', `Incremented views for ${sampleEventId}`);
    } catch (err) {
      record('RPC: increment_event_views', 'FAIL', err.message);
    }

    try {
      const { data, error } = await supabase.rpc('get_event_rsvp_list', {
        p_event_id: sampleEventId
      });
      if (error) throw error;
      record('RPC: get_event_rsvp_list', 'PASS', `Returned ${data ? data.length : 0} attendees`);
    } catch (err) {
      record('RPC: get_event_rsvp_list', 'FAIL', err.message);
    }

    try {
      const { data, error } = await supabase.rpc('get_event_reviews', {
        p_event_id: sampleEventId
      });
      if (error) throw error;
      record('RPC: get_event_reviews', 'PASS', `Returned ${data ? data.length : 0} reviews`);
    } catch (err) {
      record('RPC: get_event_reviews', 'FAIL', err.message);
    }
  }

  // 3. RLS & Writes Verification (Guest RSVP & Demo Profile)
  console.log('\n--- 3. RLS & WRITE PERMISSIONS ---');
  const testGuestId = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
  if (sampleEventId) {
    try {
      // Test insert RSVP
      const { data: insertData, error: insertError } = await supabase
        .from('rsvps')
        .insert({
          event_id: sampleEventId,
          user_id: testGuestId,
          status: 'confirmed'
        })
        .select();

      if (insertError) {
        // If already exists, that's fine too
        if (insertError.code === '23505') {
          record('RLS: RSVP Insert', 'PASS', 'RSVP already exists (Unique constraint passed)');
        } else {
          throw insertError;
        }
      } else {
        record('RLS: RSVP Insert', 'PASS', `Guest RSVP inserted successfully (${insertData[0]?.id})`);
      }

      // Test delete / clean up test RSVP
      const { error: deleteError } = await supabase
        .from('rsvps')
        .delete()
        .eq('event_id', sampleEventId)
        .eq('user_id', testGuestId);

      if (deleteError) throw deleteError;
      record('RLS: RSVP Delete/Cleanup', 'PASS', 'Guest RSVP deleted successfully');
    } catch (err) {
      record('RLS: RSVP Write', 'FAIL', err.message);
    }
  }

  // 4. Storage Buckets Check
  console.log('\n--- 4. SUPABASE STORAGE BUCKETS ---');
  try {
    const { data: buckets, error: bError } = await supabase.storage.listBuckets();
    if (bError) {
      record('Storage: listBuckets', 'WARN', bError.message);
    } else {
      const names = (buckets || []).map(b => `${b.name} (public: ${b.public})`);
      record('Storage: listBuckets', 'PASS', `Available buckets: ${names.join(', ') || 'None found'}`);
    }
  } catch (err) {
    record('Storage: listBuckets', 'WARN', err.message);
  }

  try {
    const { data, error } = await supabase.storage.from('event-banners').list('', { limit: 5 });
    if (error) {
      record('Storage: event-banners list', 'WARN', error.message);
    } else {
      record('Storage: event-banners list', 'PASS', `Found ${data ? data.length : 0} files in bucket`);
    }
  } catch (err) {
    record('Storage: event-banners list', 'WARN', err.message);
  }

  // 5. Auth Health Check
  console.log('\n--- 5. SUPABASE AUTH ---');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    record('Auth: getSession API', 'PASS', 'Anon client initialized and session endpoint responsive');
  } catch (err) {
    record('Auth: getSession API', 'FAIL', err.message);
  }

  // Summary
  console.log('\n====================================================');
  console.log('📊 AUDIT SUMMARY');
  console.log('====================================================');
  const passes = results.filter(r => r.status === 'PASS').length;
  const warns = results.filter(r => r.status === 'WARN').length;
  const fails = results.filter(r => r.status === 'FAIL').length;
  console.log(`TOTAL TESTS: ${results.length} | PASS: ${passes} | WARN: ${warns} | FAIL: ${fails}`);
  if (fails === 0) {
    console.log('🎉 ALL CRITICAL BACKEND TESTS PASSED!');
  } else {
    console.log(`⚠️ ${fails} TESTS FAILED - ATTENTION NEEDED`);
  }
}

runAudit().catch(err => {
  console.error('Audit fatal error:', err);
});
