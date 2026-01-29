import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Stack, IconButton, Collapse } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { formatTime } from '../control/formatTime';
import { loadBlobAsync } from '../utils/loadBlob';

interface Props {
  title: string;
  speaker: string;
  segmentStart: number;
  segmentEnd: number;
  audioPath?: string;
  expanded: boolean;
  onToggle?: () => void;
}

export const QuestionListItem = ({
  title,
  speaker,
  segmentStart,
  segmentEnd,
  audioPath,
  expanded,
  onToggle,
}: Props) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | undefined>(undefined);

  // Load the audio blob when audioPath changes and item is expanded
  useEffect(() => {
    if (!audioPath || !expanded) return;

    let objectUrl: string | undefined;
    let cancelled = false;

    loadBlobAsync(audioPath)
      .then((blob) => {
        if (blob && !cancelled) {
          objectUrl = URL.createObjectURL(blob);
          setAudioSrc(objectUrl);
        }
      })
      .catch((err) => {
        console.error('Failed to load question audio:', err);
      });

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [audioPath, expanded]);

  const handlePlayPause = () => {
    if (!audioRef.current || !audioSrc) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const timeLabel =
    segmentStart === segmentEnd
      ? formatTime(segmentStart)
      : `${formatTime(segmentStart)} - ${formatTime(segmentEnd)}`;

  return (
    <Box
      sx={{
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        onClick={expanded ? undefined : onToggle}
        sx={{
          p: 0,
          pl: 1,
          cursor: expanded ? 'default' : 'pointer',
          '&:hover': { bgcolor: expanded ? 'transparent' : '#f9f9f9' },
        }}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {timeLabel}
        </Typography>
        {!expanded && (
          <IconButton
            size="small"
            aria-label="expand"
            sx={{
              transition: 'transform 0.2s',
              '&:hover': { bgcolor: 'transparent' },
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        )}
      </Stack>

      {/* Expanded Content */}
      <Collapse in={expanded}>
        <Box sx={{ p: 0, pt: 0 }}>
          {audioSrc && (
            <audio
              ref={audioRef}
              src={audioSrc}
              onEnded={() => setIsPlaying(false)}
              style={{ display: 'none' }}
            />
          )}
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 2 }}>
            <IconButton
              onClick={handlePlayPause}
              sx={{ bgcolor: '#f5f5f5' }}
              aria-label={isPlaying ? 'pause question' : 'play question'}
              disabled={!audioSrc}
            >
              {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {title || 'Question'}
              </Typography>
              {speaker && (
                <Typography variant="body2" color="text.secondary">
                  {speaker}
                </Typography>
              )}
            </Box>
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
};
