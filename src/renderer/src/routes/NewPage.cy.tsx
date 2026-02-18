import React from 'react';
import { NewPageContent } from './NewPageContent';
import { GlobalContext } from '../context/GlobalContext';
import { Provider } from 'react-redux';
import { legacy_createStore as createStore, combineReducers } from 'redux';
import { MemoryRouter } from 'react-router-dom';
import Memory from '@orbit/memory';
import LocalizedStrings from 'react-localization';
import localizationReducer from '../store/localization/reducers';
import { PassageDetailContext } from '../context/PassageDetailContext';
import { ThemeProvider, createTheme } from '@mui/material';
import { OrbitContext } from '../hoc/OrbitContextProvider'; // Correct import

// Mock Redux selectors (Localization)
const mockMainStrings = new LocalizedStrings({
  en: {
    updateAvailable: 'Update {0} available ({1})',
    UnsavedData: 'Unsaved Data',
    saveFirst: 'Save first?',
    // ... add other strings as needed by NewPage
  },
});

const mockStringsReducer = () => {
  const initialState = localizationReducer(undefined, { type: '@@INIT' });
  return {
    ...initialState,
    loaded: true,
    lang: 'en',
    main: mockMainStrings,
    // Add other slices if needed
  };
};

const mockStore = createStore(
  combineReducers({
    strings: mockStringsReducer,
    orbit: () => ({ status: undefined, message: '' }),
    // Add other slices if needed
  })
);

// Mock Orbit Memory
const createMockLiveQuery = (data: any[]) => ({
  subscribe: () => () => {},
  query: () => data,
});

const createMockMemory = (questions: any[] = []): Memory => {
  return {
    cache: {
      query: (queryFn: (q: any) => any) => {
        return questions;
      },
      liveQuery: () => createMockLiveQuery(questions),
    },
    update: cy.stub().as('memoryUpdate'), // Stub update for creating questions
    keyMap: {
      keyToId: () => 'mock-id',
    },
  } as unknown as Memory;
};

const mockTheme = createTheme();

const createWav = (seconds: number) => {
  const sampleRate = 8000;
  const numChannels = 1;
  const bitsPerSample = 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = Math.ceil(seconds * byteRate);
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < dataSize; i++) {
    view.setUint8(44 + i, Math.floor(Math.random() * 256));
  }
  return buffer;
};

describe('NewPage Component', () => {
  // Test Data
  const passageId = 'test-passage-1';
  const questions = [
    {
      type: 'passagequestion',
      id: 'q1',
      attributes: {
        title: 'Seeded Question 1',
        segmentStart: 1.0,
        segmentEnd: 2.0,
        speaker: 'Test Speaker',
      },
      relationships: {
        passage: { data: { type: 'passage', id: passageId } },
      },
    },
    {
      type: 'passagequestion',
      id: 'q2',
      attributes: {
        title: 'Seeded Question 2',
        segmentStart: 4.0,
        segmentEnd: 5.0,
        speaker: 'Test Speaker 2',
      },
      relationships: {
        passage: { data: { type: 'passage', id: passageId } },
      },
    },
    {
      type: 'passagequestion',
      id: 'q3',
      attributes: {
        title: 'Seeded Question 3',
        segmentStart: 5.0,
        segmentEnd: 5.0,
        speaker: 'Test Speaker 2',
      },
      relationships: {
        passage: { data: { type: 'passage', id: passageId } },
      },
    },
  ];

  const mockAudioUrl = 'http://localhost:3000/test-audio.wav';
  // Create a 10s wav blob with noise
  const wavBuffer = createWav(10);
  const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });

  const mockPassageState = {
    passage: {
      type: 'passage',
      id: passageId,
      attributes: {
        reference: 'Test 1:1',
        title: 'Test Passage',
        book: 'JDG',
      },
    },
    audioBlob: wavBlob,
    audioUrl: mockAudioUrl,
    allBookData: [{ code: 'JDG', long: 'Judges' }],
    mediafileId: 'test-media-1',
  };

  const mountNewPage = (memoryInstance: Memory) => {
    // Mock GlobalContext
    const mockGlobalContext = {
      state: {
        memory: memoryInstance,
      },
      setState: cy.stub(),
    };

    // Mock OrbitContext
    const mockOrbitContext = {
      memory: memoryInstance,
      getRecs: cy.stub().returns(undefined), // Return undefined to trigger query
      setRecs: cy.stub(), // Stub setRecs
    };

    // Mock PassageDetailContext
    const mockPassageContext = {
      state: mockPassageState,
      setState: cy.stub(),
    };

    cy.mount(
      <Provider store={mockStore}>
        <ThemeProvider theme={mockTheme}>
          <GlobalContext.Provider value={mockGlobalContext as any}>
            <OrbitContext.Provider value={mockOrbitContext as any}>
              <PassageDetailContext.Provider value={mockPassageContext as any}>
                <MemoryRouter>
                  <NewPageContent />
                </MemoryRouter>
              </PassageDetailContext.Provider>
            </OrbitContext.Provider>
          </GlobalContext.Provider>
        </ThemeProvider>
      </Provider>
    );
  };

  it('loads questions', () => {
    const memory = createMockMemory(questions);
    mountNewPage(memory);
    cy.wait(500);

    cy.contains('0:01 - 0:02').should('be.visible');
    cy.contains('0:04 - 0:05').should('be.visible');
    cy.contains(/^0:05$/).should('be.visible');
  });

  it('loads question markers', () => {
    const memory = createMockMemory(questions);
    mountNewPage(memory);
    cy.wait(500);

    // verify markers
    cy.get('[aria-label="Waveform"] > div')
      .should('exist')
      .shadow()
      .find('[part="regions-container"]')
      .find('div')
      .should('have.length', questions.length);
  });
});
