/// <reference types="cypress" />
import React from 'react';
import { WorkQAPrepContent } from './WorkQAPrep';
import { GlobalProvider } from '../context/GlobalContext';
import { Provider } from 'react-redux';
import {
  legacy_createStore as createStore,
  combineReducers,
  applyMiddleware,
} from 'redux';
import { thunk } from 'redux-thunk';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Memory from '@orbit/memory';
import DataProvider from '../hoc/DataProvider';
import { PassageDetailContext } from '../context/PassageDetailContext';

// Mock child components to avoid complex dependencies
const MockPassageDetailPlayer = ({ onProgress, width }: any) => {
  return (
    <div data-cy="passage-detail-player" style={{ width }}>
      PassageDetailPlayer Mock
      <button onClick={() => onProgress(10)}>Simulate Progress</button>
    </div>
  );
};

const MockAddQuestionDialog = ({ open, onClose }: any) => {
  if (!open) return null;
  return (
    <div role="dialog" data-cy="add-question-dialog">
      Add Question Dialog
      <button onClick={onClose}>Close</button>
    </div>
  );
};

// We need to mock the imports. Since we can't easily mock imports in Cypress component testing
// generally without webpack configs, but we can verify if the component works with the real ones
// or if we need to do something else.
// For now, let's assume the real components might cause issues if their dependencies aren't met.
// But WorkQAPrep.tsx imports them.
// A common strategy is to use `cy.stub` on the component if possible, but for imports inside the file
// tested, that's hard.
// However, since we are testing `WorkQAPrepContent`, we can rely on the fact that if we provide
// the context, the child components might render.
// BUT PassageDetailPlayer uses complex data.
// Let's rely on standard shallow rendering concepts or just providing enough context.
// Actually, I can use `cy.intercept` if they make network requests, but they don't.

// Let's check if we can Mock the child components by creating a test-specific version of the file
// or just providing the contexts they need.
// PassageDetailPlayer likely needs PassageDetailContext. We are providing it.

// Mock Memory
const createMockLiveQuery = (data: any[]) => ({
  subscribe: () => () => {},
  query: () => data,
});

const createMockMemory = (dataMap: Record<string, any[]>): Memory => {
  return {
    cache: {
      query: (q: any) => {
        // q is a query builder, hard to inspect exactly what it asks for in this mock
        // but typically useOrbitData calls findRecords(model)
        return [];
      },
      liveQuery: (q: (b: any) => any) => {
        // We can try to guess the model from the query or just return data based on order
        // But useOrbitData passes a function.
        // We can inspect the function string or just return a generic query that returns everything
        // Or better, we can make the mock smarter.

        // A simple way is to return the data for the model if we can figure out the model.
        // The callback `q` is passed `params` -> `findRecords(model)`

        let model = '';
        const builder = {
            findRecords: (m: string) => { model = m; return {}; }
        };
        q(builder);

        const data = dataMap[model] || [];
        return createMockLiveQuery(data);
      },
    },
    keyMap: {},
    query: () => {},
    update: () => {},
  } as unknown as Memory;
};


// Mock Redux
const mockBookData = [
  { code: 'LUK', short: 'Luke', name: 'Luke' },
];

const mockStore = createStore(
  combineReducers({
    books: () => ({
      loaded: true,
      bookData: mockBookData,
      map: {},
    }),
    strings: () => ({
      lang: 'en',
    }),
  }),
  applyMiddleware(thunk)
);

describe('WorkQAPrep', () => {
    const prjId = 'p1';
    const pasId = 'pas1';

    // Test Data
    const passages = [
        {
            id: 'pas1',
            type: 'passage',
            attributes: { book: 'LUK', reference: '1:1', title: 'Passage Title' },
        }
    ];

    const plans = [
        {
            id: 'p1',
            type: 'plan',
            attributes: { name: 'Test Plan' }
        }
    ];

    const dataMap = {
        passage: passages,
        plan: plans,
        // Add others if needed by PassageDetailPlayer if it renders fully
        section: [],
        mediafile: [],
        artifacttype: [],
        artifactcategory: [],
        sectionresourceuser: [],
        sectionresource: [],
        orgworkflowstep: [],
        workflowstep: [],
    };

    const mockMemory = createMockMemory(dataMap);

    const setup = (mockPassageContext: any = {}) => {
        const defaultPassageContext = {
            playing: false,
            getCurrentSegment: () => ({ start: 0, end: 10 }),
            ...mockPassageContext
        };

        const passageContextValue = {
            state: defaultPassageContext,
            setState: cy.stub(),
        };

        cy.mount(
            <Provider store={mockStore}>
                <GlobalProvider init={mockMemory}>
                    <DataProvider dataStore={mockMemory}>
                         <PassageDetailContext.Provider value={passageContextValue as any}>
                            <MemoryRouter initialEntries={[`/work-qa-prep/${prjId}/${pasId}`]}>
                                <Routes>
                                    <Route path="/work-qa-prep/:prjId/:pasId" element={<WorkQAPrepContent />} />
                                </Routes>
                            </MemoryRouter>
                        </PassageDetailContext.Provider>
                    </DataProvider>
                </GlobalProvider>
            </Provider>
        );
    };

    it('renders the header with passage info', () => {
        setup();
        // Check for passage reference and book name (LUK 1:1 -> Luke 1:1)
        cy.contains('Luke 1:1').should('be.visible');
        // Check for plan name
        cy.contains('Test Plan').should('be.visible');
    });

    it('renders the add question button', () => {
        setup();
        cy.contains('+ Add Question...').should('be.visible');
    });

    it('opens dialog on add question click', () => {
        setup();
        cy.contains('+ Add Question...').click();
        cy.get('[role="dialog"]').should('exist'); // AddQuestionDialog uses Dialog which has role dialog
    });
});
