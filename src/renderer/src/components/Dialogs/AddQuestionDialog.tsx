import { useState, useEffect, useRef, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { Box, Button, Stack, TextField } from '@mui/material';
import BigDialog from '../../hoc/BigDialog';
import PassageDetailPlayer from '../PassageDetail/PassageDetailPlayer';
import WSAudioPlayer from '../WSAudioPlayer';
import BigDialogBp from '../../hoc/BigDialogBp';
import { IRegion } from '../../crud/useWavesurferRegions';
import { NamedRegions } from '../../utils/namedSegments';
import usePassageDetailContext from '../../context/usePassageDetailContext';

const QUESTION_PLAYER_HEIGHT = 200;

export interface AddQuestionDialogProps {
  open: boolean;
  onClose: (time: IRegion) => void;
  onContinue?: () => void;
  initialSegment?: IRegion;
}

export function AddQuestionDialog({
  open,
  onClose,
  onContinue,
  initialSegment,
}: AddQuestionDialogProps) {
  const [speakerName, setSpeakerName] = useState('');
  const [questionTitle, setQuestionTitle] = useState('');
  const [questionAudioBlob, setQuestionAudioBlob] = useState<Blob | undefined>(
    undefined
  );
  const [containerWidth, setContainerWidth] = useState(0);
  const [segment, setSegment] = useState<IRegion>();
  const [progressSec, setProgressSec] = useState(0);
  const { getCurrentSegment, currentSegmentIndex } = usePassageDetailContext();
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const handleUploadClick = useCallback(() => {
    uploadInputRef.current?.click();
  }, []);

  const handleUploadChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQuestionAudioBlob(file);

    // Allow re-selecting the same file later.
    e.target.value = '';
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleResize = () => {
      const avail = Math.min(window.innerWidth * 0.9, 750);
      // Subtract padding
      setContainerWidth(avail - 48);
    };

    handleResize(); // Initial calc
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !initialSegment) {
      return;
    }

    // Delay setting segment to allow player to complete initial load
    const timeoutId = setTimeout(() => {
      setSegment(initialSegment);
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [open, initialSegment]);

  const handleCancel = () => {
    //todo move this from cancel to continue
    const seg = getCurrentSegment();
    onClose(
      currentSegmentIndex === -1
        ? { start: progressSec, end: progressSec }
        : seg!
    );
  };

  const handleContinue = () => {
    onContinue?.();
  };

  // Ensure reasonable minimum for players
  const playerWidth = Math.max(containerWidth, 300);

  return (
    <BigDialog
      title="Add Question"
      isOpen={open}
      onOpen={() => {}}
      bp={BigDialogBp.mobile}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          pt: 1,
          width: '100%',
        }}
      >
        {/* Passage audio player with selection */}
        {containerWidth > 0 && (
          <PassageDetailPlayer
            width={playerWidth}
            allowZoomAndSpeed={false}
            allowAutoSegment={false}
            allowSegment={NamedRegions.TRTask}
            onProgress={(p) => setProgressSec(p)}
            suggestedSegments={JSON.stringify({ regions: [segment] })}
          />
        )}

        {/* Question audio */}
        <Box>
          <Stack
            direction="row"
            alignItems="stretch"
            mb={1}
            sx={{ justifyContent: 'space-between' }}
          >
            <TextField
              size="small"
              placeholder="Question 1"
              value={questionTitle}
              onChange={(e) => setQuestionTitle(e.target.value)}
              sx={{ width: 140 }}
            />
            <input
              ref={uploadInputRef}
              type="file"
              accept="audio/*,.mp3,.m4a,.wav,.ogg"
              onChange={handleUploadChange}
              style={{ display: 'none' }}
            />
            <Button
              variant="outlined"
              style={{ height: '40px' }}
              onClick={handleUploadClick}
            >
              Upload...
            </Button>
          </Stack>
          {containerWidth > 0 && (
            <WSAudioPlayer
              id="questionAudioPlayer"
              allowRecord={true}
              height={QUESTION_PLAYER_HEIGHT}
              width={playerWidth}
              blob={questionAudioBlob}
              onBlobReady={setQuestionAudioBlob}
              segments="{}"
            />
          )}
        </Box>

        {/* Speaker name input */}
        <TextField
          size="small"
          placeholder="Speaker"
          value={speakerName}
          onChange={(e) => setSpeakerName(e.target.value)}
          sx={{ width: 200 }}
        />

        {/* Action buttons */}
        <Stack direction="row" spacing={2} justifyContent="flex-end" mt={2}>
          <Button variant="outlined" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleContinue} disabled={true}>
            Continue
          </Button>
        </Stack>
      </Box>
    </BigDialog>
  );
}

export default AddQuestionDialog;
