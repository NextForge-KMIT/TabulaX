# TabulaX - Smart Column Transformer

TabulaX is a powerful web application for learning, applying, and managing table transformations. It helps users transform data columns and perform fuzzy joins between tables from various data sources.

## Features

- **Learn Transformations**: Upload source and target data to learn column transformations. TabulaX automatically classifies and generates transformation functions.
- **Apply Transformations**: Apply learned transformations to new data. Transform columns and prepare them for joining with target tables.
- **Fuzzy Joins**: Join tables based on transformed columns with customizable matching thresholds.
- **Multiple Data Sources**: Support for CSV files, with planned support for MySQL, MongoDB, and Excel.
- **User Authentication**: Secure login and registration system to save and manage transformations.
- **Transformation Types**:
  - String-based: Uses string manipulation functions like splitting, case conversion, abbreviation, etc.
  - Numerical: Applies mathematical functions to transform values.
  - Algorithmic: Uses specific algorithms without external knowledge for transformations.
  - General: Requires external knowledge or complex mappings with no clear algorithmic pattern.

## Tech Stack

- **Frontend**: React, Material-UI, Chart.js
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Python Integration**: Python scripts for transformation learning and application

## Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- MongoDB
- Required Python packages:
  - pandas
  - numpy
  - scipy
  - langchain-google-genai
  - Levenshtein

## Installation

### Clone the repository

```bash
git clone https://github.com/yourusername/tabulax.git
cd tabulax
```

### Setup Backend

1. Install dependencies:
```bash
cd server
npm install
```

2. Create a `.env` file in the server directory with the following variables:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/tabulax
JWT_SECRET=your_jwt_secret_key
GOOGLE_API_KEY=your_google_api_key
```

3. Install Python dependencies:
```bash
pip install pandas numpy scipy langchain-google-genai python-Levenshtein
```

### Setup Frontend

1. Install dependencies:
```bash
cd ../client
npm install
```

## Running the Application

### Start the Backend Server

```bash
cd server
npm run dev
```

### Start the Frontend Development Server

```bash
cd ../client
npm start
```

The application will be available at http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Transformations
- `POST /api/transformations/classify` - Classify transformation
- `POST /api/transformations/apply` - Apply transformation
- `POST /api/transformations/fuzzy-join` - Perform fuzzy join
- `GET /api/transformations` - Get user's transformations
- `GET /api/transformations/:id` - Get transformation by ID
- `POST /api/transformations` - Save transformation
- `DELETE /api/transformations/:id` - Delete transformation

## License

This project is licensed under the MIT License.
