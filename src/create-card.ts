import { Buffer } from 'buffer'

export const createCard= ()=>{
    const width = 4;
    const height = 4;
    let buffer = Buffer.alloc(width * height * 4, 0);
    buffer.writeFloatLE(width, 0);
    buffer.writeFloatLE(height, 4);
    let index = 8;
    // punch card code
    buffer.writeFloatLE(-1.0, index);         // mov
    index += 4;
    buffer.writeFloatLE(10, index);         // vec0    
    index += 4;
    buffer.writeFloatLE(1, index);          // 1
    index += 4;
    buffer.writeFloatLE(0, index);          // 0
    index += 4;
    buffer.writeFloatLE(0, index);          // 0
    index += 4;
    buffer.writeFloatLE(1, index);          // 1
    index += 4;

    console.log(buffer);
    return {
        buffer,
        width,
        height,
    }
}