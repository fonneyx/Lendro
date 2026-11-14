import Footer from './components/Footer';
import Navbar from './components/Navbar';
import { useApp } from './state/AppContext';
import Dashboard from './views/Dashboard';
import Landing from './views/Landing';
import Preview from './views/Preview';
import Quiz from './views/Quiz';
import Trial from './views/Trial';

const VIEWS = { landing: Landing, quiz: Quiz, preview: Preview, trial: Trial, dashboard: Dashboard };

export default function App() {
  const { view } = useApp();
  const Current = VIEWS[view];
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Current />
      </main>
      <Footer />
    </div>
  );
}
