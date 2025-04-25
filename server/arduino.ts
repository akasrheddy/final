import { SerialPort } from "serialport";
import { storage } from "./storage";

// Configuration
const ARDUINO_PORT = process.env.ARDUINO_PORT || "/dev/ttyACM0";
const BAUD_RATE = 9600;

// Global variables
let serialPort: SerialPort | null = null;
let isSensorConnected = false;
let sensorMessage = "Not initialized";
let arduinoResponseHandlers: Map<string, (response: string) => void> = new Map();

// Connect to Arduino
export async function setupArduinoConnection(): Promise<void> {
  try {
    // Attempt to use a real Arduino connection if available
    console.log("Checking for Arduino connection...");
    
    if (process.env.USE_REAL_ARDUINO === "true") {
      console.log("Attempting to connect to real Arduino");
      // List available ports
      const ports = await SerialPort.list();
      console.log("Available ports:", ports);
      
      // Try to connect to Arduino
      serialPort = new SerialPort({
        path: ARDUINO_PORT,
        baudRate: BAUD_RATE
      });
      
      // Setup event handlers
      serialPort.on("open", async () => {
        console.log("Arduino connected on port:", ARDUINO_PORT);
        await storage.updateArduinoStatus(true, `Connected on port ${ARDUINO_PORT}`);
        
        // Send initial command to check if fingerprint sensor is connected
        sendArduinoCommand("CHECK_SENSOR");
      });
      
      serialPort.on("data", async (data) => {
        const message = data.toString().trim();
        console.log("Data from Arduino:", message);
        
        // Process responses from Arduino
        handleArduinoResponse(message);
      });
      
      serialPort.on("error", async (error) => {
        console.error("Arduino connection error:", error.message);
        await storage.updateArduinoStatus(false, `Connection error: ${error.message}`);
        isSensorConnected = false;
        sensorMessage = "Connection error";
      });
      
      serialPort.on("close", async () => {
        console.log("Arduino connection closed");
        await storage.updateArduinoStatus(false, "Connection closed");
        isSensorConnected = false;
        sensorMessage = "Connection closed";
      });
    } else {
      // Fallback to simulation
      console.log("Using simulated Arduino connection");
      await storage.updateArduinoStatus(true, "Simulated Arduino connection");
      isSensorConnected = true;
      sensorMessage = "Simulated sensor connected";
    }
  } catch (error) {
    console.error("Failed to setup Arduino connection:", error);
    await storage.updateArduinoStatus(false, `Setup error: ${(error as Error).message}`);
    isSensorConnected = false;
    sensorMessage = "Setup error";
  }
}

function handleArduinoResponse(message: string) {
  // Handle common responses
  if (message.startsWith("SENSOR_STATUS:")) {
    const status = message.split(":")[1].trim();
    isSensorConnected = status === "CONNECTED";
    sensorMessage = isSensorConnected ? "Sensor connected" : "Sensor not found";
    return;
  }
  
  // Check if there are any registered handlers for this message prefix
  for (const [prefix, handler] of arduinoResponseHandlers.entries()) {
    if (message.startsWith(prefix)) {
      handler(message);
      return;
    }
  }
  
  // Unknown response
  console.log("Unhandled Arduino message:", message);
}

// Get the current status of the Arduino and fingerprint sensor
export async function getArduinoStatus(): Promise<{
  isConnected: boolean;
  message: string;
  isSensorConnected: boolean;
  sensorMessage: string;
}> {
  // First check if we're using simulation mode regardless of real hardware setting
  if (process.env.ENABLE_SIMULATION === "true") {
    return {
      isConnected: true,
      message: "SIMULATION MODE - no hardware required",
      isSensorConnected: true,
      sensorMessage: "SIMULATION MODE ACTIVE - place finger on the sensor graphic"
    };
  }
  
  // If we're trying to use real hardware
  if (process.env.USE_REAL_ARDUINO === "true") {
    if (serialPort && serialPort.isOpen) {
      return {
        isConnected: true,
        message: `R307 connected on port ${ARDUINO_PORT}`,
        isSensorConnected,
        sensorMessage: isSensorConnected 
          ? "R307 fingerprint sensor READY - place finger on sensor" 
          : "R307 sensor not detected - check wiring"
      };
    } else {
      return {
        isConnected: false,
        message: `Unable to connect to Arduino on port ${ARDUINO_PORT}`,
        isSensorConnected: false,
        sensorMessage: "Fingerprint sensor unavailable - check device connection"
      };
    }
  } else {
    // Fallback simulation status when hardware mode is disabled
    return {
      isConnected: true,
      message: "SIMULATION MODE - hardware mode disabled",
      isSensorConnected: true,
      sensorMessage: "SIMULATION MODE ACTIVE - place finger on the sensor graphic"
    };
  }
}

