const generateHash = (
  pants?: string,
  glasses?: string,
  upper?: string,
  lower?: string,
  hair?: string,
  hat?: string
) => {
  const inputString = `${pants}_${glasses}_${upper}_${lower}_${hair}_${hat}`;
  let hash = 0;

  for (let i = 0; i < inputString.length; i++) {
    const char = inputString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }

  return hash;
};
