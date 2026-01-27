import React, { useState } from 'react';
import { Box, Typography, Stack, IconButton, Collapse } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { formatTime } from '../control/formatTime';

interface Props {
  title: string;
  speaker: string;
  segmentStart: number;
  segmentEnd: number;
  onPlay?: () => void;
}

export const QuestionListItem = ({
  title,
  speaker,
  segmentStart,
  segmentEnd,
  onPlay,
}: Props) => {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => {
    setExpanded(!expanded);
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
        onClick={handleToggle}
        sx={{
          p: 0,
          pl: 1,
          cursor: 'pointer',
          '&:hover': { bgcolor: '#f9f9f9' },
        }}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {timeLabel}
        </Typography>
        <IconButton
          size="small"
          sx={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            '&:hover': { bgcolor: 'transparent' },
          }}
        >
          <ExpandMoreIcon />
        </IconButton>
      </Stack>

      {/* Expanded Content */}
      <Collapse in={expanded}>
        <Box sx={{ p: 0, pt: 0 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 2 }}>
            <IconButton onClick={onPlay} sx={{ bgcolor: '#f5f5f5' }}>
              <PlayArrowIcon />
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
