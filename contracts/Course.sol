// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./YDToken.sol";

/**
 * @title Course
 * @dev Course management contract with rating, refund, subscription, referral, certification, categories, and bulk discount features.
 */
contract Course is Ownable, ReentrancyGuard {
    YDToken public ydToken;

    // ============ Structs ============

    struct CourseInfo {
        uint256 id;
        string title;
        string description;
        string coverUrl;
        uint256 priceYDT;
        address instructor;
        bool isActive;
        uint256 createdAt;
        uint256 totalStudents;
        uint256 categoryId;
        uint256 totalRating;
        uint256 ratingCount;
    }

    struct PurchaseRecord {
        uint256 courseId;
        uint256 purchaseTime;
        uint256 pricePaid;
        bool refunded;
        address referrer;
    }

    struct Rating {
        uint8 score; // 1-5
        string comment;
        uint256 timestamp;
    }

    struct Category {
        uint256 id;
        string name;
        bool isActive;
    }

    struct Subscription {
        uint256 startTime;
        uint256 endTime;
        bool isActive;
    }

    // ============ State Variables ============

    // Course ID => Course info
    mapping(uint256 => CourseInfo) public courses;

    // Course ID => Student address => Whether purchased
    mapping(uint256 => mapping(address => bool)) public hasPurchased;

    // Student address => List of purchased course IDs
    mapping(address => uint256[]) public studentCourses;

    // Instructor address => List of created course IDs
    mapping(address => uint256[]) public instructorCourses;

    // Course ID => Student address => Purchase record
    mapping(uint256 => mapping(address => PurchaseRecord)) public purchaseRecords;

    // Course ID => Student address => Rating
    mapping(uint256 => mapping(address => Rating)) public courseRatings;

    // Category ID => Category info
    mapping(uint256 => Category) public categories;

    // Certified instructors
    mapping(address => bool) public certifiedInstructors;

    // User subscriptions
    mapping(address => Subscription) public subscriptions;

    // Referral rewards: referrer => total rewards earned
    mapping(address => uint256) public referralRewards;

    // Counters
    uint256 public courseCounter;
    uint256 public categoryCounter;

    // Configuration
    uint256 public platformFeePercent = 5; // Platform fee 5%
    uint256 public refundPeriod = 7 days; // Refund window
    uint256 public referralRewardPercent = 5; // Referral reward 5%
    uint256 public monthlySubscriptionPrice = 100 * 10 ** 18; // 100 YDT per month
    uint256 public yearlySubscriptionPrice = 1000 * 10 ** 18; // 1000 YDT per year
    uint256 public bulkDiscountThreshold = 3; // Min courses for bulk discount
    uint256 public bulkDiscountPercent = 10; // 10% discount for bulk purchase
    bool public requireCertification = false; // Whether instructors need certification

    // ============ Events ============

    event CourseCreated(
        uint256 indexed courseId,
        string title,
        address indexed instructor,
        uint256 priceYDT,
        uint256 categoryId
    );

    event CoursePurchased(
        uint256 indexed courseId,
        address indexed student,
        uint256 priceYDT,
        uint256 timestamp,
        address referrer
    );

    event CourseUpdated(
        uint256 indexed courseId,
        string title,
        uint256 priceYDT
    );

    event CourseDeactivated(uint256 indexed courseId);

    event CourseRated(
        uint256 indexed courseId,
        address indexed student,
        uint8 score,
        string comment
    );

    event RefundIssued(
        uint256 indexed courseId,
        address indexed student,
        uint256 amount
    );

    event SubscriptionPurchased(
        address indexed user,
        uint256 duration,
        uint256 endTime
    );

    event ReferralRewardPaid(
        address indexed referrer,
        address indexed referee,
        uint256 amount
    );

    event InstructorCertified(address indexed instructor);
    event InstructorDecertified(address indexed instructor);

    event CategoryCreated(uint256 indexed categoryId, string name);
    event CategoryUpdated(uint256 indexed categoryId, string name);

    // ============ Constructor ============

    constructor(address payable _ydTokenAddress) Ownable(msg.sender) {
        ydToken = YDToken(_ydTokenAddress);
    }

    // ============ Modifiers ============

    modifier onlyCertifiedInstructor() {
        if (requireCertification) {
            require(
                certifiedInstructors[msg.sender],
                "Not a certified instructor"
            );
        }
        _;
    }

    modifier courseExists(uint256 _courseId) {
        require(_courseId > 0 && _courseId <= courseCounter, "Course does not exist");
        _;
    }

    // ============ Course Functions ============

    /**
     * @dev Create a new course
     */
    function createCourse(
        string memory _title,
        string memory _description,
        string memory _coverUrl,
        uint256 _priceYDT,
        uint256 _categoryId
    ) external onlyCertifiedInstructor returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_priceYDT > 0, "Price must be greater than 0");
        require(
            _categoryId == 0 || (_categoryId <= categoryCounter && categories[_categoryId].isActive),
            "Invalid category"
        );

        courseCounter++;
        uint256 newCourseId = courseCounter;

        courses[newCourseId] = CourseInfo({
            id: newCourseId,
            title: _title,
            description: _description,
            coverUrl: _coverUrl,
            priceYDT: _priceYDT,
            instructor: msg.sender,
            isActive: true,
            createdAt: block.timestamp,
            totalStudents: 0,
            categoryId: _categoryId,
            totalRating: 0,
            ratingCount: 0
        });

        instructorCourses[msg.sender].push(newCourseId);

        emit CourseCreated(newCourseId, _title, msg.sender, _priceYDT, _categoryId);

        return newCourseId;
    }

    /**
     * @dev Purchase a course (pay with YDT)
     */
    function purchaseCourse(
        uint256 _courseId,
        address _referrer
    ) external nonReentrant courseExists(_courseId) {
        CourseInfo storage course = courses[_courseId];

        require(course.isActive, "Course is not active");
        require(!hasPurchased[_courseId][msg.sender], "Already purchased");
        require(
            course.instructor != msg.sender,
            "Instructor cannot buy own course"
        );
        require(_referrer != msg.sender, "Cannot refer yourself");

        // Check if user has active subscription
        if (subscriptions[msg.sender].isActive &&
            subscriptions[msg.sender].endTime > block.timestamp) {
            // Free access with subscription
            _recordPurchase(_courseId, 0, address(0));
            return;
        }

        uint256 price = course.priceYDT;

        // Calculate platform fee and instructor payment
        uint256 platformFee = (price * platformFeePercent) / 100;
        uint256 referralReward = 0;

        // Calculate referral reward if referrer is valid
        if (_referrer != address(0) && hasPurchased[_courseId][_referrer]) {
            referralReward = (price * referralRewardPercent) / 100;
        }

        uint256 instructorPayment = price - platformFee - referralReward;

        // Transfer YDT: Student -> Instructor
        require(
            ydToken.transferFrom(msg.sender, course.instructor, instructorPayment),
            "Payment to instructor failed"
        );

        // Transfer platform fee to contract owner
        require(
            ydToken.transferFrom(msg.sender, owner(), platformFee),
            "Platform fee transfer failed"
        );

        // Transfer referral reward
        if (referralReward > 0) {
            require(
                ydToken.transferFrom(msg.sender, _referrer, referralReward),
                "Referral reward transfer failed"
            );
            referralRewards[_referrer] += referralReward;
            emit ReferralRewardPaid(_referrer, msg.sender, referralReward);
        }

        _recordPurchase(_courseId, price, _referrer);
    }

    /**
     * @dev Purchase multiple courses with bulk discount
     */
    function purchaseCoursesBulk(
        uint256[] memory _courseIds,
        address _referrer
    ) external nonReentrant {
        require(_courseIds.length >= bulkDiscountThreshold, "Not enough courses for bulk discount");

        uint256 totalPrice = 0;
        for (uint256 i = 0; i < _courseIds.length; i++) {
            uint256 courseId = _courseIds[i];
            require(courseId > 0 && courseId <= courseCounter, "Course does not exist");
            CourseInfo storage course = courses[courseId];
            require(course.isActive, "Course is not active");
            require(!hasPurchased[courseId][msg.sender], "Already purchased");
            require(course.instructor != msg.sender, "Instructor cannot buy own course");
            totalPrice += course.priceYDT;
        }

        // Apply bulk discount
        uint256 discount = (totalPrice * bulkDiscountPercent) / 100;
        uint256 finalPrice = totalPrice - discount;

        // Calculate fees
        uint256 platformFee = (finalPrice * platformFeePercent) / 100;
        uint256 referralReward = 0;
        if (_referrer != address(0)) {
            referralReward = (finalPrice * referralRewardPercent) / 100;
        }

        // Transfer platform fee
        require(
            ydToken.transferFrom(msg.sender, owner(), platformFee),
            "Platform fee transfer failed"
        );

        // Transfer referral reward
        if (referralReward > 0) {
            require(
                ydToken.transferFrom(msg.sender, _referrer, referralReward),
                "Referral reward transfer failed"
            );
            referralRewards[_referrer] += referralReward;
            emit ReferralRewardPaid(_referrer, msg.sender, referralReward);
        }

        uint256 remainingPayment = finalPrice - platformFee - referralReward;

        // Pay each instructor proportionally
        for (uint256 i = 0; i < _courseIds.length; i++) {
            uint256 courseId = _courseIds[i];
            CourseInfo storage course = courses[courseId];

            uint256 courseShare = (course.priceYDT * remainingPayment) / totalPrice;
            require(
                ydToken.transferFrom(msg.sender, course.instructor, courseShare),
                "Payment to instructor failed"
            );

            _recordPurchase(courseId, course.priceYDT - ((course.priceYDT * bulkDiscountPercent) / 100), _referrer);
        }
    }

    function _recordPurchase(uint256 _courseId, uint256 _pricePaid, address _referrer) internal {
        CourseInfo storage course = courses[_courseId];

        hasPurchased[_courseId][msg.sender] = true;
        studentCourses[msg.sender].push(_courseId);
        course.totalStudents++;

        purchaseRecords[_courseId][msg.sender] = PurchaseRecord({
            courseId: _courseId,
            purchaseTime: block.timestamp,
            pricePaid: _pricePaid,
            refunded: false,
            referrer: _referrer
        });

        emit CoursePurchased(_courseId, msg.sender, _pricePaid, block.timestamp, _referrer);
    }

    /**
     * @dev Request refund for a course (within refund period)
     */
    function requestRefund(uint256 _courseId) external nonReentrant courseExists(_courseId) {
        require(hasPurchased[_courseId][msg.sender], "Not purchased");

        PurchaseRecord storage record = purchaseRecords[_courseId][msg.sender];
        require(!record.refunded, "Already refunded");
        require(
            block.timestamp <= record.purchaseTime + refundPeriod,
            "Refund period expired"
        );
        require(record.pricePaid > 0, "Subscription purchase cannot be refunded");

        CourseInfo storage course = courses[_courseId];

        // Mark as refunded
        record.refunded = true;
        hasPurchased[_courseId][msg.sender] = false;
        course.totalStudents--;

        // Refund from instructor (they keep the platform fee as penalty)
        uint256 refundAmount = record.pricePaid - ((record.pricePaid * platformFeePercent) / 100);
        require(
            ydToken.transferFrom(course.instructor, msg.sender, refundAmount),
            "Refund failed"
        );

        emit RefundIssued(_courseId, msg.sender, refundAmount);
    }

    // ============ Rating Functions ============

    /**
     * @dev Rate a course (only purchased students)
     */
    function rateCourse(
        uint256 _courseId,
        uint8 _score,
        string memory _comment
    ) external courseExists(_courseId) {
        require(hasPurchased[_courseId][msg.sender], "Must purchase to rate");
        require(_score >= 1 && _score <= 5, "Score must be 1-5");
        require(courseRatings[_courseId][msg.sender].score == 0, "Already rated");

        CourseInfo storage course = courses[_courseId];

        courseRatings[_courseId][msg.sender] = Rating({
            score: _score,
            comment: _comment,
            timestamp: block.timestamp
        });

        course.totalRating += _score;
        course.ratingCount++;

        emit CourseRated(_courseId, msg.sender, _score, _comment);
    }

    /**
     * @dev Get average rating for a course
     */
    function getCourseAverageRating(
        uint256 _courseId
    ) external view courseExists(_courseId) returns (uint256 average, uint256 count) {
        CourseInfo storage course = courses[_courseId];
        if (course.ratingCount == 0) {
            return (0, 0);
        }
        return ((course.totalRating * 100) / course.ratingCount, course.ratingCount);
    }

    // ============ Subscription Functions ============

    /**
     * @dev Purchase monthly subscription
     */
    function purchaseMonthlySubscription() external nonReentrant {
        require(
            ydToken.transferFrom(msg.sender, owner(), monthlySubscriptionPrice),
            "Payment failed"
        );

        uint256 endTime = block.timestamp + 30 days;
        if (subscriptions[msg.sender].isActive &&
            subscriptions[msg.sender].endTime > block.timestamp) {
            endTime = subscriptions[msg.sender].endTime + 30 days;
        }

        subscriptions[msg.sender] = Subscription({
            startTime: block.timestamp,
            endTime: endTime,
            isActive: true
        });

        emit SubscriptionPurchased(msg.sender, 30 days, endTime);
    }

    /**
     * @dev Purchase yearly subscription
     */
    function purchaseYearlySubscription() external nonReentrant {
        require(
            ydToken.transferFrom(msg.sender, owner(), yearlySubscriptionPrice),
            "Payment failed"
        );

        uint256 endTime = block.timestamp + 365 days;
        if (subscriptions[msg.sender].isActive &&
            subscriptions[msg.sender].endTime > block.timestamp) {
            endTime = subscriptions[msg.sender].endTime + 365 days;
        }

        subscriptions[msg.sender] = Subscription({
            startTime: block.timestamp,
            endTime: endTime,
            isActive: true
        });

        emit SubscriptionPurchased(msg.sender, 365 days, endTime);
    }

    /**
     * @dev Check if user has active subscription
     */
    function hasActiveSubscription(address _user) external view returns (bool) {
        return subscriptions[_user].isActive &&
               subscriptions[_user].endTime > block.timestamp;
    }

    // ============ Category Functions ============

    /**
     * @dev Create a new category (only owner)
     */
    function createCategory(string memory _name) external onlyOwner returns (uint256) {
        require(bytes(_name).length > 0, "Name cannot be empty");

        categoryCounter++;
        categories[categoryCounter] = Category({
            id: categoryCounter,
            name: _name,
            isActive: true
        });

        emit CategoryCreated(categoryCounter, _name);
        return categoryCounter;
    }

    /**
     * @dev Update category (only owner)
     */
    function updateCategory(uint256 _categoryId, string memory _name, bool _isActive) external onlyOwner {
        require(_categoryId > 0 && _categoryId <= categoryCounter, "Category does not exist");
        categories[_categoryId].name = _name;
        categories[_categoryId].isActive = _isActive;
        emit CategoryUpdated(_categoryId, _name);
    }

    /**
     * @dev Get courses by category
     */
    function getCoursesByCategory(
        uint256 _categoryId,
        uint256 _offset,
        uint256 _limit
    ) external view returns (CourseInfo[] memory) {
        uint256 matchCount = 0;

        for (uint256 i = 1; i <= courseCounter; i++) {
            if (courses[i].isActive && courses[i].categoryId == _categoryId) {
                matchCount++;
            }
        }

        if (_offset >= matchCount) {
            return new CourseInfo[](0);
        }

        uint256 resultCount = _limit;
        if (_offset + _limit > matchCount) {
            resultCount = matchCount - _offset;
        }

        CourseInfo[] memory result = new CourseInfo[](resultCount);
        uint256 currentIndex = 0;
        uint256 skipped = 0;

        for (uint256 i = 1; i <= courseCounter && currentIndex < resultCount; i++) {
            if (courses[i].isActive && courses[i].categoryId == _categoryId) {
                if (skipped >= _offset) {
                    result[currentIndex] = courses[i];
                    currentIndex++;
                } else {
                    skipped++;
                }
            }
        }

        return result;
    }

    // ============ Instructor Certification Functions ============

    /**
     * @dev Certify an instructor (only owner)
     */
    function certifyInstructor(address _instructor) external onlyOwner {
        certifiedInstructors[_instructor] = true;
        emit InstructorCertified(_instructor);
    }

    /**
     * @dev Remove instructor certification (only owner)
     */
    function decertifyInstructor(address _instructor) external onlyOwner {
        certifiedInstructors[_instructor] = false;
        emit InstructorDecertified(_instructor);
    }

    /**
     * @dev Set whether certification is required
     */
    function setRequireCertification(bool _required) external onlyOwner {
        requireCertification = _required;
    }

    // ============ Course Management Functions ============

    /**
     * @dev Update course information (only instructor can operate)
     */
    function updateCourse(
        uint256 _courseId,
        string memory _title,
        string memory _description,
        string memory _coverUrl,
        uint256 _priceYDT,
        uint256 _categoryId
    ) external courseExists(_courseId) {
        CourseInfo storage course = courses[_courseId];
        require(course.instructor == msg.sender, "Only instructor can update");
        require(course.isActive, "Course is not active");

        course.title = _title;
        course.description = _description;
        course.coverUrl = _coverUrl;
        course.priceYDT = _priceYDT;
        course.categoryId = _categoryId;

        emit CourseUpdated(_courseId, _title, _priceYDT);
    }

    /**
     * @dev Deactivate course (only instructor or owner can operate)
     */
    function deactivateCourse(uint256 _courseId) external courseExists(_courseId) {
        CourseInfo storage course = courses[_courseId];
        require(
            course.instructor == msg.sender || msg.sender == owner(),
            "Not authorized"
        );

        course.isActive = false;
        emit CourseDeactivated(_courseId);
    }

    // ============ View Functions ============

    /**
     * @dev Check if user has purchased a course
     */
    function hasUserPurchased(
        uint256 _courseId,
        address _user
    ) external view returns (bool) {
        return hasPurchased[_courseId][_user];
    }

    /**
     * @dev Get all courses purchased by a student
     */
    function getStudentCourses(
        address _student
    ) external view returns (uint256[] memory) {
        return studentCourses[_student];
    }

    /**
     * @dev Get all courses created by an instructor
     */
    function getInstructorCourses(
        address _instructor
    ) external view returns (uint256[] memory) {
        return instructorCourses[_instructor];
    }

    /**
     * @dev Get course details
     */
    function getCourse(
        uint256 _courseId
    ) external view returns (CourseInfo memory) {
        return courses[_courseId];
    }

    /**
     * @dev Get all active courses (paginated)
     */
    function getActiveCourses(
        uint256 _offset,
        uint256 _limit
    ) external view returns (CourseInfo[] memory) {
        uint256 activeCount = 0;

        for (uint256 i = 1; i <= courseCounter; i++) {
            if (courses[i].isActive) {
                activeCount++;
            }
        }

        uint256 resultCount = _limit;
        if (_offset >= activeCount) {
            return new CourseInfo[](0);
        }
        if (_offset + _limit > activeCount) {
            resultCount = activeCount - _offset;
        }

        CourseInfo[] memory activeCourses = new CourseInfo[](resultCount);
        uint256 currentIndex = 0;
        uint256 skipped = 0;

        for (uint256 i = 1; i <= courseCounter && currentIndex < resultCount; i++) {
            if (courses[i].isActive) {
                if (skipped >= _offset) {
                    activeCourses[currentIndex] = courses[i];
                    currentIndex++;
                } else {
                    skipped++;
                }
            }
        }

        return activeCourses;
    }

    /**
     * @dev Get purchase record
     */
    function getPurchaseRecord(
        uint256 _courseId,
        address _student
    ) external view returns (PurchaseRecord memory) {
        return purchaseRecords[_courseId][_student];
    }

    /**
     * @dev Get user rating for a course
     */
    function getUserRating(
        uint256 _courseId,
        address _user
    ) external view returns (Rating memory) {
        return courseRatings[_courseId][_user];
    }

    // ============ Admin Functions ============

    /**
     * @dev Set platform fee percentage (only owner)
     */
    function setPlatformFee(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= 20, "Fee cannot exceed 20%");
        platformFeePercent = _feePercent;
    }

    /**
     * @dev Set refund period (only owner)
     */
    function setRefundPeriod(uint256 _period) external onlyOwner {
        refundPeriod = _period;
    }

    /**
     * @dev Set referral reward percentage (only owner)
     */
    function setReferralRewardPercent(uint256 _percent) external onlyOwner {
        require(_percent <= 20, "Reward cannot exceed 20%");
        referralRewardPercent = _percent;
    }

    /**
     * @dev Set subscription prices (only owner)
     */
    function setSubscriptionPrices(
        uint256 _monthlyPrice,
        uint256 _yearlyPrice
    ) external onlyOwner {
        monthlySubscriptionPrice = _monthlyPrice;
        yearlySubscriptionPrice = _yearlyPrice;
    }

    /**
     * @dev Set bulk discount settings (only owner)
     */
    function setBulkDiscountSettings(
        uint256 _threshold,
        uint256 _discountPercent
    ) external onlyOwner {
        require(_discountPercent <= 50, "Discount cannot exceed 50%");
        bulkDiscountThreshold = _threshold;
        bulkDiscountPercent = _discountPercent;
    }
}
