import { useCallback, useContext, useState } from "react";
import { AccountsContext } from "../accounts/AccountsContext";
import { Account } from "../accounts/types";
import { List } from "../components/List";
import { CreateLocalAccountModal } from "../modals/CreateLocalAccountModal";
import { SignMessageModal } from "../modals/SignMessageModal";
import { TransferAmountModal } from "../modals/TransferAmountModal";
import { useNavigate } from "react-router-dom"; // Use useNavigate instead of useHistory

export const AccountsPage = () => {
  const { accounts, fetchMetamaskAccounts, fetchPolkadotAccounts } =
    useContext(AccountsContext);
  const accountsArray = Array.from(accounts.values());
  const [currentAccount, setCurrentAccount] = useState<Account>();
  const [transferAmountIsVisible, setTransferAmountIsVisible] = useState(false);
  const [signMessageIsVisible, setSignMessageIsVisible] = useState(false);
  const [createAccountIsVisible, setCreateAccountIsVisible] = useState(false);

  const navigate = useNavigate(); // Initialize useNavigate

  const onSend = useCallback(
    (account: Account) => () => {
      setCurrentAccount(account);
      setTransferAmountIsVisible(true);
    },
    []
  );

  const onCloseTransferAmount = useCallback(() => {
    setCurrentAccount(undefined);
    setTransferAmountIsVisible(false);
  }, []);

  const onSignMessage = useCallback(
    (account: Account) => () => {
      setCurrentAccount(account);
      setSignMessageIsVisible(true);
    },
    []
  );

  const onCreateAccountClick = useCallback(() => {
    setCreateAccountIsVisible(true);
  }, []);

  const onCloseSignMessage = useCallback(() => {
    setCurrentAccount(undefined);
    setSignMessageIsVisible(false);
  }, []);

  const onCloseCreateAccount = useCallback(() => {
    setCreateAccountIsVisible(false);
  }, []);

  const navigateToMarketplace = useCallback(() => {
    navigate("/marketplace"); // Navigate to "/marketplace" when clicked
  }, [navigate]);

  const navigateToRacecar = useCallback(() => {
    navigate("/racecar"); // Navigate to "/racecar" when clicked
  }, [navigate]);

  return (
    <div className="game-container">
      <div className="title-container">
        <img
          src="/polkaTypeRacer.png"
          alt="Racecar"
          className="racecar-image"
          style={{ width: "250px", height: "250px" }}
        />
        <h1>Polka Type Race</h1>
      </div>
      <div
        className="top-bar"
        style={{
          display: "flex",
          justifyContent: "space-evenly",
          alignItems: "center",
        }}
      >
        <button
          style={{ padding: "10px", fontSize: "16px", borderRadius: "5px" }}
          onClick={fetchPolkadotAccounts}
        >
          Sign in with Polkadot Wallet
        </button>
        {accountsArray && accountsArray.length > 0 && (
          <>
            <button
              style={{ padding: "10px", fontSize: "16px", borderRadius: "5px" }}
              onClick={navigateToMarketplace}
            >
              Go to Marketplace
            </button>
            <button
              style={{ padding: "10px", fontSize: "16px", borderRadius: "5px" }}
              onClick={navigateToRacecar}
            >
              Let's Race!
            </button>
          </>
        )}
      </div>
      <List>
        {accountsArray.map((account) => {
          return (
            <List.Item key={account.address}>
              <span>{account.signerType}</span>
              <span>{account.name}</span>
              <span>{account.address}</span>
              <span>{account.balance?.toFixed(2) || "0"}</span>
              <button onClick={onSend(account)}>Send amount</button>
              <button onClick={onSignMessage(account)}>Sign message</button>
            </List.Item>
          );
        })}
      </List>
      <TransferAmountModal
        isVisible={transferAmountIsVisible}
        sender={currentAccount}
        onClose={onCloseTransferAmount}
      />
      <SignMessageModal
        isVisible={signMessageIsVisible}
        account={currentAccount}
        onClose={onCloseSignMessage}
      />
      <CreateLocalAccountModal
        isVisible={createAccountIsVisible}
        onClose={onCloseCreateAccount}
      />
    </div>
  );
};
