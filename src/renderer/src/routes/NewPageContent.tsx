import React, { useContext, useEffect, useMemo, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions';
import {
  Box,
  IconButton,
  Typography,
  Button,
  Paper,
  Stack,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ForumIcon from '@mui/icons-material/Forum';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { useMyNavigate } from '../utils/useMyNavigate';
import { formatTime } from '../control/formatTime';
import { PassageDetailContext } from '../context/PassageDetailContext';
import { AddQuestionDialog } from '../components/AddQuestionDialog';
import { usePassageQuestions } from '../crud/usePassageQuestions';
import {
  QuestionLocationGroup,
  QuestionData,
} from '../components/QuestionLocationGroup';
import { PassageQuestionD } from '../model';

export const NewPageContent = () => {
  const navigate = useMyNavigate();
  const theme = useTheme();
  const { state } = useContext(PassageDetailContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<RegionsPlugin | null>(null);
  const questionsRef = useRef<ReturnType<typeof usePassageQuestions>>([]);
  const selectionRef = useRef<{ start: number; end: number } | null>(null);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [selection, setSelection] = React.useState<{
    start: number;
    end: number;
  } | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const [addQuestionOpen, setAddQuestionOpen] = React.useState(false);
  // Group key is "start-end" to identify unique time locations
  const [expandedGroupKey, setExpandedGroupKey] = React.useState<string | null>(
    null
  );
  const questions = usePassageQuestions(state.passage?.id);

  // Group questions by matching both start and end times
  const groupedQuestions = useMemo(() => {
    const groups = new Map<
      string,
      { segmentStart: number; segmentEnd: number; questions: typeof questions }
    >();

    questions.forEach((q) => {
      const start = q.attributes.segmentStart ?? 0;
      const end = q.attributes.segmentEnd ?? start;
      const key = `${start}-${end}`;

      if (!groups.has(key)) {
        groups.set(key, {
          segmentStart: start,
          segmentEnd: end,
          questions: [],
        });
      }
      groups.get(key)!.questions.push(q);
    });

    // Convert to array sorted by start time
    return Array.from(groups.values()).sort(
      (a, b) => a.segmentStart - b.segmentStart
    );
  }, [questions]);

  // Ref for groupedQuestions to use in event handlers
  const groupedQuestionsRef = useRef(groupedQuestions);
  useEffect(() => {
    groupedQuestionsRef.current = groupedQuestions;
  }, [groupedQuestions]);

  // Tolerance in seconds for clicking near a question marker
  const MARKER_CLICK_TOLERANCE_PX = 4;

  // Keep questionsRef in sync
  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  // Keep selectionRef in sync
  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  // Helper to get group key from a question
  const getGroupKeyForQuestion = (questionId: string): string | null => {
    const q = questions.find((q) => q.id === questionId);
    if (!q) return null;
    const start = q.attributes.segmentStart ?? 0;
    const end = q.attributes.segmentEnd ?? start;
    return `${start}-${end}`;
  };

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Regions Plugin
    const wsRegions = RegionsPlugin.create();
    regionsRef.current = wsRegions;

    wavesurferRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#9fc5e8',
      progressColor: '#9fc5e8',
      cursorColor: '#333',
      cursorWidth: 4,
      barWidth: 2,
      height: 80,
      normalize: true,
      plugins: [wsRegions],
    });

    const ws = wavesurferRef.current;

    // Enable drag selection
    wsRegions.enableDragSelection({
      color: 'rgba(0, 0, 0, 0.1)',
    });

    wsRegions.on('region-created', (region) => {
      if (region.start === region.end) return;

      // Skip programmatically-created regions (from expanding a question)
      if (region.id === 'user-selection') return;

      // Remove other selected regions
      wsRegions.getRegions().forEach((r) => {
        if (r.id !== region.id && r.start !== r.end) r.remove();
      });

      setSelection({ start: region.start, end: region.end });
      ws.setTime(region.start);

      // Creating a region collapses all question rows
      setExpandedGroupKey(null);
    });

    wsRegions.on('region-updated', (region) => {
      setSelection({ start: region.start, end: region.end });
      ws.setTime(region.start);

      // Updating a region collapses all question rows (user dragged/resized)
      setExpandedGroupKey(null);
    });

    wsRegions.on('region-clicked', (region, e) => {
      if (region.start !== region.end) {
        e.stopPropagation();
      }
    });

    ws.on('timeupdate', (time) => {
      setCurrentTime(time);
      // Stop playback when reaching end of selection range
      const sel = selectionRef.current;
      if (sel && sel.start !== sel.end && time >= sel.end) {
        ws.pause();
        setPlaying(false);
      }
    });
    ws.on('decode', (d) => setDuration(d));
    ws.on('finish', () => {
      setPlaying(false);
    });

    // Click on waveform: check if near a question marker
    ws.on('click', (relativeX) => {
      const waveformWidth = containerRef.current?.clientWidth || 1;
      const audioDuration = ws.getDuration() || 1;
      const clickTime = relativeX * audioDuration;
      const toleranceSeconds =
        (MARKER_CLICK_TOLERANCE_PX / waveformWidth) * audioDuration;

      // Find if click is near any question marker
      const clickedQuestion = questionsRef.current.find((q) => {
        const markerTime = q.attributes.segmentStart;
        return (
          markerTime !== undefined &&
          markerTime !== null &&
          Math.abs(clickTime - markerTime) <= toleranceSeconds
        );
      });

      if (clickedQuestion) {
        // Expand the group containing the clicked question
        const start = clickedQuestion.attributes.segmentStart ?? 0;
        const end = clickedQuestion.attributes.segmentEnd ?? start;
        const groupKey = `${start}-${end}`;
        setExpandedGroupKey((prev) => (prev === groupKey ? null : groupKey));
      } else {
        // Click outside any marker: collapse all and clear selection
        setExpandedGroupKey(null);
        wsRegions.getRegions().forEach((r) => {
          if (r.start !== r.end) r.remove();
        });
        setSelection(null);
      }
    });

    return () => {
      ws.destroy();
      wavesurferRef.current = null;
    };
  }, []);

  // Sync expanded group with Waveform selection
  useEffect(() => {
    const ws = wavesurferRef.current;
    const wsRegions = regionsRef.current;
    if (!ws || !wsRegions || !expandedGroupKey) return;

    const group = groupedQuestions.find(
      (g) => `${g.segmentStart}-${g.segmentEnd}` === expandedGroupKey
    );
    if (!group) return;

    const start = group.segmentStart;
    const end = group.segmentEnd;

    // Clear existing user selections (not question markers)
    wsRegions.getRegions().forEach((r) => {
      if (!r.id.startsWith('question-')) r.remove();
    });

    if (start !== end) {
      // Create a selection region for the group range
      wsRegions.addRegion({
        id: 'user-selection',
        start,
        end,
        color: 'rgba(0, 0, 0, 0.1)',
        drag: true,
        resize: true,
      });
      setSelection({ start, end });
    } else {
      setSelection(null);
    }
    ws.setTime(start);
  }, [expandedGroupKey, groupedQuestions]);

  // Sync audio blob with WaveSurfer
  useEffect(() => {
    if (state.audioBlob && wavesurferRef.current) {
      const url = URL.createObjectURL(state.audioBlob);
      wavesurferRef.current.load(url);
      return () => URL.revokeObjectURL(url);
    }
    return undefined;
  }, [state.audioBlob]);

  useEffect(() => {
    const wsRegions = regionsRef.current;
    if (!wsRegions) return;

    // Remove existing question markers
    wsRegions.getRegions().forEach((r) => {
      if (r.id.startsWith('question-')) r.remove();
    });

    // Get unique segmentStart locations
    const uniqueLocations = new Set<number>();
    questions.forEach((q) => {
      const time = q.attributes.segmentStart;
      if (time !== undefined && time !== null) {
        uniqueLocations.add(time);
      }
    });

    // Add one marker per unique location
    Array.from(uniqueLocations).forEach((time, index) => {
      wsRegions.addRegion({
        id: `question-${index}`,
        start: time,
        end: time,
        color: 'rgba(0, 0, 0, 0.5)',
        drag: false,
        resize: false,
      });
    });
  }, [questions, duration]); //depending on duration refreshes when WS loads

  // Sync playing state
  useEffect(() => {
    const ws = wavesurferRef.current;
    if (ws) {
      if (playing) {
        ws.play();
      } else {
        ws.pause();
      }
    }
  }, [playing]);

  const handlePlayToggle = () => {
    setPlaying(!playing);
  };

  const handleGroupToggle = (groupKey: string) => {
    const isExpanding = expandedGroupKey !== groupKey;
    setExpandedGroupKey(isExpanding ? groupKey : null);
  };

  const handleQuestionUpdated = (question: PassageQuestionD) => {
    // Update the waveform selection to the new location
    const newStart = question.attributes.segmentStart;
    const newEnd = question.attributes.segmentEnd;
    const newGroupKey = `${newStart}-${newEnd}`;
    setExpandedGroupKey(newGroupKey);

    if (newStart !== newEnd) {
      setSelection({ start: newStart, end: newEnd });
    } else {
      setSelection(null);
    }
  };

  // Logic to get passage info from context
  const bookCode = state.passage?.attributes?.book || '';
  const bookName =
    state.allBookData?.find((b) => b.code === bookCode)?.long || 'Genesis';
  const passageRef = state.passage?.attributes?.reference || '2:12-25';

  const title = state.passage?.attributes?.book
    ? `${bookName} ${passageRef}`
    : 'Loading...';
  const subtitle = state.passage?.attributes?.book ? bookName : '';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        bgcolor: 'background.paper',
        fontFamily: theme.typography.fontFamily,
      }}
    >
      {/* Header Section */}
      <Paper
        elevation={0}
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 1,
          pt: 1,
          bgcolor: '#f5f5f5',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2 }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton
              onClick={() => navigate('/team')}
              aria-label="back"
              sx={{ width: 40, height: 40 }}
            >
              <ArrowBackIcon sx={{ fontSize: 32 }} />
            </IconButton>
            <Box>
              <Typography
                variant="h6"
                sx={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.2 }}
              >
                {title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <IconButton>
              <HelpOutlineOutlinedIcon />
            </IconButton>
            <IconButton>
              <PersonOutlineIcon />
            </IconButton>
          </Stack>
        </Stack>

        {/* Progress Bar Mock */}
        <Stack direction="row" sx={{ mt: 2, px: 2, height: 24, spacing: 0.5 }}>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Box
              key={i}
              sx={{
                flex: 1,
                bgcolor: i === 5 ? '#333' : i < 5 ? '#999' : '#e0e0e0',
                transform: 'skewX(-20deg)',
                borderRight: '2px solid white',
                '&:first-of-type': { borderLeft: 'none' },
                mx: 0.2,
              }}
            />
          ))}
        </Stack>
        <Typography
          align="center"
          variant="subtitle2"
          sx={{ mt: 1, fontWeight: 500 }}
        >
          Community Test Q&A Preparation
        </Typography>
      </Paper>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, p: 3, position: 'relative', overflowY: 'auto' }}>
        {/* Audio Player */}
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
            <IconButton
              onClick={handlePlayToggle}
              sx={{ p: 0 }}
              aria-label={playing ? 'pause' : 'play'}
            >
              {playing ? (
                <PauseIcon fontSize="large" sx={{ color: 'neutral.main' }} />
              ) : (
                <PlayArrowIcon
                  fontSize="large"
                  sx={{ color: 'neutral.main' }}
                />
              )}
            </IconButton>
            <Typography variant="body2">
              {selection
                ? formatTime(selection.start) +
                  ' - ' +
                  formatTime(selection.end)
                : formatTime(currentTime)}{' '}
              / {formatTime(duration || 0)}
            </Typography>
          </Stack>

          <Box
            ref={containerRef}
            aria-label="Waveform"
            sx={{
              height: 80,
              bgcolor: 'action.hover',
              my: 2,
              borderRadius: 1,
              overflow: 'hidden',
              width: '100%',
            }}
          />
        </Box>

        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column' }}>
          {(() => {
            // Calculate insertion index for Add Question button
            const effectiveTime = selection?.start ?? currentTime;
            let addQuestionIndex: number;

            if (expandedGroupKey) {
              // If a group is expanded, place button right after it
              addQuestionIndex =
                groupedQuestions.findIndex(
                  (g) =>
                    `${g.segmentStart}-${g.segmentEnd}` === expandedGroupKey
                ) + 1;
            } else {
              // Place based on chronological order (where effectiveTime falls)
              addQuestionIndex = groupedQuestions.findIndex(
                (g) => g.segmentStart > effectiveTime
              );
              if (addQuestionIndex === -1) {
                addQuestionIndex = groupedQuestions.length; // At the end
              }
            }

            // Use CSS order to visually position items while keeping React tree stable
            // Groups get order: 0, 2, 4, 6, ... (even numbers)
            // Button gets order based on where it should appear (odd number between groups)
            const buttonOrder = addQuestionIndex * 2 + 1;

            return (
              <>
                {groupedQuestions.map((group, index) => {
                  const groupKey = `${group.segmentStart}-${group.segmentEnd}`;
                  const questionData: QuestionData[] = group.questions.map(
                    (q) => ({
                      questionId: q.id,
                      title: q.attributes.title,
                      speaker: q.attributes.speaker,
                      audioPath: q.attributes.audioPath,
                      duration: q.attributes.duration,
                    })
                  );
                  return (
                    <Box
                      key={groupKey}
                      sx={{ order: index * 2 + 2, my: '1px' }}
                    >
                      <QuestionLocationGroup
                        segmentStart={group.segmentStart}
                        segmentEnd={group.segmentEnd}
                        questions={questionData}
                        expanded={expandedGroupKey === groupKey}
                        onToggle={() => handleGroupToggle(groupKey)}
                        onQuestionUpdated={handleQuestionUpdated}
                      />
                    </Box>
                  );
                })}
                <Button
                  key="add-question-btn"
                  variant={expandedGroupKey ? undefined : 'primary'}
                  fullWidth
                  onClick={() => setAddQuestionOpen(true)}
                  sx={{ order: buttonOrder, my: '4px' }}
                >
                  + Add Question...
                </Button>
              </>
            );
          })()}
        </Box>

        {questions.length === 0 && (
          <Typography
            align="center"
            sx={{
              mt: 4,
              color: 'text.secondary',
              maxWidth: 400,
              mx: 'auto',
              lineHeight: 1.6,
            }}
          >
            Tap + to add a question here. Drag to select a range, or double-tap
            to select all.
          </Typography>
        )}

        <IconButton
          variant="floating"
          aria-label="forum"
          sx={{ position: 'absolute', right: 24, bottom: 24 }}
        >
          <ForumIcon />
        </IconButton>

        <AddQuestionDialog
          open={addQuestionOpen}
          onClose={() => setAddQuestionOpen(false)}
          initialSelection={
            selection || { start: currentTime, end: currentTime }
          }
          onQuestionCreated={(question) => {
            setTimeout(() => {
              handleQuestionUpdated(question)
            }, 250);
          }}
        />
      </Box>

      {/* Footer Navigation */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: '#f5f5f5',
        }}
      >
        <Button startIcon={<ChevronLeftIcon />} sx={{ bgcolor: 'white' }}>
          Previous
        </Button>
        <Button
          startIcon={<CheckBoxOutlineBlankIcon />}
          sx={{ bgcolor: 'white' }}
        >
          Step Complete
        </Button>
        <Button endIcon={<ChevronRightIcon />} sx={{ bgcolor: 'white' }}>
          Next
        </Button>
      </Paper>
    </Box>
  );
};
