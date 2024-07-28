import React, { useState, useEffect, useContext } from "react";
import { connectSdk } from "../utils/connect-sdk.js";
import { Link } from "react-router-dom"; // Import Link from react-router-dom
import "./styles.css"; // Ensure this path is correct
import { AccountsContext } from "../accounts/AccountsContext";
import { Address } from "@unique-nft/sdk/utils";

export const Marketplace: React.FC = () => {
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [userTrophies, setUserTrophies] = useState(0);
  const { accounts } = useContext(AccountsContext);

  // Set user info from accounts context
  useEffect(() => {
    const accountsArray = Array.from(accounts.entries());
    if (accountsArray.length > 0) {
      const [id, details] = accountsArray[0];
      setUserId(id);
      setUserName(details.name);
    }
  }, [accounts]);

    const fetchUserTrophies = async () => {
        try {
            const { sdk } = await connectSdk();
            const tokens = await sdk.token.accountTokens({
                address: userId,
                collectionId: 3416,
            });

            let winnerTokenId: number;
            try {
                const winnerToken = tokens.tokens[0];
                if (!winnerToken) {
                    throw new Error(`Winner token not found for owner: ${userId}`);
                }
                winnerTokenId = winnerToken.tokenId;
            } catch (error) {
                throw new Error(`No token found for owner: ${userId}`);
            }

            console.log("Fetching Trophies");

            const winnerToken = await sdk.token.getV2({
                collectionId: 3416,
                tokenId: winnerTokenId,
            });

            const winnerAttributes = winnerToken.attributes || [];
            const victoriesAttribute = winnerAttributes.find(
                (a) => a.trait_type === "Trophies"
            );
            console.log(victoriesAttribute);

            if (!victoriesAttribute || victoriesAttribute.value === undefined) {
                throw new Error(`Trophies attribute not found for tokenId: ${winnerTokenId}`);
            }

            const winnerTrophies = typeof victoriesAttribute.value === "number"
                ? victoriesAttribute.value
                : parseInt(victoriesAttribute.value);

            if (isNaN(winnerTrophies)) {
                throw new Error(`Invalid Trophies value for tokenId: ${winnerTokenId}`);
            }

            console.log(`TokenID ${winnerTokenId} has ${winnerTrophies} wins before`);
            return winnerTrophies;
        } catch (error) {
            console.error('Error fetching user trophies:', error);
            return 0;
        }
    };

  useEffect(() => {
    const getUserTrophies = async () => {
      if (userId) {
        const trophies = await fetchUserTrophies();
        setUserTrophies(trophies);
      }
    };
    getUserTrophies();
  }, [userId]);

    async function createTokenFireWindIce(
        carsCollectionId: number,
        achievementsCollectionId: number,
        owner: string,
        imageUrl: string
    ) {
        console.log(imageUrl);
        console.log("Creating fireIceWind token for owner:", owner);
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

        console.log(carsCollectionId, achievementsCollectionId, winnerTokenId);

        let { nonce } = await sdk.common.getNonce(account);
        const transactions = [];

        const winnerTokenDetails = await sdk.token.getV2({
            collectionId: carsCollectionId,
            tokenId: winnerTokenId,
        });

        transactions.push(
            sdk.token.createV2(
                {
                    collectionId: achievementsCollectionId,
                    image: imageUrl,
                    attributes: [{ trait_type: "Fire/Wind/Ice", value: 10 }],
                    owner: Address.nesting.idsToAddress(
                        winnerTokenDetails.collectionId,
                        winnerTokenDetails.tokenId
                    ),
                },
                { nonce: nonce++ }
            )
        );

        console.log("FireWindIce NFT created");
        console.log(
            "Owner:",
            Address.nesting.idsToAddress(winnerTokenDetails.collectionId, winnerTokenDetails.tokenId)
        );
        alert(
            `Explore your NFT: https://uniquescan.io/opal/tokens/${winnerTokenDetails.collectionId}/${winnerTokenDetails.tokenId}`
        );
        await Promise.all(transactions);

        console.log(`TokenID ${winnerTokenId} has been updated`);
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <div>
                <p>User Trophies: {userTrophies}</p>
            </div>
            <div style={{ display: 'flex', marginBottom: '20px' }}>
                <div style={{ marginRight: '20px', textAlign: 'center' }}>
                    <h3>Word Scorcher</h3>
                    <img src="/fire.png" alt="Fire" style={{ width: '100px', height: '100px' }} />
                    <p>Price: 1 trophy</p>
                    <button onClick={() => createTokenFireWindIce(3416, 3419, userId, '/fire.png')}>Create Fire Token</button>
                </div>
                <div style={{ marginRight: '20px', textAlign: 'center' }}>
                    <h3>Gust of Distraction</h3>
                    <img src="/wind.png" alt="Wind" style={{ width: '100px', height: '100px' }} />
                    <p>Price: 2 trophies</p>
                    <button onClick={() => createTokenFireWindIce(3416, 3419, userId, '/wind.png')}>Create Wind Token</button>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <h3>Freeze Frame</h3>
                    <img src="/ice.png" alt="Ice" style={{ width: '100px', height: '100px' }} />
                    <p>Price: 3 trophies</p>
                    <button onClick={() => createTokenFireWindIce(3416, 3419, userId, '/ice.png')}>Create Ice Token</button>
                </div>
            </div>
            <Link to="/">Go back to Accounts</Link>
        </div>
    );
};
