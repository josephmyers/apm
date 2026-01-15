import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { act } from 'react';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  useParams: jest.fn(() => ({ prjId: 'p1', pasId: 'pa1' })),
  useNavigate: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(() => []),
}));

jest.mock('../context/useGlobal', () => ({
  useGlobal: jest.fn(),
}));

jest.mock('../hoc/useOrbitData', () => ({
  useOrbitData: jest.fn(),
}));

jest.mock('../control/formatTime', () => ({
  formatTime: jest.fn(() => '00:00'),
}));

jest.mock('../crud/remoteId', () => ({
  remoteIdGuid: jest.fn(() => 'guid'),
}));

// Create a mock for setCurrentSegment that we can call to simulate waveform selection
let mockSetCurrentSegment: ((segment: any, index: number) => void) | undefined;
let mockCurrentSegmentRef: { current: any } = { current: undefined };

// Mock the PassageDetailContext to expose setCurrentSegment and getCurrentSegment
jest.mock('../context/PassageDetailContext', () => ({
  PassageDetailProvider: ({ children }: { children: React.ReactNode }) => {
    return <div>{children}</div>;
  },
}));

// Mock usePassageDetailContext to provide real getCurrentSegment behavior
jest.mock('../context/usePassageDetailContext', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    playing: false,
    getCurrentSegment: () => mockCurrentSegmentRef.current,
    setCurrentSegment: (segment: any, index: number) => {
      mockCurrentSegmentRef.current = segment;
      if (mockSetCurrentSegment) {
        mockSetCurrentSegment(segment, index);
      }
    },
  })),
}));

// Mock PassageDetailPlayer to capture onProgress and allow triggering segment changes
let mockOnProgress: ((progress: number) => void) | undefined;
jest.mock('../components/PassageDetail/PassageDetailPlayer', () => ({
  __esModule: true,
  default: ({ onProgress }: { onProgress?: (progress: number) => void }) => {
    mockOnProgress = onProgress;
    return <div data-testid="passage-detail-player">PassageDetailPlayer_Mock</div>;
  },
}));

// Capture initialSegment prop passed to AddQuestionDialog
let capturedInitialSegment: any = undefined;
jest.mock('../components/Dialogs/AddQuestionDialog', () => ({
  __esModule: true,
  default: ({ open, initialSegment }: { open: boolean; initialSegment?: any }) => {
    capturedInitialSegment = initialSegment;
    return (
      <div data-testid="add-question-dialog">
        Dialog is {open ? 'open' : 'closed'}
        {initialSegment && (
          <span data-testid="dialog-segment">
            {JSON.stringify(initialSegment)}
          </span>
        )}
      </div>
    );
  },
}));

// Import component
import { WorkQAPrepContent } from './WorkQAPrep';
import { useGlobal } from '../context/useGlobal';
import { useOrbitData } from '../hoc/useOrbitData';
import usePassageDetailContext from '../context/usePassageDetailContext';

describe('WorkQAPrepContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedInitialSegment = undefined;
    mockCurrentSegmentRef.current = undefined;
    mockSetCurrentSegment = undefined;
    mockOnProgress = undefined;
    (useGlobal as jest.Mock).mockReturnValue([{}]);
    (useOrbitData as jest.Mock).mockReturnValue([]);
  });

  test('should render without crashing', async () => {
    render(<WorkQAPrepContent />);

    expect(screen.getByText('Community Test Q&A Preparation')).toBeInTheDocument();
  });

  test('should open Add Question dialog when button is clicked', async () => {
    const user = userEvent.setup();
    render(<WorkQAPrepContent />);

    // Verify dialog is initially closed
    expect(screen.getByText('Dialog is closed')).toBeInTheDocument();

    // Click the button
    const addButton = screen.getByRole('button', { name: /\+ Add Question/i });
    await user.click(addButton);

    // Verify dialog is open
    expect(screen.getByText('Dialog is open')).toBeInTheDocument();
  });

  test('should pass selected segment to AddQuestionDialog when getCurrentSegment returns a range', async () => {
    const user = userEvent.setup();
    const mockSegment = { start: 5.0, end: 10.0 };

    render(<WorkQAPrepContent />);

    // Simulate that the player has set a current segment (as if user dragged on waveform)
    // This sets the ref that getCurrentSegment reads from
    mockCurrentSegmentRef.current = mockSegment;

    // Click the Add Question button
    const addButton = screen.getByRole('button', { name: /\+ Add Question/i });
    await user.click(addButton);

    // Verify that the dialog received the correct segment
    expect(capturedInitialSegment).toEqual(mockSegment);
  });

  test('should use progressSec for zero-length segment when no range selected', async () => {
    const user = userEvent.setup();
    mockCurrentSegmentRef.current = undefined;

    render(<WorkQAPrepContent />);

    // Simulate progress update from player (user clicked somewhere on timeline)
    if (mockOnProgress) {
      act(() => {
        mockOnProgress!(7.5);
      });
    }

    // Click the Add Question button
    const addButton = screen.getByRole('button', { name: /\+ Add Question/i });
    await user.click(addButton);

    // Verify that the dialog received a zero-length segment at the progress position
    expect(capturedInitialSegment).toEqual({ start: 7.5, end: 7.5 });
  });
});
