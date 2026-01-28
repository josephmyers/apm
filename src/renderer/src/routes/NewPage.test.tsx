import { TextEncoder, TextDecoder } from 'util';
Object.assign(global, { TextEncoder, TextDecoder });

import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { NewPage } from './NewPage';
import { PassageD, PassageQuestionD } from '../model';

// Mock usePassageQuestions (Allowed explicitly)
jest.mock('../crud/usePassageQuestions', () => ({
  usePassageQuestions: jest.fn(),
}));
import { usePassageQuestions } from '../crud/usePassageQuestions';

// Mock WaveSurfer (Necessary for JSDOM environment)
jest.mock('wavesurfer.js', () => {
  return {
    create: jest.fn().mockImplementation(() => ({
      load: jest.fn(),
      on: jest.fn(),
      destroy: jest.fn(),
      play: jest.fn(),
      pause: jest.fn(),
      setTime: jest.fn(),
      registerPlugin: jest.fn(),
    })),
  };
});

jest.mock('react-localization', () => {
  return jest.fn().mockImplementation(() => ({
    setLanguage: jest.fn(),
    getLanguage: jest.fn(),
    getInterfaceLanguage: jest.fn(),
    formatString: jest.fn(),
    getString: jest.fn(),
  }));
});

jest.mock('wavesurfer.js/dist/plugins/regions', () => ({
  create: jest.fn(),
}));
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions';

jest.mock('../context/PassageDetailContext', () => {
  const React = require('react');
  const Context = React.createContext({});
  return {
    PassageDetailContext: Context,
    PassageDetailProvider: ({ children }: any) => children,
  };
});
import { PassageDetailContext } from '../context/PassageDetailContext';

jest.mock('../utils', () => ({
  useMyNavigate: jest.fn(),
  infoMsg: jest.fn(),
  logError: jest.fn(),
  prettySegment: jest.fn(),
  rememberCurrentPassage: jest.fn(),
  Severity: { error: 'error' },
  useProjectPermissions: () => ({ canPublish: true }),
  useCheckOnline: jest.fn(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
  useDispatch: jest.fn().mockReturnValue(jest.fn()),
}));
import { useSelector } from 'react-redux';

jest.mock('../context/useGlobal', () => ({
  useGlobal: jest.fn(),
  useGetGlobal: jest.fn(),
}));
import { useGlobal } from '../context/useGlobal';

describe('NewPage', () => {
  const mockPassageId = 'p1';
  const mockProjectId = 'proj1';
  const mockPassage = {
    type: 'passage',
    id: mockPassageId,
    attributes: {
      book: 'GEN',
      reference: '1:1',
      title: 'Test Passage',
    },
  } as PassageD;

  const mockAddRegion = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup RegionsPlugin mock return value
    (RegionsPlugin.create as jest.Mock).mockReturnValue({
      enableDragSelection: jest.fn(),
      on: jest.fn(),
      getRegions: jest.fn().mockReturnValue([]),
      addRegion: mockAddRegion,
      clearRegions: jest.fn(),
    });

    // Default Mocks
    (usePassageQuestions as jest.Mock).mockReturnValue([]);

    // Mock Redux selectors
    (useSelector as unknown as jest.Mock).mockReturnValue({});

    // Mock URL methods
    global.URL.createObjectURL = jest.fn();
    global.URL.revokeObjectURL = jest.fn();

    // Mock useGlobal
    (useGlobal as jest.Mock).mockImplementation(() => [undefined, jest.fn()]);
  });

  const mockState = {
    passage: mockPassage,
    audioBlob: new Blob(),
  };

  test('page loads with question and play marker', async () => {
    // Arrange
    const questions: PassageQuestionD[] = [
      {
        type: 'passagequestion',
        id: 'q1',
        attributes: {
          title: 'Question 1',
          segmentStart: 1.5,
          segmentEnd: 2.5,
          state: 'Open',
        },
        relationships: {
          passage: { data: { type: 'passage', id: mockPassageId } },
        },
      } as any,
    ];

    (usePassageQuestions as jest.Mock).mockReturnValue(questions);

    // Act
    render(
      <PassageDetailContext.Provider
        value={{
          state: mockState as any,
          setState: jest.fn(),
        }}
      >
        <MemoryRouter
          initialEntries={[`/detail/${mockProjectId}/${mockPassageId}`]}
        >
          <Routes>
            <Route path="/detail/:prjId/:pasId" element={<NewPage />} />
          </Routes>
        </MemoryRouter>
      </PassageDetailContext.Provider>
    );

    // Assert
    // 1. Verify Question List Item is rendered
    expect(await screen.findByText('Question 1')).toBeDefined();

    // 2. Verify Question Markers (Regions) are added to WaveSurfer
    await waitFor(() => {
      expect(mockAddRegion).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.stringMatching(/^question-/),
          start: 1.5,
          end: 1.5,
        })
      );
    });

    // 3. Verify Play Marker
    const WaveSurfer = require('wavesurfer.js');
    expect(WaveSurfer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        cursorWidth: 4,
      })
    );
  });
});
