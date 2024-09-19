# School of Computing &mdash; Year 4 Project Proposal Form

> Edit (then commit and push) this document to complete your proposal form.
> Make use of figures / diagrams where appropriate.
>
> Do not rename this file.

## SECTION A

|                     |                   |
|---------------------|-------------------|
|Project Title:       | FarmaTech         |
|Student 1 Name:      | Abhijit Mahal     |
|Student 1 ID:        | 21375106          |
|Student 2 Name:      | Faizan Ali Shah   |
|Student 2 ID:        | 21319901          |
|Project Supervisor:  | xxxxxx            |

> Ensure that the Supervisor formally agrees to supervise your project; this is only recognised once the
> Supervisor assigns herself/himself via the project Dashboard.
>
> Project proposals without an assigned
> Supervisor will not be accepted for presentation to the Approval Panel.

## SECTION B

> Guidance: This document is expected to be approximately 3 pages in length, but it can exceed this page limit.
> It is also permissible to carry forward content from this proposal to your later documents (e.g. functional
> specification) as appropriate.
>
> Your proposal must include *at least* the following sections.


### Introduction

> FarmaTech is a blockchain based application to help drug companies and their consumers to ensure that only the genuine medicines
> made by the companies reach their consumers.

### Outline

> This web based application is going to make an interface that will allow the drug companies to register their medicines on our app   > that will then generate them a unique key and will be displayed on the packaging as encrypted QR-code. The QR-code can be scanned by > registered personnel along the supply chain to confirm that the medicines are still not tampered with and update the blockchain. The > end consumer then can scan QR-code to check the legitamacy of the medicines or if any flags were raised along the way.

### Background

> We intially wanted to build a securtiy based app around the healthcare industry, especially using blockchain because it allows an end to end connection between two users. As we know the healthcare industry carry a lot of sensitive information that can be misused and can be potentially deadly for some people, we agreed on a medicine counterfeit app that will make sure that only the original and safe medicine made by the drug companies are delivered to the user.

### Achievements

> FarmaTech is going to be a web application that will have three end users:
    - The certified drug companies that will have the permission to make new entries to the blockchain for their medicines that will    carry general information about that specific medicine like the name, date of manufacturing, date of expiration, location of manufacturing and the a reference to the package that it is going to be shipped in. This will then generate QR-codes for each medicine and their package.

    - The qualified personnel along the supply chain will have the ability to update the blockchain with information about the condition of the package. A few use cases could be a package with a broken seal, medicines that may not be kept in desireable condition or maybe a damaged package. They can then remove the package and send it back if the issue is severe or flag the package that can then be investigated or be handled with caution. In any case the blockchain is updated with the relevant information along with location at which it was scanned.

    - Finally the user with the final medicine can scan the QR-code on their personal device which will then give them all the relevant information regarding the medicine and also if any flags were raised along their journey. If the medicine is expired, counterfeit or any major flags were raised that deemed the medicine unfit for consumtion the app will alert the user that it is not reccomended to use the medicine.  

### Justification

> 
You said:
how to edit md file in gitlab
ChatGPT said:
ChatGPT
To edit a Markdown (.md) file in GitLab, you can do this directly through the GitLab web interface or by cloning the repository and editing it locally. Here's how you can do both:

1. Edit a Markdown File Directly in GitLab
Steps:
Navigate to Your Repository:

Go to your GitLab project repository where the .md file is located.
Locate the File:

Browse through the files in your repository and find the .md file you want to edit (e.g., README.md).
Open the File:

Click on the file name to view its contents.
Click the "Edit" Button:

Once the file is open, you’ll see an "Edit" button (pencil icon) in the top-right corner. Click on this button to enter editing mode.
Make Changes:

