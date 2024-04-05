import { Link } from 'react-router-dom';
import { MainRoutes } from './components/MainRoutes';

const App = () => {
  return (
    <div>
       <button><Link to="/">Home</Link></button>
       <button><Link to="/login">Login</Link></button>
     <MainRoutes/>
    </div>
  );
};

export default App;

