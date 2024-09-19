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

