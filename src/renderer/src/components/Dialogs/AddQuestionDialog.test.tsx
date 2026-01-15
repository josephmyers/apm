import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AddQuestionDialog } from './AddQuestionDialog';
import { IRegion } from '../../crud/useWavesurferRegions';

// Mock dependencies
jest.mock('../../hoc/BigDialog', () => ({
  __esModule: true,
  default: ({ children, isOpen, title }: any) => (
    <div data-testid="big-dialog" style={{ display: isOpen ? 'block' : 'none' }}>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

let capturedSuggestedSegments: string | undefined = undefined;
jest.mock('../PassageDetail/PassageDetailPlayer', () => ({
  __esModule: true,
  default: (props: any) => {
    capturedSuggestedSegments = props.suggestedSegments;
    return <div data-testid="passage-detail-player">PassageDetailPlayer Prop: {props.suggestedSegments}</div>;
  },
}));

jest.mock('../WSAudioPlayer', () => ({
  __esModule: true,
  default: () => <div data-testid="ws-audio-player">WSAudioPlayer</div>,
}));

// We need to mock window.innerWidth for the resize calculation
Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });

describe('AddQuestionDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedSuggestedSegments = undefined;
  });

  test('should pass initialSegment to PassageDetailPlayer as suggestedSegments after delay', async () => {
    const mockSegment: IRegion = { start: 1.5, end: 4.2 };

    render(
      <AddQuestionDialog
        open={true}
        onClose={() => {}}
        initialSegment={mockSegment}
      />
    );

    // Initially, suggestedSegments should be undefined (delayed)
    expect(capturedSuggestedSegments).toBeUndefined();

    // Wait for the timeout (50ms) to populate delayedSegments
    await waitFor(() => {
      expect(capturedSuggestedSegments).toBeDefined();
    }, { timeout: 1000 });

    const expectedSegments = JSON.stringify({ regions: [mockSegment] });
    expect(capturedSuggestedSegments).toBe(expectedSegments);

    // Check if it's rendered in the mock too
    expect(screen.getByText(new RegExp(expectedSegments.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeInTheDocument();
  });

  test('should not show highlighted selection if initialSegment is not provided', async () => {
    render(
      <AddQuestionDialog
        open={true}
        onClose={() => {}}
      />
    );

    // Wait a bit to be sure no timeout triggered it (50ms delay in component)
    await new Promise(r => setTimeout(r, 100));

    expect(capturedSuggestedSegments).toBeUndefined();
  });
});
