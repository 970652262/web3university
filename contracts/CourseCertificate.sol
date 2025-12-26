// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Course.sol";

/**
 * @title CourseCertificate
 * @dev NFT certificate for course completion
 */
contract CourseCertificate is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable {
    Course public courseContract;

    struct CertificateInfo {
        uint256 courseId;
        address student;
        uint256 issueDate;
        string courseName;
        string instructorName;
    }

    // Token ID => Certificate info
    mapping(uint256 => CertificateInfo) public certificates;

    // Course ID => Student address => Token ID (0 if not issued)
    mapping(uint256 => mapping(address => uint256)) public studentCertificates;

    // Course ID => Whether certificates are enabled
    mapping(uint256 => bool) public certificatesEnabled;

    // Course ID => Certificate metadata URI template
    mapping(uint256 => string) public courseMetadataURI;

    uint256 private _tokenIdCounter;

    // Events
    event CertificateIssued(
        uint256 indexed tokenId,
        uint256 indexed courseId,
        address indexed student,
        uint256 issueDate
    );

    event CertificatesEnabledForCourse(uint256 indexed courseId, bool enabled);

    constructor(address _courseContractAddress) ERC721("Course Certificate", "CERT") Ownable(msg.sender) {
        courseContract = Course(_courseContractAddress);
    }

    /**
     * @dev Enable certificates for a course (only course instructor)
     */
    function enableCertificates(
        uint256 _courseId,
        string memory _metadataURI
    ) external {
        Course.CourseInfo memory course = courseContract.getCourse(_courseId);
        require(course.instructor == msg.sender, "Only instructor can enable");
        require(course.isActive, "Course is not active");

        certificatesEnabled[_courseId] = true;
        courseMetadataURI[_courseId] = _metadataURI;

        emit CertificatesEnabledForCourse(_courseId, true);
    }

    /**
     * @dev Disable certificates for a course (only course instructor)
     */
    function disableCertificates(uint256 _courseId) external {
        Course.CourseInfo memory course = courseContract.getCourse(_courseId);
        require(course.instructor == msg.sender, "Only instructor can disable");

        certificatesEnabled[_courseId] = false;

        emit CertificatesEnabledForCourse(_courseId, false);
    }

    /**
     * @dev Claim certificate for completing a course
     */
    function claimCertificate(
        uint256 _courseId,
        string memory _instructorName
    ) external returns (uint256) {
        require(certificatesEnabled[_courseId], "Certificates not enabled for this course");
        require(
            courseContract.hasUserPurchased(_courseId, msg.sender),
            "Must purchase course first"
        );
        require(
            studentCertificates[_courseId][msg.sender] == 0,
            "Certificate already claimed"
        );

        Course.CourseInfo memory course = courseContract.getCourse(_courseId);

        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;

        _safeMint(msg.sender, newTokenId);

        // Set token URI
        string memory tokenURI = courseMetadataURI[_courseId];
        _setTokenURI(newTokenId, tokenURI);

        // Store certificate info
        certificates[newTokenId] = CertificateInfo({
            courseId: _courseId,
            student: msg.sender,
            issueDate: block.timestamp,
            courseName: course.title,
            instructorName: _instructorName
        });

        studentCertificates[_courseId][msg.sender] = newTokenId;

        emit CertificateIssued(newTokenId, _courseId, msg.sender, block.timestamp);

        return newTokenId;
    }

    /**
     * @dev Issue certificate to a student (only instructor)
     */
    function issueCertificate(
        uint256 _courseId,
        address _student,
        string memory _instructorName
    ) external returns (uint256) {
        Course.CourseInfo memory course = courseContract.getCourse(_courseId);
        require(course.instructor == msg.sender, "Only instructor can issue");
        require(certificatesEnabled[_courseId], "Certificates not enabled");
        require(
            courseContract.hasUserPurchased(_courseId, _student),
            "Student must purchase course first"
        );
        require(
            studentCertificates[_courseId][_student] == 0,
            "Certificate already issued"
        );

        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;

        _safeMint(_student, newTokenId);

        string memory tokenURI = courseMetadataURI[_courseId];
        _setTokenURI(newTokenId, tokenURI);

        certificates[newTokenId] = CertificateInfo({
            courseId: _courseId,
            student: _student,
            issueDate: block.timestamp,
            courseName: course.title,
            instructorName: _instructorName
        });

        studentCertificates[_courseId][_student] = newTokenId;

        emit CertificateIssued(newTokenId, _courseId, _student, block.timestamp);

        return newTokenId;
    }

    /**
     * @dev Get certificate info
     */
    function getCertificate(
        uint256 _tokenId
    ) external view returns (CertificateInfo memory) {
        require(_ownerOf(_tokenId) != address(0), "Certificate does not exist");
        return certificates[_tokenId];
    }

    /**
     * @dev Get student's certificate for a course
     */
    function getStudentCertificate(
        uint256 _courseId,
        address _student
    ) external view returns (uint256) {
        return studentCertificates[_courseId][_student];
    }

    /**
     * @dev Check if student has certificate for a course
     */
    function hasCertificate(
        uint256 _courseId,
        address _student
    ) external view returns (bool) {
        return studentCertificates[_courseId][_student] != 0;
    }

    /**
     * @dev Get all certificates owned by an address
     */
    function getCertificatesOf(
        address _owner
    ) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(_owner);
        uint256[] memory tokenIds = new uint256[](balance);

        for (uint256 i = 0; i < balance; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(_owner, i);
        }

        return tokenIds;
    }

    /**
     * @dev Update course contract address (only owner)
     */
    function setCourseContract(address _courseContractAddress) external onlyOwner {
        courseContract = Course(_courseContractAddress);
    }

    // Required overrides for multiple inheritance

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
