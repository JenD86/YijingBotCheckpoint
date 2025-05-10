import { Web3 } from 'web3';

export function splitArrayIntoChunks(ticketCount: number, rand: number) {
    const numbers = Array.from({ length: ticketCount }, (_, i) => i + 1);
    const chunkSize = Math.min(Math.max(Math.floor(ticketCount / 5), 5), 20);
    const chunks = [];
    
    for (let i = 0; i < numbers.length; i += chunkSize) {
        chunks.push(numbers.slice(i, i + chunkSize));
    }
    
    return fisherYatesShuffle(chunks.slice(), rand);
}

function fisherYatesShuffle(array: any[], rand: number) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor((rand % 10) * (i / array.length) * i);
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export async function getFirstHashAfterMidnight(targetTimestamp: number): Promise<string> {
    const web3 = new Web3(process.env.INFURA_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY');
    const latestBlockNumber = await web3.eth.getBlockNumber();
    
    let low = BigInt(0);
    let high = BigInt(latestBlockNumber);
    
    while (low <= high) {
        const mid = (low + high) / BigInt(2);
        const block = await web3.eth.getBlock(Number(mid));
        
        if (!block) {
            high = mid - BigInt(1);
            continue;
        }
        
        if (block.timestamp < targetTimestamp) {
            low = mid + BigInt(1);
        } else {
            high = mid - BigInt(1);
        }
    }
    
    const firstBlockAfterMidnight = await web3.eth.getBlock(Number(low));
    return firstBlockAfterMidnight.hash;
}

function modifyArray(array: any[], num: number) {
    if (array.length <= 1) return array;
    
    const length = array.length;
    const mid = Math.ceil(length / 2);
    
    if (length <= 4) {
        const splitPoint = Math.floor(length * (num / 10));
        return array.slice(0, Math.max(1, splitPoint));
    }
    
    return num >= 5 ? array.slice(mid) : array.slice(0, mid);
}

function getLastNumericDigit(hexString: string, inputCount: number): number {
    let count = inputCount;
    let j = 0;
    const numberOfDigits = countNumericDigits(hexString);
    
    if (numberOfDigits < count) count = count % numberOfDigits || 1;
    
    for (let i = hexString.length - 1; i >= 0; i--) {
        const char = hexString[i];
        if (char >= '0' && char <= '9') {
            j++;
            if (j === count) {
                return parseInt(char);
            }
        }
    }
    
    return parseInt(hexString.match(/\d/)[0]);
}

function countNumericDigits(hashString: string): number {
    return (hashString.match(/\d/g) || []).length;
}

export interface LotteryResult {
    winningTicketIndex: number;
    blockHash: string;
    drawTimestamp: number;
    totalTickets: number;
}

export async function selectWinner(ticketCount: number, drawTimestamp: number): Promise<LotteryResult> {
    if (ticketCount <= 0) {
        throw new Error('No tickets available for drawing');
    }
    
    const firstHash = await getFirstHashAfterMidnight(drawTimestamp);
    const lastNumber = Number(getLastNumericDigit(firstHash, 1));
    
    const result = await splitArrayIntoChunks(ticketCount, lastNumber);
    let currentResult = await modifyArray(result, lastNumber).flat();
    
    let count = 2;
    while (currentResult.length > 1) {
        const nextNumber = getLastNumericDigit(firstHash, count);
        currentResult = await modifyArray(currentResult, nextNumber).flat();
        count++;
        
        if (count > 20) {
            currentResult = [currentResult[0]];
        }
    }
    
    return {
        winningTicketIndex: currentResult[0] - 1,
        blockHash: firstHash,
        drawTimestamp,
        totalTickets: ticketCount
    };
}