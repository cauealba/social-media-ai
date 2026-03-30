import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { exec } from "child_process";
import { promisify } from "util";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import Anthropic from "@anthropic-ai/sdk";

const execAsync = promisify(exec);

// Configure ffmpeg with absolute path and verification
let ffmpegConfigured = false;
function configureFFmpeg() {
  if (ffmpegConfigured) return;

  try {
    console.log('=== FFmpeg Configuration Debug ===');
    console.log('ffmpegStatic value:', ffmpegStatic);
    console.log('ffmpegStatic type:', typeof ffmpegStatic);
    console.log('Current working directory:', process.cwd());
    console.log('Node version:', process.version);
    console.log('Platform:', process.platform);
    console.log('====================================');

    // Check if ffmpegStatic is available
    if (!ffmpegStatic) {
      throw new Error('ffmpeg-static package not available');
    }

    // Use absolute resolved path
    const ffmpegPath = path.resolve(ffmpegStatic);
    console.log('Resolved FFmpeg path:', ffmpegPath);
    console.log('Current working directory:', process.cwd());

    // Try to find the actual ffmpeg binary
    let actualFFmpegPath = ffmpegPath;

    // Check if the resolved path exists
    if (!fs.existsSync(ffmpegPath)) {
      console.log('Resolved path does not exist, trying alternatives...');

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
          console.log('Found FFmpeg at:', actualFFmpegPath);
          break;
        }
      }
    }

    // Verify the file exists
    if (!fs.existsSync(actualFFmpegPath)) {
      throw new Error(`FFmpeg binary not found at: ${actualFFmpegPath}`);
    }

    // Verify it's executable
    const stats = fs.statSync(actualFFmpegPath);
    if (!(stats.mode & parseInt('111', 8))) {
      console.warn('FFmpeg binary may not be executable');
    }

    ffmpeg.setFfmpegPath(actualFFmpegPath);
    console.log('FFmpeg configured successfully with path:', actualFFmpegPath);
    ffmpegConfigured = true;
  } catch (error) {
    console.error('Failed to configure FFmpeg:', error);
    throw error;
  }
}

// Try to find system ffmpeg as fallback
async function findSystemFFmpeg(): Promise<string | null> {
  try {
    const { stdout } = await execAsync('which ffmpeg');
    const systemPath = stdout.trim();
    if (systemPath && fs.existsSync(systemPath)) {
      console.log('Found system FFmpeg at:', systemPath);
      return systemPath;
    }
  } catch (e) {
    console.log('System FFmpeg not found');
  }
  return null;
}

