import { AccountsContextProvider } from './accounts/AccountsContext';
import './App.css';
import { AccountsPage } from './pages/Accounts';
import { RacecarPage } from './pages/Racecar';
import { SdkProvider } from './sdk/SdkContext';
import { SignByLocalSignerModalProvider } from './signModal/SignByLocalSignerModalContext';

function App() {
  return (
    <div className="App">
      <SdkProvider>
        <SignByLocalSignerModalProvider>
          <AccountsContextProvider>
            <AccountsPage />
          </AccountsContextProvider>
        </SignByLocalSignerModalProvider>
      </SdkProvider>
      <RacecarPage />
    </div>
  );
}

export default App;
