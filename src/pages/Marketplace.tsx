import React, { useState, useEffect, useContext } from "react";
import { connectSdk } from "../utils/connect-sdk.js";
import { Link } from "react-router-dom"; // Import Link from react-router-dom
import "./styles.css"; // Ensure this path is correct
import { AccountsContext } from "../accounts/AccountsContext";

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
        collectionId: 3231,
      });
      return tokens.tokens.length;
    } catch (error) {
      console.error("Error fetching user trophies:", error);
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

  return (
    <div className="game-container">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div className="title-container">
          <img
            src="/polkaTypeRacer.png"
            alt="Racecar"
            className="racecar-image"
            style={{ width: "250px", height: "250px" }}
          />
          <h1>Polka Type Race Marketplace</h1>
        </div>
        <div>
          <p>User Trophies: {userTrophies}</p>
        </div>
        <div style={{ display: "flex", marginBottom: "20px" }}>
          <div style={{ marginRight: "20px", textAlign: "center" }}>
            <h3>Word Scorcher</h3>
            <img
              src="/fire.png"
              alt="Fire"
              style={{ width: "100px", height: "100px" }}
            />
            <p>Price: 1 trophy</p>
            <button disabled={userTrophies < 1}>Buy</button>
          </div>
          <div style={{ marginRight: "20px", textAlign: "center" }}>
            <h3>Gust of Distraction</h3>
            <img
              src="/wind.png"
              alt="Wind"
              style={{ width: "100px", height: "100px" }}
            />
            <p>Price: 2 trophies</p>
            <button disabled={userTrophies < 2}>Buy</button>
          </div>
          <div style={{ textAlign: "center" }}>
            <h3>Freeze Frame</h3>
            <img
              src="/ice.png"
              alt="Ice"
              style={{ width: "100px", height: "100px" }}
            />
            <p>Price: 3 trophies</p>
            <button disabled={userTrophies < 3}>Buy</button>
          </div>
        </div>
        <Link to="/">Go back to Accounts</Link>
      </div>
    </div>
  );
};
