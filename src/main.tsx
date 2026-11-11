import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {LazyMotion, MotionConfig, domAnimation} from 'motion/react';
import App from './App.tsx';
import './index.css';

// `m` + domAnimation en vez de `motion`: menos peso. reducedMotion "user" apaga transforms con prefers-reduced-motion.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <App />
      </MotionConfig>
    </LazyMotion>
  </StrictMode>,
);