// Send a command to the Arduino
export async function sendArduinoCommand(command: string): Promise<boolean> {
  // If simulation mode is enabled, always simulate commands
  if (process.env.ENABLE_SIMULATION === "true") {
    console.log(`SIMULATION MODE: Arduino command '${command}'`);
    return true;
  }
  
  // Only attempt to communicate with real hardware if it's enabled and connected
  if (process.env.USE_REAL_ARDUINO === "true" && serialPort && serialPort.isOpen) {
    try {
      serialPort.write(`${command}\n`);
      return true;
    } catch (error) {
      console.error("Error sending command to Arduino:", error);
      return false;
    }
  } else {
    // Fallback to simulation if real hardware is enabled but not connected
    console.log(`Simulating Arduino command: ${command}`);
    return true;
  }
}

// Clean up and disconnect
export async function disconnectArduino(): Promise<void> {
  if (process.env.USE_REAL_ARDUINO === "true" && serialPort && serialPort.isOpen) {
    serialPort.close();
    await storage.updateArduinoStatus(false, "Disconnected");
  } else {
    console.log("Simulating Arduino disconnection");
  }
}

// Register a fingerprint and get a fingerprint ID
export async function registerFingerprintAndGetId(userId: number): Promise<number> {
  // If simulation mode is enabled, always use the simulation approach
  if (process.env.ENABLE_SIMULATION === "true") {
    console.log("SIMULATION MODE: Registering fingerprint");
    const nextId = await storage.getNextAvailableFingerprintId();
    console.log(`SIMULATION MODE: Registered fingerprint with ID ${nextId}`);
    return nextId;
  }
  
  // If using real hardware
  if (process.env.USE_REAL_ARDUINO === "true") {
    return new Promise((resolve, reject) => {
      // Find next available ID
      storage.getNextAvailableFingerprintId().then(nextId => {
        console.log(`Attempting to register fingerprint with ID ${nextId}`);
        
        // Register handler for the enrollment response
        arduinoResponseHandlers.set("ENROLL", (response) => {
          if (response.includes("SUCCESS")) {
            const parts = response.split(":");
            if (parts.length === 3) {
              const fingerprintId = parseInt(parts[2]);
              console.log(`Successfully registered fingerprint with ID ${fingerprintId}`);
              
              // Remove the handler once done
              arduinoResponseHandlers.delete("ENROLL");
              resolve(fingerprintId);
            } else {
              reject(new Error("Invalid response format from Arduino"));
            }
          } else if (response.includes("ERROR")) {
            console.error(`Fingerprint registration error: ${response}`);
            
            // Detailed error logging based on specific error codes
            if (response.includes("ERROR_TEMPLATE2")) {
              console.error("DEBUG: Second fingerprint image failed to convert to template.");
              console.error("CAUSE: This typically happens when the finger is placed differently on the second attempt.");
              console.error("SUGGESTION: Try placing your finger in the exact same position as the first time.");
            } else if (response.includes("ERROR_IMAGING")) {
              console.error("DEBUG: Failed to capture fingerprint image.");
              console.error("CAUSE: Poor finger placement or dirty sensor surface.");
              console.error("SUGGESTION: Clean the sensor and ensure finger covers the entire surface.");
            } else if (response.includes("ERROR_TEMPLATE")) {
              console.error("DEBUG: Failed to convert first fingerprint image to template.");
              console.error("CAUSE: Poor image quality or insufficient fingerprint features detected.");
              console.error("SUGGESTION: Ensure finger is clean and press firmly but gently on the sensor.");
            }
            
            // Remove the handler once done
            arduinoResponseHandlers.delete("ENROLL");
            
            // Provide a more user-friendly error message
            const errorMessage = response.includes("ERROR_TEMPLATE2") 
              ? "Enrollment failed: The second fingerprint scan didn't match the first. Please try again with consistent finger placement."
              : `Enrollment failed: ${response}`;
            
            reject(new Error(errorMessage));
          } else if (response.includes("PLACE_FINGER")) {
            console.log("Waiting for user to place finger on sensor");
          } else if (response.includes("REMOVE_FINGER")) {
            console.log("Waiting for user to remove finger from sensor");
          } else if (response.includes("PLACE_AGAIN")) {
            console.log("Waiting for user to place finger on sensor for second scan");
          }
        });
        
        // Send the enrollment command
        sendArduinoCommand(`ENROLL:${nextId}`);
      });
    });
  } else {
    // Fallback simulation
    console.log("Simulating fingerprint registration (hardware mode disabled)");
    const nextId = await storage.getNextAvailableFingerprintId();
    return nextId;
  }
}

