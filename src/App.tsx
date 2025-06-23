import { GameProvider } from './contexts/GameContext';
import { Game } from './components/game/Game/Game';
import './App.css';

function App() {
  return (
    <GameProvider>
      <div className="App">
        <Game />
      </div>
    </GameProvider>
  );
}

export default App;
