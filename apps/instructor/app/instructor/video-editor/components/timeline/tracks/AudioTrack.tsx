'use client'
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import WaveSurfer from 'wavesurfer.js';
import { Clips } from '../../../../../types/videoeditor.types';

interface AudioTrackProps {
  clips: Clips[];
  totalDuration: number;
  scale: number;
  onClipsChange: (clips: Clips[]) => void;
}

const AudioTrack: React.FC<AudioTrackProps> = ({
  clips,
  totalDuration,
  scale,
  onClipsChange,
}) => {
  const waveformsRef = useRef<(WaveSurfer | null)[]>([]);
  const [failedWaveforms, setFailedWaveforms] = useState<Set<number>>(new Set());

  const getClipWidth = (clip: Clips) => {
    const duration = clip.end - clip.start;
    return Math.max(duration * 100 * scale, 50);
  };

  const getClipPosition = (clipIndex: number) => {
    let position = 0;
    for (let i = 0; i < clipIndex; i++) {
      const duration = clips[i].end - clips[i].start;
      position += duration * 100 * scale;
    }
    return position;
  };

  // Initialize waveforms for each clip
  useEffect(() => {
    clips.forEach(async (clip, index) => {
      // Skip if already failed or already initialized
      if (failedWaveforms.has(index) || waveformsRef.current[index]) {
        return;
      }

      if (clip.url) {
        const container = document.getElementById(`audio-waveform-${index}`);
        if (container) {
          try {
            // For video clips, we might not have direct audio URLs
            // Skip waveform generation for video URLs
            const isVideoUrl = clip.url.includes('.mp4') || 
                             clip.url.includes('.webm') || 
                             clip.url.includes('.mov') ||
                             clip.type === 'video';
            
            if (isVideoUrl) {
              console.log(`Skipping waveform for video clip ${index}`);
              setFailedWaveforms(prev => new Set([...prev, index]));
              return;
            }

            // Validate URL before loading
            const isValidUrl = clip.url.startsWith('http://') || 
                             clip.url.startsWith('https://') || 
                             clip.url.startsWith('blob:') || 
                             clip.url.startsWith('data:');
            
            if (!isValidUrl) {
              console.warn(`Invalid audio URL for clip ${index}:`, clip.url);
              setFailedWaveforms(prev => new Set([...prev, index]));
              return;
            }

            const wavesurfer = WaveSurfer.create({
              container: `#audio-waveform-${index}`,
              waveColor: '#60A5FA',
              progressColor: '#3B82F6',
              height: 40,
              normalize: true,
              backend: 'WebAudio',
              interact: false,
              cursorWidth: 0,
            });

            // Add error handling for load failures
            wavesurfer.on('error', (error) => {
              console.error(`Failed to load audio for clip ${index}:`, error);
              setFailedWaveforms(prev => new Set([...prev, index]));
              wavesurfer.destroy();
              waveformsRef.current[index] = null;
            });

            wavesurfer.on('ready', () => {
              console.log(`Audio loaded successfully for clip ${index}`);
            });

            await wavesurfer.load(clip.url);
            waveformsRef.current[index] = wavesurfer;
          } catch (error) {
            console.error(`Error creating waveform for clip ${index}:`, error);
            setFailedWaveforms(prev => new Set([...prev, index]));
          }
        }
      }
    });

    // Cleanup waveforms that are no longer needed
    return () => {
      waveformsRef.current.forEach((waveform, idx) => {
        if (waveform && idx >= clips.length) {
          waveform.destroy();
          waveformsRef.current[idx] = null;
        }
      });
    };
  }, [clips, failedWaveforms]);

  const handleClipDelete = (index: number) => {
    // Destroy the waveform before removing the clip
    if (waveformsRef.current[index]) {
      waveformsRef.current[index]?.destroy();
      waveformsRef.current[index] = null;
    }
    
    const newClips = clips.filter((_, i) => i !== index);
    onClipsChange(newClips);
  };

  return (
    <div className="relative">
      {/* Track Header */}
      <div className="flex items-center mb-2">
        <div className="flex items-center space-x-2 w-24">
          <Image src="/assets/audio.svg" width={20} height={20} alt="Audio" />
          <span className="text-white text-sm">Audio</span>
        </div>
        
        {/* Track Controls */}
        <div className="flex items-center space-x-2">
          <button className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Track Lane */}
      <div className="relative h-12 bg-gray-700 rounded">
        {clips.map((clip, index) => (
          <div
            key={`audio-${index}`}
            className="absolute top-1 h-10 bg-gradient-to-r from-cyan-400 to-purple-600 rounded cursor-move"
            style={{
              left: `${getClipPosition(index)}px`,
              width: `${getClipWidth(clip)}px`,
            }}
          >
            {/* Waveform container or fallback */}
            {failedWaveforms.has(index) ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-white/70">
                <span>Audio Track {index + 1}</span>
              </div>
            ) : (
              <div
                id={`audio-waveform-${index}`}
                className="w-full h-full rounded"
              />
            )}
            
            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClipDelete(index);
              }}
              className="absolute top-1 right-1 text-white hover:text-red-300 transition-colors"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        ))}

        {/* Drop zone indicator when empty */}
        {clips.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            Audio from video clips
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioTrack;