# Getting Started

Follow these steps to set up RTFM-GPT locally.

## Prerequisites

- **Node.js**: Version 18.17.0 or higher.
- **npm**: Version 9.0.0 or higher.
- **Cerebras API Key**: Get one at [cloud.cerebras.ai](https://cloud.cerebras.ai).

## Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/yourusername/rtfm-gpt.git
    cd rtfm-gpt
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Setup Environment**
    Create a `.env.local` file in the root directory:
    ```bash
    CEREBRAS_API_KEY=your_key_here
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

Visit `http://localhost:3000` to start using the app.

---

[Next: The Workflow >](?page=user-guide/workflow)
