import { useApp } from './state/AppContext';
import Landing from './views/Landing';
import Quiz from './views/Quiz';
import Preview from './views/Preview';
import Trial from './views/Trial';
import Dashboard from './views/Dashboard';

export default function App() {
  const { view } = useApp();
  switch (view) {
    case 'landing':
      return <Landing />;
    case 'quiz':
      return <Quiz />;
    case 'preview':
      return <Preview />;
    case 'trial':
      return <Trial />;
    case 'dashboard':
      return <Dashboard />;
  }
}
