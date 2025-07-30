import CryptoJS from "crypto-js";

// Generate a unique device ID based on browser info
function generateDeviceInfo() {
  const deviceInfo = [
    navigator.userAgent,
    //navigator.platform,
    navigator.language,
    navigator.hardwareConcurrency,
    window.screen.width,
    window.screen.height,
    window.screen.colorDepth,
    window.screen.pixelDepth,
    navigator.maxTouchPoints,
  ].join("-");

  return deviceInfo;
}

// Create a secure key using device info and app secret
function generateSecureKey() {
  const deviceInfo = generateDeviceInfo();
  const SECRET_KEY =
    process.env.NEXT_PUBLIC_CRYPTO_KEY || "default-fallback-key";

  // Combine device info with app secret for better security
  return CryptoJS.SHA256(deviceInfo + SECRET_KEY).toString();
}

/**
 * Encrypts data using AES with device-specific key
 * @param {Object|string} data - Data to encrypt
 * @returns {string} - Encrypted string
 */
export const encryptData = (data) => {
  // Convert to string if object
  const dataString =
    typeof data === "object" ? JSON.stringify(data) : String(data);

  // Get device-specific secure key
  const secureKey = generateSecureKey();

  console.log("Secure Key: ", secureKey);
  // Encrypt with AES
  const encrypted = CryptoJS.AES.encrypt(dataString, secureKey).toString();

  return encrypted;
};

/**
 * Decrypts previously encrypted data
 * @param {string} encryptedData - Encrypted string to decrypt
 * @returns {Object|string|null} - Decrypted data, parsed as JSON if possible
 */
export const decryptData = (encryptedData) => {
  try {
    if (!encryptedData) return null;

    // Get device-specific secure key (should be same as during encryption)
    const secureKey = generateSecureKey();

    // Decrypt the data
    const bytes = CryptoJS.AES.decrypt(encryptedData, secureKey);

    console.log(bytes)

    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    console.log(decryptedString)

    if (!decryptedString) return null;

    // Try to parse as JSON, return as string if not valid JSON
    try {
      return JSON.parse(decryptedString);
    } catch (e) {
      return decryptedString;
    }
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
};

/**
 * Stores encrypted data in localStorage
 * @param {string} key - Storage key
 * @param {Object|string} data - Data to encrypt and store
 */
export const storeEncryptedData = (key, data) => {
  //const encrypted = encryptData(data);
  localStorage.setItem(key, data);
};

/**
 * Retrieves and decrypts data from localStorage
 * @param {string} key - Storage key
 * @returns {Object|string|null} - Decrypted data
 */
export const getDecryptedData = (key) => {
  const encryptedData = localStorage.getItem(key);

          console.log(encryptedData)

  return encryptedData ? decryptData(encryptedData) : null;
};

/**
 * Stores encrypted data in sessionStorage
 * @param {string} key - Storage key
 * @param {Object|string} data - Data to encrypt and store
 */
export const storeEncryptedDataInSession = (key, data) => {
  const encrypted = encryptData(data);
  sessionStorage.setItem(key, encrypted);
};

/**
 * Retrieves and decrypts data from sessionStorage
 * @param {string} key - Storage key
 * @returns {Object|string|null} - Decrypted data
 */
export const getDecryptedDataFromSession = (key) => {
  const encryptedData = sessionStorage.getItem(key);
  return encryptedData ? decryptData(encryptedData) : null;
};

/**
 * Removes a specific key from localStorage
 * @param {string} key - Storage key to remove
 */
export const removeEncryptedData = (key) => {
  localStorage.removeItem(key);
};

/**
 * Removes a specific key from sessionStorage
 * @param {string} key - Storage key to remove
 */
export const removeEncryptedDataFromSession = (key) => {
  sessionStorage.removeItem(key);
};
