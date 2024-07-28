import './polyfill.js'; // Add this import at the very top
import { useContext } from "react";
import { Routes, Route } from 'react-router-dom'; // Import Routes and Route
import {
  AccountsContextProvider,
  AccountsContext,
} from "./accounts/AccountsContext";
import "./App.css";
import { AccountsPage } from "./pages/Accounts";
import { RacecarPage } from "./pages/Racecar";
import { Marketplace } from "./pages/Marketplace";
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
    <Routes> {/* Define your routes here */}
      <Route path="/" element={<AccountsPage />} />
      <Route path="/racecar" element={<RacecarPage />} />
      <Route path="/marketplace" element={<Marketplace />} />
      {/* Add more routes as needed */}
    </Routes>
  );
}

export default App;
