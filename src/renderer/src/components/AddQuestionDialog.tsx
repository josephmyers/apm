import {
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ChangeEvent,
} from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions';
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Stack,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import StopIcon from '@mui/icons-material/Stop';
import { PassageDetailContext } from '../context/PassageDetailContext';
import { formatTime } from '../control/formatTime';
import { useWavRecorder } from '../crud/useWavRecorder';
import { usePassageQuestionCreate } from '../crud/usePassageQuestionCreate';
import { usePassageQuestionUpdate } from '../crud/usePassageQuestionUpdate';
import { loadBlobAsync } from '../utils/loadBlob';
import { PassageQuestionD } from '../model';

interface Props {
  open: boolean;
  onClose: () => void;
  initialSelection: { start: number; end: number };
  onQuestionCreated?: (question: PassageQuestionD) => void;
  onQuestionUpdated?: (question: PassageQuestionD) => void;
  questionId?: string;
  initialTitle?: string;
  initialSpeaker?: string;
  initialAudioPath?: string;
  initialDuration?: number;
}

export const AddQuestionDialog = ({
  open,
  onClose,
  initialSelection,
  onQuestionCreated,
  onQuestionUpdated,
  questionId,
  initialTitle,
  initialSpeaker,
  initialAudioPath,
  initialDuration,
}: Props) => {
  const { state } = useContext(PassageDetailContext);
  const passageContainerRef = useRef<HTMLDivElement>(null);
  const passageWsRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<RegionsPlugin | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const questionContainerRef = useRef<HTMLDivElement>(null);
  const questionWsRef = useRef<WaveSurfer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!questionId;

  const [passagePlaying, setPassagePlaying] = useState(false);
  const [passageTime, setPassageTime] = useState(0);
  const [passageDuration, setPassageDuration] = useState(0);
  const [questionTitle, setQuestionTitle] = useState(
    initialTitle || 'Question 1'
  );
  const [speaker, setSpeaker] = useState(initialSpeaker || '');
  const [audioChanged, setAudioChanged] = useState(false);

  const [questionAudioUrl, setQuestionAudioUrl] = useState<string | null>(null);
  const [questionPlaying, setQuestionPlaying] = useState(false);
  const [questionTime, setQuestionTime] = useState(0);
  const [questionDuration, setQuestionDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [currentSelection, setCurrentSelection] = useState(initialSelection);
  const [locationMarker, setLocationMarker] = useState<number>(
    initialSelection.start
  );

  useEffect(() => {
    if (open) {
      setCurrentSelection(initialSelection);
      setLocationMarker(initialSelection.start);
    }
  }, [open, initialSelection]);

  const handleRecordingStop = useCallback(
    (blob: Blob) => {
      setIsRecording(false);
      if (questionAudioUrl) {
        URL.revokeObjectURL(questionAudioUrl);
      }
      const url = URL.createObjectURL(blob);
      setQuestionAudioUrl(url);
      setAudioChanged(true);
    },
    [questionAudioUrl]
  );

  const { startRecording, stopRecording } = useWavRecorder(
    true,
    () => setIsRecording(true),
    handleRecordingStop,
    (err) => console.error('Recorder error:', err),
    async () => {}
  );

  // Initializing Passage WaveSurfer
  const initPassageWS = useCallback(() => {
    if (!passageContainerRef.current) return;

    const wsRegions = RegionsPlugin.create();
    regionsRef.current = wsRegions;

    const ws = WaveSurfer.create({
      container: passageContainerRef.current,
      waveColor: '#9fc5e8',
      progressColor: '#9fc5e8',
      cursorColor: '#333',
      cursorWidth: 4,
      barWidth: 2,
      height: 80,
      normalize: true,
      plugins: [wsRegions],
    });

    passageWsRef.current = ws;

    ws.on('ready', () => {
      const duration = ws.getDuration();
      setPassageDuration(duration);

      if (initialSelection.start !== initialSelection.end) {
        wsRegions.addRegion({
          start: initialSelection.start,
          end: initialSelection.end,
          color: 'rgba(0, 0, 0, 0.1)',
          drag: true,
          resize: true,
        });
      } else {
        wsRegions.addRegion({
          id: 'location-marker',
          start: initialSelection.start,
          end: initialSelection.start,
          color: 'rgba(0, 0, 0, 0.5)',
          drag: true,
          resize: false,
        });
      }

      // Force sync to the selection start
      ws.setTime(initialSelection.start);
      setPassageTime(initialSelection.start);
    });

    wsRegions.on('region-updated', (region) => {
      if (region.id === 'location-marker') {
        setLocationMarker(region.start);
      } else {
        setCurrentSelection({ start: region.start, end: region.end });
      }
    });

    ws.on('timeupdate', (time) => setPassageTime(time));
    ws.on('play', () => setPassagePlaying(true));
    ws.on('pause', () => setPassagePlaying(false));
    ws.on('finish', () => setPassagePlaying(false));

    if (state.audioBlob) {
      const url = URL.createObjectURL(state.audioBlob);
      audioUrlRef.current = url;
      ws.load(url);
    }
  }, [state.audioBlob, initialSelection]);

  useEffect(() => {
    if (open) {
      // Small delay to ensure Dialog is rendered and container has size
      const timer = setTimeout(initPassageWS, 200);
      return () => {
        clearTimeout(timer);
        if (passageWsRef.current) {
          passageWsRef.current.destroy();
          passageWsRef.current = null;
        }
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
      };
    }
    return undefined;
  }, [open, initPassageWS]);

  const handlePassagePlayToggle = () => {
    passageWsRef.current?.playPause();
  };

  const handleQuestionPlayToggle = () => {
    questionWsRef.current?.playPause();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (questionAudioUrl) {
        URL.revokeObjectURL(questionAudioUrl);
      }
      const url = URL.createObjectURL(file);
      setQuestionAudioUrl(url);
      setAudioChanged(true);
    }
  };

  const handleRecordClick = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  // Initialize Question WaveSurfer when audio URL changes
  useEffect(() => {
    if (!questionContainerRef.current || !questionAudioUrl) return;

    if (questionWsRef.current) {
      questionWsRef.current.destroy();
    }

    const ws = WaveSurfer.create({
      container: questionContainerRef.current,
      waveColor: '#9fc5e8',
      progressColor: '#9fc5e8',
      cursorColor: '#333',
      cursorWidth: 4,
      barWidth: 2,
      height: 100,
      normalize: true,
    });

    questionWsRef.current = ws;

    ws.on('ready', () => {
      setQuestionDuration(ws.getDuration());
    });

    ws.on('timeupdate', (time) => setQuestionTime(time));
    ws.on('play', () => setQuestionPlaying(true));
    ws.on('pause', () => setQuestionPlaying(false));
    ws.on('finish', () => setQuestionPlaying(false));

    ws.load(questionAudioUrl);

    return () => {
      ws.destroy();
      questionWsRef.current = null;
    };
  }, [questionAudioUrl]);

  // Cleanup question audio URL on unmount
  useEffect(() => {
    return () => {
      if (questionAudioUrl) {
        URL.revokeObjectURL(questionAudioUrl);
      }
    };
  }, [questionAudioUrl]);

  // Reset state when dialog closes or opens with new data
  useEffect(() => {
    if (!open) {
      setQuestionAudioUrl(null);
      setQuestionTime(0);
      setQuestionDuration(0);
      setQuestionTitle('Question 1');
      setSpeaker('');
      setAudioChanged(false);
    } else if (isEditMode) {
      // Edit mode: populate with existing data
      setQuestionTitle(initialTitle || '');
      setSpeaker(initialSpeaker || '');
      setQuestionDuration(initialDuration || 0);
      setAudioChanged(false);
      // Load existing audio
      if (initialAudioPath) {
        loadBlobAsync(initialAudioPath)
          .then((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              setQuestionAudioUrl(url);
            }
          })
          .catch((err) => {
            console.error('Failed to load question audio for edit:', err);
          });
      }
    }
  }, [
    open,
    isEditMode,
    initialTitle,
    initialSpeaker,
    initialAudioPath,
    initialDuration,
  ]);

  /* Action Buttons */
  const { createQuestion } = usePassageQuestionCreate();
  const { updateQuestion } = usePassageQuestionUpdate();

  const handleContinue = async () => {
    if (!questionAudioUrl) return;

    const isRange = initialSelection.start !== initialSelection.end;
    const finalStart = isRange ? currentSelection.start : locationMarker;
    const finalEnd = isRange ? currentSelection.end : locationMarker;
    if (isEditMode && questionId) {
      // Edit mode: update existing question
      let audioBlob: Blob | undefined;
      if (audioChanged) {
        const response = await fetch(questionAudioUrl);
        audioBlob = await response.blob();
      }

      const updatedQuestion = await updateQuestion({
        questionId,
        title: questionTitle,
        speaker: speaker,
        audioBlob,
        duration: audioChanged ? questionDuration : undefined,
        segmentStart: finalStart,
        segmentEnd: finalEnd,
      });

      onClose();

      if (onQuestionUpdated && updatedQuestion) {
        onQuestionUpdated(updatedQuestion);
      }
    } else {
      // Create mode: create new question
      const response = await fetch(questionAudioUrl);
      const blob = await response.blob();

      const newQuestion = await createQuestion({
        passageId: state.passage?.id || '',
        mediafileId: state.mediafileId || '',
        title: questionTitle,
        speaker: speaker,
        segmentStart: finalStart,
        segmentEnd: finalEnd,
        audioBlob: blob,
        duration: questionDuration,
      });

      onClose();

      if (onQuestionCreated && newQuestion?.id) {
        onQuestionCreated(newQuestion);
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 1,
          width: { xs: '90%', sm: '100%' },
          maxWidth: '800px',
          m: 'auto',
          boxShadow: 'none',
          border: '1px solid black',
        },
      }}
      slotProps={{
        backdrop: {
          sx: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
        },
      }}
    >
      <Box sx={{ p: 4, position: 'relative' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          {isEditMode ? 'Edit Question' : 'Add Question'}
        </Typography>

        {/* Passage Waveform Section */}
        <Box sx={{ mb: 4 }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{ mb: 1.5 }}
          >
            <IconButton onClick={handlePassagePlayToggle} sx={{ p: 0 }}>
              {passagePlaying ? (
                <PauseIcon sx={{ color: 'neutral.main', fontSize: 32 }} />
              ) : (
                <PlayArrowIcon sx={{ color: 'neutral.main', fontSize: 32 }} />
              )}
            </IconButton>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {initialSelection.start !== initialSelection.end
                ? `${formatTime(currentSelection.start)} - ${formatTime(currentSelection.end)}`
                : formatTime(locationMarker)}{' '}
              / {formatTime(passageDuration)}
            </Typography>
          </Stack>
          <Box
            ref={passageContainerRef}
            sx={{
              height: 80,
              bgcolor: '#f0f0f0',
              borderRadius: 0,
              overflow: 'hidden',
            }}
          />
        </Box>

        {/* Question Audio Section */}
        <Box sx={{ mb: 4 }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{ mb: 1.5 }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton
                disabled={!questionAudioUrl}
                onClick={handleQuestionPlayToggle}
                sx={{ p: 0 }}
              >
                {questionPlaying ? (
                  <PauseIcon sx={{ color: 'neutral.main', fontSize: 32 }} />
                ) : (
                  <PlayArrowIcon
                    sx={{
                      color: questionAudioUrl ? 'neutral.main' : '#ccc',
                      fontSize: 32,
                    }}
                  />
                )}
              </IconButton>
              <Typography
                variant="body1"
                color={questionAudioUrl ? 'text.primary' : 'text.secondary'}
              >
                {formatTime(questionTime)} / {formatTime(questionDuration)}
              </Typography>
            </Stack>
            <TextField
              variant="outlined"
              size="small"
              value={questionTitle}
              onChange={(e) => setQuestionTitle(e.target.value)}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 0,
                  border: '1px solid black',
                  '& fieldset': { border: 'none' },
                },
              }}
            />
            <input
              type="file"
              accept="audio/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <Button
              startIcon={<CloudUploadOutlinedIcon />}
              onClick={handleUploadClick}
            >
              Upload...
            </Button>
            <IconButton>
              <MoreVertIcon />
            </IconButton>
          </Stack>
          <Box
            ref={questionContainerRef}
            sx={{
              height: 100, // Matching the larger empty space in image
              bgcolor: '#f0f0f0',
              width: '100%',
              borderRadius: 0,
              overflow: 'hidden',
            }}
          />
        </Box>

        {/* Speaker and Recording */}
        <Box>
          <TextField
            placeholder="Speaker"
            variant="outlined"
            size="small"
            value={speaker}
            onChange={(e) => setSpeaker(e.target.value)}
            sx={{
              width: 250,
              mb: 4,
              '& .MuiOutlinedInput-root': {
                borderRadius: 0,
                border: '1px solid black',
                '& fieldset': { border: 'none' },
              },
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 5 }}>
            <IconButton
              onClick={handleRecordClick}
              aria-label={isRecording ? 'Stop' : 'Record'}
              sx={{
                width: 80,
                height: 80,
                bgcolor: isRecording ? 'white' : '#d32f2f',
                color: isRecording ? '#d32f2f' : 'white',
                border: isRecording ? '2px solid #d32f2f' : 'none',
                '&:hover': {
                  bgcolor: isRecording ? '#ffebee' : '#b71c1c',
                },
                '& .MuiSvgIcon-root': { fontSize: 40 },
              }}
            >
              {isRecording ? <StopIcon /> : <FiberManualRecordIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Stack direction="row" spacing={3} justifyContent="center">
          <Button onClick={onClose} sx={{ minWidth: 140, py: 1 }}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!questionAudioUrl}
            onClick={handleContinue}
            sx={{ minWidth: 140, py: 1 }}
          >
            {isEditMode ? 'Save' : 'Continue'}
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
};
