export const CourseCertificateABI = [
  // Read functions
  { type: "function", name: "name", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "symbol", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "owner", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "courseContract", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "totalSupply", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "balanceOf", inputs: [{ name: "owner", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "ownerOf", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "tokenURI", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "tokenByIndex", inputs: [{ name: "index", type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "tokenOfOwnerByIndex", inputs: [{ name: "owner", type: "address" }, { name: "index", type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "getApproved", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "address" }], stateMutability: "view" },
  { type: "function", name: "isApprovedForAll", inputs: [{ name: "owner", type: "address" }, { name: "operator", type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "supportsInterface", inputs: [{ name: "interfaceId", type: "bytes4" }], outputs: [{ type: "bool" }], stateMutability: "view" },

  { type: "function", name: "certificates", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [
    { name: "courseId", type: "uint256" },
    { name: "student", type: "address" },
    { name: "issueDate", type: "uint256" },
    { name: "courseName", type: "string" },
    { name: "instructorName", type: "string" },
  ], stateMutability: "view" },

  { type: "function", name: "studentCertificates", inputs: [{ name: "courseId", type: "uint256" }, { name: "student", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "certificatesEnabled", inputs: [{ name: "courseId", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "courseMetadataURI", inputs: [{ name: "courseId", type: "uint256" }], outputs: [{ type: "string" }], stateMutability: "view" },

  { type: "function", name: "getCertificate", inputs: [{ name: "_tokenId", type: "uint256" }], outputs: [{ name: "", type: "tuple", components: [
    { name: "courseId", type: "uint256" },
    { name: "student", type: "address" },
    { name: "issueDate", type: "uint256" },
    { name: "courseName", type: "string" },
    { name: "instructorName", type: "string" },
  ]}], stateMutability: "view" },

  { type: "function", name: "getStudentCertificate", inputs: [{ name: "_courseId", type: "uint256" }, { name: "_student", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "hasCertificate", inputs: [{ name: "_courseId", type: "uint256" }, { name: "_student", type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "getCertificatesOf", inputs: [{ name: "_owner", type: "address" }], outputs: [{ type: "uint256[]" }], stateMutability: "view" },

  // Write functions
  { type: "function", name: "enableCertificates", inputs: [{ name: "_courseId", type: "uint256" }, { name: "_metadataURI", type: "string" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "disableCertificates", inputs: [{ name: "_courseId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "claimCertificate", inputs: [{ name: "_courseId", type: "uint256" }, { name: "_instructorName", type: "string" }], outputs: [{ type: "uint256" }], stateMutability: "nonpayable" },
  { type: "function", name: "issueCertificate", inputs: [{ name: "_courseId", type: "uint256" }, { name: "_student", type: "address" }, { name: "_instructorName", type: "string" }], outputs: [{ type: "uint256" }], stateMutability: "nonpayable" },

  { type: "function", name: "approve", inputs: [{ name: "to", type: "address" }, { name: "tokenId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "setApprovalForAll", inputs: [{ name: "operator", type: "address" }, { name: "approved", type: "bool" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "transferFrom", inputs: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "tokenId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "safeTransferFrom", inputs: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "tokenId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "safeTransferFrom", inputs: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "tokenId", type: "uint256" }, { name: "data", type: "bytes" }], outputs: [], stateMutability: "nonpayable" },

  // Owner functions
  { type: "function", name: "setCourseContract", inputs: [{ name: "_courseContractAddress", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "renounceOwnership", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "transferOwnership", inputs: [{ name: "newOwner", type: "address" }], outputs: [], stateMutability: "nonpayable" },

  // Events
  { type: "event", name: "CertificateIssued", inputs: [{ name: "tokenId", type: "uint256", indexed: true }, { name: "courseId", type: "uint256", indexed: true }, { name: "student", type: "address", indexed: true }, { name: "issueDate", type: "uint256", indexed: false }] },
  { type: "event", name: "CertificatesEnabledForCourse", inputs: [{ name: "courseId", type: "uint256", indexed: true }, { name: "enabled", type: "bool", indexed: false }] },
  { type: "event", name: "Transfer", inputs: [{ name: "from", type: "address", indexed: true }, { name: "to", type: "address", indexed: true }, { name: "tokenId", type: "uint256", indexed: true }] },
  { type: "event", name: "Approval", inputs: [{ name: "owner", type: "address", indexed: true }, { name: "approved", type: "address", indexed: true }, { name: "tokenId", type: "uint256", indexed: true }] },
  { type: "event", name: "ApprovalForAll", inputs: [{ name: "owner", type: "address", indexed: true }, { name: "operator", type: "address", indexed: true }, { name: "approved", type: "bool", indexed: false }] },
  { type: "event", name: "OwnershipTransferred", inputs: [{ name: "previousOwner", type: "address", indexed: true }, { name: "newOwner", type: "address", indexed: true }] },
] as const;
