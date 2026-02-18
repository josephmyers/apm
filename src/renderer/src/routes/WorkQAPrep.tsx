import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Stack,
  Typography,
  Paper,
  IconButton,
} from '@mui/material';
import HelpIcon from '@mui/icons-material/HelpOutlineOutlined';
import UserIcon from '@mui/icons-material/PersonOutline';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RecordKeyMap } from '@orbit/records';
import { IRegion } from '../crud/useWavesurferRegions';
import PassageDetailPlayer from '../components/PassageDetail/PassageDetailPlayer';
import { formatTime } from '../control/formatTime';
import { PassageDetailProvider } from '../context/PassageDetailContext';
import usePassageDetailContext from '../context/usePassageDetailContext';
import { useOrbitData } from '../hoc/useOrbitData';
import { IState, Passage, Plan } from '../model';
import { remoteIdGuid } from '../crud/remoteId';
import { useGlobal } from '../context/useGlobal';

export function WorkQAPrepContent() {
  const { prjId, pasId } = useParams();
  const navigate = useNavigate();
  const [memory] = useGlobal('memory');
  const passages = useOrbitData<Passage[]>('passage');
  const plans = useOrbitData<Plan[]>('plan');
  const bookData = useSelector((state: IState) => state.books.bookData);
  const { playing, getCurrentSegment, setCurrentSegment } =
    usePassageDetailContext();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [playerWidth, setPlayerWidth] = useState(0);
  const [progressSec, setProgressSec] = useState(0);
  const [addQuestionOpen, setAddQuestionOpen] = useState(false);
  const [addQuestionSegment, setAddQuestionSegment] = useState<
    IRegion | undefined
  >(undefined);

  const segment = getCurrentSegment?.();
  const segmentStartSec = segment?.start;
  const segmentEndSec = segment?.end;
  const timeDisplay = useMemo(() => {
    if (
      typeof segmentStartSec === 'number' &&
      typeof segmentEndSec === 'number' &&
      segmentEndSec > segmentStartSec
    ) {
      return `${formatTime(segmentStartSec)} - ${formatTime(segmentEndSec)}`;
    }
    return formatTime(progressSec);
  }, [progressSec, segmentEndSec, segmentStartSec]);

  useEffect(() => {
    const updateWidth = () =>
      setPlayerWidth(containerRef.current?.clientWidth ?? 0);
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const resolvedWidth = Math.max(playerWidth, 320);

  const localPassageId = useMemo(() => {
    if (memory?.keyMap && pasId) {
      return (
        remoteIdGuid('passage', pasId, memory.keyMap as RecordKeyMap) || pasId
      );
    }
    return pasId ?? '';
  }, [memory?.keyMap, pasId]);

  const localPlanId = useMemo(() => {
    if (memory?.keyMap && prjId) {
      return (
        remoteIdGuid('plan', prjId, memory.keyMap as RecordKeyMap) || prjId
      );
    }
    return prjId ?? '';
  }, [memory?.keyMap, prjId]);

  const passageRec = useMemo(
    () => passages.find((p) => p.id === localPassageId),
    [localPassageId, passages]
  );

  const planRec = useMemo(
    () => plans.find((p) => p.id === localPlanId),
    [localPlanId, plans]
  );

  const currentStepIndex = 4; // visually highlight current step

  const passageTitle = useMemo(() => {
    if (passageRec) {
      const b = bookData.find((b) => b.code === passageRec.attributes.book);
      let ret = b ? b.short : passageRec.attributes.book;
      ret += ' ';
      ret += passageRec.attributes.reference;
      return ret;
    }
  }, [passageRec, bookData]);

  const projectName = useMemo(() => planRec?.attributes?.name ?? '', [planRec]);

  const handleBack = () => {
    if (prjId) navigate(`/plan/${prjId}/0`);
  };

  const handleAddQuestion = () => {
    // Snapshot the current position/selection before opening the dialog
    const seg = getCurrentSegment?.();
    if (seg && typeof seg.start === 'number' && typeof seg.end === 'number') {
      setAddQuestionSegment(seg);
    } else {
      setAddQuestionSegment({ start: progressSec, end: progressSec });
    }
    setAddQuestionOpen(true);
  };

  const handleCloseAddQuestion = (time: IRegion) => {
    setAddQuestionOpen(false);
    // when the dialog closes, the segments reset (likely due to the detail player destroy),
    // so make sure the segment is preserved
    if (time) {
      setTimeout(() => {
        setCurrentSegment(time, 0);
      }, 500);
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100vh"
      bgcolor="#fff"
      position="relative"
    >
      {/* Header */}
      <Paper
        square
        elevation={0}
        sx={{ borderBottom: '1px solid #d1d5db', bgcolor: '#f5f5f5' }}
      >
        {/* Passage info */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          px={2}
          py={2}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <IconButton onClick={handleBack} size="small">
              <ChevronLeftIcon
                sx={{ width: 24, height: 24, color: '#374151' }}
              />
            </IconButton>
            <Box>
              <Typography fontWeight={600} fontSize={18}>
                {passageTitle || 'Loading...'}
              </Typography>
              <Typography fontSize={14} color="#4b5563">
                {projectName || ''}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <HelpIcon sx={{ width: 28, height: 28, color: '#374151' }} />
            <UserIcon sx={{ width: 28, height: 28, color: '#374151' }} />
          </Stack>
        </Stack>

        {/* Progress bar */}
        <Box px={2} pb={2}>
          <Stack direction="row" alignItems="center" height={32}>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              // Darkest for current, darker-left for completed, lighter-right for remaining
              <Box
                key={i}
                sx={{
                  flex: 1,
                  height: '100%',
                  bgcolor:
                    i === currentStepIndex
                      ? '#141414'
                      : i < currentStepIndex
                        ? '#9d9ea0'
                        : '#d1d5db',
                  ml: i > 0 ? -1 : 0,
                  clipPath:
                    'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)',
                }}
              />
            ))}
          </Stack>
        </Box>

        {/* Step title */}
        <Box textAlign="center" pb={1.5}>
          <Typography color="#374151" fontWeight={500}>
            Community Test Q&A Preparation
          </Typography>
        </Box>
      </Paper>

      {/* Audio Player Section */}
      <Box
        ref={containerRef}
        flex={1}
        px={2}
        py={2}
        sx={{ overflowX: 'hidden' }}
      >
        <PassageDetailPlayer
          width={resolvedWidth}
          allowZoomAndSpeed={false}
          allowAutoSegment={false}
          allowSegment={undefined}
          onProgress={(p) => setProgressSec(p)}
        />

        <Box mb={2}>
          <Typography variant="body2" color="text.secondary">
            {timeDisplay}
          </Typography>
        </Box>

        <Button
          variant="contained"
          fullWidth
          disabled={playing}
          onClick={handleAddQuestion}
          sx={{
            bgcolor: '#141414',
            color: '#fff',
            py: 1.5,
            borderRadius: 2,
            fontSize: 16,
            fontWeight: 600,
            mb: 3,
            '&:hover': { bgcolor: '#1f2937' },
          }}
        >
          + Add Question...
        </Button>

        <Box textAlign="center" color="#4b5563" py={4}>
          <Typography
            variant="body1"
            component="p"
            sx={{ maxWidth: 420, mx: 'auto' }}
          >
            Tap + to add a question here. Drag to select a range, or double-tap
            to select all.
          </Typography>
        </Box>
      </Box>

      {/* Footer */}
      <Paper
        square
        elevation={0}
        sx={{
          borderTop: '2px solid #d1d5db',
          bgcolor: '#f5f5f5',
          position: 'relative',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          px={{ xs: 1, sm: 2 }}
          py={1.5}
        >
          <Button
            variant="outlined"
            startIcon={<ChevronLeftIcon />}
            sx={{
              bgcolor: '#fff',
              color: '#374151',
              px: 2,
              py: 1.2,
              width: 100,
              height: 44,
              textTransform: 'none',
              fontSize: 14,
              '& .MuiButton-startIcon': { mr: 0.25 },
              '&:hover': { bgcolor: '#f3f4f6' },
            }}
          >
            Previous
          </Button>

          <Button
            variant="outlined"
            sx={{
              bgcolor: '#fff',
              color: '#374151',
              px: { xs: 2, sm: 3 },
              py: 1.2,
              textTransform: 'none',
              fontSize: 14,
              display: 'flex',
              gap: 1,
              alignItems: 'center',
              height: 44,
              '&:hover': { bgcolor: '#f3f4f6' },
            }}
          >
            <Box
              sx={{
                width: 16,
                height: 16,
                border: '2px solid #cbd5e1',
                borderRadius: 0.8,
              }}
            />
            Step Complete
          </Button>

          <Button
            variant="outlined"
            endIcon={<ChevronRightIcon />}
            sx={{
              bgcolor: '#fff',
              color: '#374151',
              px: 2,
              py: 1.2,
              width: 100,
              height: 44,
              textTransform: 'none',
              fontSize: 14,
              '& .MuiButton-endIcon': { ml: 0.25 },
              '&:hover': { bgcolor: '#f3f4f6' },
            }}
          >
            Next
          </Button>
        </Stack>

        <Box position="fixed" bottom={84} right={16}>
          <Button
            variant="outlined"
            sx={{
              width: 64,
              height: 64,
              bgcolor: '#fff',
              borderRadius: 2,
              minWidth: 64,
              '&:hover': { bgcolor: '#f3f4f6' },
            }}
          >
            <QuestionAnswerIcon
              sx={{ width: 32, height: 32, color: '#1f2937' }}
            />
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default function AudioProjectManager() {
  return (
    <PassageDetailProvider>
      <WorkQAPrepContent />
    </PassageDetailProvider>
  );
}
