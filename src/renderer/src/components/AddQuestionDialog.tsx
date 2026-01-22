import { useContext, useEffect, useRef, useState, useCallback } from 'react';
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
import { PassageDetailContext } from '../context/PassageDetailContext';
import { formatTime } from '../control/formatTime';

interface Props {
  open: boolean;
  onClose: () => void;
  initialSelection: { start: number; end: number };
}

export const AddQuestionDialog = ({
  open,
  onClose,
  initialSelection,
}: Props) => {
  const { state } = useContext(PassageDetailContext);
  const passageContainerRef = useRef<HTMLDivElement>(null);
  const passageWsRef = useRef<WaveSurfer | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const [passagePlaying, setPassagePlaying] = useState(false);
  const [passageTime, setPassageTime] = useState(0);
  const [passageDuration, setPassageDuration] = useState(0);
  const [questionTitle, setQuestionTitle] = useState('Question 1');
  const [speaker, setSpeaker] = useState('');

  // Initializing Passage WaveSurfer
  const initPassageWS = useCallback(() => {
    if (!passageContainerRef.current) return;

    const wsRegions = RegionsPlugin.create();
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
      }

      // Force sync to the selection start
      ws.setTime(initialSelection.start);
      setPassageTime(initialSelection.start);
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
          Add Question
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
                ? `${formatTime(initialSelection.start)} - ${formatTime(initialSelection.end)}`
                : formatTime(passageTime)}{' '}
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
              <IconButton disabled sx={{ p: 0 }}>
                <PlayArrowIcon sx={{ color: '#ccc', fontSize: 32 }} />
              </IconButton>
              <Typography variant="body1" color="text.secondary">
                0:00 / 0:00
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
            <Button startIcon={<CloudUploadOutlinedIcon />}>Upload...</Button>
            <IconButton>
              <MoreVertIcon />
            </IconButton>
          </Stack>
          <Box
            sx={{
              height: 100, // Matching the larger empty space in image
              bgcolor: '#f0f0f0',
              width: '100%',
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
              sx={{
                width: 80,
                height: 80,
                bgcolor: '#d32f2f',
                color: 'white',
                '&:hover': { bgcolor: '#b71c1c' },
                '& .MuiSvgIcon-root': { fontSize: 40 },
              }}
            >
              <FiberManualRecordIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Stack direction="row" spacing={3} justifyContent="center">
          <Button onClick={onClose} sx={{ minWidth: 140, py: 1 }}>
            Cancel
          </Button>
          <Button color="primary" disabled sx={{ minWidth: 140, py: 1 }}>
            Continue
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
};
