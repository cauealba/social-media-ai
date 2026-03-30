import { analyzeVideoWithClaude } from './src/lib/claude-video-analysis.ts';
import * as fs from 'fs';

// Test the video analysis with an existing video from the CSV
async function testVideoAnalysis() {
  try {
    console.log('Testing video analysis with Claude...');

    // Use the video from the CSV
    const videoUrl = 'https://www.instagram.com/p/DVRhW3agA6P/';
    const thumbnailUrl = 'https://instagram.fsjc1-3.fna.fbcdn.net/v/t51.71878-15/641236102_2404211473336791_3106369681839574166_n.jpg?stp=dst-jpegr_e15_tt6&_nc_cat=109&ig_cache_key=Mzg0MTk5ODY2Mzk4NzQ5ODYzOQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjY0MHgxMTM2Lmhkci5DMyJ9&_nc_ohc=YKqxG0GAQUwQ7kNvwHlf1Nm&_nc_oc=Adl_qca55vqSPbmGR7slZ88UfzloGsx6wVlbAf0k-LkRRIksf5AvbpM93nY-GlcWqUM&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&se=-1&_nc_ht=instagram.fsjc1-3.fna.fbcdn.net&_nc_gid=GQjZXEk7zu51inJ_HHNoLQ&_nc_ss=1a&oh=00_Afzl0kwaHCk6-gfKFPBn1aa2NEO6XaLmb-c0swI276_Xfw&oe=69B03F21';

    // Download the video first
    console.log('Downloading video...');
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status}`);
    }

    const videoBuffer = Buffer.from(await response.arrayBuffer());
    console.log(`Video downloaded: ${videoBuffer.length} bytes`);

    const analysisPrompt = "Analyze this video for content, hook, retention, and structure.";

    const result = await analyzeVideoWithClaude(videoBuffer, thumbnailUrl, analysisPrompt);
    console.log('Analysis completed successfully!');
    console.log('Result:', result);

  } catch (error) {
    console.error('Video analysis failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testVideoAnalysis();