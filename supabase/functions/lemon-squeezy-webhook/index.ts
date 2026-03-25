import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🎯 Webhook received from Lemon Squeezy');

    const signature = req.headers.get('x-signature');
    const rawBody = await req.text();

    console.log('📝 Signature present:', !!signature);
    console.log('📦 Body length:', rawBody.length);

    const secret = Deno.env.get('LEMON_WEBHOOK_SECRET') ?? '';
    if (!secret) {
      console.error('❌ LEMON_WEBHOOK_SECRET environment variable is not set');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (signature) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
      const computedSignature = Array.from(new Uint8Array(signatureBytes))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      if (computedSignature !== signature) {
        console.error('❌ Signature verification failed');
        console.error('Expected:', computedSignature);
        console.error('Received:', signature);
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('✅ Signature verified successfully');
    } else {
      console.warn('⚠️ No signature provided, skipping verification');
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta?.event_name;

    console.log('📋 Event type:', eventName);
    console.log('📋 Full payload meta:', JSON.stringify(payload.meta, null, 2));
    console.log('📋 Full payload data attributes:', JSON.stringify(payload.data?.attributes, null, 2));

    if (!['order_created', 'subscription_created', 'subscription_updated'].includes(eventName)) {
      console.log('ℹ️ Ignoring event:', eventName);
      return new Response(JSON.stringify({ message: 'Event ignored' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ─── IDEMPOTENCY CHECK ────────────────────────────────────────────
    // Use data.id as the unique order/subscription identifier
    const orderId = String(payload.data?.id ?? '');

    if (!orderId) {
      console.error('❌ No order/subscription ID found in payload');
      return new Response(JSON.stringify({ error: 'Missing order ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🔑 Order/Subscription ID:', orderId);

    const { data: existingEvent, error: eventCheckError } = await supabase
      .from('lemon_events')
      .select('order_id, processed_at')
      .eq('order_id', orderId)
      .maybeSingle();

    if (eventCheckError) {
      console.error('❌ Error checking lemon_events:', eventCheckError);
      // Don't block processing on check error — log and continue
    }

    if (existingEvent) {
      console.warn('⚠️ Duplicate event detected — already processed at:', existingEvent.processed_at);
      return new Response(
        JSON.stringify({ message: 'Event already processed', order_id: orderId }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ New event — proceeding with processing');
    // ─────────────────────────────────────────────────────────────────

    // Resolve user_id
    let userId =
      payload.meta?.custom_data?.user_id ||
      payload.data?.attributes?.order?.custom_data?.user_id ||
      payload.data?.attributes?.custom_data?.user_id;

    let matchMethod = 'custom_data.user_id';
    console.log('👤 User ID from custom_data:', userId);

    if (!userId) {
      console.log('🔍 No user_id in custom_data, attempting email match...');
      const userEmail = payload.data?.attributes?.user_email;
      console.log('📧 Searching for user with email:', userEmail);

      if (userEmail) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('email', userEmail)
          .maybeSingle();

        if (profileError) {
          console.error('❌ Error finding user by email:', profileError);
        } else if (profile) {
          userId = profile.id;
          matchMethod = 'email';
          console.log('✅ User matched by email:', userEmail, '→ ID:', userId);
        }
      }
    }

    if (!userId) {
      console.error('❌ No user found for this payment');
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ User identified via:', matchMethod);

    // Determine product & build updateData
    let updateData: Record<string, unknown> = {};
    let creditsAdded = 0;

    const productName =
      payload.data?.attributes?.first_order_item?.product_name ||
      payload.data?.attributes?.product_name ||
      '';
    const variantName =
      payload.data?.attributes?.first_order_item?.variant_name ||
      payload.data?.attributes?.variant_name ||
      '';

    console.log('🛍️ Product:', productName, '| Variant:', variantName);

    const fullProductInfo = `${productName} ${variantName}`.toLowerCase();
    console.log('🔍 Full product info:', fullProductInfo);

    if (
      fullProductInfo.includes('10 simulation') ||
      fullProductInfo.includes('10 pack') ||
      fullProductInfo.includes('10-pack') ||
      fullProductInfo.includes('10 runs') ||
      productName.toLowerCase().includes('10 simulation')
    ) {
      // ── 10-run pack ──────────────────────────────────────────────────
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('free_runs_left, email')
        .eq('id', userId)
        .maybeSingle();

      if (fetchError) {
        console.error('❌ Error fetching profile:', fetchError);
      }

      const currentRuns = profile?.free_runs_left ?? 0;
      creditsAdded = 10;
      updateData = { free_runs_left: currentRuns + 10 };

      console.log(`➕ Adding 10 runs: ${currentRuns} → ${currentRuns + 10}`);
    } else if (
      fullProductInfo.includes('monthly') ||
      fullProductInfo.includes('annual') ||
      fullProductInfo.includes('unlimited') ||
      fullProductInfo.includes('premium subscription')
    ) {
      // ── Premium subscription ──────────────────────────────────────────
      updateData = {
        membership_type: 'Premium',
        premium_since: new Date().toISOString(),
      };
      console.log('⭐ Upgrading to Premium membership');
    } else {
      console.warn('⚠️ Unknown product type — productName:', productName, '| variantName:', variantName);
      console.warn('⚠️ first_order_item:', JSON.stringify(payload.data?.attributes?.first_order_item, null, 2));
    }

    if (Object.keys(updateData).length === 0) {
      console.error('❌ No update data generated — unknown product');
      return new Response(JSON.stringify({ error: 'Unknown product type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('💾 Updating profile with:', updateData);

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating profile:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Profile updated successfully:', updatedProfile);

    // ─── RECORD EVENT (idempotency write) ─────────────────────────────
    const { error: insertEventError } = await supabase
      .from('lemon_events')
      .insert({ order_id: orderId });

    if (insertEventError) {
      // Non-fatal — profile already updated, just log
      console.error('⚠️ Failed to record lemon_event (non-fatal):', insertEventError);
    } else {
      console.log('📝 lemon_events record saved for order_id:', orderId);
    }
    // ──────────────────────────────────────────────────────────────────

    if (creditsAdded > 0) {
      console.log(
        `🎉 SUCCESS: User ${updatedProfile.email} received ${creditsAdded} credits. New balance: ${updatedProfile.free_runs_left}`
      );
    } else {
      console.log(`🎉 SUCCESS: User ${updatedProfile.email} upgraded to Premium`);
    }

    return new Response(JSON.stringify({ success: true, profile: updatedProfile }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
