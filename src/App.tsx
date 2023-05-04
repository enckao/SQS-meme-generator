import './App.css';
import Gallery from './components/gallery.tsx';
import { Suspense } from 'react';

function App() {
  return (
    <Suspense fallback={'Loading memes, please stand by...'}>
      <Gallery />
    </Suspense>
  );
}

export default App;
