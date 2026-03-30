import * as fs from "fs";
import * as path from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";

console.log('=== FFmpeg Debug Test ===');
console.log('ffmpegStatic value:', ffmpegStatic);
console.log('ffmpegStatic type:', typeof ffmpegStatic);
console.log('Current working directory:', process.cwd());

// Check if ffmpegStatic is available
if (!ffmpegStatic) {
  console.error('❌ ffmpeg-static package not available');
  process.exit(1);
}

// Use absolute resolved path
const ffmpegPath = path.resolve(ffmpegStatic);
console.log('Resolved FFmpeg path:', ffmpegPath);

// Try to find the actual ffmpeg binary
let actualFFmpegPath = ffmpegPath;

// Check if the resolved path exists
if (!fs.existsSync(ffmpegPath)) {
  console.log('❌ Resolved path does not exist, trying alternatives...');

  // Try common locations
  const possiblePaths = [
    path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg'),
    path.join(process.cwd(), 'node_modules', '.bin', 'ffmpeg'),
    '/usr/local/bin/ffmpeg',
    '/usr/bin/ffmpeg',
    '/opt/homebrew/bin/ffmpeg'
  ];

  for (const testPath of possiblePaths) {
    console.log('Checking path:', testPath);
    if (fs.existsSync(testPath)) {
      actualFFmpegPath = testPath;
      console.log('✅ Found FFmpeg at:', actualFFmpegPath);
      break;
    }
  }
} else {
  console.log('✅ Resolved path exists');
}

// Verify the file exists
if (!fs.existsSync(actualFFmpegPath)) {
  console.error('❌ FFmpeg binary not found at:', actualFFmpegPath);
  process.exit(1);
} else {
  console.log('✅ FFmpeg binary exists at:', actualFFmpegPath);
}

// Verify it's executable
try {
  const stats = fs.statSync(actualFFmpegPath);
  if (!(stats.mode & parseInt('111', 8))) {
    console.warn('⚠️  FFmpeg binary may not be executable');
  } else {
    console.log('✅ FFmpeg binary is executable');
  }
} catch (e) {
  console.error('❌ Error checking file stats:', e.message);
  process.exit(1);
}

console.log('🔧 Configuring FFmpeg with path:', actualFFmpegPath);
ffmpeg.setFfmpegPath(actualFFmpegPath);
console.log('✅ FFmpeg configured successfully');

console.log('🧪 Testing basic FFmpeg functionality...');

ffmpeg()
  .input('testsrc=duration=1:size=320x240:rate=1')
  .output('/dev/null')
  .outputOptions(['-f', 'null'])
  .on('start', (commandLine) => {
    console.log('FFmpeg command:', commandLine);
  })
  .on('end', () => {
    console.log('✅ FFmpeg basic test passed!');
  })
  .on('error', (err) => {
    console.error('❌ FFmpeg basic test failed:', err.message);
  })
  .run();