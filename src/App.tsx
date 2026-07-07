import { TerminalProvider } from './core/context';
import { Shell } from './components/Shell';

export default function App() {
  return (
    <TerminalProvider>
      <Shell />
    </TerminalProvider>
  );
}
