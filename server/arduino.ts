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
  if (process.env.USE_REAL_ARDUINO === "true" && serialPort && serialPort.isOpen) {
    return {
      isConnected: true,
      message: `Connected on port ${ARDUINO_PORT}`,
      isSensorConnected,
      sensorMessage
    };
  } else {
    // Return simulated status
    return {
      isConnected: true,
      message: "Simulated Arduino connection",
      isSensorConnected: true,
      sensorMessage: "Simulated sensor connected"
    };
  }
}

// Send a command to the Arduino
export async function sendArduinoCommand(command: string): Promise<boolean> {
  if (process.env.USE_REAL_ARDUINO === "true" && serialPort && serialPort.isOpen) {
    try {
      serialPort.write(`${command}\n`);
      return true;
    } catch (error) {
      console.error("Error sending command to Arduino:", error);
      return false;
    }
  } else {
    // Simulate Arduino communication
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
            
            // Remove the handler once done
            arduinoResponseHandlers.delete("ENROLL");
            reject(new Error(`Enrollment failed: ${response}`));
          }
        });
        
        // Send the enrollment command
        sendArduinoCommand(`ENROLL:${nextId}`);
      });
    });
  } else {
    // Simulate a fingerprint registration
    console.log("Simulating fingerprint registration");
    // Get the next available ID from storage
    const nextId = await storage.getNextAvailableFingerprintId();
    return nextId;
  }
}

// Verify a fingerprint and get the matching ID
export async function verifyFingerprintAndGetId(): Promise<number | null> {
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
    // Simulate a verification
    console.log("Simulating fingerprint verification");
    
    // For simulation, let's say we match the first fingerprint
    // In a real app, we'd have a mock map of userIds to fingerprintIds
    const fingerprintId = 1;
    
    return fingerprintId;
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
