const sdk = require("@defillama/sdk");
const BigNumber = require("bignumber.js");
const token0 = require('./abis/token0.json')
const {getPoolTokens, getPoolId} = require('./abis/balancer.json')
const getPricePerShare = require('./abis/getPricePerShare.json')
const {requery} = require('./requery')
const creamAbi = require('./abis/cream.json')
const { request, gql } = require("graphql-request");

const crvPools = {
    '0x6c3f90f043a72fa612cbac8115ee7e52bde6e490': {
        swapContract: '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7',
        underlyingTokens: ['0xdac17f958d2ee523a2206206994597c13d831ec7', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', '0x6b175474e89094c44da98b954eedeac495271d0f'],
    },
    '0x194ebd173f6cdace046c53eacce9b953f28411d1': {
        swapContract: '0x0Ce6a5fF5217e38315f87032CF90686C96627CAA',
        underlyingTokens: ['0xdb25f211ab05b1c97d595516f45794528a807ad8', '0xd71ecff9342a5ced620049e616c5035f1db98620'],
    },
    '0x075b1bb99792c9e1041ba13afef80c91a1e70fb3': {
        swapContract: '0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714',
        underlyingTokens: ['0xeb4c2781e4eba804ce9a9803c67d0893436bb27d', '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', '0xfe18be6b3bd88a2d2a7f928d00292e7a9963cfc6'],
    },
    // Nerve
    '0xf2511b5e4fb0e5e2d123004b672ba14850478c14': {
        swapContract: '0x1B3771a66ee31180906972580adE9b81AFc5fCDc',
        underlyingTokens: ['0xe9e7cea3dedca5984780bafc599bd69add087d56', '0x55d398326f99059ff775485246999027b3197955', '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d'],
    },
    // DOP-LP BSC
    '0x9116f04092828390799514bac9986529d70c3791': {
        swapContract: '0x5162f992EDF7101637446ecCcD5943A9dcC63A8A',
        underlyingTokens: [
            '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
            '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
            '0x55d398326f99059fF775485246999027B3197955',
            '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'
        ],
    },
    // DOP-2P-LP BSC
    '0x124166103814e5a033869c88e0f40c61700fca17': {
        swapContract: '0x449256e20ac3ed7F9AE81c2583068f7508d15c02',
        underlyingTokens: [
            '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
            '0x55d398326f99059fF775485246999027B3197955'
        ],
    },
    // DOP-UST-LP BSC
    '0x7edcdc8cd062948ce9a9bc38c477e6aa244dd545': {
        swapContract: '0x830e287ac5947B1C0DA865dfB3Afd7CdF7900464',
        underlyingTokens: [
            '0x23396cF899Ca06c4472205fC903bDB4de249D6fC',
            '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
            '0x55d398326f99059fF775485246999027B3197955'
        ],
    },
    // DOP-3P-LP BSC
    '0xaa5509ce0ecea324bff504a46fc61eb75cb68b0c': {
        swapContract: '0x61f864a7dFE66Cc818a4Fd0baabe845323D70454',
        underlyingTokens: [
            '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
            '0x55d398326f99059fF775485246999027B3197955',
            '0xfF54da7CAF3BC3D34664891fC8f3c9B6DeA6c7A5'
        ],
    },
    // 3P-QLP BSC
    '0xb0f0983b32352a1cfaec143731ddd8a5f6e78b1f': {
        swapContract: '0x3ED4b2070E3DB5eF5092F504145FB8150CfFE5Ea',
        underlyingTokens: [
            '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
            '0x55d398326f99059fF775485246999027B3197955',
            '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'
        ],
    },
    // IS3USD Polygon
    "0xb4d09ff3dA7f9e9A2BA029cb0A81A989fd7B8f17": {
        swapContract: "0x837503e8A8753ae17fB8C8151B8e6f586defCb57",
        underlyingTokens: [
            "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
            "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
            "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
        ]
    },
    // am3CRV Polygon
    "0xe7a24ef0c5e95ffb0f6684b813a78f2a3ad7d171": {
      swapContract: "0x445FE580eF8d70FF569aB36e80c647af338db351",
      underlyingTokens: [
        "0x27F8D03b3a2196956ED754baDc28D73be8830A6e",
        "0x1a13F4Ca1d028320A707D99520AbFefca3998b7F",
        "0x60D55F02A771d515e077c9C2403a1ef324885CeC"
      ]
    },
    // sCRV Eth
    "0xc25a3a3b969415c80451098fa907ec722572917f": {
      swapContract: "0xA5407eAE9Ba41422680e2e00537571bcC53efBfD",
      underlyingTokens: [
        "0xdac17f958d2ee523a2206206994597c13d831ec7",
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "0x6b175474e89094c44da98b954eedeac495271d0f",
        "0x57ab1ec28d129707052df4df418d58a2d46d5f51"
      ]
    },
    // renBTC Eth
    "0x49849c98ae39fff122806c06791fa73784fb3675": {
      swapContract: "0x93054188d876f558f4a66B2EF1d97d16eDf0895B",
      underlyingTokens: [
        "0xeb4c2781e4eba804ce9a9803c67d0893436bb27d",
        "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599"
      ]
    },
    // lusd Eth
    "0xed279fdd11ca84beef15af5d39bb4d4bee23f0ca": {
      swapContract: "0xed279fdd11ca84beef15af5d39bb4d4bee23f0ca",
      underlyingTokens: [
        "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0",
        "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490"
      ]
    },
    // steCRV Eth
    "0x06325440d014e39736583c165c2963ba99faf14e": {
      swapContract: "0xdc24316b9ae028f1497c275eb9192a3ea0f67022",
      underlyingTokens: ["0xae7ab96520de3a18e5e111b5eaab095312d7fe84"]
    },
    // fraxCRV Eth
    "0xd632f22692fac7611d2aa1c0d552930d43caed3b": {
      swapContract: "0xd632f22692fac7611d2aa1c0d552930d43caed3b",
      underlyingTokens: [
        "0x853d955acef822db058eb8505911ed77f175b99e",
        "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490"
      ]
    },
    // seCRV Eth
    "0xa3d87fffce63b53e0d54faa1cc983b7eb0b74a9c": {
        swapContract: "0xc5424B857f758E906013F3555Dad202e4bdB4567",
        underlyingTokens: ["0x5e74C9036fb86BD7eCdcb084a0673EFc32eA31cb"]
    },
    // btcCRV Polygon
    "0xf8a57c1d3b9629b77b6726a042ca48990a84fb49": {
        swapContract: "0xC2d95EEF97Ec6C17551d45e77B590dc1F9117C67",
        underlyingTokens: [
          "0x5c2ed810328349100A66B82b78a1791B101C9D61",
          "0xDBf31dF14B66535aF65AaC99C32e9eA844e14501"
        ]
      },
    // tricryptoCRV v1 Polygon
    "0x8096ac61db23291252574D49f036f0f9ed8ab390": {
        swapContract: "0x751B1e21756bDbc307CBcC5085c042a0e9AaEf36",
        underlyingTokens: [
          "0x28424507fefb6f7f8e9d3860f56504e4e5f5f390",
          "0x5c2ed810328349100a66b82b78a1791b101c9d61",
          "0xe7a24ef0c5e95ffb0f6684b813a78f2a3ad7d171"
        ]
      },
    // tricryptoCRV v2 Polygon
    "0xbece5d20a8a104c54183cc316c8286e3f00ffc71": {
        swapContract: "0x92577943c7aC4accb35288aB2CC84D75feC330aF",
        underlyingTokens: [
          "0x28424507fefb6f7f8e9d3860f56504e4e5f5f390",
          "0x5c2ed810328349100a66b82b78a1791b101c9d61",
          "0xe7a24ef0c5e95ffb0f6684b813a78f2a3ad7d171"
        ]
    },
    // tricryptoCRV v3 Polygon
    "0xdad97f7713ae9437fa9249920ec8507e5fbb23d3": {
        swapContract: "0x92215849c439e1f8612b6646060b4e3e5ef822cc",
        underlyingTokens: [
        "0x28424507fefb6f7f8e9d3860f56504e4e5f5f390",
        "0x5c2ed810328349100a66b82b78a1791b101c9d61",
        "0xe7a24ef0c5e95ffb0f6684b813a78f2a3ad7d171"
        ]
    },
    // 4eur-f Polygon
    "0xad326c253a84e9805559b73a08724e11e49ca651": {
        swapContract: "0xad326c253a84e9805559b73a08724e11e49ca651",
        underlyingTokens: [
        "0xe111178a87a3bff0c8d18decba5798827539ae99",
        "0x4e3decbb3645551b8a19f0ea1678079fcb33fb4c", 
        "0x7BDF330f423Ea880FF95fC41A280fD5eCFD3D09f", 
        "0xe2aa7db6da1dae97c5f5c6914d285fbfcc32a128"
        ]
    },
    // gondolaDAIeUSDTe Avax
    "0xd7d4a4c67e9c1f5a913bc38e87e228f4b8820e8a": {
        swapContract: "0xCF97190fAAfea63523055eBd139c008cdb4468eB",
        underlyingTokens: [
        "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70",
        "0xc7198437980c041c805a1edcba50c1ce5db95118"
        ]
    },
    // gondolaYAKPool Avax
    "0x7f1e6a8730fec77f27daeecd82e1941518383a62": {
        swapContract: "0xd72Dc856868f964D37D01CeA7A7a3c1F4da4F98f",
        underlyingTokens: [
            "0xddaaad7366b455aff8e7c82940c43ceb5829b604",
            "0x59414b3089ce2af0010e7523dea7e2b35d776ec7"
        ]
    },
    // gondolaUSDCe Avax
    "0x4dc5a6308338e540aa97faab7fd2e03876075413": {
        swapContract: "0x4b941276eb39d114c89514791d073a085acba3c0",
        underlyingTokens: [
            "0xc7198437980c041c805a1edcba50c1ce5db95118",
            "0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664"
        ]
    },
    // av3CRV Avax
    "0x1337bedc9d22ecbe766df105c9623922a27963ec": {
        swapContract: "0x7f90122BF0700F9E7e1F688fe926940E8839F353",
        underlyingTokens: [
          "0x47AFa96Cdc9fAb46904A55a6ad4bf6660B53c38a",
          "0x46A51127C3ce23fb7AB1DE06226147F446e4a857",
          "0x532E6537FEA298397212F09A61e03311686f548e"
        ]
      },
    // MIM-fUSDT-USDC Fantom
    "0x2dd7c9371965472e5a5fd28fbe165007c61439e1": {
        swapContract: "0x2dd7C9371965472E5A5fD28fbE165007c61439E1",
        underlyingTokens: [
            "0x82f0B8B456c1A451378467398982d4834b6829c1",
            "0x049d68029688eAbF473097a2fC38ef61633A3C7A",
            "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75"
        ]
    },
    // Dai-Usdc Fantom
    "0x27e611fd27b276acbd5ffd632e5eaebec9761e40": {
        swapContract: "0x27E611FD27b276ACbd5Ffd632E5eAEBEC9761E40",
        underlyingTokens: [
            "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75",
            "0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E"
        ]
    },
    // gDai-gUSDC-gUSDT Fantom
    "0xd02a30d33153877bc20e5721ee53dedee0422b2f": {
        swapContract: "0x0fa949783947Bf6c1b171DB13AEACBB488845B3f",
        underlyingTokens: [
            "0x940F41F0ec9ba1A34CF001cc03347ac092F5F6B5",
            "0x07E6332dD090D287d3489245038daF987955DCFB",
            "0xe578C856933D8e1082740bf7661e379Aa2A30b26"
        ]
    },
    // tricrypto Fantom
    "0x58e57ca18b7a47112b877e31929798cd3d703b0f": {
        swapContract: "0x3a1659Ddcf2339Be3aeA159cA010979FB49155FF",
        underlyingTokens: [
            "0x74b23882a30290451A17c44f4F05243b6b58C76d",
            "0x321162Cd933E2Be498Cd2267a90534A804051b11",
            "0x049d68029688eAbF473097a2fC38ef61633A3C7A"
        ]
    },
    // btc-renbtc Fantom
    "0x5b5cfe992adac0c9d48e05854b2d91c73a003858": {
        swapContract: "0x3eF6A01A0f81D6046290f3e2A8c5b843e738E604",
        underlyingTokens: [
            "0xDBf31dF14B66535aF65AaC99C32e9eA844e14501",
            "0x321162Cd933E2Be498Cd2267a90534A804051b11"
        ]
    },
    // mim pool avax
    "0xaea2e71b631fa93683bcf256a8689dfa0e094fcd": {
        swapContract: "0xaea2e71b631fa93683bcf256a8689dfa0e094fcd",
        underlyingTokens: [
            "0xc7198437980c041c805a1edcba50c1ce5db95118",
            "0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664",
            "0x130966628846bfd36ff31a822705796e8cb8c18d",
        ]
    },
    // EURS/sEUR Eth
    "0x194ebd173f6cdace046c53eacce9b953f28411d1": {
        swapContract: "0x0ce6a5ff5217e38315f87032cf90686c96627caa",
        underlyingTokens: [
            "0xd71ecff9342a5ced620049e616c5035f1db98620",
            "0xdb25f211ab05b1c97d595516f45794528a807ad8"
        ]
    },
    // aDAI/aUSDC/aUSDT (a3CRV) Eth
    "0xfd2a8fa60abd58efe3eee34dd494cd491dc14900": {
        swapContract: "0xdebf20617708857ebe4f679508e7b7863a8a8eee",
        underlyingTokens: [
            "0x028171bca77440897b824ca71d1c56cac55b68a3",
            "0xbcca60bb61934080951369a648fb03df4f96263c",
            "0x3ed3b47dd13ec9a98b44e6204a523e766b225811"
        ]
    },
    // MIM / USDT/USDC/DAI Eth
    "0x5a6a4d54456819380173272a5e8e9b9904bdf41b": {
        swapContract: "0x5a6A4D54456819380173272A5E8E9B9904BdF41B",
        underlyingTokens: [
            "0x99D8a9C45b2ecA8864373A26D1459e3Dff1e17F3",
            "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    ],
    },
    // ETH / alETH Eth
    "0xc4c319e2d4d66cca4464c0c2b32c9bd23ebe784e": {
        swapContract: "0xC4C319E2D4d66CcA4464C0c2B32c9Bd23ebe784e",
        underlyingTokens: ["0x0100546F2cD4C9D97f798fFC9755E47865FF7Ee6"],
    },
    // LINK / sLINK Eth
    "0xcee60cfa923170e4f8204ae08b4fa6a3f5656f3a": {
        swapContract: "0xF178C0b5Bb7e7aBF4e12A4838C7b7c5bA2C623c0",
        underlyingTokens: [
            "0x514910771AF9Ca656af840dff83E8264EcF986CA",
            "0xbBC455cb4F1B9e4bFC4B73970d360c8f032EfEE6",
    ],
    },
    // 3CRV Harmony
    "0xc5cfada84e902ad92dd40194f0883ad49639b023": {
        swapContract: "0xc5cfada84e902ad92dd40194f0883ad49639b023",
        underlyingTokens: [
          "0xef977d2f931c1978db5f6747666fa1eacb0d0339",
          "0x985458e523db3d53125813ed68c274899e9dfab4",
          "0x3c2b8be99c50593081eaa2a724f0b8285f5aba8f"
        ]
    },
    // VST-FRAX Arbitrum
    "0x59bf0545fca0e5ad48e13da269facd2e8c886ba4": {
        swapContract: "0x59bf0545fca0e5ad48e13da269facd2e8c886ba4",
        underlyingTokens: [
          "0x64343594ab9b56e99087bfa6f2335db24c2d1f17",
          "0x17FC002b466eEc40DaE837Fc4bE5c67993ddBd6F",
        ]
    },
    // pBTC-sBTC Ethereum
    "0xde5331ac4b3630f94853ff322b66407e0d6331e8": {
        swapContract: "0x7F55DDe206dbAD629C080068923b36fe9D6bDBeF",
        underlyingTokens: [
          "0x5228a22e72ccC52d415EcFd199F99D0665E7733b",
          "0x075b1bb99792c9e1041ba13afef80c91a1e70fb3",
        ]
    },
    // TOKEMAKS START
    "0x9462f2b3c9beea8afc334cdb1d1382b072e494ea": {
        swapContract: "0x9462f2b3c9beea8afc334cdb1d1382b072e494ea",
        underlyingTokens: ["0x6BeA7CFEF803D1e3d5f7C0103f7ded065644e197"]
    },
    "0x50b0d9171160d6eb8aa39e090da51e7e078e81c4": {
        swapContract: "0x50b0d9171160d6eb8aa39e090da51e7e078e81c4",
        underlyingTokens: ["0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F"]
    },
    "0xcaf8703f8664731ced11f63bb0570e53ab4600a9": {
        swapContract: "0xcaf8703f8664731ced11f63bb0570e53ab4600a9",
        underlyingTokens: ["0x4104b135DBC9609Fc1A9490E61369036497660c8"]
    },
    "0x01fe650ef2f8e2982295489ae6adc1413bf6011f": {
        swapContract: "0x01fe650ef2f8e2982295489ae6adc1413bf6011f",
        underlyingTokens: ["0x9C4A4204B79dd291D6b6571C5BE8BbcD0622F050"]
    },
    "0xc250b22d15e43d95fbe27b12d98b6098f8493eac": {
        swapContract: "0xc250b22d15e43d95fbe27b12d98b6098f8493eac",
        underlyingTokens: ["0xc770EEfAd204B5180dF6a14Ee197D99d808ee52d"]
    },
    "0x0437ac6109e8a366a1f4816edf312a36952db856": {
        swapContract: "0x0437ac6109e8a366a1f4816edf312a36952db856",
        underlyingTokens: ["0x6B3595068778DD592e39A122f4f5a5cF09C90fE2"]
    },
    "0x9001a452d39a8710d27ed5c2e10431c13f5fba74": {
        swapContract: "0x9001a452d39a8710d27ed5c2e10431c13f5fba74",
        underlyingTokens: ["0xdBdb4d16EdA451D0503b854CF79D55697F90c8DF"]
    },
    "0x961226b64ad373275130234145b96d100dc0b655": {
        swapContract: "0x961226b64ad373275130234145b96d100dc0b655",
        underlyingTokens: ["0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0"]
    },
    // TOKEMAKS END

}
const yearnVaults = {
    // yvToken: underlying, eg yvYFI:YFI
    // yvYFI v2
    "0xe14d13d8b3b85af791b2aadd661cdbd5e6097db1": "0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e",
    // yvWETH v2
    "0xa258c4606ca8206d8aa700ce2143d7db854d168c": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    // yvWETH v1
    "0xa9fe4601811213c340e850ea305481aff02f5b28": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    // yvUSDT v2
    "0x7da96a3891add058ada2e826306d812c638d87a7": "0xdac17f958d2ee523a2206206994597c13d831ec7",
    // yvUSDC v2
    "0x5f18c75abdae578b483e5f43f12a39cf75b973a9": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    // yvcrvSTETH
    "0xdcd90c7f6324cfa40d7169ef80b12031770b4325": "0x06325440d014e39736583c165c2963ba99faf14e",
    // yvcrvIB
    "0x27b7b1ad7288079a66d12350c828d3c00a6f07d7": "0x5282a4ef67d9c33135340fb3289cc1711c13638c",
    // yvYFI FTM
    "0x2c850cced00ce2b14aa9d658b7cad5df659493db": "0x29b0Da86e484E1C0029B56e817912d778aC0EC69",
    // yvDAI FTM
    "0x637ec617c86d24e421328e6caea1d92114892439": "0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E",
    // yvMIM FTM
    "0x0a0b23d9786963de69cb2447dc125c49929419d8": "0x82f0b8b456c1a451378467398982d4834b6829c1",
    // yvUSDC FTM
    "0xef0210eb96c7eb36af8ed1c20306462764935607": "0x04068da6c83afcfa0e13ba15a6696662335d5b75",
    // yvWFTM FTM
    "0x0dec85e74a92c52b7f708c4b10207d9560cefaf0": "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83"
}
async function unwrapYearn(balances, yToken, block, chain = "ethereum", transformAddress=(addr)=>addr) {
    //if (yearnVaults[yToken.toLowerCase()] == undefined) { return; };
    const underlying = yearnVaults[yToken.toLowerCase()];

    let pricePerShare = await sdk.api.abi.call({
        target: yToken,
        abi: getPricePerShare[1],
        block: block,
        chain: chain
    });
    if (pricePerShare == undefined) {
        pricePerShare = await sdk.api.abi.call({
            target: yToken,
            abi: getPricePerShare[0],
            block: block,
            chain: chain
        });
    };
    sdk.util.sumSingleBalance(balances, transformAddress(underlying),
        balances[(chain == 'ethereum' ? yToken : `${chain}:${yToken}`)] * pricePerShare.output / 10 **
        (await sdk.api.erc20.decimals(underlying, chain)).output);
    delete balances[(chain == 'ethereum' ? yToken : `${chain}:${yToken}`)];
};
async function unwrapCrv(balances, crvToken, lpBalance, block, chain = "ethereum", transformAddress=(addr)=>addr, excludeTokensRaw=[]) {
    const excludeTokens = excludeTokensRaw.map(addr=>addr.toLowerCase())
    if(crvPools[crvToken.toLowerCase()] === undefined){
        return
    }
    const crvSwapContract = crvPools[crvToken.toLowerCase()].swapContract
    const underlyingTokens = crvPools[crvToken.toLowerCase()].underlyingTokens
    const crvTotalSupply = sdk.api.erc20.totalSupply({
        target: crvToken,
        block,
        chain
    })
    const underlyingSwapTokens = (await sdk.api.abi.multiCall({
        calls: underlyingTokens.map(token => ({
            target: token,
            params: [crvSwapContract]
        })),
        block,
        chain,
        abi: 'erc20:balanceOf'
    })).output

    // steth and seth case where balanceOf not applicable on ETH balance
    if (crvToken.toLowerCase() === "0x06325440d014e39736583c165c2963ba99faf14e" || crvToken.toLowerCase() === "0xa3d87fffce63b53e0d54faa1cc983b7eb0b74a9c") {
        underlyingSwapTokens[0].output = underlyingSwapTokens[0].output * 2;
    }

    const resolvedCrvTotalSupply = (await crvTotalSupply).output
    underlyingSwapTokens.forEach(call => {
        if (excludeTokens.includes(call.input.target.toLowerCase())) {
            return;
        }
        const underlyingBalance = BigNumber(call.output).times(lpBalance).div(resolvedCrvTotalSupply);
        sdk.util.sumSingleBalance(balances, transformAddress(call.input.target), underlyingBalance.toFixed(0))
    })
}

const lpReservesAbi = { "constant": true, "inputs": [], "name": "getReserves", "outputs": [{ "internalType": "uint112", "name": "_reserve0", "type": "uint112" }, { "internalType": "uint112", "name": "_reserve1", "type": "uint112" }, { "internalType": "uint32", "name": "_blockTimestampLast", "type": "uint32" }], "payable": false, "stateMutability": "view", "type": "function" }
const lpSuppliesAbi = {"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}
const token0Abi =  {"constant":true,"inputs":[],"name":"token0","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"}
const token1Abi = {"constant":true,"inputs":[],"name":"token1","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"}

/* lpPositions:{
    balance,
    token
}[]
*/
async function unwrapUniswapLPs(balances, lpPositions, block, chain='ethereum', transformAddress=(addr)=>addr, excludeTokensRaw = [], retry = false, uni_type = 'standard') {
    const excludeTokens = excludeTokensRaw.map(addr=>addr.toLowerCase())
    const lpTokenCalls = lpPositions.map(lpPosition=>({
        target: lpPosition.token
    }))
    const lpReserves = sdk.api.abi.multiCall({
        block,
        abi: lpReservesAbi,
        calls: lpTokenCalls,
        chain
    })
    const lpSupplies = sdk.api.abi.multiCall({
        block,
        abi: lpSuppliesAbi,
        calls: lpTokenCalls,
        chain
      })
      const tokens0 = sdk.api.abi.multiCall({
        block,
        abi:token0Abi,
        calls: lpTokenCalls,
        chain
      })
      const tokens1 = sdk.api.abi.multiCall({
        block,
        abi:token1Abi,
        calls: lpTokenCalls,
        chain
      })
      if(retry){
        await Promise.all([
            [lpReserves, lpReservesAbi],
            [lpSupplies, lpSuppliesAbi],
            [tokens0, token0Abi],
            [tokens1, token1Abi]
        ].map(async call=>{
            await requery(await call[0], chain, block, call[1])
        }))
      }
      await Promise.all(lpPositions.map(async lpPosition => {
        try{
            const lpToken = lpPosition.token
            const token0 = (await tokens0).output.find(call=>call.input.target === lpToken).output.toLowerCase()
            const token1 = (await tokens1).output.find(call=>call.input.target === lpToken).output.toLowerCase()
            const supply = (await lpSupplies).output.find(call=>call.input.target === lpToken).output
            if(supply === "0"){
                return
            }

            let _reserve0, _reserve1
            if (uni_type === 'standard') {
                ({_reserve0, _reserve1} = (await lpReserves).output.find(call=>call.input.target === lpToken).output)
            }
            else if (uni_type === 'gelato') {
                const gelatoPools = sdk.api.abi.multiCall({
                    block,
                    abi: gelatoPoolsAbi,
                    calls: lpTokenCalls,
                    chain
                });
                const gelatoPool = (await gelatoPools).output.find(call=>call.input.target === lpToken).output
                const [ {output: _reserve0_}, {output: _reserve1_} ] = (await Promise.all([
                    sdk.api.erc20.balanceOf({
                        target: token0,
                        owner: gelatoPool,
                        block,
                        chain
                    })
                    ,sdk.api.erc20.balanceOf({
                        target: token1,
                        owner: gelatoPool,
                        block,
                        chain
                    })
                ]))
                _reserve0 = _reserve0_
                _reserve1 = _reserve1_
            }

            if(!excludeTokens.includes(token0)){
                const token0Balance = BigNumber(lpPosition.balance).times(BigNumber(_reserve0)).div(BigNumber(supply))
                sdk.util.sumSingleBalance(balances, await transformAddress(token0), token0Balance.toFixed(0))
            }
            if(!excludeTokens.includes(token1)){
                const token1Balance = BigNumber(lpPosition.balance).times(BigNumber(_reserve1)).div(BigNumber(supply))
                sdk.util.sumSingleBalance(balances, await transformAddress(token1), token1Balance.toFixed(0))
            }
          } catch(e){
              console.log(`Failed to get data for LP token at ${lpPosition.token} on chain ${chain}`)
              throw e
          }
      }))
}


// Mostly similar to unwrapGelatoLPs with only edits being gelatoToken0ABI, same for token1 and balances of tokens which are actually held by the contract which address is given by the read pool method
/* lpPositions:{
    balance,
    token
}[]
*/
const gelatoPoolsAbi = {"inputs":[],"name":"pool","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}

async function unwrapGelatoLPs(balances, lpPositions, block, chain='ethereum', transformAddress=(addr)=>addr, excludeTokensRaw = [], retry = false) {
    const excludeTokens = excludeTokensRaw.map(addr=>addr.toLowerCase())
    const lpTokenCalls = lpPositions.map(lpPosition=>({
        target: lpPosition.token
    }))
    const lpReserves = sdk.api.abi.multiCall({
        block,
        abi: lpReservesAbi,
        calls: lpTokenCalls,
        chain
    })
    const lpSupplies = sdk.api.abi.multiCall({
        block,
        abi: lpSuppliesAbi,
        calls: lpTokenCalls,
        chain
      })
      const tokens0 = sdk.api.abi.multiCall({
        block,
        abi: token0Abi,
        calls: lpTokenCalls,
        chain
      })
      const tokens1 = sdk.api.abi.multiCall({
        block,
        abi: token1Abi,
        calls: lpTokenCalls,
        chain
      })

      // Different bit
      if(retry){
        await Promise.all([
            [lpReserves, lpReservesAbi],
            [lpSupplies, lpSuppliesAbi],
            [tokens0, token0Abi], 
            [tokens1, token1Abi]
        ].map(async call=>{
            await requery(await call[0], chain, block, call[1])
        }))
      }
      await Promise.all(lpPositions.map(async lpPosition => {
        try{
            const lpToken = lpPosition.token
            const token0 = (await tokens0).output.find(call=>call.input.target === lpToken).output.toLowerCase()
            const token1 = (await tokens1).output.find(call=>call.input.target === lpToken).output.toLowerCase()
            const supply = (await lpSupplies).output.find(call=>call.input.target === lpToken).output

            // Different bits
            const gelatoPool = (await gelatoPools).output.find(call=>call.input.target === lpToken).output
            const [ {output: _reserve0}, {output: _reserve1} ] = (await Promise.all([
                sdk.api.erc20.balanceOf({
                    target: token0,
                    owner: gelatoPool,
                    block,
                    chain
                })
                ,sdk.api.erc20.balanceOf({
                    target: token1,
                    owner: gelatoPool,
                    block,
                    chain
                })
            ]))

            if(!excludeTokens.includes(token0)){
                const token0Balance = BigNumber(lpPosition.balance).times(BigNumber(_reserve0)).div(BigNumber(supply))
                sdk.util.sumSingleBalance(balances, await transformAddress(token0), token0Balance.toFixed(0))
            }
            if(!excludeTokens.includes(token1)){
                const token1Balance = BigNumber(lpPosition.balance).times(BigNumber(_reserve1)).div(BigNumber(supply))
                sdk.util.sumSingleBalance(balances, await transformAddress(token1), token1Balance.toFixed(0))
            }
          } catch(e){
              console.log(`Failed to get data for LP token at ${lpPosition.token} on chain ${chain}`)
              throw e
          }
      }))
}

// pool will give you the amount of fUniV3_WETH_ABC held by the pool of the position token against that token total supply
const uniV3_nft_contract = '0xc36442b4a4522e871399cd717abdd847ab11fe88'
const abi_staking = {
    'univ3_positions': {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"positions","outputs":[{"internalType":"uint96","name":"nonce","type":"uint96"},{"internalType":"address","name":"operator","type":"address"},{"internalType":"address","name":"token0","type":"address"},{"internalType":"address","name":"token1","type":"address"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"int24","name":"tickLower","type":"int24"},{"internalType":"int24","name":"tickUpper","type":"int24"},{"internalType":"uint128","name":"liquidity","type":"uint128"},{"internalType":"uint256","name":"feeGrowthInside0LastX128","type":"uint256"},{"internalType":"uint256","name":"feeGrowthInside1LastX128","type":"uint256"},{"internalType":"uint128","name":"tokensOwed0","type":"uint128"},{"internalType":"uint128","name":"tokensOwed1","type":"uint128"}],"stateMutability":"view","type":"function"}, 

    'erc721_tokenOfOwnerByIndex': {"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"index","type":"uint256"}],"name":"tokenOfOwnerByIndex","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}, 

    'token0': {"inputs":[],"name":"token0","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}, 
    'token1': {"inputs":[],"name":"token1","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
}
// Convert Uniswap v3 tick to a price (i.e. the ratio between the amounts of tokens: token1/token0)
const tickBase = 1.0001
function tick_to_price(tick) {
    return tickBase ** tick
}
// GraphQL query to get the pool information
const univ3_graph_url = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3"
const univ3_graph_query = gql`
query position($block: Int, $position_id: ID!) {
    position (
        id: $position_id
        block: { number: $block }
    ) {
        id
        owner
        tickLower {tickIdx}
        tickUpper {tickIdx}
        liquidity
        pool {
            tick
            liquidity
            feeTier
            token0 { symbol decimals id }
            token1 { symbol  decimals id }
        }
    }
}`

async function getUniv3PositionBalances(position_id, block) {
    // Retrieve aTokens and reserves from graphql API endpoint
    const { position } = await request(
        univ3_graph_url,
        univ3_graph_query, {
            block: block,
            position_id: position_id 
        })
    
    // Extract pool parameters
    const pool = position['pool']
    const tick = pool['tick']
    const token0 = pool['token0']['id']
    const token1 = pool['token1']['id']
    // Retrieve these from the graphql query instead of onchain call
    const bottom_tick = position['tickLower']['tickIdx']
    const top_tick = position['tickUpper']['tickIdx']
    const liquidity = position['liquidity']
    
    // Compute square roots of prices corresponding to the bottom and top ticks
    const sa = tick_to_price(Math.floor(bottom_tick / 2))
    const sb = tick_to_price(Math.floor(top_tick / 2))
    const price = tick_to_price(tick)
    const sp = price ** 0.5
    // const decimals0 = pool['token0']['decimals']
    // const decimals1 = pool['token1']['decimals']
    // const adjusted_price = price / (10 ** (decimals1 - decimals0))

    // Compute real amounts of the two assets
    const amount0 = liquidity * (sb - sp) / (sp * sb)
    const amount1 = liquidity * (sp - sa)

    console.log(`Whole pool: amount0: ${(amount0 / 1e18).toFixed(1)} / amount1: ${(amount1 / 1e18).toFixed(1)}`)
    return {
        [token0]: amount0, 
        [token1]: amount1, 
    }
}
/*
// Could get some props of the position itself onchain rather than using uni-v3 graphql endpoint, but some information needed is missing like whole pool liq/tick etc
const {output: position_props} = await sdk.api.abi.call({
    block,
    abi: abi_staking['univ3_positions'],
    target: uniV3_nft_contract,
    params: position_id, // get the last one for demonstration
    chain: 'ethereum'
})
const bottom_tick = position_props['tickLower']
const top_tick = position_props['tickUpper']
const L = position_props['liquidity']
const token0 = position_props['token0']
const token1 = position_props['token1']
*/

/*
univ3_Positions:{
    vault,
    pool
}[]
*/
async function unwrapUniswapV3LPs(balances, univ3_Positions, block, chain='ethereum', transformAddress=(addr)=>addr, excludeTokensRaw = [], retry = false) {
    const excludeTokens = excludeTokensRaw.map(addr=>addr.toLowerCase())
    await Promise.all(univ3_Positions.map(async univ3_Position => {
        try{ 
            // Get share of that LP NFT inside the vault as balanceOf / totalSupply
            const {output: totalSupply} = await sdk.api.abi.call({
                block,
                abi: 'erc20:totalSupply',
                target: univ3_Position.vault,
                chain
            })
            const {output: heldLPshares} = await sdk.api.abi.call({
                block,
                abi: 'erc20:balanceOf',
                target: univ3_Position.vault,
                params: univ3_Position.pool,
                chain
            })
            const sharesRatio = heldLPshares / totalSupply

            /*
            const {output: uniV3_nft_count} = await sdk.api.abi.call({
                block,
                abi: 'erc20:balanceOf',
                target: uniV3_nft_contract,
                params: univ3_Position.vault,
                chain
            })
            */
           // Here we assume only the first nft position is retrieved
           // could look for more using uniV3_nft_count 
            const {output: position_id} = await sdk.api.abi.call({
                block,
                abi: abi_staking['erc721_tokenOfOwnerByIndex'],
                target: uniV3_nft_contract,
                params: [univ3_Position.vault, 0], 
                chain
            })

            const positionBalances = await getUniv3PositionBalances(position_id, block)

            // Add balances while multiplying amount by ratio of shares
            Object.entries(positionBalances).forEach(async entry => {
                const [key, value] = entry;
                if(!excludeTokens.includes(key)){
                    // balances[key] = BigNumber( balances[key] || 0 ).plus(sharesRatio * value);
                    sdk.util.sumSingleBalance(balances, await transformAddress(key), BigNumber(sharesRatio * value).toFixed(0))
                }
            });
            console.log(`ratio of the pool: ${(100 * sharesRatio).toFixed(1)}% of position_id ${position_id}`)
            
        } catch(e) {
            console.log(`Failed to get data for LP token vault at ${univ3_Position.vault} on chain ${chain}`)
            throw e
        }
    }))
}

async function addBalanceOfTokensAndLPs(balances, balanceResult, block){
    await addTokensAndLPs(balances, {
        output: balanceResult.output.map(t=>({output:t.input.target}))
    },
    balanceResult,
    block)
}

// Unwrap the tokens that are LPs and directly add the others
// To be used when you don't know which tokens are LPs and which are not
async function addTokensAndLPs(balances, tokens, amounts, block, chain = "ethereum", transformAddress=id=>id){
    const tokens0 = await sdk.api.abi.multiCall({
        calls:tokens.output.map(t=>({
            target: t.output
        })),
        abi: token0,
        block,
        chain
    })
    const lpBalances = []
    tokens0.output.forEach((result, idx)=>{
        const token = tokens.output[idx].output
        const balance = amounts.output[idx].output
        if(result.success){
            lpBalances.push({
                token,
                balance
            })
        } else {
            sdk.util.sumSingleBalance(balances, transformAddress(token), balance);
        }
    })
    await unwrapUniswapLPs(balances, lpBalances, block, chain, transformAddress)
}

function addressesEqual(a,b){
    return a.toLowerCase() === b.toLowerCase()
}
/*
tokens [
    [token, isLP] - eg ["0xaaa", true]
]
*/
async function sumTokensAndLPsSharedOwners(balances, tokens, owners, block, chain = "ethereum", transformAddress=id=>id){
    const balanceOfTokens = await sdk.api.abi.multiCall({
        calls: tokens.map(t=>owners.map(o=>({
            target: t[0],
            params: o
        }))).flat(),
        abi: 'erc20:balanceOf',
        block,
        chain
    })
    await requery(balanceOfTokens, chain, block, 'erc20:balanceOf')
    const isLP = {}
    tokens.forEach(token=>{
        isLP[token[0].toLowerCase()]=token[1]
    })
    const lpBalances = []
    balanceOfTokens.output.forEach((result, idx)=>{
        const token = result.input.target.toLowerCase()
        const balance = result.output
        if(isLP[token] === true){
            lpBalances.push({
                token,
                balance
            })
        } else {
            sdk.util.sumSingleBalance(balances, transformAddress(token), balance);
        }
    })
    if(lpBalances.length > 0){
        await unwrapUniswapLPs(balances, lpBalances, block, chain, transformAddress)
    }
}

async function sumTokensSharedOwners(balances, tokens, owners, block, chain = "ethereum", transformAddress){
    if(transformAddress===undefined){
        transformAddress = addr=>`${chain}:${addr}`
    }
    await sumTokensAndLPsSharedOwners(balances, tokens.map(t=>[t,false]), owners, block, chain, transformAddress)
}

async function sumLPWithOnlyOneToken(balances, lpToken, owner, listedToken, block, chain = "ethereum", transformAddress=id=>id){
    const [balanceOfLP, balanceOfTokenListedInLP, lpSupply] = await Promise.all([
        sdk.api.erc20.balanceOf({
            target: lpToken,
            owner,
            block,
            chain
        }),
        sdk.api.erc20.balanceOf({
            target: listedToken,
            owner: lpToken,
            block,
            chain
        }),
        sdk.api.erc20.totalSupply({
            target: lpToken,
            block,
            chain
        }),
    ])
    sdk.util.sumSingleBalance(balances, transformAddress(listedToken), 
        BigNumber(balanceOfLP.output).times(balanceOfTokenListedInLP.output).div(lpSupply.output).times(2).toFixed(0)
    )
}

async function sumLPWithOnlyOneTokenOtherThanKnown(balances, lpToken, owner, tokenNotToUse, block, chain = "ethereum", transformAddress=id=>id){
    const [token0, token1] = await Promise.all([token0Abi, token1Abi]
        .map(abi=>sdk.api.abi.call({
            target: lpToken,
            abi,
            chain,
            block
        }).then(o=>o.output))
    )
    let listedToken = token0
    if(tokenNotToUse.toLowerCase() === listedToken.toLowerCase()){
        listedToken = token1
    }
    await sumLPWithOnlyOneToken(balances, lpToken, owner, listedToken, block, chain, transformAddress)
}


/*
tokens [
    [token, owner, isLP] - eg ["0xaaa", "0xbbb", true]
]
*/
async function sumTokensAndLPs(balances, tokens, block, chain = "ethereum", transformAddress=id=>id){
    const balanceOfTokens = await sdk.api.abi.multiCall({
        calls: tokens.map(t=>({
            target: t[0],
            params: t[1]
        })),
        abi: 'erc20:balanceOf',
        block,
        chain
    })
    const lpBalances = []
    balanceOfTokens.output.forEach((result, idx)=>{
        const token = result.input.target
        const balance = result.output
        if(tokens[idx][2]){
            lpBalances.push({
                token,
                balance
            })
        } else {
            sdk.util.sumSingleBalance(balances, transformAddress(token), balance);
        }
    })
    await unwrapUniswapLPs(balances, lpBalances, block, chain, transformAddress)
}

const balancerVault = "0xBA12222222228d8Ba445958a75a0704d566BF2C8"
async function sumBalancerLps(balances, tokensAndOwners, block, chain, transformAddress){
    const poolIds = sdk.api.abi.multiCall({
        calls: tokensAndOwners.map(t => ({
            target: t[0]
        })),
        abi: getPoolId,
        block,
        chain
    })
    const balancerPoolSupplies = sdk.api.abi.multiCall({
        calls: tokensAndOwners.map(t => ({
            target: t[0]
        })),
        abi: 'erc20:totalSupply',
        block,
        chain
    })
    const balanceOfTokens = sdk.api.abi.multiCall({
        calls: tokensAndOwners.map(t => ({
            target: t[0],
            params: t[1]
        })),
        abi: 'erc20:balanceOf',
        block,
        chain
    });
    const balancerPoolsPromise = sdk.api.abi.multiCall({
        calls: (await poolIds).output.map(o => ({
            target: balancerVault,
            params: o.output
        })),
        abi: getPoolTokens,
        block,
        chain
    })
    const [poolSupplies, tokenBalances, balancerPools] = await Promise.all([balancerPoolSupplies, balanceOfTokens, balancerPoolsPromise])
    tokenBalances.output.forEach((result, idx)=>{
        const lpBalance = result.output
        const balancerPool = balancerPools.output[idx].output
        const supply = poolSupplies.output[idx].output
        balancerPool.tokens.forEach((token, tokenIndex)=>{
            const tokensInPool = balancerPool.balances[tokenIndex]
            const underlyingBalance = BigNumber(tokensInPool).times(lpBalance).div(supply)
            sdk.util.sumSingleBalance(balances, transformAddress(token), underlyingBalance.toFixed(0));
        })
    })
}

/*
tokensAndOwners [
    [token, owner] - eg ["0xaaa", "0xbbb"]
]
*/
async function sumTokens(balances, tokensAndOwners, block, chain = "ethereum", transformAddress=id=>id){
    const balanceOfTokens = await sdk.api.abi.multiCall({
        calls: tokensAndOwners.map(t=>({
            target: t[0],
            params: t[1]
        })),
        abi: 'erc20:balanceOf',
        block,
        chain
    })
    balanceOfTokens.output.forEach((result, idx)=>{
        const token = result.input.target
        const balance = result.output
        sdk.util.sumSingleBalance(balances, transformAddress(token), balance);
    })
}

async function unwrapCreamTokens(balances, tokensAndOwners, block, chain = "ethereum", transformAddress=id=>id){
    const [balanceOfTokens, exchangeRates, underlyingTokens] = await Promise.all([
        sdk.api.abi.multiCall({
            calls: tokensAndOwners.map(t => ({
                target: t[0],
                params: t[1]
            })),
            abi: 'erc20:balanceOf',
            block,
            chain
        }),
        sdk.api.abi.multiCall({
            calls: tokensAndOwners.map(t => ({
                target: t[0],
            })),
            abi: creamAbi.exchangeRateStored,
            block,
            chain
        }),
        sdk.api.abi.multiCall({
            calls: tokensAndOwners.map(t => ({
                target: t[0],
            })),
            abi: creamAbi.underlying,
            block,
            chain
        })
    ])
    balanceOfTokens.output.forEach((balanceCall, i)=>{
        const underlying = underlyingTokens.output[i].output
        const balance = BigNumber(balanceCall.output).times(exchangeRates.output[i].output).div(1e18).toFixed(0)
        sdk.util.sumSingleBalance(balances, transformAddress(underlying), balance)
    })
}

module.exports = {
    unwrapYearn,
    unwrapCrv,
    unwrapUniswapLPs,
    unwrapUniswapV3LPs,
    addTokensAndLPs,
    sumTokensAndLPsSharedOwners,
    addBalanceOfTokensAndLPs,
    sumTokensAndLPs,
    sumTokens,
    sumBalancerLps,
    unwrapCreamTokens,
    sumLPWithOnlyOneToken,
    sumTokensSharedOwners,
    sumLPWithOnlyOneTokenOtherThanKnown, 
    unwrapGelatoLPs
}
