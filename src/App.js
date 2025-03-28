import React from 'react';
import { ThemeProvider } from './components/ThemeProvider';
import Header from './components/Header';
import Board from './components/Board';

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Header />
        <main className="container mx-auto py-8">
          <Board />
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
