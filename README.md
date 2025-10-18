# Online Viewer sample

[![Node.js](https://img.shields.io/badge/Node.js-8.11.1-blue.svg)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-6.1.0-blue.svg)](https://www.npmjs.com/)
![Platforms](https://img.shields.io/badge/platform-windows%20%7C%20osx%20%7C%20linux-lightgray.svg)
[![License](http://img.shields.io/:license-mit-blue.svg)](http://opensource.org/licenses/MIT)

[![oAuth2](https://img.shields.io/badge/oAuth2-v1-green.svg)](https://forge.autodesk.com/)
[![Data-Management](https://img.shields.io/badge/Data%20Management-v2-green.svg)](https://forge.autodesk.com/)
[![Model-Derivative](https://img.shields.io/badge/Model%20Derivative-v2-green.svg)](https://forge.autodesk.com/)
[![Viewer](https://img.shields.io/badge/Viewer-v7-green.svg)](https://forge.autodesk.com/)

# Description
This sample is part of the [Online Viewer Walkthrough](https://forge.autodesk.com/developer/learn/viewer-app).

In this sample, we will be creating a simple web page that allows end users to upload some files to Forge storage service, then translate them and display them in a web browser.

- Authenticate your developer identity
- Create a bucket
- Get bucket detail
- Save a supported file to a bucket
- Read the uploaded file from a bucket
- Translate the file to the SVF format
- Display the file in a web browser

## Thumbnail
![thumbnail](/thumbnail.png)

# Setup

## Prerequisites

1. A Forge account: [Getting Started with Forge](https://forge.autodesk.com/developer/getting-started)
2. A text editor of your choice. (For example Brackets or Visual Studio Code are good choices.)
3. A basic knowledge of :
    - HTML and CSS
    - JavaScript ES6
    - Command-line programs
      - Node.js Command Line (for Windows users)
      - Terminal (for Mac/Linux/Unix users)

## Running locally

Install [NodeJS](https://nodejs.org/) (version 8 or newer).

Clone this project or download it. It's recommended to install [GitHub desktop](https://desktop.github.com/).

### Get your Forge API credentials

1. Go to [Autodesk Forge Developer Portal](https://forge.autodesk.com/myapps)
2. Create a new app or use an existing one
3. Copy your **Client ID** and **Client Secret**

### Setup environment variables

You have two options to set up your environment variables:

#### Option 1: Using .env file (Recommended)

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and replace the placeholder values with your actual credentials:
   ```
   FORGE_CLIENT_ID=your_actual_client_id_here
   FORGE_CLIENT_SECRET=your_actual_client_secret_here
   ```

#### Option 2: Using command line environment variables

Mac OSX/Linux (Terminal)

```bash
export FORGE_CLIENT_ID=your_client_id_here
export FORGE_CLIENT_SECRET=your_client_secret_here
```

Windows (use Node.js command line from Start menu)

```bash
set FORGE_CLIENT_ID=your_client_id_here
set FORGE_CLIENT_SECRET=your_client_secret_here
```

### Install and run

```bash
npm install
npm start
```

Open a browser and navigate to http://localhost:3000.

Click on the `Authorize me` link and then click through the links on the browser to:
  - Create a bucket
  - Save a supported file to a bucket
  - Display the file in a web browser

*NOTE:* _It may take several minutes to complete translate the file._

# License
This sample is licensed under the terms of the [MIT License](http://opensource.org/licenses/MIT). Please see the [LICENSE](LICENSE) file for full details.

# Support
forge.help@autodesk.com
