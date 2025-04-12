# Project Name
ERC20 Token Launch with Custom Vesting Schedule

## 📖 Overview

1. **ERC20 Token Development:**

   - Design and develop a secure ERC20 token following best practices.
   - Implement standard functions such as `totalSupply`, `balanceOf`, `transfer`, `transferFrom`, `approve`, and `allowance`.
   - Ensure the token is optimized for minimal gas usage without compromising security.

2. **Vesting Schedule Implementation:**

   - Create a smart contract to manage the vesting of tokens over a predefined period.
   - Ensure the vesting schedule can handle different cliff periods, release intervals, and percentages.
   - The vesting contract should allow beneficiaries to claim tokens according to the vesting schedule automatically.
   - Include functionalities for early withdrawal penalties (if applicable) and proper handling of any remaining tokens post-vesting.

3. **Testing and Auditing:**

   - Thoroughly test the smart contracts on a testnet to ensure functionality and security.
   - Perform a comprehensive security audit to identify and fix potential vulnerabilities.


## 🚀 Getting Started

### Prerequisites

List what needs to be installed before running this project:

```
Node.js 18.18.0+
```

### Installation

Step-by-step instructions to get your project running:

1. Clone the repository
```bash
   git clone https://github.com/xampe11/ERC20TOKEN-and-VESTING-CONTRACT
   cd ERC20TOKEN-and-VESTING-CONTRACT
 ```

2. Install dependencies
```bash
   npm install
```

3. Configure the environment
```bash
   cp .env.example .env
   # Then edit .env with your configuration
```


## 🔧 Usage


You have some scripts created to show the behaviour of the contracts:

```javascript
lock-and-claim-hh.js
```
- Simulates a complete vesting schedule. Locks the tokens, moves time throught the different release schedules and claims the tokens when possible until all locked tokens are claimed.

```javascript
lock-tokens.js
```
- Creates a vesting Schedule and lock the tokens. 

```javascript
move-intervals.js
```
- Moves time forward in a local chain environment to help when testing.

```javascript
claim-token.js
```
- Simulates the claiming of tokens by the owner of the vesting. The owner will be able to claim the tokens depending on how many intervals have passed.

## 🧪 Testing

Instructions on how to run tests:

```bash
npx hardhat test
```

## 🚢 Deployment

Instructions for deploying this project to different environments:


1. Start a hardhat node (for local chain testing)
```bash
npx hardhat node
```

2. You can use the deployment scripts to deploy the contracts in a testnet or mainnet.
```bash
npx hardhat deploy --network your-network
```
Make sure to update the network object within the hardhat.config file with its proper attributes.


### Data Flow

Describe how data flows through your system:

1. User submits request from frontend
2. Request is authenticated by middleware
3. API server processes request and queries database
4. Response is formatted and returned to frontend
5. Frontend updates UI based on response

## 👥 Contributing

Contributions are always welcome!

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

## 📄 License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.

## 📞 Contact

Juan Farina - [Linked-In](www.linkedin.com/in/juan-pablo-fariña-a1b8a2133) - juampi.farinia@gmail.com

Project Link: [https://github.com/xampe11/ERC20TOKEN-and-VESTING-CONTRACT](https://github.com/xampe11/ERC20TOKEN-and-VESTING-CONTRACT)