async function extractFramesFromVideo(videoBuffer: Buffer, numFrames: number = 3): Promise<Buffer[]> {
  // Configure FFmpeg first
  configureFFmpeg();

  // Save video to temp file
  const tmpDir = os.tmpdir();
  const videoPath = path.join(tmpDir, `video-${Date.now()}.mp4`);
  const frameDir = path.join(tmpDir, `frames-${Date.now()}`);

  try {
    fs.writeFileSync(videoPath, videoBuffer);
    fs.mkdirSync(frameDir, { recursive: true });

    console.log(`Video saved to: ${videoPath} (${videoBuffer.length} bytes)`);

    // Test basic ffmpeg functionality first
    console.log('Testing FFmpeg basic functionality...');
    let ffmpegWorking = false;

    try {
      await new Promise<void>((resolve, reject) => {
        const testCommand = ffmpeg()
          .input(videoPath)
          .output('/dev/null')
          .outputOptions(['-f', 'null', '-t', '1']) // Test with just 1 second
          .on('start', (commandLine) => {
            console.log('FFmpeg test command:', commandLine);
          })
          .on('end', () => {
            console.log('FFmpeg basic test passed');
            ffmpegWorking = true;
            resolve();
          })
          .on('error', (err) => {
            console.error('FFmpeg basic test failed:', err.message);
            reject(err);
          });

        setTimeout(() => {
          console.warn('FFmpeg test timed out');
          testCommand.kill('SIGKILL');
          reject(new Error('FFmpeg test timeout'));
        }, 10000);

        testCommand.run();
      });
    } catch (e) {
      console.error('FFmpeg basic test exception:', e);

      // Try system FFmpeg as fallback
      console.log('Trying system FFmpeg...');
      const systemFFmpeg = await findSystemFFmpeg();
      if (systemFFmpeg) {
        ffmpeg.setFfmpegPath(systemFFmpeg);
        console.log('Switched to system FFmpeg');
        ffmpegWorking = true;
      } else {
        throw new Error(`FFmpeg not working: ${e}`);
      }
    }

    if (!ffmpegWorking) {
      throw new Error('FFmpeg is not functional');
    }

    // Try very simple frame extraction at 1 second
    const frameBuffers: Buffer[] = [];
    const simpleFrameOutput = path.join(frameDir, 'simple.jpg');

    console.log('Attempting simple frame extraction at 1 second...');

    try {
      await new Promise<void>((resolve, reject) => {
        const command = ffmpeg(videoPath)
          .inputOptions(['-ss', '1'])
          .outputOptions(['-vframes', '1', '-q:v', '2'])
          .output(simpleFrameOutput)
          .on('start', (commandLine) => {
            console.log('FFmpeg extraction command:', commandLine);
          })
          .on('end', () => {
            console.log('Simple frame extraction completed');
            if (fs.existsSync(simpleFrameOutput)) {
              const buffer = fs.readFileSync(simpleFrameOutput);
              console.log(`Frame extracted: ${buffer.length} bytes`);
              if (buffer.length > 1000) {
                frameBuffers.push(buffer);
              } else {
                console.warn('Extracted frame too small');
              }
            } else {
              console.warn('Frame file not created');
            }
            resolve();
          })
          .on('error', (err) => {
            console.error('Simple frame extraction error:', err.message);
            resolve(); // Don't fail completely
          });

        setTimeout(() => {
          console.warn('Simple frame extraction timed out');
          command.kill('SIGKILL');
          resolve();
        }, 15000);

        command.run();
      });
    } catch (e) {
      console.warn('Exception in simple extraction:', e);
    }

    // If simple extraction worked, try a few more frames
    if (frameBuffers.length > 0) {
      console.log('Simple extraction worked, trying additional frames...');
      const additionalTimestamps = [3, 5];

      for (let i = 0; i < additionalTimestamps.length && frameBuffers.length < numFrames; i++) {
        const timestamp = additionalTimestamps[i];
        const frameOutput = path.join(frameDir, `frame-${timestamp}s.jpg`);

        try {
          await new Promise<void>((resolve) => {
            ffmpeg(videoPath)
              .inputOptions(['-ss', timestamp.toString()])
              .outputOptions(['-vframes', '1', '-q:v', '2'])
              .output(frameOutput)
              .on('end', () => {
                if (fs.existsSync(frameOutput)) {
                  const buffer = fs.readFileSync(frameOutput);
                  if (buffer.length > 1000) {
                    frameBuffers.push(buffer);
                    console.log(`Additional frame at ${timestamp}s extracted (${buffer.length} bytes)`);
                  }
                }
                resolve();
              })
              .on('error', () => resolve())
              .run();
          });
        } catch (e) {
          console.warn(`Failed additional frame at ${timestamp}s:`, e);
        }
      }
    }

    console.log(`Final result: ${frameBuffers.length} frames extracted`);

    if (frameBuffers.length === 0) {
      throw new Error("No frames could be extracted from video after all attempts");
    }

    return frameBuffers;
  } finally {
    // Cleanup
    try {
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      if (fs.existsSync(frameDir)) fs.rmSync(frameDir, { recursive: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

export async function analyzeVideoWithClaude(
  videoBuffer: Buffer,
  thumbnailUrl: string,
  analysisPrompt: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const client = new Anthropic({ apiKey });

  try {
    console.log('Starting video analysis with Claude...');

    // Extract frames from the actual video
    const frames = await extractFramesFromVideo(videoBuffer, 5);
    console.log(`Extracted ${frames.length} frames from video`);

    // Also try to get thumbnail if available
    let thumbnailBuffer: Buffer | null = null;
    try {
      if (thumbnailUrl) {
        console.log('Fetching thumbnail...');
        const response = await fetch(thumbnailUrl);
        if (response.ok) {
          thumbnailBuffer = Buffer.from(await response.arrayBuffer());
          console.log('Thumbnail fetched successfully');
        }
      }
    } catch (e) {
      console.warn("Could not fetch thumbnail:", e);
    }

    const content: any[] = [];

    // Add extracted frames
    for (let i = 0; i < frames.length; i++) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: frames[i].toString("base64"),
        },
      });
    }

    // Add thumbnail if available and different from frames
    if (thumbnailBuffer && thumbnailBuffer.length > 1000) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: thumbnailBuffer.toString("base64"),
        },
      });
    }

    console.log(`Sending ${content.length - 1} images to Claude for analysis`);

    // Add analysis prompt
    content.push({
      type: "text",
      text: `You are an expert video content analyst. I'm providing you with ${frames.length} key frames extracted from different moments of a viral Instagram Reel${thumbnailBuffer ? ' plus the video thumbnail' : ''}.

These frames represent the complete video content and sequence. Analyze the entire video based on these frames and provide detailed insights following this structure:

${analysisPrompt}

Format your response with clear sections and be specific and actionable. Consider the narrative flow and visual progression throughout the video.`,
    });

    const message = await client.messages.create({
      model: "claude-opus-4-1",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content,
        },
      ],
    });

    const block = message.content[0];
    const result = block.type === "text" ? block.text : "";
    console.log('Claude analysis completed successfully');
    return result;
  } catch (error) {
    console.error('Error in analyzeVideoWithClaude:', error);
    throw new Error(`Failed to analyze video with Claude: ${error instanceof Error ? error.message : "unknown error"}`);
  }
}
