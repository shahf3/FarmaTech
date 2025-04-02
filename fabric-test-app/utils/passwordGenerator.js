function generatePassword(length = 10) {
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowercase = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "@#$%&*!?";

  const allChars = uppercase + lowercase + numbers + symbols;

  let password = "";

  // Ensure password has at least one character from each set
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += symbols.charAt(Math.floor(Math.random() * symbols.length));

  for (let i = 4; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  password = password
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");

  return password;
}

module.exports = { generatePassword };
