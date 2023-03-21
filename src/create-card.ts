import { Buffer } from 'buffer'
import { Card, TypeCode } from './card';

export interface ICard {
    buffer: Buffer;
    width: number;
    height: number;
    index: number;
}

export const createCard = () => {
    const card = new Card();
    card.movConst(Card.address(TypeCode.float, 0), [1]);
    card.movConst(Card.address(TypeCode.float, 17), [1]);
    card.add();
    return {
        buffer: card.buffer,
        width: card.width,
        height: card.height,
        index: card.index
    } as ICard;
}