import {
  RecordOperation,
  RecordTransformBuilder,
  UninitializedRecord,
} from '@orbit/records';
import { useGlobal } from '../context/useGlobal';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';
import { PassageQuestion, PassageQuestionD } from '../model';
import { isElectron } from '../../api-variable';

interface CreateQuestionProps {
  passageId: string;
  mediafileId: string;
  title: string;
  speaker: string;
  segmentStart: number;
  segmentEnd: number;
  audioBlob: Blob;
  duration: number;
}

export const usePassageQuestionCreate = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  const createQuestion = async (props: CreateQuestionProps) => {
    // 1. Save audio file first
    let audioPath = '';

    if (isElectron && (window as any).api?.saveQuestionAudio) {
      // Use IPC to save file
      const buffer = await props.audioBlob.arrayBuffer();
      audioPath = await (window as any).api.saveQuestionAudio(
        props.passageId,
        buffer
      );
    } else {
      console.warn(
        'saveQuestionAudio not available or not electron, using blob URL fallback'
      );
      audioPath = URL.createObjectURL(props.audioBlob);
    }

    // 2. Create Orbit record
    const newQuestion: PassageQuestion = {
      type: 'passagequestion',
      attributes: {
        title: props.title,
        speaker: props.speaker,
        segmentStart: props.segmentStart,
        segmentEnd: props.segmentEnd,
        audioPath: audioPath,
        duration: props.duration,
        sequencenum: 1, // Logic for sequence number could be improved later
        dateCreated: new Date().toISOString(),
        dateUpdated: new Date().toISOString(),
        lastModifiedBy: user ? parseInt(user) : -1,
      },
    } as PassageQuestion;

    const t = new RecordTransformBuilder();
    const ops: RecordOperation[] = [];

    ops.push(
      ...AddRecord(
        t,
        newQuestion as unknown as UninitializedRecord,
        user,
        memory
      )
    );

    if (props.passageId) {
      ops.push(
        ...ReplaceRelatedRecord(
          t,
          newQuestion as PassageQuestionD,
          'passage',
          'passage',
          props.passageId
        )
      );
    }

    if (props.mediafileId) {
      ops.push(
        ...ReplaceRelatedRecord(
          t,
          newQuestion as PassageQuestionD,
          'mediafile',
          'mediafile',
          props.mediafileId
        )
      );
    }

    await memory.update(ops);
    return newQuestion as PassageQuestionD;
  };

  return { createQuestion };
};
