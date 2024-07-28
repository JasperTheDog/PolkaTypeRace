const getConfig = () => {
  const MNEMONIC =
    "okay broccoli scrap movie course among ocean bunker female build ice apology";
  if (!MNEMONIC)
    throw Error("Create .env from .env-example and set MNEMONIC env");

  return {
    mnemonic: MNEMONIC,
  };
};

export const config = getConfig();
