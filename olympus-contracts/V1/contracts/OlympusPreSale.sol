// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.7.5;


import "hardhat/console.sol";

/**
 * @dev Extension of {ERC20} that allows token holders to destroy both their own
 * tokens and those that they have an allowance for, in a way that can be
 * recognized off-chain (via event analysis).
 */
interface IERC20Mintable {

  function mint( uint256 amount_ ) external;

  function mint( address account_, uint256 ammount_ ) external;
}


/**
 * @dev Extension of {ERC20} that allows token holders to destroy both their own
 * tokens and those that they have an allowance for, in a way that can be
 * recognized off-chain (via event analysis).
 */
interface IERC20Burnable {

  function burn(uint256 amount) external;

  function burnFrom( address account_, uint256 ammount_ ) external;
}

contract Ownable is IOwnable {
    address internal _owner;
    address internal _newOwner;

    event OwnershipPushed(
        address indexed previousOwner,
        address indexed newOwner
    );
    event OwnershipPulled(
        address indexed previousOwner,
        address indexed newOwner
    );

    constructor() {
        _owner = msg.sender;
        emit OwnershipPushed(address(0), _owner);
    }

    function policy() public view override returns (address) {
        return _owner;
    }

    modifier onlyPolicy() {
        require(_owner == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    function renounceManagement() public virtual override onlyPolicy {
        emit OwnershipPushed(_owner, address(0));
        _owner = address(0);
    }

    function pushManagement(address newOwner_)
        public
        virtual
        override
        onlyPolicy
    {
        require(
            newOwner_ != address(0),
            "Ownable: new owner is the zero address"
        );
        emit OwnershipPushed(_owner, newOwner_);
        _newOwner = newOwner_;
    }

    function pullManagement() public virtual override {
        require(msg.sender == _newOwner, "Ownable: must be new owner to pull");
        emit OwnershipPulled(_owner, _newOwner);
        _owner = _newOwner;
    }
}

library SafeERC20 {
    using SafeMath for uint256;
    using Address for address;

    function safeTransfer(
        IERC20 token,
        address to,
        uint256 value
    ) internal {
        _callOptionalReturn(
            token,
            abi.encodeWithSelector(token.transfer.selector, to, value)
        );
    }

    function safeTransferFrom(
        IERC20 token,
        address from,
        address to,
        uint256 value
    ) internal {
        _callOptionalReturn(
            token,
            abi.encodeWithSelector(token.transferFrom.selector, from, to, value)
        );
    }

    function safeApprove(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        require(
            (value == 0) || (token.allowance(address(this), spender) == 0),
            "SafeERC20: approve from non-zero to non-zero allowance"
        );
        _callOptionalReturn(
            token,
            abi.encodeWithSelector(token.approve.selector, spender, value)
        );
    }

    function safeIncreaseAllowance(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        uint256 newAllowance = token.allowance(address(this), spender).add(
            value
        );
        _callOptionalReturn(
            token,
            abi.encodeWithSelector(
                token.approve.selector,
                spender,
                newAllowance
            )
        );
    }

    function safeDecreaseAllowance(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        uint256 newAllowance = token.allowance(address(this), spender).sub(
            value,
            "SafeERC20: decreased allowance below zero"
        );
        _callOptionalReturn(
            token,
            abi.encodeWithSelector(
                token.approve.selector,
                spender,
                newAllowance
            )
        );
    }

    function _callOptionalReturn(IERC20 token, bytes memory data) private {
        bytes memory returndata = address(token).functionCall(
            data,
            "SafeERC20: low-level call failed"
        );
        if (returndata.length > 0) {
            // Return data is optional
            // solhint-disable-next-line max-line-length
            require(
                abi.decode(returndata, (bool)),
                "SafeERC20: ERC20 operation did not succeed"
            );
        }
    }
}

library FullMath {
    function fullMul(uint256 x, uint256 y)
        private
        pure
        returns (uint256 l, uint256 h)
    {
        uint256 mm = mulmod(x, y, uint256(-1));
        l = x * y;
        h = mm - l;
        if (mm < l) h -= 1;
    }

    function fullDiv(
        uint256 l,
        uint256 h,
        uint256 d
    ) private pure returns (uint256) {
        uint256 pow2 = d & -d;
        d /= pow2;
        l /= pow2;
        l += h * ((-pow2) / pow2 + 1);
        uint256 r = 1;
        r *= 2 - d * r;
        r *= 2 - d * r;
        r *= 2 - d * r;
        r *= 2 - d * r;
        r *= 2 - d * r;
        r *= 2 - d * r;
        r *= 2 - d * r;
        r *= 2 - d * r;
        return l * r;
    }

    function mulDiv(
        uint256 x,
        uint256 y,
        uint256 d
    ) internal pure returns (uint256) {
        (uint256 l, uint256 h) = fullMul(x, y);
        uint256 mm = mulmod(x, y, d);
        if (mm > l) h -= 1;
        l -= mm;
        require(h < d, "FullMath::mulDiv: overflow");
        return fullDiv(l, h, d);
    }
}


/**
 * 预售合约，gitup中没有开源，是从浏览器拷贝出来的
 */
contract OHMPreSale is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address public aOHM;
    address public DAI;
    address public addressToSendDai;

    uint256 public salePrice;
    uint256 public totalWhiteListed;
    uint256 public endOfSale;

    bool public saleStarted;

    mapping(address => bool) boughtOHM;
    mapping(address => bool) whiteListed;

    function whiteListBuyers(address[] memory _buyers)
        external
        onlyOwner()
        returns (bool)
    {
        require(saleStarted == false, "Already initialized");

        totalWhiteListed = totalWhiteListed.add(_buyers.length);

        for (uint256 i; i < _buyers.length; i++) {
            whiteListed[_buyers[i]] = true;
        }

        return true;
    }

    function initialize(
        address _addressToSendDai,
        address _dai,
        address _aOHM,
        uint256 _salePrice,
        uint256 _saleLength
    ) external onlyOwner() returns (bool) {
        require(saleStarted == false, "Already initialized");

        aOHM = _aOHM;
        DAI = _dai;

        salePrice = _salePrice;

        endOfSale = _saleLength.add(block.timestamp);

        saleStarted = true;

        addressToSendDai = _addressToSendDai;

        return true;
    }

    function getAllotmentPerBuyer() public view returns (uint256) {
        return IERC20(aOHM).balanceOf(address(this)).div(totalWhiteListed);
    }

    function purchaseaOHM(uint256 _amountDAI) external returns (bool) {
        require(saleStarted == true, "Not started");
        require(whiteListed[msg.sender] == true, "Not whitelisted");
        require(boughtOHM[msg.sender] == false, "Already participated");
        require(block.timestamp < endOfSale, "Sale over");

        boughtOHM[msg.sender] = true;

        uint256 _purchaseAmount = _calculateSaleQuote(_amountDAI);

        require(_purchaseAmount <= getAllotmentPerBuyer(), "More than alloted");
        totalWhiteListed = totalWhiteListed.sub(1);

        IERC20(DAI).safeTransferFrom(msg.sender, addressToSendDai, _amountDAI);
        IERC20(aOHM).safeTransfer(msg.sender, _purchaseAmount);

        return true;
    }

    function sendRemainingaOHM(address _sendaOHMTo)
        external
        onlyOwner()
        returns (bool)
    {
        require(saleStarted == true, "Not started");
        require(block.timestamp >= endOfSale, "Not ended");

        IERC20(aOHM).safeTransfer(
            _sendaOHMTo,
            IERC20(aOHM).balanceOf(address(this))
        );

        return true;
    }

    function _calculateSaleQuote(uint256 paymentAmount_)
        internal
        view
        returns (uint256)
    {
        return uint256(1e9).mul(paymentAmount_).div(salePrice);
    }

    function calculateSaleQuote(uint256 paymentAmount_)
        external
        view
        returns (uint256)
    {
        return _calculateSaleQuote(paymentAmount_);
    }
}