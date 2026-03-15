// SPDX-License-Identifier: MIT
// HAU Vault Credentials — uses _mint (not _safeMint) so smart accounts work.
//
// If you get "Stack too deep" in Remix: open the Solidity Compiler tab,
// enable "Enable optimization" (runs: 200), then enable "Use configuration file"
// and add "viaIR": true under "settings" in the JSON, or use the "Via IR" checkbox if shown.
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HAUVaultCredentials is ERC721Enumerable, Ownable {
    struct Credential {
        string studentName;
        string program;
        string institution;
        string credentialTitle;
        string credentialType;
        string issuedDate;
        string metadataURI;
        string studentNumber;
        string batch;
        string email;
        string location;
        string credentialTypes;
        bool active;
    }

    mapping(uint256 => Credential) public credentials;
    mapping(string => uint256) public tokenIdByStudentNumber;
    mapping(address => bool) public issuers;
    uint256 private _nextId = 1;

    event IssuerAdded(address indexed account);
    event IssuerRemoved(address indexed account);
    event CredentialIssued(
        uint256 indexed tokenId,
        address indexed holder,
        string credentialTitle,
        string credentialType
    );

    event CredentialRevoked(uint256 indexed tokenId);

    modifier onlyOwnerOrIssuer() {
        require(owner() == msg.sender || issuers[msg.sender], "Not owner or issuer");
        _;
    }

    constructor() ERC721("HAU Vault Credential", "HAUCRED") Ownable(msg.sender) {}

    function addIssuer(address account) external onlyOwner {
        require(account != address(0), "Zero address");
        issuers[account] = true;
        emit IssuerAdded(account);
    }

    function removeIssuer(address account) external onlyOwner {
        issuers[account] = false;
        emit IssuerRemoved(account);
    }

    function issueCredential(address to, Credential calldata data)
        external
        onlyOwnerOrIssuer
        returns (uint256 tokenId)
    {
        tokenId = _nextId;
        _nextId++;

        // Use _mint (not _safeMint) so smart accounts / contract recipients work
        _mint(to, tokenId);

        _saveCredentialPart1(tokenId, data);
        _saveCredentialPart2(tokenId, data);
        _finishIssue(tokenId, to, data.studentNumber, data.credentialTitle, data.credentialType);
    }

    function _finishIssue(
        uint256 tokenId,
        address holder,
        string calldata studentNumber,
        string calldata credentialTitle,
        string calldata credentialType
    ) private {
        tokenIdByStudentNumber[studentNumber] = tokenId;
        emit CredentialIssued(tokenId, holder, credentialTitle, credentialType);
    }

    function _saveCredentialPart1(uint256 tokenId, Credential calldata data) private {
        Credential storage c = credentials[tokenId];
        c.studentName = data.studentName;
        c.program = data.program;
        c.institution = data.institution;
        c.credentialTitle = data.credentialTitle;
        c.credentialType = data.credentialType;
        c.issuedDate = data.issuedDate;
    }

    function _saveCredentialPart2(uint256 tokenId, Credential calldata data) private {
        Credential storage c = credentials[tokenId];
        c.metadataURI = data.metadataURI;
        c.studentNumber = data.studentNumber;
        c.batch = data.batch;
        c.email = data.email;
        c.location = data.location;
        c.credentialTypes = data.credentialTypes;
        c.active = data.active;
    }

    function updateCredential(uint256 tokenId, Credential calldata data) external onlyOwnerOrIssuer {
        require(_ownerOf(tokenId) != address(0), "Invalid token");
        _saveCredentialPart1(tokenId, data);
        _saveCredentialPart2(tokenId, data);
        tokenIdByStudentNumber[data.studentNumber] = tokenId;
    }

    function revokeCredential(uint256 tokenId) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Invalid token");
        credentials[tokenId].active = false;
        emit CredentialRevoked(tokenId);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("Soulbound: non-transferable");
        }
        return super._update(to, tokenId, auth);
    }
}
