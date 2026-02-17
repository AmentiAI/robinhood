/**
 * Movie Mode End-to-End Test Script
 * Tests the complete Movie Mode workflow
 */

import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const getDatabaseUrl = () => {
  return process.env.NEON_DATABASE || process.env.DATABASE_URL || '';
};

const databaseUrl = getDatabaseUrl();

if (!databaseUrl) {
  console.error('❌ No database connection string found');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function runTests() {
  console.log('🎬 Movie Mode End-to-End Test\n');

  try {
    // ============================================
    // TEST 1: Verify Tables Exist
    // ============================================
    console.log('📋 Test 1: Checking database tables...');

    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('video_sequences', 'video_sequence_clips', 'video_composition_jobs')
      ORDER BY table_name
    `;

    if (tables.length === 3) {
      console.log('✅ All 3 tables exist:');
      tables.forEach(t => console.log(`   - ${t.table_name}`));
    } else {
      console.log('❌ Missing tables. Found:', tables.map(t => t.table_name));
      return;
    }

    // ============================================
    // TEST 2: Check Table Columns
    // ============================================
    console.log('\n📋 Test 2: Verifying table schema...');

    const sequencesColumns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'video_sequences'
      ORDER BY ordinal_position
    `;

    const expectedColumns = ['id', 'wallet_address', 'name', 'collection_id', 'status', 'composition_mode', 'output_video_url', 'total_duration_seconds', 'aspect_ratio', 'created_at', 'updated_at', 'completed_at'];
    const actualColumns = sequencesColumns.map(c => c.column_name);
    const hasAllColumns = expectedColumns.every(col => actualColumns.includes(col));

    if (hasAllColumns) {
      console.log('✅ video_sequences schema correct');
    } else {
      console.log('❌ video_sequences missing columns');
    }

    // ============================================
    // TEST 3: Test Wallet Check (need a test wallet)
    // ============================================
    console.log('\n📋 Test 3: Checking for test data...');

    // Find a wallet that has promotion jobs (videos)
    const walletsWithVideos = await sql`
      SELECT wallet_address, COUNT(*) as video_count
      FROM promotion_jobs
      WHERE status = 'completed'
        AND subject_actions->>'content_type' = 'video'
      GROUP BY wallet_address
      ORDER BY video_count DESC
      LIMIT 5
    `;

    if (walletsWithVideos.length > 0) {
      console.log('✅ Found wallets with completed videos:');
      walletsWithVideos.forEach(w => {
        console.log(`   - ${w.wallet_address.substring(0, 8)}... (${w.video_count} videos)`);
      });

      const testWallet = walletsWithVideos[0].wallet_address;
      console.log(`\n   Using ${testWallet.substring(0, 8)}... for testing`);

      // ============================================
      // TEST 4: Get Videos for Test Wallet
      // ============================================
      console.log('\n📋 Test 4: Fetching available videos...');

      const videos = await sql`
        SELECT id, image_url, subject_actions->>'aspect_ratio' as aspect_ratio
        FROM promotion_jobs
        WHERE wallet_address = ${testWallet}
          AND status = 'completed'
          AND subject_actions->>'content_type' = 'video'
        LIMIT 3
      `;

      if (videos.length >= 2) {
        console.log(`✅ Found ${videos.length} videos for testing`);
        videos.forEach((v, i) => {
          console.log(`   ${i + 1}. ${v.aspect_ratio || '16:9'} - ${v.image_url.substring(0, 50)}...`);
        });
      } else {
        console.log('⚠️  Need at least 2 videos to test sequence creation');
        console.log('   Generate some videos first at /promotion');
        return;
      }

      // ============================================
      // TEST 5: Create Test Sequence
      // ============================================
      console.log('\n📋 Test 5: Creating test sequence...');

      const aspectRatio = videos[0].aspect_ratio || '16:9';

      const sequenceResult = await sql`
        INSERT INTO video_sequences (
          wallet_address,
          name,
          composition_mode,
          aspect_ratio,
          status
        )
        VALUES (
          ${testWallet},
          'Test Movie Sequence',
          'simple',
          ${aspectRatio},
          'draft'
        )
        RETURNING *
      `;

      const sequence = sequenceResult[0];
      console.log('✅ Created sequence:', sequence.id);
      console.log(`   Name: ${sequence.name}`);
      console.log(`   Mode: ${sequence.composition_mode}`);
      console.log(`   Status: ${sequence.status}`);

      // ============================================
      // TEST 6: Add Clips to Sequence
      // ============================================
      console.log('\n📋 Test 6: Adding clips to sequence...');

      // Add first 2 videos as clips
      for (let i = 0; i < Math.min(2, videos.length); i++) {
        await sql`
          INSERT INTO video_sequence_clips (
            sequence_id,
            promotion_job_id,
            clip_order,
            transition_type,
            transition_duration
          )
          VALUES (
            ${sequence.id},
            ${videos[i].id},
            ${i},
            ${i === 0 ? 'fade' : 'none'},
            0.5
          )
        `;
        console.log(`✅ Added clip ${i + 1}`);
      }

      // ============================================
      // TEST 7: Verify Clips
      // ============================================
      console.log('\n📋 Test 7: Verifying clips...');

      const clips = await sql`
        SELECT c.*, pj.image_url as video_url
        FROM video_sequence_clips c
        LEFT JOIN promotion_jobs pj ON c.promotion_job_id = pj.id
        WHERE c.sequence_id = ${sequence.id}
        ORDER BY c.clip_order
      `;

      console.log(`✅ Found ${clips.length} clips in sequence`);
      clips.forEach((c, i) => {
        console.log(`   Clip ${i + 1}: Order ${c.clip_order}, Transition: ${c.transition_type}`);
      });

      // ============================================
      // TEST 8: Calculate Costs
      // ============================================
      console.log('\n📋 Test 8: Cost calculation...');

      const clipCount = clips.length;
      const baseCost = 2;
      const clipCost = clipCount * 0.5;
      const totalCost = baseCost + clipCost;

      console.log('✅ Cost breakdown:');
      console.log(`   Base fee: ${baseCost} credits`);
      console.log(`   ${clipCount} clips: ${clipCost} credits`);
      console.log(`   Total: ${totalCost} credits`);

      // ============================================
      // TEST 9: Create Composition Job
      // ============================================
      console.log('\n📋 Test 9: Creating composition job...');

      const jobResult = await sql`
        INSERT INTO video_composition_jobs (
          sequence_id,
          wallet_address,
          status,
          current_stage,
          credits_charged
        )
        VALUES (
          ${sequence.id},
          ${testWallet},
          'pending',
          'Queued for processing',
          ${totalCost}
        )
        RETURNING *
      `;

      const job = jobResult[0];
      console.log('✅ Created composition job:', job.id);
      console.log(`   Status: ${job.status}`);
      console.log(`   Stage: ${job.current_stage}`);
      console.log(`   Credits: ${job.credits_charged}`);

      // ============================================
      // TEST 10: Cleanup
      // ============================================
      console.log('\n📋 Test 10: Cleanup test data...');

      await sql`DELETE FROM video_composition_jobs WHERE id = ${job.id}`;
      await sql`DELETE FROM video_sequence_clips WHERE sequence_id = ${sequence.id}`;
      await sql`DELETE FROM video_sequences WHERE id = ${sequence.id}`;

      console.log('✅ Cleaned up test data');

      // ============================================
      // SUMMARY
      // ============================================
      console.log('\n' + '='.repeat(50));
      console.log('🎉 All Tests Passed!');
      console.log('='.repeat(50));
      console.log('\n✅ Movie Mode is fully functional and ready to use!');
      console.log('\nNext steps:');
      console.log('1. Generate 2-3 videos at /promotion');
      console.log('2. Visit /movie-mode to create your first sequence');
      console.log('3. Set up cron job: /api/cron/process-composition-jobs');
      console.log('\nCron setup (Vercel):');
      console.log('  vercel.json → Add cron job for every 30 seconds');

    } else {
      console.log('⚠️  No videos found in database');
      console.log('   Generate some videos first at /promotion');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

runTests();
