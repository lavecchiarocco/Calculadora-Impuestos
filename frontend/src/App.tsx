import { CalculadoraView } from '@/components/calculadora/CalculadoraView';
import { LandingPage } from '@/components/calculadora/LandingPage';
import './App.css';

function App() {
  return window.location.pathname.replace(/\/$/, '') === '/calculadora'
    ? <CalculadoraView />
    : <LandingPage />;
}

export default App;
