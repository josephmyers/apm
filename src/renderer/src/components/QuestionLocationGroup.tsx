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
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import Memory from '@orbit/memory';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { formatTime } from '../control/formatTime';
import { loadBlobAsync } from '../utils/loadBlob';
import { AddQuestionDialog } from './AddQuestionDialog';
import Confirm from './AlertDialog';
import { useGlobal } from '../context/useGlobal';
import { usePassageQuestionReorder } from '../crud/usePassageQuestionReorder';

export interface QuestionData {
  questionId: string;
  title: string;
  speaker: string;
  audioPath?: string;
  duration: number;
}

interface QuestionItemProps {
  question: QuestionData;
  segmentStart: number;
  segmentEnd: number;
  showDragHandle: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

/**
 * A single question item within an expanded group.
 * Handles its own audio playback and edit dialog.
 */
const QuestionItem = ({
  question,
  segmentStart,
  segmentEnd,
  showDragHandle,
  dragHandleProps,
}: QuestionItemProps) => {
  const [coordinator] = useGlobal('coordinator');
  const memory = coordinator?.getSource('memory') as Memory;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | undefined>(undefined);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

  const handleDeleteClick = () => {
    setConfirmDeleteId(question.questionId);
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmDeleteId || !memory) return;
    try {
      await memory.update((t) =>
        t.removeRecord({ type: 'passagequestion', id: confirmDeleteId })
      );
    } catch (err) {
      console.error('Failed to delete question:', err);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleDeleteRefused = () => {
    setConfirmDeleteId(null);
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
        {showDragHandle && (
          <Box
            {...dragHandleProps}
            sx={{
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' },
            }}
            aria-label="drag to reorder"
          >
            <DragIndicatorIcon />
          </Box>
        )}
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
        >
          Edit
        </Button>
        <Button startIcon={<DeleteIcon />} onClick={handleDeleteClick}>
          Delete
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
        }}
      />

      {/* Delete Confirmation Dialog */}
      {confirmDeleteId && (
        <Confirm
          text="Are you sure you want to delete this question?"
          yesResponse={handleDeleteConfirmed}
          noResponse={handleDeleteRefused}
        />
      )}
    </Box>
  );
};

interface QuestionGroupProps {
  segmentStart: number;
  segmentEnd: number;
  questions: QuestionData[];
  expanded: boolean;
  onToggle?: () => void;
}

/**
 * Groups multiple questions at the same time location into a single
 * expand/collapse row. Supports drag-and-drop reordering when there
 * are multiple questions.
 */
export const QuestionLocationGroup = ({
  segmentStart,
  segmentEnd,
  questions,
  expanded,
  onToggle,
}: QuestionGroupProps) => {
  const { reorderQuestions } = usePassageQuestionReorder();

  const timeLabel =
    segmentStart === segmentEnd
      ? formatTime(segmentStart)
      : `${formatTime(segmentStart)} - ${formatTime(segmentEnd)}`;

  const questionCount = questions.length;
  const showDragHandles = questionCount > 1;

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    // Reorder the questions array
    const reorderedIds = Array.from(questions.map((q) => q.questionId));
    const [removed] = reorderedIds.splice(result.source.index, 1);
    reorderedIds.splice(result.destination.index, 0, removed);

    // Persist the new order
    await reorderQuestions(reorderedIds);
  };

  const renderQuestionItem = (
    q: QuestionData,
    index: number,
    dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
  ) => (
    <React.Fragment key={q.questionId}>
      {index > 0 && <Divider sx={{ my: 1 }} />}
      <QuestionItem
        question={q}
        segmentStart={segmentStart}
        segmentEnd={segmentEnd}
        showDragHandle={showDragHandles}
        dragHandleProps={dragHandleProps}
      />
    </React.Fragment>
  );

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
          {showDragHandles ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable
                droppableId={`questions-${segmentStart}-${segmentEnd}`}
              >
                {(provided) => (
                  <Box ref={provided.innerRef} {...provided.droppableProps}>
                    {questions.map((q, index) => (
                      <Draggable
                        key={q.questionId}
                        draggableId={q.questionId}
                        index={index}
                      >
                        {(provided) => (
                          <Box
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                          >
                            {renderQuestionItem(
                              q,
                              index,
                              provided.dragHandleProps ?? undefined
                            )}
                          </Box>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            // Single question - no drag-drop needed
            questions.map((q, index) => renderQuestionItem(q, index))
          )}
        </Box>
      </Collapse>
    </Box>
  );
};
