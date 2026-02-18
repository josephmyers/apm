import Memory from '@orbit/memory';
import { useGlobal } from '../context/useGlobal';
import { PassageQuestionD } from '../model';

/**
 * Hook for reordering questions within a group (same segmentStart/segmentEnd).
 * Updates the sequencenum attribute for each question based on the new order.
 */
export const usePassageQuestionReorder = () => {
  const [coordinator] = useGlobal('coordinator');
  const memory = coordinator?.getSource('memory') as Memory;

  /**
   * Reorder questions by updating their sequencenum.
   * @param orderedIds - Array of question IDs in their new order
   */
  const reorderQuestions = async (orderedIds: string[]) => {
    if (!memory || orderedIds.length === 0) return;

    // Get all questions to update
    const allQuestions = memory.cache.query((q) =>
      q.findRecords('passagequestion')
    ) as PassageQuestionD[];

    // Filter to only the questions we're reordering
    const questionsToUpdate = orderedIds
      .map((id) => allQuestions.find((q) => q.id === id))
      .filter((q): q is PassageQuestionD => q !== undefined);

    if (questionsToUpdate.length === 0) return;

    // Update each question's sequencenum based on its new index
    await memory.update((t) =>
      questionsToUpdate.map((question, index) =>
        t.replaceAttribute(
          { type: 'passagequestion', id: question.id },
          'sequencenum',
          index + 1
        )
      )
    );
  };

  return { reorderQuestions };
};