// Verify a fingerprint and get the matching ID
export async function verifyFingerprintAndGetId(voterID?: string): Promise<number | null> {
  // If simulation mode is enabled, always use the simulation approach
  if (process.env.ENABLE_SIMULATION === "true") {
    console.log("SIMULATION MODE: Verifying fingerprint for voter ID:", voterID);
    
    try {
      // If no voterID is provided, return a default fingerprint ID for simulation
      if (!voterID) {
        console.log("SIMULATION MODE: No voter ID provided, using default fingerprint ID");
        return 1;
      }
      
      // Get the user associated with the voter ID
      const user = await storage.getUserByVoterId(voterID);
      if (!user) {
        console.log(`SIMULATION MODE: No user found with voter ID: ${voterID}`);
        return null;
      }
      
      // In simulation mode, if the user has fingerprint flag set, 
      // we'll automatically return a valid fingerprint ID even if it's not in the database yet
      if (user.hasFingerprint) {
        // Try to get existing fingerprint ID
        const fingerprintId = await storage.getFingerprintByUserId(user.id);
        
        if (fingerprintId !== null) {
          console.log(`SIMULATION MODE: Found existing fingerprint with ID ${fingerprintId} for user ${user.id}`);
          return fingerprintId;
        } else {
          // For simulation mode, we'll create a fingerprint entry if it doesn't exist
          console.log(`SIMULATION MODE: Creating simulated fingerprint for user ${user.id}`);
          const nextId = await storage.getNextAvailableFingerprintId();
          await storage.registerFingerprint(user.id, nextId);
          console.log(`SIMULATION MODE: Registered fingerprint with ID ${nextId} for user ${user.id}`);
          return nextId;
        }
      } else {
        console.log(`SIMULATION MODE: User ${user.id} doesn't have fingerprint registered (hasFingerprint=false)`);
        return null;
      }
    } catch (error) {
      console.error("SIMULATION MODE: Error in fingerprint verification:", error);
      // Log the error but don't use a fallback - return null for failure
      return null;
    }
  }
  
  // If using real hardware
  if (process.env.USE_REAL_ARDUINO === "true") {
    return new Promise((resolve, reject) => {
      // Register handler for the verification response
      arduinoResponseHandlers.set("VERIFY", (response) => {
        if (response.includes("MATCH")) {
          const parts = response.split(":");
          if (parts.length === 3) {
            const fingerprintId = parseInt(parts[2]);
            console.log(`Successfully verified fingerprint with ID ${fingerprintId}`);
            
            // Remove the handler once done
            arduinoResponseHandlers.delete("VERIFY");
            resolve(fingerprintId);
          } else {
            reject(new Error("Invalid response format from Arduino"));
          }
        } else if (response.includes("NO_MATCH")) {
          console.log("No matching fingerprint found");
          
          // Remove the handler once done
          arduinoResponseHandlers.delete("VERIFY");
          resolve(null); // No match
        } else if (response.includes("ERROR")) {
          console.error(`Fingerprint verification error: ${response}`);
          
          // Remove the handler once done
          arduinoResponseHandlers.delete("VERIFY");
          reject(new Error(`Verification failed: ${response}`));
        }
      });
      
      // Send the verification command
      sendArduinoCommand("VERIFY");
    });
  } else {
    // Fallback simulation when hardware is disabled
    console.log("Simulating fingerprint verification (hardware mode disabled)");
    
    try {
      // If no voterID is provided, return the default fingerprint ID
      if (!voterID) {
        console.log("No voter ID provided, using default fingerprint ID");
        return 1;
      }
      
      // Get the user associated with the voter ID
      const user = await storage.getUserByVoterId(voterID);
      if (!user) {
        console.log(`No user found with voter ID: ${voterID}`);
        return null;
      }
      
      // Get the fingerprint ID associated with this user
      const fingerprintId = await storage.getFingerprintByUserId(user.id);
      if (fingerprintId === null) {
        console.log(`No fingerprint found for user with ID: ${user.id}`);
        return null;
      }
      
      console.log(`Simulated fingerprint match for user ${user.id} with fingerprint ID ${fingerprintId}`);
      return fingerprintId;
    } catch (error) {
      console.error("Error in simulated fingerprint verification:", error);
      // Default fallback - return fingerprint ID 1 if we can't find a match
      return 1;
    }
  }
}

