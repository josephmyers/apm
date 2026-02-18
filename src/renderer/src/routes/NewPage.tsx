import React from 'react';
import { PassageDetailProvider } from '../context/PassageDetailContext';
import { NewPageContent } from './NewPageContent';

export function NewPage() {
  return (
    <PassageDetailProvider>
      <NewPageContent />
    </PassageDetailProvider>
  );
}

export default NewPage;
