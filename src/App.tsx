import { useContext } from "react";
import {
  AccountsContextProvider,
  AccountsContext,
} from "./accounts/AccountsContext";
import "./App.css";
import { AccountsPage } from "./pages/Accounts";
import { RacecarPage } from "./pages/Racecar";
import { SdkProvider } from "./sdk/SdkContext";
import { SignByLocalSignerModalProvider } from "./signModal/SignByLocalSignerModalContext";

function App() {
  return (
    <div className="App">
      <SdkProvider>
        <SignByLocalSignerModalProvider>
          <AccountsContextProvider>
            <AppContent />
          </AccountsContextProvider>
        </SignByLocalSignerModalProvider>
      </SdkProvider>
    </div>
  );
}

function AppContent() {
  const { accounts } = useContext(AccountsContext);

  if (accounts.size === 0) {
    return <AccountsPage />; // Replace this with your actual sign-in button
  }

  return (
    <>
      <RacecarPage />
    </>
  );
}

export default App;
