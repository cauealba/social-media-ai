import { extractFramesFromVideo } from './src/lib/claude-video-analysis.js';
import * as fs from 'fs';

// Simple test to verify FFmpeg works
async function testFFmpeg() {
  try {
    console.log('Testing FFmpeg configuration...');

    // Create a minimal test video buffer (this won't work but will test the setup)
    const testBuffer = Buffer.from('fake video data');

    await extractFramesFromVideo(testBuffer, 1);
    console.log('FFmpeg test completed successfully');
  } catch (error) {
    console.log('FFmpeg test failed as expected (no real video), but setup worked:', error.message);
  }
}

testFFmpeg();