import * as fs from "fs";
import * as path from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";

console.log('Testing FFmpeg configuration...');

// Check if ffmpegStatic is available
if (!ffmpegStatic) {
  console.error('ffmpeg-static package not available');
  process.exit(1);
}

// Use absolute resolved path
const ffmpegPath = path.resolve(ffmpegStatic);
console.log('FFmpeg path:', ffmpegPath);

// Verify the file exists
if (!fs.existsSync(ffmpegPath)) {
  console.error(`FFmpeg binary not found at: ${ffmpegPath}`);
  process.exit(1);
}

console.log('FFmpeg binary exists');

// Verify it's executable
const stats = fs.statSync(ffmpegPath);
if (!(stats.mode & parseInt('111', 8))) {
  console.warn('FFmpeg binary may not be executable');
} else {
  console.log('FFmpeg binary is executable');
}

ffmpeg.setFfmpegPath(ffmpegPath);
console.log('FFmpeg configured successfully');

// Test basic functionality
console.log('Testing basic FFmpeg functionality...');

ffmpeg()
  .input('testsrc=duration=1:size=320x240:rate=1')
  .output('/dev/null')
  .outputOptions(['-f', 'null'])
  .on('start', (commandLine) => {
    console.log('FFmpeg command:', commandLine);
  })
  .on('end', () => {
    console.log('FFmpeg basic test passed!');
  })
  .on('error', (err) => {
    console.error('FFmpeg basic test failed:', err.message);
  })
  .run();