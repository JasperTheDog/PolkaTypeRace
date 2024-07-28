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
import { Sdk } from "@unique-nft/sdk/full";
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
import { changeAttribute } from "../utils/change-attribute.js";
import { Address } from "@unique-nft/sdk/utils";

export const AccountsContext = createContext<AccountsContextValue>({
  accounts: new Map(),
  setAccounts: noop,
  fetchPolkadotAccounts: noop,
  fetchMetamaskAccounts: noop,
  fetchLocalAccounts: noop,
});

async function incrementWinnerToken(
  carsCollectionId: number,
  achievementsCollectionId: number,
  owner: string,
) {
  console.log("Incrementing winner token for owner:", owner);
  const { account, sdk } = await connectSdk();
  const tokens = await sdk.token.accountTokens({
    address: owner,
    collectionId: 3231,
  });

  let winnerTokenId: number;
  try {
    const winnerToken = tokens.tokens[0];
    if (!winnerToken) {
      throw new Error(`Winner token not found for owner: ${owner}`);
    }
    winnerTokenId = winnerToken.tokenId;
  } catch (error) {
    throw new Error(`No token found for owner: ${owner}`);
  }

  console.log("Incrementing winner token");
  console.log(carsCollectionId, achievementsCollectionId, winnerTokenId);


  let { nonce } = await sdk.common.getNonce(account);
  const transactions = [];

  // 1. Increment Victories to Winner
  const winnerToken = await sdk.token.getV2({
    collectionId: carsCollectionId,
    tokenId: winnerTokenId,
  });

  if (!winnerToken) {
    throw new Error(`Winner token not found for tokenId: ${winnerTokenId}`);
  }

  const winnerAttributes = winnerToken.attributes || [];
  const victoriesAttribute = winnerAttributes.find(
    (a) => a.trait_type === "Victories"
  );
  console.log(victoriesAttribute);

  if (!victoriesAttribute || victoriesAttribute.value === undefined) {
    throw new Error(`Victories attribute not found for tokenId: ${winnerTokenId}`);
  }

  const winnerVictories = typeof victoriesAttribute.value === "number"
    ? victoriesAttribute.value
    : parseInt(victoriesAttribute.value);

  if (isNaN(winnerVictories)) {
    throw new Error(`Invalid Victories value for tokenId: ${winnerTokenId}`);
  }

  console.log(`TokenID ${winnerTokenId} has ${winnerVictories} wins before`);

  transactions.push(sdk.token.setProperties({
    collectionId: carsCollectionId,
    tokenId: winnerTokenId,
    // NOTICE: Attributes stored in "tokenData" property
    properties: [{
      key: "tokenData",
      value: changeAttribute(winnerToken, "Victories", winnerVictories + 1)
    }]
  }, { nonce: nonce++}));


  console.log("Creating achievement NFT");

  transactions.push(
    sdk.token.createV2({
      collectionId: achievementsCollectionId,
      image:
        "https://gateway.pinata.cloud/ipfs/QmY7hbSNiwE3ApYp83CHWFdqrcEAM6AvChucBVA6kC1e8u",
      attributes: [{ trait_type: "Bonus", value: 10 }],
      // NOTICE: owner of the achievement NFT is car NFT
      owner: Address.nesting.idsToAddress(
        winnerToken.collectionId,
        winnerToken.tokenId
      ),
    }, { nonce: nonce++ })
  );

  console.log("Achievement NFT created");
  console.log("Owner:", Address.nesting.idsToAddress(
    winnerToken.collectionId,
    winnerToken.tokenId
  ));

  await Promise.all(transactions);

  console.log(`TokenID ${winnerTokenId} has ${winnerVictories + 1} wins`);
}

async function createToken(
  collectionId: number,
  owner: string,
  nickname: string
) {
  const { account, sdk } = await connectSdk();
  console.log(account);
  console.log(sdk);
  console.log(collectionId, owner, nickname);
  const tokenImage =
    getRandomInt(2) === 0
      ? "https://gateway.pinata.cloud/ipfs/QmfWKy52e8pyH1jrLu4hwyAG6iwk6hcYa37DoVe8rdxXwV"
      : "https://gateway.pinata.cloud/ipfs/QmNn6jfFu1jE7xPC2oxJ75kY1RvA2tz9bpQDsqweX2kDig";
  const tokens = await sdk.token.accountTokens({
    address: owner,
    collectionId: 3231,
  });
  if (tokens.tokens.length > 0) {
    console.log("Player already exists");
    console.log(owner);
    return;
  } else {
    const tokenTx = await sdk.token.createV2({
      collectionId: 3231,
      image: tokenImage,
      owner: owner,
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
          trait_type: "Games",
          value: 0,
        },
      ],
    });
    console.log("Token created");
    console.log(tokenTx);
    const token = tokenTx.parsed;
    if (!token) throw Error("Cannot parse token");
    console.log(
      `Explore your NFT: https://uniquescan.io/opal/tokens/${token.collectionId}/${token.tokenId}`
    );
  }
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
        await createToken(3231, account.address, name);
        //play(3231, 3183, 2, 3);
        incrementWinnerToken(3231, 3277, account.address);
      }
    }
    console.log("Displaying polkadot accounts");
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
