
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecipeData {
  id: string;
  name: string;
  portions: number;
  total_cost: number;
  selling_price: number;
  profit_margin: number;
  notes: string;
  ingredients: any[];
  steps: any[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { recipeId } = await req.json();
    
    // Get recipe data with all related information
    const { data: recipe, error: recipeError } = await supabaseClient
      .from('recipe_scandallos')
      .select(`
        *,
        recipe_ingredients (*),
        recipe_steps (*),
        menu_items (name, price)
      `)
      .eq('id', recipeId)
      .single();

    if (recipeError) {
      throw new Error(`Error fetching recipe: ${recipeError.message}`);
    }

    // Use the n8n webhook URL directly
    const webhookUrl = 'https://n8n-n8n.mdrxie.easypanel.host/webhook/bef5925b-45d4-4f5d-a3ab-eb59afb62659';

    // Format recipe data
    const formattedData: RecipeData = {
      id: recipe.id,
      name: recipe.name,
      portions: recipe.portions,
      total_cost: recipe.total_cost || 0,
      selling_price: recipe.selling_price || 0,
      profit_margin: recipe.profit_margin || 0,
      notes: recipe.notes || '',
      ingredients: recipe.recipe_ingredients || [],
      steps: recipe.recipe_steps || []
    };

    console.log('Sending recipe to n8n webhook:', formattedData.name);

    // Send to n8n webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'recipe_data',
        data: formattedData,
        timestamp: new Date().toISOString()
      }),
    });

    if (!webhookResponse.ok) {
      throw new Error(`N8N Webhook failed: ${webhookResponse.status} ${webhookResponse.statusText}`);
    }

    const result = await webhookResponse.json().catch(() => ({}));

    console.log('Recipe sent successfully to n8n webhook');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Escandallo enviado correctamente a n8n',
        webhookResponse: result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in send-recipe function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
