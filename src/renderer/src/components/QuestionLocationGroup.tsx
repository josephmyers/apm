import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  IconButton,
  Collapse,
  Button,
  Divider,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import { formatTime } from '../control/formatTime';
import { loadBlobAsync } from '../utils/loadBlob';
import { AddQuestionDialog } from './AddQuestionDialog';

export interface QuestionData {
  questionId: string;
  title: string;
  speaker: string;
  audioPath?: string;
  duration: number;
}

interface Props {
  segmentStart: number;
  segmentEnd: number;
  questions: QuestionData[];
  expanded: boolean;
  onToggle?: () => void;
  onQuestionUpdated?: (questionId: string) => void;
}

/**
 * A single question item within an expanded group.
 * Handles its own audio playback and edit dialog.
 */
const QuestionItem = ({
  question,
  segmentStart,
  segmentEnd,
  onQuestionUpdated,
}: {
  question: QuestionData;
  segmentStart: number;
  segmentEnd: number;
  onQuestionUpdated?: (questionId: string) => void;
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | undefined>(undefined);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Load the audio blob when audioPath changes
  useEffect(() => {
    if (!question.audioPath) return;

    let objectUrl: string | undefined;
    let cancelled = false;

    loadBlobAsync(question.audioPath)
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
  }, [question.audioPath]);

  const handlePlayPause = () => {
    if (!audioRef.current || !audioSrc) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <Box>
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          onEnded={() => setIsPlaying(false)}
          style={{ display: 'none' }}
        />
      )}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ py: 1 }}>
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
            {question.title || 'Question'}
          </Typography>
          {question.speaker && (
            <Typography variant="body2" color="text.secondary">
              {question.speaker}
            </Typography>
          )}
        </Box>
        <Button
          startIcon={<EditIcon />}
          onClick={() => setEditDialogOpen(true)}
          size="small"
          sx={{ ml: 1 }}
        >
          Edit
        </Button>
      </Stack>

      {/* Edit Question Dialog */}
      <AddQuestionDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        initialSelection={{ start: segmentStart, end: segmentEnd }}
        questionId={question.questionId}
        initialTitle={question.title}
        initialSpeaker={question.speaker}
        initialAudioPath={question.audioPath}
        initialDuration={question.duration}
        onQuestionUpdated={(id) => {
          setEditDialogOpen(false);
          onQuestionUpdated?.(id);
        }}
      />
    </Box>
  );
};

/**
 * Groups multiple questions at the same time location into a single
 * expand/collapse row.
 */
export const QuestionLocationGroup = ({
  segmentStart,
  segmentEnd,
  questions,
  expanded,
  onToggle,
  onQuestionUpdated,
}: Props) => {
  const timeLabel =
    segmentStart === segmentEnd
      ? formatTime(segmentStart)
      : `${formatTime(segmentStart)} - ${formatTime(segmentEnd)}`;

  const questionCount = questions.length;

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
          minHeight: '34px',
          cursor: expanded ? 'default' : 'pointer',
          '&:hover': { bgcolor: expanded ? 'transparent' : '#f9f9f9' },
        }}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {timeLabel}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={1}>
          {questionCount > 1 && (
            <Typography
              variant="caption"
              sx={{
                px: 0.75,
                pb: 0.25,
                color: 'text.secondary',
              }}
            >
              {questionCount} questions
            </Typography>
          )}
          <IconButton
            size="small"
            aria-label="expand"
            disabled={expanded}
            sx={{
              transition: 'transform 0.2s',
              '&:hover': { bgcolor: 'transparent' },
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Stack>
      </Stack>

      {/* Expanded Content */}
      <Collapse in={expanded}>
        <Box sx={{ p: 0, pt: 0 }}>
          {questions.map((q, index) => (
            <React.Fragment key={q.questionId}>
              {index > 0 && <Divider sx={{ my: 1 }} />}
              <QuestionItem
                question={q}
                segmentStart={segmentStart}
                segmentEnd={segmentEnd}
                onQuestionUpdated={onQuestionUpdated}
              />
            </React.Fragment>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};
