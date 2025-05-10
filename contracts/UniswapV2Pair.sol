// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

contract UniswapV2Pair {
    address public token0; // KSM
    address public token1; // USDT
    uint112 private reserve0;
    uint112 private reserve1;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    uint256 private constant MINIMUM_LIQUIDITY = 10**3;

    event Mint(address indexed sender, uint256 amount0, uint256 amount1);

    constructor(address _token0, address _token1) {
        token0 = _token0;
        token1 = _token1;
    }

    function getReserves() public view returns (uint112 _reserve0, uint112 _reserve1) {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
    }

    function mint(address to) public returns (uint256 liquidity) {
        (uint112 _reserve0, uint112 _reserve1) = getReserves();
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));
        uint256 amount0 = balance0 - _reserve0;
        uint256 amount1 = balance1 - _reserve1;

        if (totalSupply == 0) {
            uint256 product = amount0 * amount1;
            uint256 z = product;
            if (product > 3) {
                uint256 x = product / 2 + 1;
                while (x < z) {
                    z = x;
                    x = (product / x + x) / 2;
                }
            } else if (product != 0) {
                z = 1;
            }
            liquidity = z - MINIMUM_LIQUIDITY;
            balanceOf[address(0)] = MINIMUM_LIQUIDITY;
        } else {
            uint256 liquidity0 = (amount0 * totalSupply) / _reserve0;
            uint256 liquidity1 = (amount1 * totalSupply) / _reserve1;
            liquidity = liquidity0 < liquidity1 ? liquidity0 : liquidity1;
        }
        require(liquidity > 0, "INSUFFICIENT_LIQUIDITY");
        balanceOf[to] += liquidity;
        totalSupply += liquidity;

        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);
        emit Mint(msg.sender, amount0, amount1);
    }
    event Swap(
    address indexed sender,
    uint256 amount0In,
    uint256 amount1In,
    uint256 amount0Out,
    uint256 amount1Out,
    address indexed to
);

function swap(uint256 amount0Out, uint256 amount1Out, address to) public {
    require(amount0Out > 0 || amount1Out > 0, "INSUFFICIENT_OUTPUT_AMOUNT");
    (uint112 _reserve0, uint112 _reserve1) = getReserves();
    require(amount0Out < _reserve0 && amount1Out < _reserve1, "INSUFFICIENT_LIQUIDITY");

    require(to != token0 && to != token1, "INVALID_TO");
    if (amount0Out > 0) {
        (bool success,) = token0.call(abi.encodeWithSelector(IERC20.transfer.selector, to, amount0Out));
        require(success, "TRANSFER_FAILED_TOKEN0");
    }
    if (amount1Out > 0) {
        (bool success,) = token1.call(abi.encodeWithSelector(IERC20.transfer.selector, to, amount1Out));
        require(success, "TRANSFER_FAILED_TOKEN1");
    }

    uint256 balance0 = IERC20(token0).balanceOf(address(this));
    uint256 balance1 = IERC20(token1).balanceOf(address(this));
    uint256 amount0In = balance0 > _reserve0 - amount0Out ? balance0 - (_reserve0 - amount0Out) : 0;
    uint256 amount1In = balance1 > _reserve1 - amount1Out ? balance1 - (_reserve1 - amount1Out) : 0;
    require(amount0In > 0 || amount1In > 0, "INSUFFICIENT_INPUT_AMOUNT");

    require(
        (balance0 * 1000) * (balance1 * 1000) >= uint256(_reserve0) * uint256(_reserve1) * (1000**2),
        "K"
    );

    reserve0 = uint112(balance0);
    reserve1 = uint112(balance1);
    emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
}
}