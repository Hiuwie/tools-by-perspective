import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PDFWorkspace from './pages/PDFWorkspace';
import MobileSignature from './pages/MobileSignature';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/pdf-workspace" element={<PDFWorkspace />} />
      <Route path="/mobile-sign" element={<MobileSignature />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}

export default App;
