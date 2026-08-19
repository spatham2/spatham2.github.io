# What is it?

The Cuff-Link is a device I thought up when I realized that there's no one size fits all mouse for people with disabilities. It works via an IMU and EMG strapped to the wrist of the user using the band. The IMU's yaw, pitch, and roll is used to control the movement of an onscreen cursor, and the EMG reads muscle contractions and sends a click command after it exceeds a certain threshold. All of this data is fed to the computer via BLE, where a Python script running on the computer controls the mouse. We also added an optional finger controller for more precision.

# Key Technologies

- ESP32 (using Arduino IDE)
- Python
- Circuit Design
- Sensor Processing (EMG, IMU)
- Fusion360 (CAD) + 3D Printing
