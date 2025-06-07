# My Tasks App  

---

## Description  
My Tasks is a React Native mobile application built using Expo. It allows users to add tasks with priority levels, mark tasks as completed or active, edit and delete tasks, and receive scheduled reminders via notifications. Tasks are stored locally on the device for persistence.

---

## Features  
- Add new tasks with priority (High, Medium, Low)  
- View tasks divided into **Active** and **Completed** sections  
- Tap a task to toggle its completion status  
- Edit and delete tasks  
- Scheduled local notifications remind users to complete tasks  
- Persistent storage with AsyncStorage  

---

## Setup & Running the App  

### Prerequisites  
- Node.js and npm installed  
- Expo CLI installed globally (`npm install -g expo-cli`) or use `npx`  
- Expo Go app installed on your Android/iOS device  

### Steps  

1. **Clone the repository**  
   ```bash
   git clone <repository-url>
   cd <repository-folder>

2. **Install Dependencies**
   Run this command in your project directory to install all required packages:
   ```bash
   npm install

3. **Start the Expo development server**
   Launch the Expo dev server with:
   ```bash
   npm start
   or
   expo start


4. **Run the app on your device**
   -Open the Expo Go app on your Android or iOS device.
   -Scan the QR code displayed in the terminal or the browser window that opened when you ran the server.
   -The app will load and run on your device instantly.
