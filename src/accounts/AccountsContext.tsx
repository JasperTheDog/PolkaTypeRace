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

export async function incrementWinnerToken(
  carsCollectionId: number,
  achievementsCollectionId: number,
  owner: string
) {
  console.log("Incrementing winner token for owner:", owner);
  const { account, sdk } = await connectSdk();
  const tokens = await sdk.token.accountTokens({
    address: owner,
    collectionId: 3416,
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
  const winnerTokenDetails = await sdk.token.getV2({
    collectionId: carsCollectionId,
    tokenId: winnerTokenId,
  });

  if (!winnerTokenDetails) {
    throw new Error(`Winner token not found for tokenId: ${winnerTokenId}`);
  }

  const winnerAttributes = winnerTokenDetails.attributes || [];
  const victoriesAttribute = winnerAttributes.find(
    (a) => a.trait_type === "Victories"
  );
  const trophiesAttribute = winnerAttributes.find(
    (a) => a.trait_type === "Trophies"
  );

  if (!victoriesAttribute || victoriesAttribute.value === undefined) {
    throw new Error(
      `Victories attribute not found for tokenId: ${winnerTokenId}`
    );
  }

  if (!trophiesAttribute || trophiesAttribute.value === undefined) {
    throw new Error(
      `Trophies attribute not found for tokenId: ${winnerTokenId}`
    );
  }

  const winnerVictories =
    typeof victoriesAttribute.value === "number"
      ? victoriesAttribute.value
      : parseInt(victoriesAttribute.value);

  const winnerTrophies =
    typeof trophiesAttribute.value === "number"
      ? trophiesAttribute.value
      : parseInt(trophiesAttribute.value);

  if (isNaN(winnerVictories)) {
    throw new Error(`Invalid Victories value for tokenId: ${winnerTokenId}`);
  }

  if (isNaN(winnerTrophies)) {
    throw new Error(`Invalid Trophies value for tokenId: ${winnerTokenId}`);
  }

  console.log(`TokenID ${winnerTokenId} has ${winnerVictories} wins before`);
  console.log(`TokenID ${winnerTokenId} has ${winnerTrophies} trophies before`);

  transactions.push(
    sdk.token.setProperties(
      {
        collectionId: carsCollectionId,
        tokenId: winnerTokenId,
        properties: [
          {
            key: "tokenData",
            value: changeAttribute(
              winnerTokenDetails,
              "Victories",
              winnerVictories + 1
            ),
          },
          {
            key: "tokenData",
            value: changeAttribute(
              winnerTokenDetails,
              "Trophies",
              winnerTrophies + 1
            ),
          },
        ],
      },
      { nonce: nonce++ }
    )
  );

  console.log("Creating achievement NFT");

  transactions.push(
    sdk.token.createV2(
      {
        collectionId: achievementsCollectionId,
        image:
          "https://gateway.pinata.cloud/ipfs/QmY7hbSNiwE3ApYp83CHWFdqrcEAM6AvChucBVA6kC1e8u",
        attributes: [{ trait_type: "Bonus", value: 10 }],
        owner: Address.nesting.idsToAddress(
          winnerTokenDetails.collectionId,
          winnerTokenDetails.tokenId
        ),
      },
      { nonce: nonce++ }
    )
  );

  console.log("Achievement NFT created");
  console.log(
    "Owner:",
    Address.nesting.idsToAddress(winnerTokenDetails.collectionId, winnerTokenDetails.tokenId)
  );
  alert(
    `Explore your NFT: https://uniquescan.io/opal/tokens/${winnerTokenDetails.collectionId}/${winnerTokenDetails.tokenId}`
  );
  await Promise.all(transactions);

  console.log(`TokenID ${winnerTokenId} has ${winnerVictories + 1} wins`);
  console.log(`TokenID ${winnerTokenId} has ${winnerTrophies + 1} trophies`);
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
    collectionId: 3416,
  });
  if (tokens.tokens.length > 0) {
    console.log("Player already exists");
    console.log(owner);
    return;
  } else {
    const tokenTx = await sdk.token.createV2({
      collectionId: 3416,
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
        {
          trait_type: "Trophies",
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
        await createToken(3416, account.address, name);
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
