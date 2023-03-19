import { Buffer } from 'buffer'


interface ICard {
    buffer: Buffer;
    width: number;
    height: number;
    index: number;
}

const movConst = (card: ICard, address: number, val:number[]) => {
    card.buffer.writeFloatLE(-1.0, card.index);       // mov
    card.index += 4;
    card.buffer.writeFloatLE(address, card.index);
    card.index += 4;
    for (let i = 0; i < val.length; i++) {
        card.buffer.writeFloatLE(val[i], card.index);  
        card.index += 4;
    }
}

const mov = (card: ICard, address1: number, address2: number) => {
    card.buffer.writeFloatLE(1.0, card.index);       // mov
    card.index += 4;
    card.buffer.writeFloatLE(address1, card.index);
    card.index += 4;
    card.buffer.writeFloatLE(address2, card.index);
    card.index += 4;
}

const add = (card: ICard,) => {
    card.buffer.writeFloatLE(3.0, card.index);       // add
}

const sub = (card: ICard,) => {
    card.buffer.writeFloatLE(4.0, card.index);       // sub
}

const mul = (card: ICard,) => {
    card.buffer.writeFloatLE(5.0, card.index);       // mul
}

const create = (width: number, height: number) => {
    const buffer = Buffer.alloc(width * height * 4, 0);
    buffer.writeFloatLE(width, 0);
    buffer.writeFloatLE(height, 4);
    return {
        buffer,
        width,
        height,
        index: 8,
    }
}

export const createCard= ()=>{
    const card: ICard = create(4, 4);
    // punch card code
    movConst(card, 10, [1, 0, 0, 1]);
    movConst(card, 14, [0, 1, 0, 1]);
    add(card);
    return card;
}