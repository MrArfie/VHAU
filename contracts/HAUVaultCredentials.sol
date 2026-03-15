// SPDX-License-Identifier: MIT
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
        bool active;
    }

    mapping(uint256 => Credential) public credentials;
    uint256 private _nextId = 1;

    event CredentialIssued(
        uint256 indexed tokenId,
        address indexed holder,
        string credentialTitle,
        string credentialType
    );

    event CredentialRevoked(uint256 indexed tokenId);

    constructor() ERC721("HAU Vault Credential", "HAUCRED") Ownable(msg.sender) {}

    function issueCredential(address to, Credential calldata data)
        external
        onlyOwner
        returns (uint256 tokenId)
    {
        tokenId = _nextId;
        _nextId++;

        _safeMint(to, tokenId);

        credentials[tokenId] = Credential({
            studentName: data.studentName,
            program: data.program,
            institution: data.institution,
            credentialTitle: data.credentialTitle,
            credentialType: data.credentialType,
            issuedDate: data.issuedDate,
            metadataURI: data.metadataURI,
            active: true
        });

        emit CredentialIssued(tokenId, to, data.credentialTitle, data.credentialType);
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
