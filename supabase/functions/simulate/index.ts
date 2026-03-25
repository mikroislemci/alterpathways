import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Simulation request received');

    // Environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY') ?? '';

    console.log('🔧 ENV CHECK:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasOpenAI: !!openaiApiKey,
    });

    // Create Supabase client with SERVICE ROLE KEY to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { simulation_text, user_id } = await req.json();

    if (!simulation_text || !user_id) {
      console.error('❌ Missing required fields');
      return new Response(
        JSON.stringify({ code: 400, message: 'Missing simulation_text or user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📊 Fetching/creating user profile for:', user_id);

    // Try to fetch user profile
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('free_runs_left, membership_type')
      .eq('id', user_id)
      .single();

    // If profile doesn't exist, create it
    if (profileError && profileError.code === 'PGRST116') {
      console.log('🆕 Profile not found, creating new profile...');
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user_id,
          free_runs_left: 3,
          membership_type: 'Free'
        })
        .select('free_runs_left, membership_type')
        .single();

      if (createError) {
        console.error('❌ Failed to create profile:', createError);
        return new Response(
          JSON.stringify({ code: 500, message: 'Failed to create user profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      profile = newProfile;
      console.log('✅ New profile created:', profile);
    } else if (profileError) {
      console.error('❌ Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ code: 500, message: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User profile:', profile);

    // Check free runs
    if (profile.membership_type === 'Free' && profile.free_runs_left <= 0) {
      console.log('❌ No free runs left');
      return new Response(
        JSON.stringify({ code: 403, message: 'No free runs left' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🤖 Generating simulation with OpenAI...');

    // OpenAI API call
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a life path simulator. Analyze the user's "what if" scenario and provide:

1. A detailed narrative (200-300 words) exploring how their life might have unfolded
2. Butterfly scores comparing current life vs alternative path (0-100 for each):
   - Wealth: Financial prosperity and material success
   - Emotional Peace: Inner calm, contentment, and mental well-being
   - Stress: Level of pressure, anxiety, and life challenges (higher = more stress)
   - Social Impact: Influence on others and contribution to society

3. A profound insight (50-100 words) about the nature of choices and paths not taken

Return ONLY valid JSON in this exact format:
{
  "narrative": "detailed story here",
  "butterfly_scores": {
    "current_life": {
      "wealth": 65,
      "emotional_peace": 70,
      "stress": 60,
      "social_impact": 55
    },
    "alternative_path": {
      "wealth": 80,
      "emotional_peace": 50,
      "stress": 85,
      "social_impact": 75
    }
  },
  "ghost_message": {
    "paragraphs": [
      "First paragraph of the letter...",
      "Second paragraph...",
      "Third paragraph..."
    ],
    "signature": "Your alternate self"
  },
  "insight": "profound reflection here"
}`
          },
          {
            role: 'user',
            content: simulation_text
          }
        ],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('❌ OpenAI API error:', errorText);
      return new Response(
        JSON.stringify({ code: 500, message: 'AI generation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiData = await openaiResponse.json();
    const aiContent = openaiData.choices[0].message.content;

    console.log('✅ OpenAI response received');

    // Parse JSON
    let simulationResult;
    try {
      simulationResult = JSON.parse(aiContent);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ code: 500, message: 'Invalid AI response format' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('💾 Saving simulation to database...');

    // Save simulation
    const { error: insertError } = await supabase
      .from('simulations')
      .insert({
        user_id,
        simulation_text,
        narrative: simulationResult.narrative,
        butterfly_scores: simulationResult.butterfly_scores,
        ghost_message: simulationResult.ghost_message,
        insight: simulationResult.insight,
      });

    if (insertError) {
      console.error('❌ Database insert error:', insertError);
      return new Response(
        JSON.stringify({ code: 500, message: 'Failed to save simulation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ Only deduct credit AFTER successful save
    if (profile.membership_type === 'Free') {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ free_runs_left: profile.free_runs_left - 1 })
        .eq('id', user_id);
      if (updateError) {
        console.error('❌ Credit deduction error:', updateError);
      }
    }

    console.log('🎉 Simulation completed successfully!');

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        narrative: simulationResult.narrative,
        butterfly_scores: simulationResult.butterfly_scores,
        ghost_message: simulationResult.ghost_message,
        insight: simulationResult.insight,
        free_runs_left: profile.membership_type === 'Free' ? profile.free_runs_left - 1 : null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ code: 500, message: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
