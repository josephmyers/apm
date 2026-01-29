import React, { useContext, useEffect, useRef } from 'react';
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
import { QuestionListItem } from '../components/QuestionListItem';

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
  const [expandedQuestionId, setExpandedQuestionId] = React.useState<
    string | null
  >(null);
  const questions = usePassageQuestions(state.passage?.id);

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
      setExpandedQuestionId(null);
    });

    wsRegions.on('region-updated', (region) => {
      setSelection({ start: region.start, end: region.end });
      ws.setTime(region.start);

      // Updating a region collapses all question rows (user dragged/resized)
      setExpandedQuestionId(null);
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
        // Expand the clicked question
        setExpandedQuestionId((prev) =>
          prev === clickedQuestion.id ? null : clickedQuestion.id
        );
      } else {
        // Click outside any marker: collapse all and clear selection
        setExpandedQuestionId(null);
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

  // Sync expanded question with Waveform selection
  useEffect(() => {
    const ws = wavesurferRef.current;
    const wsRegions = regionsRef.current;
    if (!ws || !wsRegions || !expandedQuestionId) return;

    const q = questions.find((q) => q.id === expandedQuestionId);
    if (!q) return;

    const start = q.attributes.segmentStart;
    const end = q.attributes.segmentEnd;
    if (start === undefined || start === null) return;

    // Clear existing user selections (not question markers)
    wsRegions.getRegions().forEach((r) => {
      if (!r.id.startsWith('question-')) r.remove();
    });

    if (start !== end) {
      // Create a selection region for the question range
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
  }, [expandedQuestionId, questions]);

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

    // Add markers for each question at segmentStart
    questions.forEach((q, index) => {
      const time = q.attributes.segmentStart;
      if (time !== undefined && time !== null) {
        wsRegions.addRegion({
          id: `question-${index}`,
          start: time,
          end: time,
          color: 'rgba(0, 0, 0, 0.5)',
          drag: false,
          resize: false,
        });
      }
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

  const handleQuestionToggle = (questionId: string) => {
    const isExpanding = expandedQuestionId !== questionId;
    setExpandedQuestionId(isExpanding ? questionId : null);
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

            if (expandedQuestionId) {
              // If a question is expanded, place button right after it
              addQuestionIndex =
                questions.findIndex((q) => q.id === expandedQuestionId) + 1;
            } else {
              // Place based on chronological order (where effectiveTime falls)
              addQuestionIndex = questions.findIndex((q) => {
                const qTime = q.attributes.segmentStart ?? 0;
                return qTime > effectiveTime;
              });
              if (addQuestionIndex === -1) {
                addQuestionIndex = questions.length; // At the end
              }
            }

            // Use CSS order to visually position items while keeping React tree stable
            // Questions get order: 0, 2, 4, 6, ... (even numbers)
            // Button gets order based on where it should appear (odd number between questions)
            const buttonOrder = addQuestionIndex * 2 + 1;

            return (
              <>
                {questions.map((q, index) => (
                  <Box key={q.id} sx={{ order: index * 2 + 2 }}>
                    <QuestionListItem
                      title={q.attributes.title}
                      speaker={q.attributes.speaker}
                      segmentStart={q.attributes.segmentStart}
                      segmentEnd={q.attributes.segmentEnd}
                      audioPath={q.attributes.audioPath}
                      expanded={expandedQuestionId === q.id}
                      onToggle={() => handleQuestionToggle(q.id)}
                    />
                  </Box>
                ))}
                <Button
                  key="add-question-btn"
                  variant={expandedQuestionId ? undefined : 'primary'}
                  fullWidth
                  onClick={() => setAddQuestionOpen(true)}
                  sx={{ order: buttonOrder }}
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
          onQuestionCreated={(questionId) => {
            setTimeout(() => {
              setExpandedQuestionId(questionId);
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
