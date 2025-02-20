// SHA-256 Hashing Function (using Web Crypto API)
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Generate a unique device ID based on browser info
async function generateDeviceId() {
  const deviceInfo = [
    navigator.userAgent,
    navigator.platform,
    navigator.language,
    navigator.hardwareConcurrency,
    window.screen.width,
    window.screen.height,
    window.screen.colorDepth,
    window.screen.pixelDepth,
    navigator.deviceMemory, // Available memory in GB
    navigator.maxTouchPoints,
  ].join("-");

  return await sha256(deviceInfo);
}

// Retrieve or generate device ID
async function getDeviceId() {
  let deviceId = await generateDeviceId();

  return deviceId;
}

// Generate encryption key from password and device ID
async function generateKey(password, salt) {
  const deviceId = await getDeviceId();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password + deviceId),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// Encrypt data using AES-GCM algorithm
async function encryptData(data, password) {
  try {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);

    // Generate a random salt and IV
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const key = await generateKey(password, salt);

    const encryptedContent = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encodedData
    );

    // Convert ArrayBuffer to Uint8Array for storage
    const encryptedData = new Uint8Array(encryptedContent);

    // Return everything needed for decryption
    return {
      encryptedData: Array.from(encryptedData), // Convert to regular array for JSON storage
      iv: Array.from(iv),
      salt: Array.from(salt),
    };
  } catch (error) {
    console.error("Encryption failed:", error);
    throw error;
  }
}

// Decrypt the encrypted data
async function decryptData(encryptedData, iv, salt, password) {
  try {
    // Convert arrays back to Uint8Array
    const encryptedArray = new Uint8Array(encryptedData);
    const ivArray = new Uint8Array(iv);
    const saltArray = new Uint8Array(salt);

    const key = await generateKey(password, saltArray);

    const decryptedContent = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivArray },
      key,
      encryptedArray
    );

    return new TextDecoder().decode(decryptedContent);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw error;
  }
}

// Store encrypted data in localStorage
function storeEncryptedData(encryptedData, iv, salt) {
  localStorage.setItem(
    "encryptedData",
    JSON.stringify({ encryptedData, iv, salt })
  );
}

// Retrieve encrypted data from localStorage
function getEncryptedDataFromStorage() {
  const storedData = localStorage.getItem("encryptedData");
  return storedData ? JSON.parse(storedData) : null;
}

export {
  encryptData,
  decryptData,
  storeEncryptedData,
  getEncryptedDataFromStorage,
};
