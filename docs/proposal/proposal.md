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
|Project Supervisor:  | Irina Tal         |

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

- The qualified personnel along the supply chain will have the ability to update the blockchain with information about the condition of the package. A few use cases could be a package with a broken seal, medicines that may not be kept in desireable condition or maybe a damaged package. They can then remove the package and send it back if the issue is severe or flag the package that can then be investigated or be handled with caution. In any case the blockchain is updated with the relevant information along with location at which it was scanned. These will also inclue public health organistions

-  Finally the user with the final medicine can scan the QR-code on their personal device which will then give them all the relevant information regarding the medicine and also if any flags were raised along their journey. If the medicine is expired, counterfeit or any major flags were raised that deemed the medicine unfit for consumtion the app will alert the user that it is not reccomended to use the medicine.  

### Justification

FarmaTech provides a critical solution to the counterfeit drug problem by utilizing blockchain technology for secure and transparent tracking of medicines. Counterfeit drugs pose serious health risks and undermine consumer trust in the pharmaceutical industry. Existing systems are often insufficient in addressing these challenges. FarmaTech addresses this by generating unique QR codes for each medicine, ensuring that only genuine products are tracked from manufacturing to the end consumer, offering real-time verification along the entire supply chain.

The use of blockchain guarantees immutable transparency, allowing every transaction and interaction to be securely recorded and visible to all authorized participants. This fosters trust among manufacturers, distributors, and consumers. The system's QR code functionality allows easy verification of medicine authenticity, ensuring that both supply chain personnel and end users can quickly confirm that a medicine is legitimate and safe. Additionally, real-time monitoring flags any issues, such as tampered packaging or improper handling, ensuring only safe medicines reach consumers. Overall, FarmaTech ensures security, transparency, and trust in the pharmaceutical supply chain.

### Programming language(s)

**Node.js (JavaScript):** Used for backend development and interaction with Hyperledger Fabric through the  Fabric SDK.

**React.js (JavaScript):** For frontend development, providing a dynamic and responsive user interface.

**Go/Node.js:** For writing smart contract on the Hyperledger Fabric network.

### Programming tools / Tech stack

**Backend:**

- Node.js with Express.js: For backend development, handles API requests and manages interactions with the Hyperledger Fabric network through the Fabric SDK.
  
- Hyperledger Fabric: A permissioned blockchain platform used to ensure secure, immutable, and scalable tracking of medicines through the supply chain.
  
- Fabric SDK (Node.js): Facilitates communication between the backend and the blockchain, allowing the system to interact with smart contracts (chaincode).

  
**Frontend:**

- React.js: A robust frontend framework used to build the user interface, handling asynchronous requests to the backend and displaying drug authentication information.
  
- instascan.js: Enables QR code scanning on the frontend, allowing users to verify drug authenticity by querying the blockchain.

- qrcode.js (JavaScript): A library for generating QR codes containing drug-specific information.


**Location Tracking:**

- Google Geolocation API: Integrated into the system for tracking the physical location of transactions and  scans. This ensures the validity of scans at various points in the supply chain by verifying the location data.

**Development Tools:**

- VS Code: IDE we are going to be using for development
- Postman: A tool used for testing API endpoints


**Version Control:**

- GitLab: Version control system for managing source code, collaborating, and tracking changes in the project.

### Hardware

- Smartphone cameras
- qrcode scanner

### Learning Challenges

- Hyperledger Fabric: Setting up a private blockchain, writing chaincode, interacting through Fabric SDK.
- Node.js: Backend development, asynchronous programming.
- React.js: Frontend integration with blockchain, dynamic interfaces.
- QR Code Generation & Scanning: Secure QR code handling for tracking medicine.
- Geolocation API: Implementing location-based validation.
- Testing and Debugging: Ensuring smart contract and backend functionality.
- Security Best Practices: Encrypting data and ensuring the integrity of transactions.


### Breakdown of work

> Clearly identify who will undertake which parts of the project.
>
> It must be clear from the explanation of this breakdown of work both that each student is responsible for
> separate, clearly-defined tasks, and that those responsibilities substantially cover all of the work required
> for the project.

| Phase                                       | Responsibilities                                       | Student 1 | Student 2 |
|---------------------------------------------|-------------------------------------------------------|-----------|-----------|
| **Initial Setup and Planning**    | Collaborate on project planning and requirements      | Both      | Both      |
|                                             | Research best practices for blockchain in healthcare   | Both      | Both      |
| **Setting Up Hyperledger Fabric**  | Set up Hyperledger Fabric environment                  | Both      | Both      |
|                                             | Configure network and deploy blockchain instance       | Both      | Both      |
| **Backend Development**            | Develop API endpoints for drug registration            | Yes       | No        |
|                                             | Implement user authentication and role management      | Yes       | No        |
|                                             | Write smart contracts (chaincode)                      | No        | Yes       |
|                                             | Implement interaction with the Fabric SDK              | No        | Yes       |
| **Frontend Development**           | Design user interface using React.js                   | Yes       | No        |
|                                             | Implement QR code scanning with instascan.js           | Yes       | No        |
|                                             | Create components to display medicine information       | No        | Yes       |
|                                             | Handle asynchronous requests to the backend            | No        | Yes       |
| **Location Tracking Integration**   | Integrate Google Geolocation API                        | Both      | Both      |
|                                             | Test location-based features                            | Both      | Both      |
| **Testing and Debugging**          | Test backend functionality                              | Yes       | No        |
|                                             | Focus on security best practices                        | Yes       | No        |
|                                             | Test frontend components                                | No        | Yes       |
|                                             | Debug QR code generation and scanning                  | No        | Yes       |


#### Student 1

> *Student 1 should complete this section.*
- Collaborate on project planning and requirements gathering.
- Develop API endpoints for registering drugs and generating QR codes.
- Implement user authentication and role management.
- Design and develop the user interface using React.js.
- Implement QR code scanning functionality using instascan.js.
- Test backend functionality, including API endpoints.
- Focus on security best practices, including data encryption.
- Deploy the application to a cloud platform.
- Conduct final testing to ensure seamless integration.
- Prepare technical documentation for backend development and APIs.

#### Student 2

> *Student 2 should complete this section.*
- Collaborate on project planning and requirements gathering.
- Research best practices for implementing blockchain in healthcare.
- Write smart contracts (chaincode) for medicine entries and updates.
- Implement interaction with the Fabric SDK.
- Create dynamic components to display medicine information and alerts.
- Handle asynchronous requests to the backend.
- Integrate Google Geolocation API for tracking and validating scans.
- Test location-based features for accuracy.
- Test frontend components for responsiveness and user experience.
- Debug issues related to QR code generation and scanning.
- Prepare documentation for frontend development and user interface guidelines.


## Example

> Example: Here's how you can include images in markdown documents...

<!-- Basically, just use HTML! -->

<p align="center">
  <img src="./res/cat.png" width="300px">
</p>

