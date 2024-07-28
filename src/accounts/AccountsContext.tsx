import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { SdkContext } from "../sdk/SdkContext";
import { SignByLocalSignerModalContext } from "../signModal/SignByLocalSignerModalContext";
import { noop } from "../utils/common";
import {
  getLocalAccounts,
  getMetamaskAccount,
  getPolkadotAccounts,
} from "./AccountsManager";
import { Account, AccountsContextValue } from "./types";
import { connectSdk } from "../utils/connect-sdk.js";
import { getRandomInt } from "../utils/random.js";

export const AccountsContext = createContext<AccountsContextValue>({
  accounts: new Map(),
  setAccounts: noop,
  fetchPolkadotAccounts: noop,
  fetchMetamaskAccounts: noop,
  fetchLocalAccounts: noop,
});

async function createToken(
  collectionId: number,
  owner: string,
  nickname: string
) {
  const { account, sdk } = await connectSdk();
  const tokenImage =
    getRandomInt(2) === 0
      ? "https://gateway.pinata.cloud/ipfs/QmfWKy52e8pyH1jrLu4hwyAG6iwk6hcYa37DoVe8rdxXwV"
      : "https://gateway.pinata.cloud/ipfs/QmNn6jfFu1jE7xPC2oxJ75kY1RvA2tz9bpQDsqweX2kDig";
  const tokenTx = await sdk.token.createV2({
    collectionId: 3179,
    image: tokenImage,
    owner: "5CAsK4UFteseu6rBjEqmKFarLgmb4Rm5fDsyBK7EFZc6w5MN",
    attributes: [
      {
        trait_type: "Nickname",
        value: nickname,
      },
      {
        trait_type: "Victories",
        value: 0,
      },
      {
        trait_type: "Defeats",
        value: 0,
      },
    ],
  });
  const token = tokenTx.parsed;
  if (!token) throw Error("Cannot parse token");
  console.log(
    `Explore your NFT: https://uniquescan.io/opal/tokens/${token.collectionId}/${token.tokenId}`
  );
}

export const AccountsContextProvider = ({ children }: PropsWithChildren) => {
  const [accounts, setAccounts] = useState<Map<string, Account>>(new Map());
  const { openModal } = useContext(SignByLocalSignerModalContext);
  const { sdk } = useContext(SdkContext);

  const fetchLocalAccounts = useCallback(async () => {
    if (!sdk) return;
    const localAccounts = getLocalAccounts(openModal);
    if (localAccounts) {
      for (let [address, account] of localAccounts) {
        const balanceResponse = await sdk.balance.get({ address });
        account.balance = Number(balanceResponse.availableBalance.amount);
        localAccounts.set(address, account);
      }
      const accountsToUpdate = new Map([...accounts, ...localAccounts]);
      setAccounts(accountsToUpdate);
    }
  }, [sdk, openModal, accounts]);

  const fetchMetamaskAccounts = useCallback(async () => {
    if (!sdk) return;
    const metamaskAccounts = await getMetamaskAccount();
    if (metamaskAccounts) {
      for (let [address, account] of metamaskAccounts) {
        const balanceResponse = await sdk.balance.get({ address });
        account.balance = Number(balanceResponse.availableBalance.amount);
        metamaskAccounts.set(address, account);
      }
      const accountsToUpdate = new Map([...accounts, ...metamaskAccounts]);
      setAccounts(accountsToUpdate);
    }
  }, [sdk, accounts]);

  const fetchPolkadotAccounts = useCallback(async () => {
    if (!sdk) return;
    const polkadotAccounts = await getPolkadotAccounts();
    for (let [address, account] of polkadotAccounts) {
      const balanceResponse = await sdk.balance.get({ address });
      account.balance = Number(balanceResponse.availableBalance.amount);
      polkadotAccounts.set(address, account);
      const name = account.name;
      // Check if the account already exists
      if (!accounts.has(address)) {
        // Create a new NFT for the account
        console.log(`Creating NFT for ${name} with address ${account.address}`);
        await createToken(3179, account.address, name);
      }
    }
    const accountsToUpdate = new Map([...accounts, ...polkadotAccounts]);
    setAccounts(accountsToUpdate);
  }, [sdk, accounts]);

  useEffect(() => {
    fetchLocalAccounts();
  }, [sdk]);

  const contextValue = useMemo(
    () => ({
      accounts,
      setAccounts,
      fetchMetamaskAccounts,
      fetchPolkadotAccounts,
      fetchLocalAccounts,
    }),
    [accounts, fetchMetamaskAccounts, fetchPolkadotAccounts, fetchLocalAccounts]
  );

  return (
    <AccountsContext.Provider value={contextValue}>
      {children}
    </AccountsContext.Provider>
  );
};
