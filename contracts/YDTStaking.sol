// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title YDTStaking
 * @dev YDT代币质押合约，用户可以质押YDT获取收益
 */
contract YDTStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable ydtToken;

    // 年化收益率 (基点，10000 = 100%)
    uint256 public annualRewardRate = 1000; // 默认10%年化

    // 最小质押时间（秒）
    uint256 public minStakeDuration = 7 days;

    // 最小质押数量
    uint256 public minStakeAmount = 100 * 10**18; // 100 YDT

    // 最大质押数量（每个用户）
    uint256 public maxStakeAmount = 1000000 * 10**18; // 1,000,000 YDT

    // 奖励池余额
    uint256 public rewardPool;

    // 总质押量
    uint256 public totalStaked;

    struct StakeInfo {
        uint256 amount;         // 质押数量
        uint256 startTime;      // 质押开始时间
        uint256 lastClaimTime;  // 上次领取奖励时间
        uint256 pendingRewards; // 待领取奖励
    }

    mapping(address => StakeInfo) public stakes;

    // 事件
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount, uint256 rewards);
    event RewardsClaimed(address indexed user, uint256 rewards);
    event RewardPoolFunded(uint256 amount);
    event RewardRateUpdated(uint256 newRate);
    event MinStakeDurationUpdated(uint256 newDuration);
    event MinStakeAmountUpdated(uint256 newAmount);
    event MaxStakeAmountUpdated(uint256 newAmount);

    constructor(address _ydtToken) Ownable(msg.sender) {
        require(_ydtToken != address(0), "Invalid token address");
        ydtToken = IERC20(_ydtToken);
    }

    /**
     * @dev 质押YDT代币
     * @param amount 质押数量
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount >= minStakeAmount, "Below minimum stake amount");

        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.amount + amount <= maxStakeAmount, "Exceeds maximum stake amount");

        // 如果已有质押，先结算之前的奖励
        if (userStake.amount > 0) {
            uint256 pendingReward = calculateRewards(msg.sender);
            userStake.pendingRewards += pendingReward;
        }

        // 转移代币到合约
        ydtToken.safeTransferFrom(msg.sender, address(this), amount);

        // 更新质押信息
        userStake.amount += amount;
        if (userStake.startTime == 0) {
            userStake.startTime = block.timestamp;
        }
        userStake.lastClaimTime = block.timestamp;

        totalStaked += amount;

        emit Staked(msg.sender, amount);
    }

    /**
     * @dev 解除质押并领取奖励
     * @param amount 解除质押数量
     */
    function unstake(uint256 amount) external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.amount >= amount, "Insufficient staked amount");
        require(
            block.timestamp >= userStake.startTime + minStakeDuration,
            "Minimum stake duration not met"
        );

        // 计算并发放奖励
        uint256 rewards = calculateRewards(msg.sender) + userStake.pendingRewards;
        userStake.pendingRewards = 0;

        // 检查奖励池是否足够
        uint256 actualRewards = rewards;
        if (rewards > rewardPool) {
            actualRewards = rewardPool;
        }

        if (actualRewards > 0) {
            rewardPool -= actualRewards;
        }

        // 更新质押信息
        userStake.amount -= amount;
        userStake.lastClaimTime = block.timestamp;

        if (userStake.amount == 0) {
            userStake.startTime = 0;
        }

        totalStaked -= amount;

        // 转移代币和奖励
        ydtToken.safeTransfer(msg.sender, amount + actualRewards);

        emit Unstaked(msg.sender, amount, actualRewards);
    }

    /**
     * @dev 仅领取奖励（不解除质押）
     */
    function claimRewards() external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No stake found");

        uint256 rewards = calculateRewards(msg.sender) + userStake.pendingRewards;
        require(rewards > 0, "No rewards to claim");

        // 检查奖励池是否足够
        uint256 actualRewards = rewards;
        if (rewards > rewardPool) {
            actualRewards = rewardPool;
        }

        require(actualRewards > 0, "Reward pool is empty");

        rewardPool -= actualRewards;
        userStake.pendingRewards = rewards - actualRewards; // 保存未能发放的奖励
        userStake.lastClaimTime = block.timestamp;

        ydtToken.safeTransfer(msg.sender, actualRewards);

        emit RewardsClaimed(msg.sender, actualRewards);
    }

    /**
     * @dev 计算用户待领取的奖励
     * @param user 用户地址
     */
    function calculateRewards(address user) public view returns (uint256) {
        StakeInfo memory userStake = stakes[user];
        if (userStake.amount == 0) {
            return 0;
        }

        uint256 stakeDuration = block.timestamp - userStake.lastClaimTime;
        // 奖励 = 质押数量 * 年化利率 * 质押时间 / (365天 * 10000基点)
        uint256 rewards = (userStake.amount * annualRewardRate * stakeDuration) / (365 days * 10000);

        return rewards;
    }

    /**
     * @dev 获取用户总待领取奖励（包括pending）
     * @param user 用户地址
     */
    function getTotalPendingRewards(address user) external view returns (uint256) {
        return calculateRewards(user) + stakes[user].pendingRewards;
    }

    /**
     * @dev 获取用户质押信息
     * @param user 用户地址
     */
    function getStakeInfo(address user) external view returns (
        uint256 amount,
        uint256 startTime,
        uint256 stakeDuration,
        uint256 pendingRewards,
        bool canUnstake
    ) {
        StakeInfo memory userStake = stakes[user];
        amount = userStake.amount;
        startTime = userStake.startTime;
        stakeDuration = userStake.startTime > 0 ? block.timestamp - userStake.startTime : 0;
        pendingRewards = calculateRewards(user) + userStake.pendingRewards;
        canUnstake = userStake.startTime > 0 &&
                     block.timestamp >= userStake.startTime + minStakeDuration;
    }

    /**
     * @dev 获取质押统计数据
     */
    function getStakingStats() external view returns (
        uint256 _totalStaked,
        uint256 _rewardPool,
        uint256 _annualRewardRate,
        uint256 _minStakeDuration,
        uint256 _minStakeAmount,
        uint256 _maxStakeAmount
    ) {
        return (
            totalStaked,
            rewardPool,
            annualRewardRate,
            minStakeDuration,
            minStakeAmount,
            maxStakeAmount
        );
    }

    // ============ 管理员函数 ============

    /**
     * @dev 向奖励池注入资金
     * @param amount 注入数量
     */
    function fundRewardPool(uint256 amount) external onlyOwner {
        ydtToken.safeTransferFrom(msg.sender, address(this), amount);
        rewardPool += amount;
        emit RewardPoolFunded(amount);
    }

    /**
     * @dev 设置年化收益率
     * @param newRate 新的年化利率（基点）
     */
    function setAnnualRewardRate(uint256 newRate) external onlyOwner {
        require(newRate <= 5000, "Rate too high"); // 最高50%
        annualRewardRate = newRate;
        emit RewardRateUpdated(newRate);
    }

    /**
     * @dev 设置最小质押时间
     * @param newDuration 新的最小质押时间（秒）
     */
    function setMinStakeDuration(uint256 newDuration) external onlyOwner {
        require(newDuration <= 365 days, "Duration too long");
        minStakeDuration = newDuration;
        emit MinStakeDurationUpdated(newDuration);
    }

    /**
     * @dev 设置最小质押数量
     * @param newAmount 新的最小质押数量
     */
    function setMinStakeAmount(uint256 newAmount) external onlyOwner {
        minStakeAmount = newAmount;
        emit MinStakeAmountUpdated(newAmount);
    }

    /**
     * @dev 设置最大质押数量
     * @param newAmount 新的最大质押数量
     */
    function setMaxStakeAmount(uint256 newAmount) external onlyOwner {
        maxStakeAmount = newAmount;
        emit MaxStakeAmountUpdated(newAmount);
    }

    /**
     * @dev 紧急提取奖励池（仅限紧急情况）
     */
    function emergencyWithdrawRewardPool() external onlyOwner {
        uint256 amount = rewardPool;
        rewardPool = 0;
        ydtToken.safeTransfer(owner(), amount);
    }
}
