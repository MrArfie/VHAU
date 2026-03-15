export const hauVaultAbi = [
  {
    type: "function",
    stateMutability: "view",
    name: "credentials",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "studentName", type: "string" },
      { name: "program", type: "string" },
      { name: "institution", type: "string" },
      { name: "credentialTitle", type: "string" },
      { name: "credentialType", type: "string" },
      { name: "issuedDate", type: "string" },
      { name: "metadataURI", type: "string" },
      { name: "active", type: "bool" },
    ],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "issueCredential",
    inputs: [
      { name: "to", type: "address" },
      {
        name: "data",
        type: "tuple",
        components: [
          { name: "studentName", type: "string" },
          { name: "program", type: "string" },
          { name: "institution", type: "string" },
          { name: "credentialTitle", type: "string" },
          { name: "credentialType", type: "string" },
          { name: "issuedDate", type: "string" },
          { name: "metadataURI", type: "string" },
        ],
      },
    ],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
  {
    type: "function",
    stateMutability: "view",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