You can now make changes to the file using the Markdown editor. GitLab supports Markdown syntax (e.g., # for headings, * for lists, etc.).
Commit the Changes:

After making the necessary edits, scroll down to the Commit Changes section.
Add a commit message describing the changes you made.
Choose whether to create a new branch or commit directly to the existing branch.
Click Commit Changes to save your edits.
2. Edit a Markdown File Locally via Git
Steps:
Clone the Repository:

If you haven't already cloned the repository locally, run the following command in your terminal:
bash
Copy code
git clone https://gitlab.com/username/project.git
Replace username/project.git with the actual path to your GitLab repository.
Navigate to the Directory:

bash
Copy code
cd project
Edit the File:

Open the Markdown file with a text editor or code editor (e.g., VS Code, Sublime Text, or Nano).
bash
Copy code
nano README.md
Make the necessary changes to the .md file.
Add and Commit the Changes:

After editing, save the file and stage the changes:
bash
Copy code
git add README.md
Commit the changes with a meaningful message:
bash
Copy code
git commit -m "Updated README.md with new content"
Push the Changes to GitLab:

Push the changes back to the GitLab repository:
bash
Copy code
git push origin branch_name
Replace branch_name with the name of the branch you're working on (usually main or master).
Now your .md file should be updated in the GitLab repository either through the web interface or by pushing local changes!






You said:
i want you to write justification for me "### Introduction

> FarmaTech is a blockchain based application to help drug companies and their consumers to ensure that only the genuine medicines
> made by the companies reach their consumers.

### Outline

> This web based application is going to make an interface that will allow the drug companies to register their medicines on our app   > that will then generate them a unique key and will be displayed on the packaging as encrypted QR-code. The QR-code can be scanned by > registered personnel along the supply chain to confirm that the medicines are still not tampered with and update the blockchain. The > end consumer then can scan QR-code to check the legitamacy of the medicines or if any flags were raised along the way.

### Background

> We intially wanted to build a securtiy based app around the healthcare industry, especially using blockchain because it allows an end to end connection between two users. As we know the healthcare industry carry a lot of sensitive information that can be misused and can be potentially deadly for some people, we agreed on a medicine counterfeit app that will make sure that only the original and safe medicine made by the drug companies are delivered to the user.

### Achievements

> FarmaTech is going to be a web application that will have three end users:
    - The certified drug companies that will have the permission to make new entries to the blockchain for their medicines that will    carry general information about that specific medicine like the name, date of manufacturing, date of expiration, location of manufacturing and the a reference to the package that it is going to be shipped in. This will then generate QR-codes for each medicine and their package.

    - The qualified personnel along the supply chain will have the ability to update the blockchain with information about the condition of the package. A few use cases could be a package with a broken seal, medicines that may not be kept in desireable condition or maybe a damaged package. They can then remove the package and send it back if the issue is severe or flag the package that can then be investigated or be handled with caution. In any case the blockchain is updated with the relevant information along with location at which it was scanned.

    - Finally the user with the final medicine can scan the QR-code on their personal device which will then give them all the relevant information regarding the medicine and also if any flags were raised along their journey. If the medicine is expired, counterfeit or any major flags were raised that deemed the medicine unfit for consumtion the app will alert the user that it is not reccomended to use the medicine.  

### Justification

> Why/when/where/how will it be useful?"
ChatGPT said:
ChatGPT
Justification
FarmaTech addresses a critical need in the healthcare industry by providing an end-to-end solution that ensures the authenticity and safety of medicines. Counterfeit drugs pose significant health risks to consumers and financial losses to pharmaceutical companies. By leveraging blockchain technology, FarmaTech creates a transparent, tamper-proof, and decentralized system that enhances trust and security across the entire drug supply chain.

Why is FarmaTech Useful?
Counterfeit Prevention: Counterfeit medicines account for a large percentage of drugs circulating in many markets, particularly in developing countries. FarmaTech ensures that only authentic medicines, manufactured and approved by licensed drug companies, reach consumers. The unique QR-code and blockchain integration prevent counterfeiters from replicating legitimate drug packaging, significantly reducing the risk of fake medicines being sold.

Transparency and Trust: Blockchain’s immutable and decentralized ledger ensures that every interaction with a drug package—from manufacturing to distribution and consumption—is securely recorded. This transparency builds trust among all stakeholders, including drug manufacturers, suppliers, regulators, and end consumers, by making the drug's entire lifecycle visible and verifiable.

Real-Time Monitoring: The supply chain is vulnerable to issues such as tampered packaging, improper storage, or mishandling. FarmaTech allows qualified personnel to scan the medicines at various stages, updating the blockchain with real-time data about the package’s condition. This enables immediate detection of any anomalies, such as damaged packaging or improper storage conditions, which could compromise the drug's efficacy and safety.

Consumer Safety: For end users, FarmaTech provides a layer of protection by allowing them to verify the legitimacy and safety of the medicine before use. Consumers can scan the QR-code to check if the medicine is genuine and see if any warnings or flags were raised during the supply chain process. This ensures that only safe and effective drugs are consumed, protecting patients from potential harm due to counterfeit or compromised medicines.

When and Where is FarmaTech Useful?
During Manufacturing: Pharma companies can register their medicines with FarmaTech, ensuring that each product is uniquely tracked from the moment it is produced. This is the first step in creating a transparent trail for each product, ensuring accountability.

Throughout the Supply Chain: As medicines pass through various stages of the supply chain, including warehousing, transportation, and distribution, FarmaTech’s QR-code system allows for continuous verification and tracking. Any potential issues like temperature violations, tampered seals, or delays are logged in the blockchain and visible to authorized stakeholders.

At the Point of Sale and Consumption: Consumers can use FarmaTech to verify the authenticity of the medicines they purchase. Pharmacies and hospitals can also use this technology to ensure they are stocking genuine, safe products.

How Does FarmaTech Provide Value?
Technological Innovation: FarmaTech utilizes blockchain, which is known for its security and decentralization, to prevent any tampering with drug-related data. This ensures that the integrity of the information remains intact and verifiable by all parties involved, providing a significant technological advantage over traditional tracking methods.

Regulatory Compliance: Governments and regulatory agencies are increasingly pushing for stricter control over drug supply chains to prevent counterfeiting. FarmaTech offers a solution that complies with these regulations by providing a transparent, immutable system that tracks medicines from production to consumption.

Cost-Efficient: By preventing the distribution of counterfeit drugs and minimizing inefficiencies in the supply chain, FarmaTech can save drug companies substantial costs associated with product recalls, legal liabilities, and lost consumer trust. For consumers, it ensures that they are not wasting money on ineffective or dangerous counterfeit products.

In summary, FarmaTech provides a robust, blockchain-based solution that addresses the widespread issue of counterfeit drugs, ensuring safety, trust, and transparency across the entire pharmaceutical supply chain, ultimately benefiting both companies and consumers alike.






You said:
make it consise
ChatGPT said:
ChatGPT
Justification
FarmaTech offers a critical solution to the issue of counterfeit drugs, ensuring medicine authenticity and safety by leveraging blockchain technology. Counterfeit medicines pose serious health risks and financial losses. FarmaTech ensures only genuine medicines reach consumers by using unique QR codes and an immutable blockchain ledger for tracking.

This system enhances transparency and trust throughout the drug supply chain, allowing real-time monitoring of packages at various stages. Any tampering or improper handling is recorded and flagged. End users can verify the legitimacy of their medicines by scanning the QR code, ensuring safety before consumption.

FarmaTech is useful at all stages, from manufacturing to distribution and consumption, helping companies comply with regulatory standards, reduce costs, and protect consumers from harmful counterfeit drugs. By providing a secure, verifiable, and efficient solution, FarmaTech ensures transparency, trust, and safety across the pharmaceutical supply chain.






You said:
this is the roadmap i am using for my project "Counterfeit Drug Problem: Understand how counterfeit drugs affect the pharmaceutical industry and how existing systems fall short.
Blockchain Technology: Learn the basics of blockchain, smart contracts, and how they are used for tracking and traceability.
2. Identify the Key Modules and Components
Your project will have multiple modules. Based on the paper, these key components should be developed:

Blockchain Network Setup: The foundation of your system.
QR Code Generation and Scanning: Used for authenticating the medicine.
Public-Private Key Infrastructure: To ensure secure transactions and participant validation.
Transaction and Data Flow Management: Between manufacturers, distributors, and retailers.
Location Tracking: To verify the authenticity of transactions based on location.
3. Project Planning and Milestones
Here’s how you can break down your project into tasks and milestones.

Stage 1: Research and Tools Setup
Timeline: 1-2 Weeks

Research Blockchain Basics: Understand how blockchain works and what types (public/private/hybrid) are best suited for your use case.
Choose Blockchain Platform: Start with a private blockchain platform like Ethereum (via Ganache) or Hyperledger. You can also explore tools like Quorum.
Development Environment Setup:
Backend: Use Node.js with Express.js.
Blockchain Libraries: For instance, use web3.js or Truffle Suite (for Ethereum) or Hyperledger SDK.
QR Code Library: Use qrious for generating QR codes.
Front-End Framework: AngularJS or ReactJS for building the user interface.
Stage 2: Blockchain Setup
Timeline: 2-3 Weeks

Build a Private Blockchain Network:
Set up a local blockchain using Ganache for development or Hyperledger Fabric.
Create the participants of the supply chain (Manufacturer, Distributor, Retailer, Drug Administrator).
Smart Contracts:
Develop smart contracts to handle the transactions between participants (medicine production, distribution, and sale).
Store information like drug details, QR code, and timestamps.
Implement pseudocode from the paper to manage blockchain verification and location-based validation.
Test smart contracts using Truffle or Remix IDE.
Stage 3: QR Code Integration and Security
Timeline: 3-4 Weeks

QR Code Generation: Implement a QR code generator that encodes drug-specific information (drug ID, manufacturer details, etc.).
Use qrious or qrcode.js.
QR Code Scanning: Implement a system where customers and participants can scan a QR code to verify authenticity.
Use libraries like instascan.js for camera-based scanning.
When scanned, fetch the related transaction from the blockchain.
Validate Drug Authenticity: The system checks the QR code against blockchain data to confirm its legitimacy.
Implement the pseudocode from the paper (block validation and quantity checks).
Stage 4: Location-Based Transaction Validation
Timeline: 2 Weeks

Location Tracking:
Use the Google Geolocation API to track and log transaction locations.
Ensure that location data is stored in the blockchain and verified during transactions.
Implement logic to reject transactions from unauthorized locations.
Stage 5: Frontend Development and UI/UX
Timeline: 2-3 Weeks

User Interface for Supply Chain Participants:
Create separate UI components for Manufacturer, Distributor, Retailer, and Customer.
Provide interfaces to check authenticity, initiate a transaction, and scan QR codes.
Use Angular or React for frontend development.
Customer Verification:
Add a simple interface where customers can scan the QR code on the medicine and see details such as origin, authenticity, and expiry.
Stage 6: System Testing and Optimization
Timeline: 2 Weeks

Testing the Blockchain System:
Test all parts of the blockchain: medicine traceability, transactions, QR code validation, and location verification.
Test for security vulnerabilities like unauthorized access and manipulation.
Data Optimization:
Implement the data reduction process by removing expired medicine records.
Improve Consensus Mechanism:
Ensure the consensus algorithm is efficient for real-time transactions.
Stage 7: Evaluation and Deployment
Timeline: 2 Weeks

Evaluate Efficiency:
Assess the speed and throughput of transactions.
Measure performance in a real-world supply chain scenario.
Deploy the System:
You can initially deploy on localhost but consider testing on a test network like Ethereum's Rinkeby testnet or using Hyperledger on a cloud-based system.
Final Adjustments:
Make any final adjustments based on testing and feedback.
4. Final Documentation and Presentation
Timeline: 2 Weeks

Document the Project:
Prepare detailed project documentation, covering the system architecture, codebase, and use cases.
Prepare Presentation and Demo:
Create slides for presenting your project.
Plan a live demo showing how the system works, focusing on key features like QR code scanning, transaction validation, and counterfeit detection.
5. Technologies to Use
Here are the recommended tools and technologies:

Backend: Node.js, Express.js
Blockchain: Ethereum (Ganache, Truffle), or Hyperledger Fabric
Frontend: AngularJS/ReactJS
Smart Contracts: Solidity (Ethereum) or Chaincode (Hyperledger)
QR Code: qrious or qrcode.js
Geolocation API: Google Geolocation API
Database (if needed): MongoDB or any NoSQL database for off-chain storage.
6. Additional Considerations
Security: Implement encryption for QR codes and transaction data using cryptography libraries (like elliptic).
Scalability: Consider how the system will handle an increasing number of participants and transactions.
Testing: Use tools like Mocha or Jest for unit testing of smart contracts and backend logic." using the road map i want you to write me justification "i want you to write justification for me "### Introduction

> FarmaTech is a blockchain based application to help drug companies and their consumers to ensure that only the genuine medicines
> made by the companies reach their consumers.

### Outline

> This web based application is going to make an interface that will allow the drug companies to register their medicines on our app   > that will then generate them a unique key and will be displayed on the packaging as encrypted QR-code. The QR-code can be scanned by > registered personnel along the supply chain to confirm that the medicines are still not tampered with and update the blockchain. The > end consumer then can scan QR-code to check the legitamacy of the medicines or if any flags were raised along the way.

### Background

> We intially wanted to build a securtiy based app around the healthcare industry, especially using blockchain because it allows an end to end connection between two users. As we know the healthcare industry carry a lot of sensitive information that can be misused and can be potentially deadly for some people, we agreed on a medicine counterfeit app that will make sure that only the original and safe medicine made by the drug companies are delivered to the user.

### Achievements

> FarmaTech is going to be a web application that will have three end users:
    - The certified drug companies that will have the permission to make new entries to the blockchain for their medicines that will    carry general information about that specific medicine like the name, date of manufacturing, date of expiration, location of manufacturing and the a reference to the package that it is going to be shipped in. This will then generate QR-codes for each medicine and their package.

    - The qualified personnel along the supply chain will have the ability to update the blockchain with information about the condition of the package. A few use cases could be a package with a broken seal, medicines that may not be kept in desireable condition or maybe a damaged package. They can then remove the package and send it back if the issue is severe or flag the package that can then be investigated or be handled with caution. In any case the blockchain is updated with the relevant information along with location at which it was scanned.

    - Finally the user with the final medicine can scan the QR-code on their personal device which will then give them all the relevant information regarding the medicine and also if any flags were raised along their journey. If the medicine is expired, counterfeit or any major flags were raised that deemed the medicine unfit for consumtion the app will alert the user that it is not reccomended to use the medicine.  

### Justification

> FarmaTech provides a critical solution to the counterfeit drug problem by utilizing blockchain technology for secure and transparent tracking of medicines. Counterfeit drugs pose serious health risks and undermine consumer trust in the pharmaceutical industry. Existing systems are often insufficient in addressing these challenges. FarmaTech addresses this by generating unique QR codes for each medicine, ensuring that only genuine products are tracked from manufacturing to the end consumer, offering real-time verification along the entire supply chain.

The use of blockchain guarantees immutable transparency, allowing every transaction and interaction to be securely recorded and visible to all authorized participants. This fosters trust among manufacturers, distributors, and consumers. The system's QR code functionality allows easy verification of medicine authenticity, ensuring that both supply chain personnel and end users can quickly confirm that a medicine is legitimate and safe. Additionally, real-time monitoring flags any issues, such as tampered packaging or improper handling, ensuring only safe medicines reach consumers. Overall, FarmaTech ensures security, transparency, and trust in the pharmaceutical supply chain.

### Programming language(s)

> Node.js (JavaScript): Used for backend development and interaction with Hyperledger Fabric through the Fabric SDK.
React.js (JavaScript): For frontend development, providing a dynamic and responsive user interface.
Go/Node.js: For writing smart contract on the Hyperledger Fabric network.

### Programming tools / Tech stack

> Backend:
  (1) Node.js with Express.js: Handles API requests and manages interactions with the Hyperledger Fabric      network through the Fabric SDK.
  
  (2) Hyperledger Fabric: A permissioned blockchain platform ensuring secure, scalable transactions within the supply chain.
  
  (3) Fabric SDK (Node.js): Facilitates communication between the backend and the blockchain, allowing the system to interact with smart contracts (chaincode).
  
  Frontend:
  (1) React.js: A robust frontend framework used to build the user interface, handling asynchronous requests to the backend and displaying drug authentication information.
  
  (2) instascan.js: Enables QR code scanning on the frontend, allowing users to verify drug authenticity by querying the blockchain.

### Hardware

> Describe any non-standard hardware components which will be required.

### Learning Challenges

> List the main new things (technologies, languages, tools, etc) that you will have to learn.

### Breakdown of work

> Clearly identify who will undertake which parts of the project.
>
> It must be clear from the explanation of this breakdown of work both that each student is responsible for
> separate, clearly-defined tasks, and that those responsibilities substantially cover all of the work required
> for the project.

#### Student 1

> *Student 1 should complete this section.*

#### Student 2

> *Student 2 should complete this section.*

## Example

> Example: Here's how you can include images in markdown documents...

<!-- Basically, just use HTML! -->

<p align="center">
  <img src="./res/cat.png" width="300px">
</p>

