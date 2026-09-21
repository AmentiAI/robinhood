import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/database';
import { buildGenerationPrompt } from '@/lib/generation/build-prompt';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!sql) {
    return NextResponse.json({ error: 'Database connection not available' }, { status: 500 });
  }

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const traitFilters = searchParams.get('traitFilters');
    const parsedFilters = traitFilters ? JSON.parse(traitFilters) : {};

    // Get collection details
    const collectionResult = await sql`
      SELECT id, name, description, art_style, border_requirements, custom_rules, colors_description, lighting_description,
             COALESCE(is_pfp_collection, false) as is_pfp_collection,
             facing_direction,
             COALESCE(body_style, 'full') as body_style,
             COALESCE(pixel_perfect, false) as pixel_perfect,
             wireframe_config
      FROM collections
      WHERE id = ${id}::uuid
    `;

    const collection = Array.isArray(collectionResult) && collectionResult.length > 0 
      ? collectionResult[0] as any
      : null;
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Ensure boolean values are properly converted
    if (typeof collection.is_pfp_collection === 'string') {
      collection.is_pfp_collection = collection.is_pfp_collection === 'true' || collection.is_pfp_collection === 't';
    }
    if (typeof collection.pixel_perfect === 'string') {
      collection.pixel_perfect = collection.pixel_perfect === 'true' || collection.pixel_perfect === 't';
    }
    collection.is_pfp_collection = Boolean(collection.is_pfp_collection);
    collection.pixel_perfect = Boolean(collection.pixel_perfect);

    // Parse wireframe_config if it's a string
    if (collection.wireframe_config && typeof collection.wireframe_config === 'string') {
      try {
        collection.wireframe_config = JSON.parse(collection.wireframe_config);
      } catch (e) {
        collection.wireframe_config = null;
      }
    }

    // Get all layers
    const layersResult = await sql`
      SELECT id, name, display_order
      FROM layers
      WHERE collection_id = ${id}::uuid
      ORDER BY display_order ASC
    `;

    const layers = Array.isArray(layersResult) ? layersResult : [];
    if (layers.length === 0) {
      return NextResponse.json({ error: 'No layers found' }, { status: 400 });
    }

    // Select traits for each layer (use filters or random)
    const selectedTraits: Record<string, { name: string; description: string; trait_prompt: string }> = {};
    
    for (const layer of layers) {
      const layerAny = layer as any;
      
      // Check if this layer has a trait filter
      const hasFilter = parsedFilters[layerAny.name];
      
      let traitsResult;
      if (hasFilter) {
        // Use the specified trait from the filter
        // IMPORTANT: When user explicitly selects a trait via filters, allow it even if ignored
        // This allows users to generate with ignored traits when they explicitly choose them
        traitsResult = await sql`
          SELECT id, name, description, trait_prompt, rarity_weight
          FROM traits
          WHERE layer_id = ${layerAny.id} 
            AND name = ${hasFilter}
          LIMIT 1
        `;
      } else {
        // Get all traits with their weights (excluding ignored traits)
        const allTraitsResult = await sql`
          SELECT id, name, description, trait_prompt, rarity_weight
          FROM traits
          WHERE layer_id = ${layerAny.id}
            AND (is_ignored = false OR is_ignored IS NULL)
        `;
        
        const allTraits = Array.isArray(allTraitsResult) ? allTraitsResult : [];
        if (allTraits.length === 0) {
          return NextResponse.json({ error: `No traits found for layer: ${layerAny.name}` }, { status: 400 });
        }
        
        // Calculate total weight
        const totalWeight = allTraits.reduce((sum: number, trait: any) => sum + (parseInt((trait as any).rarity_weight) || 1), 0);
        
        // Generate random number
        const random = Math.random() * totalWeight;
        
        // Select trait based on weighted random
        let cumulativeWeight = 0;
        let selectedTrait: any = null;
        for (const trait of allTraits) {
          cumulativeWeight += parseInt((trait as any).rarity_weight) || 1;
          if (random <= cumulativeWeight) {
            selectedTrait = trait;
            break;
          }
        }
        
        // Fallback to last trait if none selected
        if (!selectedTrait) {
          selectedTrait = allTraits[allTraits.length - 1];
        }
        
        traitsResult = [selectedTrait];
      }

      const traits = Array.isArray(traitsResult) ? traitsResult : [];
      if (traits.length === 0) {
        const errorMessage = hasFilter
          ? `Trait "${hasFilter}" not found for layer: ${layerAny.name}. Note: Ignored traits can still be used when explicitly selected via filters.`
          : `No traits found for layer: ${layerAny.name}`;
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }

      const selectedTrait = traits[0] as any;
      selectedTraits[layerAny.name] = {
        name: selectedTrait.name,
        description: selectedTrait.description || '',
        trait_prompt: selectedTrait.trait_prompt || ''
      };
    }

    // Build prompt
    const prompt = buildGenerationPrompt(collection, selectedTraits);

    // Debug: Log prompt version marker to verify code is up to date
    console.log('[Example Prompt] Generated prompt via shared buildGenerationPrompt');

    // Debug: Log collection settings to help diagnose issues
    console.log('[Example Prompt] Collection settings:', {
      is_pfp_collection: collection.is_pfp_collection,
      facing_direction: collection.facing_direction,
      body_style: collection.body_style,
      pixel_perfect: collection.pixel_perfect,
      art_style: collection.art_style
    });

    return NextResponse.json({ 
      prompt, 
      traits: selectedTraits,
      collectionSettings: {
        is_pfp_collection: collection.is_pfp_collection,
        facing_direction: collection.facing_direction,
        body_style: collection.body_style
      }
    });
  } catch (error) {
    console.error('Error generating example prompt:', error);
    return NextResponse.json(
      { error: 'Failed to generate example prompt', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

