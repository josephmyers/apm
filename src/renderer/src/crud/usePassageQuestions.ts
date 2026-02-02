import { useMemo } from 'react';
import { useOrbitData } from '../hoc/useOrbitData';
import { PassageQuestionD } from '../model';
import { RecordIdentity } from '@orbit/records';

export const usePassageQuestions = (passageId?: string) => {
  const questions = useOrbitData<PassageQuestionD[]>('passagequestion');

  return useMemo(() => {
    if (!passageId) return [];

    return questions
      .filter((q) => {
        const passageData = q.relationships?.passage?.data;
        if (Array.isArray(passageData)) return false;
        return (passageData as RecordIdentity)?.id === passageId;
      })
      .sort((a, b) => {
        // Primary sort: by segmentStart
        const startDiff =
          (a.attributes?.segmentStart || 0) - (b.attributes?.segmentStart || 0);
        if (startDiff !== 0) return startDiff;

        // Secondary sort: by segmentEnd (for questions with same start)
        const endDiff =
          (a.attributes?.segmentEnd || 0) - (b.attributes?.segmentEnd || 0);
        if (endDiff !== 0) return endDiff;

        // Tertiary sort: by sequencenum (for questions at same time location)
        return (
          (a.attributes?.sequencenum || 0) - (b.attributes?.sequencenum || 0)
        );
      });
  }, [questions, passageId]);
};
