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

    const segmentStart = Math.floor(props.segmentStart);
    const segmentEnd = Math.floor(props.segmentEnd);

    // 2. Calculate next sequencenum for questions at the same time location
    const existingQuestions = memory.cache.query((q) =>
      q.findRecords('passagequestion')
    ) as PassageQuestionD[];

    const questionsAtSameLocation = existingQuestions.filter((q) => {
      const passageData = q.relationships?.passage?.data;
      const passageId = Array.isArray(passageData)
        ? passageData[0]?.id
        : (passageData as { id: string })?.id;

      return (
        passageId === props.passageId &&
        q.attributes.segmentStart === segmentStart &&
        q.attributes.segmentEnd === segmentEnd
      );
    });

    const maxSequenceNum = questionsAtSameLocation.reduce(
      (max, q) => Math.max(max, q.attributes.sequencenum || 0),
      0
    );

    // 3. Create Orbit record
    const newQuestion: PassageQuestion = {
      type: 'passagequestion',
      attributes: {
        title: props.title,
        speaker: props.speaker,
        segmentStart: segmentStart,
        segmentEnd: segmentEnd,
        audioPath: audioPath,
        duration: props.duration,
        sequencenum: maxSequenceNum + 1,
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
