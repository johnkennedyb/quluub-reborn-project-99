
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add more padding at the bottom to account for the fixed navbar
const AppWithBottomPadding = () => {
  console.log('App being rendered');
  return (
    <div className="content-area pb-20">
      <App />
    </div>
  );
};

createRoot(document.getElementById("root")!).render(<AppWithBottomPadding />);
