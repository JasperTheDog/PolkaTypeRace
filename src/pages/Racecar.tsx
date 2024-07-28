import React, { useState, useEffect } from "react";
import "./styles.css"; // Ensure this path is correct

export const RacecarPage = () => {
  const [progress, setProgress] = useState([0, 0, 0, 0]);
  const [inputText, setInputText] = useState("");
  const [tabIndex, setTabIndex] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);

  const readOnlyText = "TEST test TEST";

  useEffect(() => {
    let tabsOpen = localStorage.getItem("tabsOpen");
    if (tabsOpen == null) {
      localStorage.setItem("tabsOpen", "1");
      setTabIndex(0);
    } else {
      const newTabsOpen = parseInt(tabsOpen) + 1;
      localStorage.setItem("tabsOpen", newTabsOpen.toString());
      setTabIndex(newTabsOpen - 1);
    }

    const storedProgress = localStorage.getItem("progress");
    if (storedProgress) {
      setProgress(JSON.parse(storedProgress));
    }

    const storedWinner = localStorage.getItem("winner");
    if (storedWinner) {
      setWinner(storedWinner);
    }

    const handleStorageChange = () => {
      const updatedProgress = localStorage.getItem("progress");
      if (updatedProgress) {
        setProgress(JSON.parse(updatedProgress));
      }

      const updatedWinner = localStorage.getItem("winner");
      if (updatedWinner) {
        setWinner(updatedWinner);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      let tabsOpen = localStorage.getItem("tabsOpen");
      if (tabsOpen != null) {
        const newTabsOpen = parseInt(tabsOpen) - 1;
        localStorage.setItem("tabsOpen", newTabsOpen.toString());
      }
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const updateProgress = (index: number, value: number) => {
    const newProgress = [...progress];
    newProgress[index] = value;
    setProgress(newProgress);
    localStorage.setItem("progress", JSON.stringify(newProgress));

    if (value >= 100) {
      localStorage.setItem("winner", `Player ${index + 1}`);
      setWinner(`Player ${index + 1}`);
      localStorage.setItem("tabsOpen", "1");
      setTabIndex(0);
      // Reset all progress bars
      const resetProgress = [0, 0, 0, 0];
      setProgress(resetProgress);
      localStorage.setItem("progress", JSON.stringify(resetProgress));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputText(value);

    const correctChars = value
      .split("")
      .filter((char, index) => char === readOnlyText[index]).length;

    const progressValue = (correctChars / readOnlyText.length) * 100;
    updateProgress(tabIndex, progressValue); // Update the progress bar for the current tab
  };

  return (
    <div>
      {winner && <div className="winner-notification">{winner} has won!</div>}
      <div>Tab Index: {tabIndex + 1}</div>
      {progress.map((value, index) => (
        <div key={index} className="progress-container">
          <div className="racer-number">Racer {index + 1}</div>
          <div
            id={`progress${index + 1}`}
            className="progress-bar"
            style={{ width: `${value}%` }}
          ></div>
          <img
            src="/public/car.png"
            alt="Car"
            className="car"
            id={`car${index + 1}`}
            style={{ left: `${value}%` }}
          />
        </div>
      ))}
      <div className="textbox-container">
        <input type="text" value={readOnlyText} readOnly className="textbox" />
        <input
          type="text"
          placeholder="Enter text here"
          className="textbox"
          value={inputText}
          onChange={handleInputChange}
        />
      </div>
    </div>
  );
};
