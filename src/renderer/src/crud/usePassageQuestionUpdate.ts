import { useGlobal } from '../context/useGlobal';
import { PassageQuestionD } from '../model';
import { isElectron } from '../../api-variable';

interface UpdateQuestionProps {
  questionId: string;
  title: string;
  speaker: string;
  audioBlob?: Blob; // Optional - only provided if audio changed
  duration?: number;
  segmentStart?: number;
  segmentEnd?: number;
}

export const usePassageQuestionUpdate = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  const updateQuestion = async (props: UpdateQuestionProps) => {
    // Find the existing question record
    const questions = memory.cache.query((q) =>
      q.findRecords('passagequestion')
    ) as PassageQuestionD[];
    const existingQuestion = questions.find((q) => q.id === props.questionId);

    if (!existingQuestion) {
      throw new Error(`Question not found: ${props.questionId}`);
    }

    let audioPath = existingQuestion.attributes.audioPath;
    let duration = existingQuestion.attributes.duration;

    // If new audio blob provided, save it
    if (props.audioBlob) {
      if (isElectron && (window as any).api?.saveQuestionAudio) {
        const passageData = existingQuestion.relationships?.passage?.data;
        const passageId = Array.isArray(passageData)
          ? passageData[0]?.id
          : (passageData as { id: string })?.id;
        const buffer = await props.audioBlob.arrayBuffer();
        audioPath = await (window as any).api.saveQuestionAudio(
          passageId || props.questionId,
          buffer
        );
      } else {
        console.warn(
          'saveQuestionAudio not available or not electron, using blob URL fallback'
        );
        audioPath = URL.createObjectURL(props.audioBlob);
      }
      duration = props.duration ?? duration;
    }

    // Update the record
    const updatedQuestion: PassageQuestionD = {
      ...existingQuestion,
      attributes: {
        ...existingQuestion.attributes,
        title: props.title,
        speaker: props.speaker,
        audioPath,
        duration,
        segmentStart:
          props.segmentStart !== undefined
            ? Math.floor(props.segmentStart)
            : existingQuestion.attributes.segmentStart,
        segmentEnd:
          props.segmentEnd !== undefined
            ? Math.floor(props.segmentEnd)
            : existingQuestion.attributes.segmentEnd,
        dateUpdated: new Date().toISOString(),
        lastModifiedBy: user ? parseInt(user) : -1,
      },
    };

    await memory.update((t) => t.updateRecord(updatedQuestion));

    return updatedQuestion;
  };

  return { updateQuestion };
};
