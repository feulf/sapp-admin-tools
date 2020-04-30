import axios from 'axios'
import { Safe } from '../safe'

export interface ContractMethod {
    inputs: any[]
    name: string,
    payable: boolean
}

export interface ContractInterface {
    payableFallback: boolean
    methods: ContractMethod[]
}

class InterfaceRepository {
    safe: Safe
    web3: any
    constructor(safe: Safe, web3: any) {
        this.safe = safe
        this.web3 = web3
    }

    private async _loadAbiFromEtherscan(address: string): Promise<string> {
        const host = this.safe.getSafeInfo().network === "rinkeby" ? "https://api-rinkeby.etherscan.io" : "https://api.etherscan.io"
        const apiUrl = `${host}/api?module=contract&action=getabi&address=${address}`
        const contractInfo = await axios.get(apiUrl)
        if (contractInfo.data.status !== "1") throw Error(`Request not successfull: ${contractInfo.data.message}; ${contractInfo.data.result}`)
        return contractInfo.data.result
    }

    async loadAbi(addressOrAbi: string): Promise<ContractInterface> {
        const abiString = this.web3.utils.isAddress(addressOrAbi) ? 
            (await this._loadAbiFromEtherscan(addressOrAbi)) : addressOrAbi
        const abi = JSON.parse(abiString)
        console.log(abi)
        const methods = abi
            .filter((e: any) => e.constant == false)
            .map((m: any) => { return { inputs: m.inputs, name: m.name, payable: m.payable || false } })
        const payableFallback = abi.findIndex((e: any) => e.type == "fallback" && e.payable == true) >= 0
        return { payableFallback, methods }
    }
}

export default InterfaceRepository