import { useOrbitData } from '../hoc/useOrbitData';
import { PassageQuestionD } from '../model';
import { RecordIdentity } from '@orbit/records';

export const usePassageQuestions = (passageId?: string) => {
  const questions = useOrbitData<PassageQuestionD[]>('passagequestion');

  if (!passageId) return [];

  return questions
    .filter((q) => {
      const passageData = q.relationships?.passage?.data;
      if (Array.isArray(passageData)) return false;
      return (passageData as RecordIdentity)?.id === passageId;
    })
    .sort(
      (a, b) =>
        (a.attributes?.segmentStart || 0) - (b.attributes?.segmentStart || 0)
    );
};