/*
 * Arduino Sketch for R307 Fingerprint Sensor (Upload this to Arduino Uno)
 * 
 * #include <Adafruit_Fingerprint.h>
 * #include <SoftwareSerial.h>
 * 
 * // Pin configuration for R307 sensor
 * #define FINGERPRINT_RX 2
 * #define FINGERPRINT_TX 3
 * 
 * SoftwareSerial mySerial(FINGERPRINT_RX, FINGERPRINT_TX);
 * Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);
 * 
 * // Command buffer
 * String command = "";
 * String param = "";
 * 
 * void setup() {
 *   // Start communication with the computer
 *   Serial.begin(9600);
 *   while (!Serial);
 *   
 *   // Set the data rate for the sensor serial port
 *   finger.begin(57600);
 *   
 *   // Check if the fingerprint sensor is found
 *   if (finger.verifyPassword()) {
 *     Serial.println("SENSOR_STATUS:CONNECTED");
 *   } else {
 *     Serial.println("SENSOR_STATUS:NOT_FOUND");
 *   }
 * }
 * 
 * void loop() {
 *   // Check for commands from the server
 *   if (Serial.available()) {
 *     String fullCommand = Serial.readStringUntil('\n');
 *     fullCommand.trim();
 *     
 *     // Parse command and parameter (if any)
 *     int separatorIndex = fullCommand.indexOf(':');
 *     if (separatorIndex != -1) {
 *       command = fullCommand.substring(0, separatorIndex);
 *       param = fullCommand.substring(separatorIndex + 1);
 *     } else {
 *       command = fullCommand;
 *       param = "";
 *     }
 *     
 *     if (command == "CHECK_SENSOR") {
 *       checkSensor();
 *     } else if (command == "ENROLL") {
 *       int id = param.toInt();
 *       if (id > 0) {
 *         enrollFingerprint(id);
 *       } else {
 *         Serial.println("ENROLL:ERROR:INVALID_ID");
 *       }
 *     } else if (command == "VERIFY") {
 *       verifyFingerprint();
 *     } else if (command == "DELETE") {
 *       int id = param.toInt();
 *       if (id > 0) {
 *         deleteFingerprint(id);
 *       } else {
 *         Serial.println("DELETE:ERROR:INVALID_ID");
 *       }
 *     } else if (command == "GET_COUNT") {
 *       getTemplateCount();
 *     }
 *   }
 * }
 * 
 * void checkSensor() {
 *   if (finger.verifyPassword()) {
 *     Serial.println("SENSOR_STATUS:CONNECTED");
 *   } else {
 *     Serial.println("SENSOR_STATUS:NOT_FOUND");
 *   }
 * }
 * 
 * void getTemplateCount() {
 *   uint8_t p = finger.getTemplateCount();
 *   if (p == FINGERPRINT_OK) {
 *     Serial.print("TEMPLATE_COUNT:");
 *     Serial.println(finger.templateCount);
 *   } else {
 *     Serial.println("TEMPLATE_COUNT:ERROR");
 *   }
 * }
 * 
 * void enrollFingerprint(int id) {
 *   Serial.println("ENROLL:PLACE_FINGER");
 *   
 *   // Wait until a finger is detected
 *   int p = -1;
 *   while (p != FINGERPRINT_OK) {
 *     p = finger.getImage();
 *     switch (p) {
 *       case FINGERPRINT_OK:
 *         Serial.println("ENROLL:IMAGE_TAKEN");
 *         break;
 *       case FINGERPRINT_NOFINGER:
 *         // Waiting for finger
 *         break;
 *       default:
 *         Serial.println("ENROLL:ERROR_IMAGING");
 *         return;
 *     }
 *   }
 *   
 *   // Convert image to template
 *   p = finger.image2Tz(1);
 *   if (p != FINGERPRINT_OK) {
 *     Serial.println("ENROLL:ERROR_TEMPLATE");
 *     return;
 *   }
 *   
 *   // Remove finger
 *   Serial.println("ENROLL:REMOVE_FINGER");
 *   delay(2000);
 *   
 *   // Place finger again
 *   Serial.println("ENROLL:PLACE_AGAIN");
 *   p = 0;
 *   while (p != FINGERPRINT_OK) {
 *     p = finger.getImage();
 *   }
 *   
 *   // Convert second image to template
 *   p = finger.image2Tz(2);
 *   if (p != FINGERPRINT_OK) {
 *     Serial.println("ENROLL:ERROR_TEMPLATE2");
 *     return;
 *   }
 *   
 *   // Create model
 *   p = finger.createModel();
 *   if (p != FINGERPRINT_OK) {
 *     Serial.println("ENROLL:ERROR_MODEL");
 *     return;
 *   }
 *   
 *   // Store model in the specified ID
 *   p = finger.storeModel(id);
 *   if (p != FINGERPRINT_OK) {
 *     Serial.println("ENROLL:ERROR_STORE");
 *     return;
 *   }
 *   
 *   // Return success along with the ID
 *   Serial.print("ENROLL:SUCCESS:");
 *   Serial.println(id);
 * }
 * 
 * void verifyFingerprint() {
 *   Serial.println("VERIFY:PLACE_FINGER");
 *   
 *   // Wait until a finger is detected
 *   int p = -1;
 *   while (p != FINGERPRINT_OK) {
 *     p = finger.getImage();
 *   }
 *   
 *   // Convert image to template
 *   p = finger.image2Tz();
 *   if (p != FINGERPRINT_OK) {
 *     Serial.println("VERIFY:ERROR_TEMPLATE");
 *     return;
 *   }
 *   
 *   // Search for a matching fingerprint
 *   p = finger.fingerFastSearch();
 *   if (p == FINGERPRINT_OK) {
 *     // Return the matched fingerprint ID
 *     Serial.print("VERIFY:MATCH:");
 *     Serial.println(finger.fingerID);
 *   } else {
 *     Serial.println("VERIFY:NO_MATCH");
 *   }
 * }
 * 
 * void deleteFingerprint(int id) {
 *   uint8_t p = finger.deleteModel(id);
 *   if (p == FINGERPRINT_OK) {
 *     Serial.print("DELETE:SUCCESS:");
 *     Serial.println(id);
 *   } else {
 *     Serial.println("DELETE:ERROR");
 *   }
 * }
 */
